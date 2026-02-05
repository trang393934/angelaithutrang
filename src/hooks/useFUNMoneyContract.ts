 import { useState, useCallback, useEffect, useMemo, useRef } from "react";
 import { ethers } from "ethers";
 import { useWeb3Wallet } from "./useWeb3Wallet";
 import { FUN_MONEY_ABI, FUN_MONEY_ADDRESSES, SignedMintRequest, MINT_ERROR_MESSAGES } from "@/lib/funMoneyABI";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "sonner";
 
 interface MintStatus {
   isLoading: boolean;
   txHash: string | null;
   error: string | null;
 }
 
 interface ContractInfo {
   name: string;
   symbol: string;
   decimals: number;
   totalSupply: string;
   balance: string;
   mintingEnabled: boolean;
   policyVersion: number;
   epochMintCap: string;
   userEpochCap: string;
   remainingEpochCapacity: string;
   remainingUserCapacity: string;
   currentEpoch: number;
   userNonce: number;
 }
 
 export interface ContractDiagnostics {
   isContractValid: boolean;
   contractCodeExists: boolean;
   blockNumber: number | null;
   error: string | null;
 }
 
 function extractRevertData(err: any): string | null {
   const candidates: unknown[] = [
     err?.data,
     err?.info?.error?.data,
     err?.error?.data,
     err?.cause?.data,
     err?.cause?.info?.error?.data,
   ];
 
   for (const c of candidates) {
     if (typeof c === "string" && c.startsWith("0x") && c.length > 2 && c !== "0x") return c;
     if (c && typeof c === "object") {
       const maybe = (c as any)?.data;
       if (typeof maybe === "string" && maybe.startsWith("0x") && maybe.length > 2 && maybe !== "0x") return maybe;
     }
   }
 
   return null;
 }
 
 function formatMintErrorFromParsedError(parsed: { name: string; args: any[] }): string {
   const base = MINT_ERROR_MESSAGES[parsed.name];
   if (parsed.name === "InvalidNonce") {
     const expected = parsed.args?.[0]?.toString?.() ?? String(parsed.args?.[0] ?? "");
     const provided = parsed.args?.[1]?.toString?.() ?? String(parsed.args?.[1] ?? "");
     return `${base || "Nonce không khớp"} (expected ${expected}, got ${provided})`;
   }
   if (parsed.name === "PolicyVersionMismatch") {
     const expected = parsed.args?.[0]?.toString?.() ?? String(parsed.args?.[0] ?? "");
     const provided = parsed.args?.[1]?.toString?.() ?? String(parsed.args?.[1] ?? "");
     return `${base || "Phiên bản chính sách không khớp"} (expected ${expected}, got ${provided})`;
   }
   if (parsed.name === "RequestTooEarly") {
     return base || "Yêu cầu chưa đến thời gian hiệu lực.";
   }
   if (parsed.name === "RequestExpired") {
     return base || "Yêu cầu đã hết hạn.";
   }
   return base || `Mint thất bại: ${parsed.name}`;
 }
 
// Get ethereum provider from window
function getEthereumProvider(): ethers.BrowserProvider | null {
  if (typeof window !== "undefined" && (window as any).ethereum) {
    return new ethers.BrowserProvider((window as any).ethereum);
  }
  return null;
}

/**
 * Safe nonce reader - tries getNonce first, falls back to mintNonces
 * This handles both old and new contract versions
 */
async function readUserNonceSafe(contract: ethers.Contract, address: string): Promise<bigint> {
  try {
    return await contract.getNonce(address);
  } catch (getNonceError: any) {
    // If CALL_EXCEPTION (method doesn't exist), try mintNonces
    const isCallException =
      getNonceError?.code === "CALL_EXCEPTION" ||
      String(getNonceError?.message || "").includes("require(false)") ||
      String(getNonceError?.message || "").includes("missing revert data");
    
    if (isCallException) {
      console.log("[FUNMoney] getNonce failed, trying mintNonces fallback");
      return await contract.mintNonces(address);
    }
    throw getNonceError;
  }
}

/**
 * Safe action minted checker - tries isActionMinted first, falls back to mintedAction
 */
