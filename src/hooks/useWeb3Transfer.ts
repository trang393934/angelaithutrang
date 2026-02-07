import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { useWeb3Wallet } from "./useWeb3Wallet";

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

export function useWeb3Transfer() {
  const { isConnected, address, connect, hasWallet } = useWeb3Wallet();
  const [isTransferring, setIsTransferring] = useState(false);
  const [camlyCoinBalance, setCamlyCoinBalance] = useState<string>("0");

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
      // Chain not added yet — add it
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

  // Fetch CAMLY token balance using dedicated BSC Mainnet provider (not the wallet's testnet provider)
  const fetchCamlyBalance = useCallback(async () => {
    if (!isConnected || !address || !hasWallet) {
      setCamlyCoinBalance("0");
      return "0";
    }

    try {
      // Use a read-only mainnet provider — independent of the wallet's current chain
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

  // Safe wrapper for wallet connect that catches MetaMask internal errors
  const safeConnect = useCallback(async (): Promise<boolean> => {
    // Never attempt wallet connection inside iframes
    if (isInIframe()) {
      console.warn("[Web3Transfer] Blocked connect inside iframe");
      return false;
    }

    try {
      await connect();
      // Verify connection actually succeeded by checking ethereum accounts
      const ethereum = (window as any).ethereum;
      if (!ethereum) return false;
      const accounts = await ethereum.request({ method: "eth_accounts" }).catch(() => []);
      return accounts.length > 0;
    } catch (error: any) {
      console.warn("[Web3Transfer] Connect failed:", error?.message || error);
      return false;
    }
  }, [connect]);

  // Transfer CAMLY token to another address (requires BSC Mainnet)
  const transferCamly = useCallback(async (
    toAddress: string,
    amount: number
  ): Promise<TransferResult> => {
    // Block transfers inside iframes — MetaMask can't open popups
    if (isInIframe()) {
      return { success: false, message: "Không thể chuyển token trong môi trường preview. Vui lòng mở ứng dụng trong tab mới." };
    }

    if (!hasWallet) {
      return { success: false, message: "Vui lòng cài đặt MetaMask hoặc ví Web3 tương thích" };
    }

    // Pre-flight: verify MetaMask is responsive
    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum || typeof ethereum.request !== "function") {
        return { success: false, message: "MetaMask không sẵn sàng. Vui lòng mở lại extension." };
      }
      await ethereum.request({ method: "eth_accounts" });
    } catch (healthErr: any) {
      console.warn("[Web3Transfer] MetaMask health check failed:", healthErr?.message);
      return { success: false, message: "MetaMask không phản hồi. Vui lòng khởi động lại trình duyệt hoặc mở lại MetaMask." };
    }

    if (!isConnected) {
      const connected = await safeConnect();
      if (!connected) {
        return { success: false, message: "Không thể kết nối ví. Vui lòng mở MetaMask và thử lại." };
      }
      return { success: false, message: "Đã kết nối ví. Vui lòng bấm lại nút chuyển." };
    }

    // Switch to BSC Mainnet for CAMLY transfers
    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum || typeof ethereum.request !== "function") {
        return { success: false, message: "MetaMask không sẵn sàng. Vui lòng mở lại extension." };
      }
      
      const currentChainId = await ethereum.request({ method: "eth_chainId" }).catch(() => "0x0");
      if (parseInt(currentChainId, 16) !== BSC_MAINNET_CHAIN_ID) {
        const switched = await switchToMainnet();
        if (!switched) {
          return { success: false, message: "Vui lòng chuyển sang mạng BSC Mainnet để chuyển CAMLY" };
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
      
      const contract = new ethers.Contract(CAMLY_TOKEN_ADDRESS, ERC20_TRANSFER_ABI, signer);
      
      // Convert amount to smallest unit (3 decimals for CAMLY)
      const amountInWei = ethers.parseUnits(amount.toString(), CAMLY_DECIMALS);
      
      // Check balance
      const balance = await contract.balanceOf(address);
      if (balance < amountInWei) {
        setIsTransferring(false);
        return { 
          success: false, 
          message: `Số dư CAMLY không đủ. Hiện có: ${ethers.formatUnits(balance, CAMLY_DECIMALS)} CAMLY` 
        };
      }

      // Send transaction
      const tx = await contract.transfer(toAddress, amountInWei);
      
      // Wait for confirmation
      const receipt = await tx.wait();

      console.log("[Web3Transfer] TX receipt:", JSON.stringify({
        hash: receipt.hash,
        blockNumber: receipt.blockNumber,
        status: receipt.status,
      }));

      setIsTransferring(false);

      return {
        success: true,
        txHash: receipt.hash,
        message: `Chuyển thành công ${amount.toLocaleString()} CAMLY!`,
      };
    } catch (error: any) {
      console.error("Transfer error:", error);
      setIsTransferring(false);

      // Handle user rejection
      if (error.code === 4001 || error.code === "ACTION_REJECTED") {
        return { success: false, message: "Giao dịch đã bị hủy" };
      }

      // Handle insufficient funds for gas
      if (error.code === "INSUFFICIENT_FUNDS") {
        return { success: false, message: "Không đủ BNB để thanh toán phí gas" };
      }

      // Handle MetaMask internal errors gracefully
      if (error.message?.includes("MetaMask") || error.message?.includes("inpage")) {
        return { success: false, message: "MetaMask gặp lỗi. Vui lòng mở lại MetaMask và thử lại." };
      }

      return { 
        success: false, 
        message: error.reason || error.message || "Lỗi khi chuyển token" 
      };
    }
  }, [hasWallet, isConnected, address, safeConnect, switchToMainnet]);

  // Donate CAMLY to project treasury
  const donateCamlyToProject = useCallback(async (
    amount: number
  ): Promise<TransferResult> => {
    return transferCamly(TREASURY_WALLET_ADDRESS, amount);
  }, [transferCamly]);

  return {
    isTransferring,
    camlyCoinBalance,
    fetchCamlyBalance,
    transferCamly,
    donateCamlyToProject,
    isConnected,
    address,
    hasWallet,
    connect,
    TREASURY_WALLET_ADDRESS,
  };
}
