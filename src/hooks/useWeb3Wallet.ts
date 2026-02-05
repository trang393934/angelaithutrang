import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

// BSC Chain configuration
const BSC_MAINNET_CHAIN_ID = 56;
const BSC_TESTNET_CHAIN_ID = 97;

// Current active network (Testnet for now)
const BSC_CHAIN_ID = BSC_TESTNET_CHAIN_ID;
const BSC_CHAIN_ID_HEX = "0x61"; // 97 in hex

const BSC_MAINNET_CONFIG = {
  chainId: "0x38",
  chainName: "BNB Smart Chain Mainnet",
  nativeCurrency: {
    name: "BNB",
    symbol: "BNB",
    decimals: 18,
  },
  rpcUrls: ["https://bsc-dataseed.binance.org/"],
  blockExplorerUrls: ["https://bscscan.com"],
};

const BSC_TESTNET_CONFIG = {
  chainId: BSC_CHAIN_ID_HEX,
  chainName: "BNB Smart Chain Testnet",
  nativeCurrency: {
    name: "tBNB",
    symbol: "tBNB",
    decimals: 18,
  },
  rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545/"],
  blockExplorerUrls: ["https://testnet.bscscan.com"],
};

// Use Testnet config as default
const BSC_CONFIG = BSC_TESTNET_CONFIG;

// Popular BSC tokens with their contract addresses
const BSC_TOKENS = [
  {
    symbol: "BNB",
    name: "tBNB (Testnet)",
    address: "native",
    decimals: 18,
    logo: "https://cryptologos.cc/logos/bnb-bnb-logo.png",
  },
  {
    symbol: "FUN",
    name: "FUN Money",
    address: "0x1aa8DE8B1E4465C6d729E8564893f8EF823a5ff2", // FUNMoney contract on Testnet
    decimals: 18,
    logo: "/src/assets/fun-money-logo.png",
  },
];

// ERC20 ABI for balance checking
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

export interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  balanceFormatted: string;
  address: string;
  logo: string;
  usdValue?: number;
}

export interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  shortAddress: string | null;
  chainId: number | null;
  isCorrectChain: boolean;
  balances: TokenBalance[];
  totalUsdValue: number;
  error: string | null;
}

