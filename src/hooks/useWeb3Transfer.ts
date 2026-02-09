import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { useWeb3WalletContext as useWeb3Wallet } from "@/contexts/Web3WalletContext";
import { FUN_MONEY_ABI, FUN_MONEY_ADDRESSES } from "@/lib/funMoneyABI";

// Detect if running inside an iframe (e.g. Lovable preview)
const isInIframe = (): boolean => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};

// CAMLY Token contract on BSC Mainnet
const CAMLY_TOKEN_ADDRESS = "0x0910320181889fefde0bb1ca63962b0a8882e413";
const CAMLY_DECIMALS = 3; // CAMLY uses 3 decimals

// FUN Money on BSC Testnet
const FUN_MONEY_ADDRESS = FUN_MONEY_ADDRESSES[97];
const FUN_MONEY_DECIMALS = 18;
const BSC_TESTNET_CHAIN_ID = 97;
const BSC_TESTNET_RPC = "https://data-seed-prebsc-1-s1.binance.org:8545/";

// BSC Mainnet RPC for reading CAMLY balance (separate from wallet's testnet connection)
const BSC_MAINNET_RPC = "https://bsc-dataseed.binance.org/";
const BSC_MAINNET_CHAIN_ID = 56;

// Project Treasury wallet address
export const TREASURY_WALLET_ADDRESS = "0x02D5578173bd0DB25462BB32A254Cd4b2E6D9a0D";

// ERC20 ABI for transfer
const ERC20_TRANSFER_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

export interface TransferResult {
  success: boolean;
  txHash?: string;
  message: string;
}

export type TokenType = "camly" | "fun";

