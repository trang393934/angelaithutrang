import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

// BSC Chain configuration
const BSC_CHAIN_ID = 56;
const BSC_CHAIN_ID_HEX = "0x38";
const BSC_CONFIG = {
  chainId: BSC_CHAIN_ID_HEX,
  chainName: "BNB Smart Chain",
  nativeCurrency: {
    name: "BNB",
    symbol: "BNB",
    decimals: 18,
  },
  rpcUrls: ["https://bsc-dataseed.binance.org/"],
  blockExplorerUrls: ["https://bscscan.com"],
};

// Popular BSC tokens with their contract addresses
const BSC_TOKENS = [
  {
    symbol: "BNB",
    name: "BNB",
    address: "native",
    decimals: 18,
    logo: "https://cryptologos.cc/logos/bnb-bnb-logo.png",
  },
  {
    symbol: "CAMLY",
    name: "Camly Coin",
    address: "0x3CE2eb776292f2e4De2b19F1FFc14bA3D77b097D", // Camly Coin contract
    decimals: 18,
    logo: "/src/assets/camly-coin-logo.png",
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    address: "0x55d398326f99059fF775485246999027B3197955",
    decimals: 18,
    logo: "https://cryptologos.cc/logos/tether-usdt-logo.png",
  },
  {
    symbol: "BUSD",
    name: "Binance USD",
    address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
    decimals: 18,
    logo: "https://cryptologos.cc/logos/binance-usd-busd-logo.png",
  },
  {
    symbol: "CAKE",
    name: "PancakeSwap",
    address: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82",
    decimals: 18,
    logo: "https://cryptologos.cc/logos/pancakeswap-cake-logo.png",
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

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const ethereum = (window as any).ethereum;
      
      // Request account access
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      
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
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error.message || "Không thể kết nối ví",
      }));
    }
  }, [hasWallet, fetchBalances]);

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
    if (wasConnected && hasWallet) {
      connect();
    }
  }, []);

  return {
    ...state,
    hasWallet,
    connect,
    disconnect,
    switchToBSC,
    refreshBalances,
  };
}