export function useWeb3Wallet() {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    isConnecting: false,
    address: null,
    shortAddress: null,
    chainId: null,
    isCorrectChain: false,
    balances: [],
    totalUsdValue: 0,
    error: null,
  });

  // Check if MetaMask or compatible wallet is available
  const hasWallet = typeof window !== "undefined" && typeof (window as any).ethereum !== "undefined";

  // Get short address format
  const getShortAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Switch to BSC network
  const switchToBSC = async () => {
    if (!hasWallet) return false;
    
    const ethereum = (window as any).ethereum;
    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: BSC_CHAIN_ID_HEX }],
      });
      return true;
    } catch (switchError: any) {
      // Chain not added, try to add it
      if (switchError.code === 4902) {
        try {
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [BSC_CONFIG],
          });
          return true;
        } catch (addError) {
          console.error("Failed to add BSC network:", addError);
          return false;
        }
      }
      console.error("Failed to switch to BSC:", switchError);
      return false;
    }
  };

  // Fetch token balances
  const fetchBalances = useCallback(async (address: string) => {
    if (!hasWallet) return [];

    const ethereum = (window as any).ethereum;
    const provider = new ethers.BrowserProvider(ethereum);
    const balances: TokenBalance[] = [];

    for (const token of BSC_TOKENS) {
      try {
        let balance: bigint;
        
        if (token.address === "native") {
          // Get native BNB balance
          balance = await provider.getBalance(address);
        } else {
          // Get ERC20 token balance
          const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
          balance = await contract.balanceOf(address);
        }

        const formattedBalance = ethers.formatUnits(balance, token.decimals);
        const numBalance = parseFloat(formattedBalance);

        // Only add tokens with non-zero balance
        if (numBalance > 0) {
          balances.push({
            symbol: token.symbol,
            name: token.name,
            balance: balance.toString(),
            balanceFormatted: numBalance.toFixed(4),
            address: token.address,
            logo: token.logo,
          });
        }
      } catch (error) {
        console.error(`Error fetching ${token.symbol} balance:`, error);
      }
    }

    return balances;
  }, [hasWallet]);

  // Connect wallet
  const connect = useCallback(async () => {
    if (!hasWallet) {
      setState(prev => ({ ...prev, error: "Vui lòng cài đặt MetaMask hoặc ví Web3 tương thích" }));
      window.open("https://metamask.io/download/", "_blank");
      return;
    }

    // Prevent multiple connection attempts
    if (state.isConnecting) {
      console.log("Connection already in progress, skipping...");
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const ethereum = (window as any).ethereum;
      
      // First check if we already have accounts (user previously authorized)
      let accounts: string[] = [];
      try {
        accounts = await ethereum.request({ method: "eth_accounts" });
      } catch (e) {
        console.log("eth_accounts failed, will request access");
      }
      
      // Only request accounts if none are available
      if (accounts.length === 0) {
        try {
          accounts = await ethereum.request({ method: "eth_requestAccounts" });
        } catch (requestError: any) {
          // Handle "already processing" error gracefully
          if (requestError.code === -32002) {
            setState(prev => ({
              ...prev,
              isConnecting: false,
              error: "MetaMask đang chờ xác nhận. Vui lòng mở MetaMask và xác nhận yêu cầu.",
            }));
            return;
          }
          throw requestError;
        }
      }
      
      if (accounts.length === 0) {
        throw new Error("Không có tài khoản nào được chọn");
      }

      const address = accounts[0];
      const chainId = parseInt(await ethereum.request({ method: "eth_chainId" }), 16);
      const isCorrectChain = chainId === BSC_CHAIN_ID;

      // Switch to BSC if not on correct chain
      if (!isCorrectChain) {
        const switched = await switchToBSC();
        if (!switched) {
          setState(prev => ({
            ...prev,
            isConnecting: false,
            error: "Vui lòng chuyển sang mạng BSC",
          }));
          return;
        }
      }

      // Fetch balances
      const balances = await fetchBalances(address);

      setState({
        isConnected: true,
        isConnecting: false,
        address,
        shortAddress: getShortAddress(address),
        chainId: BSC_CHAIN_ID,
        isCorrectChain: true,
        balances,
        totalUsdValue: 0,
        error: null,
      });

      // Save connection state
      localStorage.setItem("wallet_connected", "true");
    } catch (error: any) {
      console.error("Connection error:", error);
      
      // Don't show error for user rejection
      if (error.code === 4001) {
        setState(prev => ({
          ...prev,
          isConnecting: false,
          error: null,
        }));
        return;
      }
      
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error.message || "Không thể kết nối ví",
      }));
    }
  }, [hasWallet, fetchBalances, state.isConnecting]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setState({
      isConnected: false,
      isConnecting: false,
      address: null,
      shortAddress: null,
      chainId: null,
      isCorrectChain: false,
      balances: [],
      totalUsdValue: 0,
      error: null,
    });
    localStorage.removeItem("wallet_connected");
  }, []);

  // Refresh balances
  const refreshBalances = useCallback(async () => {
    if (!state.address) return;
    const balances = await fetchBalances(state.address);
    setState(prev => ({ ...prev, balances }));
  }, [state.address, fetchBalances]);

  // Listen for account and chain changes
  useEffect(() => {
    if (!hasWallet) return;

    const ethereum = (window as any).ethereum;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (state.isConnected) {
        const newAddress = accounts[0];
        const balances = await fetchBalances(newAddress);
        setState(prev => ({
          ...prev,
          address: newAddress,
          shortAddress: getShortAddress(newAddress),
          balances,
        }));
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      const chainId = parseInt(chainIdHex, 16);
      const isCorrectChain = chainId === BSC_CHAIN_ID;
      setState(prev => ({
        ...prev,
        chainId,
        isCorrectChain,
      }));
      
      if (isCorrectChain && state.address) {
        refreshBalances();
      }
    };

    ethereum.on("accountsChanged", handleAccountsChanged);
    ethereum.on("chainChanged", handleChainChanged);

    return () => {
      ethereum.removeListener("accountsChanged", handleAccountsChanged);
      ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [hasWallet, state.isConnected, state.address, disconnect, fetchBalances, refreshBalances]);

  // Auto-reconnect on page load
  useEffect(() => {
    const wasConnected = localStorage.getItem("wallet_connected") === "true";
    if (wasConnected && hasWallet && !state.isConnecting && !state.isConnected) {
      // Use a silent reconnect that checks existing accounts without prompting
      const silentReconnect = async () => {
        try {
          const ethereum = (window as any).ethereum;
          
          // Check if ethereum provider is ready
          if (!ethereum || typeof ethereum.request !== "function") {
            console.log("Ethereum provider not ready");
            localStorage.removeItem("wallet_connected");
            return;
          }
          
          // Use Promise.race with timeout to prevent hanging
          const timeoutPromise = new Promise<string[]>((_, reject) => 
            setTimeout(() => reject(new Error("Timeout")), 5000)
          );
          
          const accounts = await Promise.race([
            ethereum.request({ method: "eth_accounts" }),
            timeoutPromise
          ]).catch(() => [] as string[]);
          
          if (accounts.length > 0) {
            const address = accounts[0];
            const chainIdHex = await ethereum.request({ method: "eth_chainId" }).catch(() => "0x0");
            const chainId = parseInt(chainIdHex, 16);
            const isCorrectChain = chainId === BSC_CHAIN_ID;
            
            if (isCorrectChain) {
              const balances = await fetchBalances(address);
              setState({
                isConnected: true,
                isConnecting: false,
                address,
                shortAddress: getShortAddress(address),
                chainId: BSC_CHAIN_ID,
                isCorrectChain: true,
                balances,
                totalUsdValue: 0,
                error: null,
              });
            }
          }
        } catch (error) {
          console.log("Silent reconnect failed:", error);
          localStorage.removeItem("wallet_connected");
        }
      };
      
      // Delay reconnect to ensure MetaMask is fully initialized
      const timer = setTimeout(silentReconnect, 500);
      return () => clearTimeout(timer);
    }
  }, [hasWallet]);

  return {
    ...state,
    hasWallet,
    connect,
    disconnect,
    switchToBSC,
    refreshBalances,
  };
}
