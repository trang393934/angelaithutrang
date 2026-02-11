import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { ethers } from "ethers";
import { useWeb3WalletContext as useWeb3Wallet } from "@/contexts/Web3WalletContext";
import {
  FUN_MONEY_ABI,
  FUN_MONEY_ADDRESSES,
  PPLP_ERROR_MESSAGES,
  UserAllocation,
} from "@/lib/funMoneyABI";
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
  balance: string; // Spendable balance
  locked: string; // Locked by PPLP (waiting for activate)
  activated: string; // Activated (ready to claim)
  epochMintCap: string;
  epochDuration: number;
  pauseTransitions: boolean;
  userNonce: number;
}

export interface ContractDiagnostics {
  isContractValid: boolean;
  contractCodeExists: boolean;
  blockNumber: number | null;
  error: string | null;
}

// Get ethereum provider from window
function getEthereumProvider(): ethers.BrowserProvider | null {
  if (typeof window !== "undefined" && (window as any).ethereum) {
    return new ethers.BrowserProvider((window as any).ethereum);
  }
  return null;
}

function extractErrorReason(error: any): string {
  const msg = error?.message || error?.reason || error?.shortMessage || "";
  
  // Check for known error patterns
  for (const [pattern, message] of Object.entries(PPLP_ERROR_MESSAGES)) {
    if (msg.toLowerCase().includes(pattern.toLowerCase())) {
      return message;
    }
  }
  
  // User rejection
  if (msg.includes("user rejected") || msg.includes("User denied")) {
    return "Người dùng từ chối giao dịch";
  }
  
  // Insufficient balance
  if (msg.includes("insufficient") || msg.includes("exceeds balance")) {
    return "Số dư không đủ để thực hiện giao dịch";
  }
  
  return msg || "Giao dịch thất bại";
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

  // Get contract address for current chain
  const getContractAddress = useCallback(() => {
    if (!chainId) {
      console.warn("[FUNMoney] getContractAddress: chainId is undefined");
      return null;
    }
    const addr = FUN_MONEY_ADDRESSES[chainId] || null;
    if (!addr) {
      console.warn(`[FUNMoney] getContractAddress: no contract for chainId=${chainId}. Expected 97 (BSC Testnet).`);
    }
    return addr;
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
        if (isConnected && !contractAddress) {
          console.warn(`[FUNMoney] Contract init skipped: no contract address for chainId=${chainId}. User may be on wrong network.`);
        }
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
    if (!contract || !address) {
      if (!contract && address) {
        console.warn("[FUNMoney] fetchContractInfo skipped: contract is null (wrong network or init failed)");
      }
      return null;
    }

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
        alloc,
        epochMintCap,
        epochDuration,
        pauseTransitions,
        userNonce,
      ] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.totalSupply(),
        contract.balanceOf(address),
        contract.alloc(address), // { locked, activated }
        contract.epochMintCap(),
        contract.epochDuration(),
        contract.pauseTransitions(),
        contract.nonces(address),
      ]);

      const info: ContractInfo = {
        name,
        symbol,
        decimals,
        totalSupply: ethers.formatUnits(totalSupply, decimals),
        balance: ethers.formatUnits(balance, decimals),
        locked: ethers.formatUnits(alloc.locked, decimals),
        activated: ethers.formatUnits(alloc.activated, decimals),
        epochMintCap: ethers.formatUnits(epochMintCap, decimals),
        epochDuration: Number(epochDuration),
        pauseTransitions,
        userNonce: Number(userNonce),
      };

      setContractInfo(info);
      return info;
    } catch (error) {
      console.error("Failed to fetch contract info:", error);
      return null;
    }
  }, [contract, address, contractDiagnostics]);

  // Get user allocation details
  const getUserAllocation = useCallback(async (): Promise<UserAllocation | null> => {
    if (!contract || !address) return null;

    try {
      const alloc = await contract.alloc(address);
      return {
        locked: alloc.locked,
        activated: alloc.activated,
        claimable: alloc.activated, // Can claim up to activated amount
      };
    } catch (error) {
      console.error("Failed to get user allocation:", error);
      return null;
    }
  }, [contract, address]);

  // Activate tokens (move from locked → activated)
  const activateTokens = useCallback(
    async (amount: bigint): Promise<string | null> => {
      if (!contract || !signer) {
        toast.error("Vui lòng kết nối ví trước");
        return null;
      }

      setMintStatus({ isLoading: true, txHash: null, error: null });

      try {
        // Check if transitions are paused
        const isPaused = await contract.pauseTransitions();
        if (isPaused) {
          throw new Error("Hệ thống đang tạm dừng transitions. Vui lòng thử lại sau.");
        }

        // Check locked balance
        const alloc = await contract.alloc(address);
        if (alloc.locked < amount) {
          throw new Error(`Không đủ số dư locked. Hiện có: ${ethers.formatUnits(alloc.locked, 18)} FUN`);
        }

        toast.loading("Đang activate tokens...", { id: "activate-tx" });

        const tx = await contract.activate(amount);
        const receipt = await tx.wait();
        const txHash = receipt.hash;

        setMintStatus({ isLoading: false, txHash, error: null });
        toast.success("Activate thành công!", { id: "activate-tx" });

        // Refresh contract info
        await fetchContractInfo();

        return txHash;
      } catch (error: any) {
        console.error("Activate failed:", error);
        const errorMessage = extractErrorReason(error);
        setMintStatus({ isLoading: false, txHash: null, error: errorMessage });
        toast.error(errorMessage, { id: "activate-tx" });
        return null;
      }
    },
    [contract, signer, address, fetchContractInfo]
  );

  // Claim tokens (move from activated → spendable balance)
  const claimTokens = useCallback(
    async (amount: bigint): Promise<string | null> => {
      if (!contract || !signer) {
        toast.error("Vui lòng kết nối ví trước");
        return null;
      }

      setMintStatus({ isLoading: true, txHash: null, error: null });

      try {
        // Check if transitions are paused
        const isPaused = await contract.pauseTransitions();
        if (isPaused) {
          throw new Error("Hệ thống đang tạm dừng transitions. Vui lòng thử lại sau.");
        }

        // Check activated balance
        const alloc = await contract.alloc(address);
        if (alloc.activated < amount) {
          throw new Error(`Không đủ số dư activated. Hiện có: ${ethers.formatUnits(alloc.activated, 18)} FUN`);
        }

        toast.loading("Đang claim tokens...", { id: "claim-tx" });

        const tx = await contract.claim(amount);
        const receipt = await tx.wait();
        const txHash = receipt.hash;

        setMintStatus({ isLoading: false, txHash, error: null });
        toast.success("Claim thành công!", { id: "claim-tx" });

        // Refresh contract info
        await fetchContractInfo();

        return txHash;
      } catch (error: any) {
        console.error("Claim failed:", error);
        const errorMessage = extractErrorReason(error);
        setMintStatus({ isLoading: false, txHash: null, error: errorMessage });
        toast.error(errorMessage, { id: "claim-tx" });
        return null;
      }
    },
    [contract, signer, address, fetchContractInfo]
  );

  // Request backend to create PPLP lock (attester signing)
  const requestPPLPLock = useCallback(
    async (actionId: string): Promise<{ txHash: string } | null> => {
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

      setMintStatus({ isLoading: true, txHash: null, error: null });

      try {
        toast.loading("Đang tạo yêu cầu PPLP Lock...", { id: "pplp-lock" });

        const { data, error } = await supabase.functions.invoke("pplp-authorize-mint", {
          body: { action_id: actionId, wallet_address: address },
        });

        if (error) {
          const errMsg = typeof error === 'object' ? JSON.stringify(error) : String(error);
          if (errMsg.includes('already minted')) {
            toast.info("ℹ️ Action này đã được mint on-chain trước đó.", { id: "pplp-lock" });
            setMintStatus({ isLoading: false, txHash: null, error: null });
            return null;
          }
          throw error;
        }
        if (!data.success) throw new Error(data.error || "Authorization failed");

        // Backend đã thực hiện lockWithPPLP rồi, trả về tx_hash
        if (data.tx_hash) {
          setMintStatus({ isLoading: false, txHash: data.tx_hash, error: null });
          toast.success("PPLP Lock thành công! Token đã được mint và lock.", { id: "pplp-lock" });
          
          // Refresh contract info
          await fetchContractInfo();
          
          return { txHash: data.tx_hash };
        }

        // Nếu chưa có tx_hash, backend đã signed nhưng chưa submit
        // (trường hợp này không nên xảy ra với flow mới)
        toast.info("Yêu cầu đã được ký. Token sẽ được mint sớm.", { id: "pplp-lock" });
        setMintStatus({ isLoading: false, txHash: null, error: null });
        return null;
      } catch (error: any) {
        console.error("Failed to request PPLP lock:", error);
        const errorMessage = error.message || "Không thể tạo yêu cầu PPLP Lock";
        setMintStatus({ isLoading: false, txHash: null, error: errorMessage });
        toast.error(errorMessage, { id: "pplp-lock" });
        return null;
      }
    },
    [address, fetchContractInfo]
  );

  // Execute full mint flow (for compatibility with existing UI)
  // This calls the backend to do lockWithPPLP
  const executeMint = useCallback(
    async (actionId: string): Promise<string | null> => {
      const result = await requestPPLPLock(actionId);
      return result?.txHash || null;
    },
    [requestPPLPLock]
  );

  // Check if action is already processed (check in database)
  const isActionMinted = useCallback(
    async (actionId: string): Promise<boolean> => {
      try {
        const { data } = await supabase
          .from("pplp_mint_requests")
          .select("status, tx_hash")
          .eq("action_id", actionId)
          .maybeSingle();

        return data?.status === "minted" && !!data?.tx_hash;
      } catch (error) {
        console.error("Failed to check action minted status:", error);
        return false;
      }
    },
    []
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
    getUserAllocation,
    activateTokens,
    claimTokens,
    requestPPLPLock,
    executeMint, // Main entry point for minting
    isActionMinted,
    connect,
    disconnect,
    resetBSCNetwork,

    // Helpers
    getContractAddress,
  };
}