async function readActionMintedSafe(contract: ethers.Contract, actionId: string): Promise<boolean> {
  try {
    return await contract.isActionMinted(actionId);
  } catch (error: any) {
    const isCallException =
      error?.code === "CALL_EXCEPTION" ||
      String(error?.message || "").includes("require(false)") ||
      String(error?.message || "").includes("missing revert data");
    
    if (isCallException) {
      console.log("[FUNMoney] isActionMinted failed, trying mintedAction fallback");
      return await contract.mintedAction(actionId);
    }
    throw error;
  }
}

function isOpaqueCallException(error: any): boolean {
  return (
    error?.code === "CALL_EXCEPTION" ||
    String(error?.shortMessage || "").includes("missing revert data") ||
    String(error?.shortMessage || "").includes("could not decode") ||
    String(error?.message || "").includes("missing revert data") ||
    String(error?.message || "").includes("could not decode") ||
    String(error?.message || "").includes("require(false)")
  );
}
 
 export function useFUNMoneyContract() {
   const {
     isConnected,
     address,
     chainId,
     connect,
     disconnect,
     hasWallet,
     resetBSCNetwork,
     networkDiagnostics,
     error: walletError,
   } = useWeb3Wallet();
   const [contract, setContract] = useState<ethers.Contract | null>(null);
   const [signer, setSigner] = useState<ethers.Signer | null>(null);
   const [contractInfo, setContractInfo] = useState<ContractInfo | null>(null);
   const [contractDiagnostics, setContractDiagnostics] = useState<ContractDiagnostics | null>(null);
   const [mintStatus, setMintStatus] = useState<MintStatus>({
     isLoading: false,
     txHash: null,
     error: null,
   });
 
   const initializingRef = useRef(false);
 
   const iface = useMemo(() => new ethers.Interface(FUN_MONEY_ABI as any), []);
 
   // Get contract address for current chain
   const getContractAddress = useCallback(() => {
     if (!chainId) return null;
     return FUN_MONEY_ADDRESSES[chainId] || null;
   }, [chainId]);
 
   // Verify contract exists before making calls
   const verifyContract = useCallback(
     async (provider: ethers.BrowserProvider, contractAddress: string): Promise<ContractDiagnostics> => {
       const diagnostics: ContractDiagnostics = {
         isContractValid: false,
         contractCodeExists: false,
         blockNumber: null,
         error: null,
       };
 
       try {
         // Get block number to verify we're on the right network
         const blockNumber = await provider.getBlockNumber();
         diagnostics.blockNumber = blockNumber;
 
         // BSC Testnet should have >80M blocks
         if (blockNumber < 10_000_000) {
           diagnostics.error = `Block number quá thấp (${blockNumber.toLocaleString()}). RPC có thể đang trỏ sai network.`;
           return diagnostics;
         }
 
         // Check contract code exists
         const code = await provider.getCode(contractAddress);
         diagnostics.contractCodeExists = code !== "0x" && code.length > 2;
 
         if (!diagnostics.contractCodeExists) {
           diagnostics.error = "Contract FUN Money chưa được deploy tại địa chỉ này trên network hiện tại.";
           return diagnostics;
         }
 
         diagnostics.isContractValid = true;
         return diagnostics;
       } catch (error: any) {
         diagnostics.error = error.message || "Không thể xác minh contract";
         return diagnostics;
       }
     },
     []
   );
 
   // Initialize signer and contract
   useEffect(() => {
     const initContract = async () => {
       if (initializingRef.current) return;
       initializingRef.current = true;
 
       const contractAddress = getContractAddress();
       const provider = getEthereumProvider();
 
       if (!contractAddress || !provider || !isConnected) {
         setContract(null);
         setSigner(null);
         setContractDiagnostics(null);
         initializingRef.current = false;
         return;
       }
 
       try {
         // Verify contract before initializing
         const diagnostics = await verifyContract(provider, contractAddress);
         setContractDiagnostics(diagnostics);
 
         if (!diagnostics.isContractValid) {
           console.warn("[FUNMoney] Contract verification failed:", diagnostics.error);
           setContract(null);
           setSigner(null);
           initializingRef.current = false;
           return;
         }
 
         const walletSigner = await provider.getSigner();
         setSigner(walletSigner);
 
         const contractInstance = new ethers.Contract(contractAddress, FUN_MONEY_ABI, walletSigner);
         setContract(contractInstance);
       } catch (error) {
         console.error("Failed to initialize FUNMoney contract:", error);
         setContract(null);
         setSigner(null);
       } finally {
         initializingRef.current = false;
       }
     };
 
     initContract();
   }, [isConnected, getContractAddress, verifyContract]);
 
   // Fetch contract info
   const fetchContractInfo = useCallback(async () => {
     if (!contract || !address) return null;
 
     // Skip if contract diagnostics show invalid
     if (contractDiagnostics && !contractDiagnostics.isContractValid) {
       console.warn("[FUNMoney] Skipping fetchContractInfo - contract not valid");
       return null;
     }
 
     try {
       const [
         name,
         symbol,
         decimals,
         totalSupply,
         balance,
         mintingEnabled,
         policyVersion,
         epochMintCap,
         userEpochCap,
         remainingEpochCapacity,
         remainingUserCapacity,
         currentEpoch,
         userNonce,
        ] = await Promise.all([
          contract.name(),
          contract.symbol(),
          contract.decimals(),
          contract.totalSupply(),
          contract.balanceOf(address),
          contract.mintingEnabled(),
          contract.currentPolicyVersion(),
          contract.epochMintCap(),
          contract.userEpochCap(),
          contract.remainingEpochCapacity(),
          contract.remainingUserCapacity(address),
          contract.currentEpoch(),
          readUserNonceSafe(contract, address), // Use safe helper with fallback
        ]);
 
       const info: ContractInfo = {
         name,
         symbol,
         decimals,
         totalSupply: ethers.formatUnits(totalSupply, decimals),
         balance: ethers.formatUnits(balance, decimals),
         mintingEnabled,
         policyVersion,
         epochMintCap: ethers.formatUnits(epochMintCap, decimals),
         userEpochCap: ethers.formatUnits(userEpochCap, decimals),
         remainingEpochCapacity: ethers.formatUnits(remainingEpochCapacity, decimals),
         remainingUserCapacity: ethers.formatUnits(remainingUserCapacity, decimals),
         currentEpoch: Number(currentEpoch),
         userNonce: Number(userNonce),
       };
 
       setContractInfo(info);
       return info;
     } catch (error) {
       console.error("Failed to fetch contract info:", error);
       return null;
     }
   }, [contract, address, contractDiagnostics]);
 
   // Check if action is already minted
   const isActionMinted = useCallback(
     async (actionId: string): Promise<boolean> => {
       if (!contract) return false;
 
       // Skip if contract diagnostics show invalid
       if (contractDiagnostics && !contractDiagnostics.isContractValid) {
         console.warn("[FUNMoney] Skipping isActionMinted - contract not valid");
         return false;
       }
 
        try {
          return await readActionMintedSafe(contract, actionId);
        } catch (error) {
          console.error("Failed to check action minted status:", error);
          return false;
        }
     },
     [contract, contractDiagnostics]
   );
 
   // Mint with signed request from PPLP Engine
   const mintWithSignature = useCallback(
     async (signedRequest: SignedMintRequest): Promise<string | null> => {
       if (!contract || !signer) {
         toast.error("Vui lòng kết nối ví trước");
         return null;
       }
 
       setMintStatus({ isLoading: true, txHash: null, error: null });
 
       try {
         // Network guard
         if (chainId && chainId !== 97) {
           throw new Error("Vui lòng chuyển mạng sang BSC Testnet (chainId 97) rồi thử lại.");
         }
 
         // Check if already minted
         const alreadyMinted = await isActionMinted(signedRequest.actionId);
         if (alreadyMinted) {
           throw new Error("Action này đã được mint trước đó");
         }
 
         // Policy version guard
         try {
           const onChainPolicyVersion = await contract.currentPolicyVersion();
           if (Number(onChainPolicyVersion) !== signedRequest.policyVersion) {
             throw new Error(
               formatMintErrorFromParsedError({
                 name: "PolicyVersionMismatch",
                 args: [onChainPolicyVersion, signedRequest.policyVersion],
               })
             );
           }
         } catch {
           // If policy version read fails, continue (we'll simulate below)
         }
 
         // Signer role guard (prevents opaque reverts)
         if (signedRequest.signer) {
           let hasSignerRole: boolean | null = null;
           try {
             const signerRole = await contract.SIGNER_ROLE();
             hasSignerRole = await contract.hasRole(signerRole, signedRequest.signer);
           } catch {
             hasSignerRole = null;
           }
 
           if (hasSignerRole === false) {
             throw new Error("Treasury chưa được cấp SIGNER_ROLE trên contract (cần admin gọi grantSigner).");
           }
         }
 
          // Preflight check: verify nonce matches on-chain (use safe helper)
          const onChainNonce = await readUserNonceSafe(contract, signedRequest.to);
          if (BigInt(onChainNonce) !== signedRequest.nonce) {
            setMintStatus({ isLoading: false, txHash: null, error: "Nonce mismatch" });
            toast.error("Nonce đã thay đổi trên blockchain. Vui lòng bấm Mint lại để lấy chữ ký mới.");
            return null;
          }
 
         // Prepare request struct
         const mintRequest = {
           to: signedRequest.to,
           amount: signedRequest.amount,
           actionId: signedRequest.actionId,
           evidenceHash: signedRequest.evidenceHash,
           policyVersion: signedRequest.policyVersion,
           validAfter: signedRequest.validAfter,
           validBefore: signedRequest.validBefore,
           nonce: signedRequest.nonce,
         };

          const legacyArgs = [
            mintRequest.to,
            mintRequest.amount,
            mintRequest.actionId,
            mintRequest.evidenceHash,
            mintRequest.policyVersion,
            mintRequest.validAfter,
            mintRequest.validBefore,
            mintRequest.nonce,
            signedRequest.signature,
          ] as const;

          const tryStructMint = async () => {
            // Simulation first: gives accurate revert reason + prevents wasting gas
            await contract.mintWithSignature.staticCall(mintRequest, signedRequest.signature);
            return await contract.mintWithSignature(mintRequest, signedRequest.signature);
          };

          const tryLegacyMint = async () => {
            const legacyFn = (contract as any)[
              "mintWithSignature(address,uint256,bytes32,bytes32,uint32,uint64,uint64,uint256,bytes)"
            ];
            if (!legacyFn) {
              throw new Error("Contract ABI không hỗ trợ overload legacy của mintWithSignature.");
            }

            await legacyFn.staticCall(...legacyArgs);
            return await legacyFn(...legacyArgs);
          };

          let tx: any;
          try {
            tx = await tryStructMint();
          } catch (e: any) {
            // If the deployed contract uses a legacy function signature, this call often fails with missing revert data.
            if (isOpaqueCallException(e)) {
              console.warn("[FUNMoney] Struct mintWithSignature failed opaquely; trying legacy overload", e);
              tx = await tryLegacyMint();
            } else {
              throw e;
            }
          }
 
         toast.loading("Đang xử lý giao dịch...", { id: "mint-tx" });
 
         const receipt = await tx.wait();
         const txHash = receipt.hash;
 
         setMintStatus({ isLoading: false, txHash, error: null });
         toast.success("Mint thành công!", { id: "mint-tx" });
 
         // Update mint request status in database
         await supabase
           .from("pplp_mint_requests")
           .update({
             status: "minted",
             tx_hash: txHash,
             minted_at: new Date().toISOString(),
           })
           .eq("action_hash", signedRequest.actionId);
 
         // Refresh contract info
         await fetchContractInfo();
 
         return txHash;
       } catch (error: any) {
         console.error("Mint failed:", error);
 
         let errorMessage = "Mint thất bại";
 
         // 1) Try decode custom errors from revert data
         const revertData = extractRevertData(error);
         if (revertData) {
           try {
             const parsed = iface.parseError(revertData);
             if (parsed?.name) {
               errorMessage = formatMintErrorFromParsedError({ name: parsed.name, args: parsed.args as any[] });
             }
           } catch {
             // ignore
           }
         }
 
         // 2) If no revert data (common when ABI/contract mismatch), show explicit guidance
         if (
           errorMessage === "Mint thất bại" &&
           (String(error?.shortMessage || "").includes("missing revert data") ||
             String(error?.shortMessage || "").includes("could not decode") ||
             String(error?.message || "").includes("missing revert data") ||
             String(error?.message || "").includes("could not decode") ||
             String(error?.message || "").includes("require(false)"))
         ) {
           errorMessage =
             "Lỗi contract/ABI hoặc sai mạng. Hãy kiểm tra bạn đang ở BSC Testnet (97) và địa chỉ contract FUN Money đúng.";
         }
 
         if (errorMessage === "Mint thất bại") {
           if (error.reason) {
             errorMessage = error.reason;
           } else if (error.shortMessage) {
             // Try to extract custom error name from shortMessage
             const shortMsg = error.shortMessage;
             for (const [errorName, message] of Object.entries(MINT_ERROR_MESSAGES)) {
               if (shortMsg.includes(errorName)) {
                 errorMessage = message;
                 break;
               }
             }
             if (errorMessage === "Mint thất bại") {
               errorMessage = shortMsg;
             }
           } else if (error.message) {
             // Parse common errors
             if (error.message.includes("action already minted")) {
               errorMessage = "Action này đã được mint";
             } else if (error.message.includes("expired")) {
               errorMessage = "Request đã hết hạn";
             } else if (error.message.includes("invalid signer")) {
               errorMessage = "Chữ ký không hợp lệ";
             } else if (error.message.includes("epoch cap")) {
               errorMessage = "Đã đạt giới hạn epoch";
             } else if (error.message.includes("user cap")) {
               errorMessage = "Đã đạt giới hạn cá nhân";
             } else if (error.message.includes("user rejected")) {
               errorMessage = "Người dùng từ chối giao dịch";
             } else if (error.message.includes("InvalidNonce")) {
               errorMessage = MINT_ERROR_MESSAGES.InvalidNonce;
             } else if (error.message.includes("InvalidSigner")) {
               errorMessage = MINT_ERROR_MESSAGES.InvalidSigner;
             } else {
               errorMessage = error.message;
             }
           }
         }
 
         setMintStatus({ isLoading: false, txHash: null, error: errorMessage });
         toast.error(errorMessage, { id: "mint-tx" });
 
         return null;
       }
     },
     [contract, signer, isActionMinted, fetchContractInfo, chainId, iface]
   );
 
   // Request mint authorization from PPLP Engine
   const requestMintAuthorization = useCallback(
     async (actionId: string): Promise<SignedMintRequest | null> => {
       // Validate address format
       if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
         toast.error("Vui lòng kết nối ví MetaMask trước");
         return null;
       }
 
       // Prevent test/placeholder addresses
       if (address.startsWith("0x1234567890")) {
         toast.error("Địa chỉ ví không hợp lệ. Vui lòng kết nối ví thật.");
         return null;
       }
 
       try {
         const { data, error } = await supabase.functions.invoke("pplp-authorize-mint", {
           body: { action_id: actionId, wallet_address: address },
         });
 
         if (error) throw error;
         if (!data.success) throw new Error(data.error || "Authorization failed");
 
         return {
           to: data.mint_request.to,
           amount: BigInt(data.mint_request.amount),
           actionId: data.mint_request.actionId,
           evidenceHash: data.mint_request.evidenceHash,
           policyVersion: parseInt(data.mint_request.policyVersion),
           validAfter: parseInt(data.mint_request.validAfter),
           validBefore: parseInt(data.mint_request.validBefore),
           nonce: BigInt(data.mint_request.nonce),
           signature: data.mint_request.signature,
           signer: data.mint_request.signer,
         };
       } catch (error: any) {
         console.error("Failed to get mint authorization:", error);
         toast.error(error.message || "Không thể lấy authorization");
         return null;
       }
     },
     [address]
   );
 
   // Full mint flow: authorize → sign → submit
   const executeMint = useCallback(
     async (actionId: string): Promise<string | null> => {
       // Step 1: Get signed request from PPLP Engine
       const signedRequest = await requestMintAuthorization(actionId);
       if (!signedRequest) return null;
 
       // Step 2: Submit to blockchain
       return await mintWithSignature(signedRequest);
     },
     [requestMintAuthorization, mintWithSignature]
   );
 
   return {
     // State
     isConnected,
     address,
     chainId,
     hasWallet,
     contract,
     contractInfo,
     contractDiagnostics,
     networkDiagnostics,
     walletError,
     mintStatus,
 
     // Actions
     fetchContractInfo,
     isActionMinted,
     mintWithSignature,
     requestMintAuthorization,
     executeMint,
     connect,
     disconnect,
     resetBSCNetwork,
 
     // Helpers
     getContractAddress,
   };
 }