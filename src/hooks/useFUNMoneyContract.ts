import { useState, useCallback, useEffect, useMemo } from "react";
import { ethers } from "ethers";
import { useWeb3Wallet } from "./useWeb3Wallet";
import { FUN_MONEY_ABI, FUN_MONEY_ADDRESSES, SignedMintRequest } from "@/lib/funMoneyABI";
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

// Get ethereum provider from window
function getEthereumProvider(): ethers.BrowserProvider | null {
  if (typeof window !== "undefined" && (window as any).ethereum) {
    return new ethers.BrowserProvider((window as any).ethereum);
  }
  return null;
}

export function useFUNMoneyContract() {
  const { isConnected, address, chainId } = useWeb3Wallet();
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [contractInfo, setContractInfo] = useState<ContractInfo | null>(null);
  const [mintStatus, setMintStatus] = useState<MintStatus>({
    isLoading: false,
    txHash: null,
    error: null,
  });

  // Get contract address for current chain
  const getContractAddress = useCallback(() => {
    if (!chainId) return null;
    return FUN_MONEY_ADDRESSES[chainId] || null;
  }, [chainId]);

  // Initialize signer and contract
  useEffect(() => {
    const initContract = async () => {
      const contractAddress = getContractAddress();
      const provider = getEthereumProvider();
      
      if (!contractAddress || !provider || !isConnected) {
        setContract(null);
        setSigner(null);
        return;
      }

      try {
        const walletSigner = await provider.getSigner();
        setSigner(walletSigner);
        
        const contractInstance = new ethers.Contract(
          contractAddress,
          FUN_MONEY_ABI,
          walletSigner
        );
        setContract(contractInstance);
      } catch (error) {
        console.error("Failed to initialize FUNMoney contract:", error);
        setContract(null);
        setSigner(null);
      }
    };

    initContract();
  }, [isConnected, getContractAddress]);

  // Fetch contract info
  const fetchContractInfo = useCallback(async () => {
    if (!contract || !address) return null;

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
        contract.getNonce(address),
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
  }, [contract, address]);

  // Check if action is already minted
  const isActionMinted = useCallback(async (actionId: string): Promise<boolean> => {
    if (!contract) return false;
    
    try {
      return await contract.isActionMinted(actionId);
    } catch (error) {
      console.error("Failed to check action minted status:", error);
      return false;
    }
  }, [contract]);

  // Mint with signed request from PPLP Engine
  const mintWithSignature = useCallback(async (
    signedRequest: SignedMintRequest
  ): Promise<string | null> => {
    if (!contract || !signer) {
      toast.error("Vui lòng kết nối ví trước");
      return null;
    }

    setMintStatus({ isLoading: true, txHash: null, error: null });

    try {
      // Check if already minted
      const alreadyMinted = await isActionMinted(signedRequest.actionId);
      if (alreadyMinted) {
        throw new Error("Action này đã được mint trước đó");
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

      // Execute mint transaction
      const tx = await contract.mintWithSignature(mintRequest, signedRequest.signature);
      
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
          minted_at: new Date().toISOString()
        })
        .eq("action_hash", signedRequest.actionId);

      // Refresh contract info
      await fetchContractInfo();

      return txHash;
    } catch (error: any) {
      console.error("Mint failed:", error);
      
      let errorMessage = "Mint thất bại";
      
      if (error.reason) {
        errorMessage = error.reason;
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
        } else {
          errorMessage = error.message;
        }
      }

      setMintStatus({ isLoading: false, txHash: null, error: errorMessage });
      toast.error(errorMessage, { id: "mint-tx" });
      
      return null;
    }
  }, [contract, signer, isActionMinted, fetchContractInfo]);

  // Request mint authorization from PPLP Engine
  const requestMintAuthorization = useCallback(async (actionId: string): Promise<SignedMintRequest | null> => {
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
  }, [address]);

  // Full mint flow: authorize → sign → submit
  const executeMint = useCallback(async (actionId: string): Promise<string | null> => {
    // Step 1: Get signed request from PPLP Engine
    const signedRequest = await requestMintAuthorization(actionId);
    if (!signedRequest) return null;

    // Step 2: Submit to blockchain
    return await mintWithSignature(signedRequest);
  }, [requestMintAuthorization, mintWithSignature]);

  return {
    // State
    isConnected,
    address,
    chainId,
    contract,
    contractInfo,
    mintStatus,
    
    // Actions
    fetchContractInfo,
    isActionMinted,
    mintWithSignature,
    requestMintAuthorization,
    executeMint,
    
    // Helpers
    getContractAddress,
  };
}