export function useWeb3Transfer() {
  const { isConnected, address, connect, hasWallet } = useWeb3Wallet();
  const [isTransferring, setIsTransferring] = useState(false);
  const [camlyCoinBalance, setCamlyCoinBalance] = useState<string>("0");
  const [funMoneyBalance, setFunMoneyBalance] = useState<string>("0");

  // Switch wallet to BSC Mainnet for CAMLY transfers
  const switchToMainnet = useCallback(async (): Promise<boolean> => {
    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) return false;

      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x38" }], // 0x38 = 56 (BSC Mainnet)
      });
      return true;
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await (window as any).ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: "0x38",
              chainName: "BNB Smart Chain",
              nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
              rpcUrls: [BSC_MAINNET_RPC],
              blockExplorerUrls: ["https://bscscan.com"],
            }],
          });
          return true;
        } catch {
          return false;
        }
      }
      console.error("Error switching to BSC Mainnet:", switchError);
      return false;
    }
  }, []);

  // Switch wallet to BSC Testnet for FUN Money transfers
  const switchToTestnet = useCallback(async (): Promise<boolean> => {
    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) return false;

      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x61" }], // 0x61 = 97 (BSC Testnet)
      });
      return true;
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await (window as any).ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: "0x61",
              chainName: "BNB Smart Chain Testnet",
              nativeCurrency: { name: "tBNB", symbol: "tBNB", decimals: 18 },
              rpcUrls: [BSC_TESTNET_RPC],
              blockExplorerUrls: ["https://testnet.bscscan.com"],
            }],
          });
          return true;
        } catch {
          return false;
        }
      }
      console.error("Error switching to BSC Testnet:", switchError);
      return false;
    }
  }, []);

  // Fetch CAMLY token balance using dedicated BSC Mainnet provider
  const fetchCamlyBalance = useCallback(async () => {
    if (!isConnected || !address || !hasWallet) {
      setCamlyCoinBalance("0");
      return "0";
    }

    try {
      const mainnetProvider = new ethers.JsonRpcProvider(BSC_MAINNET_RPC);
      const contract = new ethers.Contract(CAMLY_TOKEN_ADDRESS, ERC20_TRANSFER_ABI, mainnetProvider);
      
      const balance = await contract.balanceOf(address);
      const formattedBalance = ethers.formatUnits(balance, CAMLY_DECIMALS);
      setCamlyCoinBalance(formattedBalance);
      return formattedBalance;
    } catch (error) {
      console.error("Error fetching CAMLY balance:", error);
      setCamlyCoinBalance("0");
      return "0";
    }
  }, [isConnected, address, hasWallet]);

  // Fetch FUN Money balance using dedicated BSC Testnet provider
  const fetchFunMoneyBalance = useCallback(async () => {
    if (!isConnected || !address || !hasWallet) {
      setFunMoneyBalance("0");
      return "0";
    }

    try {
      const testnetProvider = new ethers.JsonRpcProvider(BSC_TESTNET_RPC);
      const contract = new ethers.Contract(FUN_MONEY_ADDRESS, FUN_MONEY_ABI, testnetProvider);
      
      const balance = await contract.balanceOf(address);
      const formattedBalance = ethers.formatUnits(balance, FUN_MONEY_DECIMALS);
      setFunMoneyBalance(formattedBalance);
      return formattedBalance;
    } catch (error) {
      console.error("Error fetching FUN Money balance:", error);
      setFunMoneyBalance("0");
      return "0";
    }
  }, [isConnected, address, hasWallet]);

  // Safe wrapper for wallet connect
  const safeConnect = useCallback(async (): Promise<boolean> => {
    if (isInIframe()) {
      console.warn("[Web3Transfer] Blocked connect inside iframe");
      return false;
    }

    try {
      await connect();
      const ethereum = (window as any).ethereum;
      if (!ethereum) return false;
      const accounts = await ethereum.request({ method: "eth_accounts" }).catch(() => []);
      return accounts.length > 0;
    } catch (error: any) {
      console.warn("[Web3Transfer] Connect failed:", error?.message || error);
      return false;
    }
  }, [connect]);

  // Pre-flight check: verify MetaMask is responsive and get live account
  const preflightCheck = useCallback(async (): Promise<{ success: boolean; address: string | null; message?: string }> => {
    if (isInIframe()) {
      return { success: false, address: null, message: "Không thể chuyển token trong môi trường preview. Vui lòng mở ứng dụng trong tab mới." };
    }

    if (!hasWallet) {
      return { success: false, address: null, message: "Vui lòng cài đặt MetaMask hoặc ví Web3 tương thích" };
    }

    let liveAddress: string | null = null;
    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum || typeof ethereum.request !== "function") {
        return { success: false, address: null, message: "MetaMask không sẵn sàng. Vui lòng mở lại extension." };
      }
      const accounts: string[] = await ethereum.request({ method: "eth_accounts" }).catch(() => []);
      if (accounts.length > 0) {
        liveAddress = accounts[0];
      }
    } catch (healthErr: any) {
      console.warn("[Web3Transfer] MetaMask health check failed:", healthErr?.message);
      return { success: false, address: null, message: "MetaMask không phản hồi. Vui lòng khởi động lại trình duyệt." };
    }

    if (!liveAddress) {
      if (!isConnected) {
        const connected = await safeConnect();
        if (!connected) {
          return { success: false, address: null, message: "Không thể kết nối ví. Vui lòng mở MetaMask và thử lại." };
        }
        try {
          const ethereum = (window as any).ethereum;
          const accounts: string[] = await ethereum.request({ method: "eth_accounts" }).catch(() => []);
          if (accounts.length > 0) liveAddress = accounts[0];
        } catch { /* fall through */ }
      }
      if (!liveAddress) {
        return { success: false, address: null, message: "Vui lòng kết nối ví trước khi chuyển token." };
      }
    }

    return { success: true, address: liveAddress };
  }, [hasWallet, isConnected, safeConnect]);

  // Generic token transfer function
  const transferToken = useCallback(async (
    toAddress: string,
    amount: number,
    tokenType: TokenType
  ): Promise<TransferResult> => {
    const preflight = await preflightCheck();
    if (!preflight.success || !preflight.address) {
      return { success: false, message: preflight.message || "Lỗi kết nối ví" };
    }

    const activeAddress = preflight.address;
    const isCamly = tokenType === "camly";
    const tokenAddress = isCamly ? CAMLY_TOKEN_ADDRESS : FUN_MONEY_ADDRESS;
    const tokenDecimals = isCamly ? CAMLY_DECIMALS : FUN_MONEY_DECIMALS;
    const targetChainId = isCamly ? BSC_MAINNET_CHAIN_ID : BSC_TESTNET_CHAIN_ID;
    const tokenSymbol = isCamly ? "CAMLY" : "FUN";
    const explorerBase = isCamly ? "https://bscscan.com" : "https://testnet.bscscan.com";
    const switchFn = isCamly ? switchToMainnet : switchToTestnet;

    // Switch to correct network
    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum || typeof ethereum.request !== "function") {
        return { success: false, message: "MetaMask không sẵn sàng." };
      }
      
      const currentChainId = await ethereum.request({ method: "eth_chainId" }).catch(() => "0x0");
      if (parseInt(currentChainId, 16) !== targetChainId) {
        const switched = await switchFn();
        if (!switched) {
          return { success: false, message: `Vui lòng chuyển sang mạng ${isCamly ? "BSC Mainnet" : "BSC Testnet"} để chuyển ${tokenSymbol}` };
        }
      }
    } catch (chainError: any) {
      console.warn("[Web3Transfer] Chain check error:", chainError?.message);
      return { success: false, message: "Lỗi kiểm tra mạng. Vui lòng mở MetaMask và thử lại." };
    }

    if (!ethers.isAddress(toAddress)) {
      return { success: false, message: "Địa chỉ ví không hợp lệ" };
    }

    if (amount <= 0) {
      return { success: false, message: "Số lượng phải lớn hơn 0" };
    }

    setIsTransferring(true);

    try {
      const ethereum = (window as any).ethereum;
      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      
      const abi = isCamly ? ERC20_TRANSFER_ABI : FUN_MONEY_ABI;
      const contract = new ethers.Contract(tokenAddress, abi, signer);
      
      const amountInWei = ethers.parseUnits(amount.toString(), tokenDecimals);
      
      // Check balance
      const balance = await contract.balanceOf(activeAddress);
      if (balance < amountInWei) {
        setIsTransferring(false);
        return { 
          success: false, 
          message: `Số dư ${tokenSymbol} không đủ. Hiện có: ${ethers.formatUnits(balance, tokenDecimals)} ${tokenSymbol}` 
        };
      }

      const tx = await contract.transfer(toAddress, amountInWei);
      const receipt = await tx.wait();

      console.log(`[Web3Transfer] ${tokenSymbol} TX receipt:`, JSON.stringify({
        hash: receipt.hash,
        blockNumber: receipt.blockNumber,
        status: receipt.status,
      }));

      setIsTransferring(false);

      return {
        success: true,
        txHash: receipt.hash,
        message: `Chuyển thành công ${amount.toLocaleString()} ${tokenSymbol}!`,
      };
    } catch (error: any) {
      console.error(`${tokenSymbol} Transfer error:`, error);
      setIsTransferring(false);

      if (error.code === 4001 || error.code === "ACTION_REJECTED") {
        return { success: false, message: "Giao dịch đã bị hủy" };
      }
      if (error.code === "INSUFFICIENT_FUNDS") {
        return { success: false, message: `Không đủ ${isCamly ? "BNB" : "tBNB"} để thanh toán phí gas` };
      }
      if (error.message?.includes("MetaMask") || error.message?.includes("inpage")) {
        return { success: false, message: "MetaMask gặp lỗi. Vui lòng mở lại MetaMask và thử lại." };
      }

      return { 
        success: false, 
        message: error.reason || error.message || "Lỗi khi chuyển token" 
      };
    }
  }, [preflightCheck, switchToMainnet, switchToTestnet]);

  // Transfer CAMLY token (BSC Mainnet)
  const transferCamly = useCallback(async (toAddress: string, amount: number): Promise<TransferResult> => {
    return transferToken(toAddress, amount, "camly");
  }, [transferToken]);

  // Transfer FUN Money token (BSC Testnet)
  const transferFunMoney = useCallback(async (toAddress: string, amount: number): Promise<TransferResult> => {
    return transferToken(toAddress, amount, "fun");
  }, [transferToken]);

  // Donate CAMLY to project treasury
  const donateCamlyToProject = useCallback(async (amount: number): Promise<TransferResult> => {
    return transferCamly(TREASURY_WALLET_ADDRESS, amount);
  }, [transferCamly]);

  return {
    isTransferring,
    camlyCoinBalance,
    funMoneyBalance,
    fetchCamlyBalance,
    fetchFunMoneyBalance,
    transferCamly,
    transferFunMoney,
    transferToken,
    donateCamlyToProject,
    isConnected,
    address,
    hasWallet,
    connect,
    TREASURY_WALLET_ADDRESS,
  };
}
