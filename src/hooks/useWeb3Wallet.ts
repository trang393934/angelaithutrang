import { useState, useEffect, useCallback, useRef } from "react";
import { ethers } from "ethers";

// Detect if running inside an iframe (e.g. Lovable preview)
const isInIframe = (): boolean => {
  try {
    return window.self !== window.top;
  } catch {
    return true; // If access is blocked, assume iframe
  }
};

// Detect mobile device
const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

// Check if we're inside MetaMask's in-app browser
const isMetaMaskBrowser = (): boolean => {
  return typeof (window as any).ethereum !== "undefined" && 
    (window as any).ethereum.isMetaMask === true;
};

// Build MetaMask deep link to open current site in MetaMask's browser
const getMetaMaskDeepLink = (): string => {
  const currentUrl = window.location.href.replace(/^https?:\/\//, "");
  return `https://metamask.app.link/dapp/${currentUrl}`;
};
 
 // BSC Testnet RPC endpoints (fallback list)
 const BSC_TESTNET_RPC_LIST = [
   "https://data-seed-prebsc-1-s1.binance.org:8545",
   "https://data-seed-prebsc-2-s1.binance.org:8545",
   "https://data-seed-prebsc-1-s2.binance.org:8545",
   "https://data-seed-prebsc-2-s2.binance.org:8545",
 ];
 
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
   rpcUrls: BSC_TESTNET_RPC_LIST,
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
 
 export interface NetworkDiagnostics {
   isValidChain: boolean;
   blockNumber: number | null;
   contractCodeExists: boolean | null;
   rpcError: string | null;
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
   networkDiagnostics: NetworkDiagnostics | null;
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
     networkDiagnostics: null,
   });
 
   // Prevent parallel connection attempts
   const connectingRef = useRef(false);
 
   // Check if MetaMask or compatible wallet is available
   const hasWallet = typeof window !== "undefined" && typeof (window as any).ethereum !== "undefined";
 
   // Get short address format
   const getShortAddress = (address: string) => {
     return `${address.slice(0, 6)}...${address.slice(-4)}`;
   };
 
   // Verify we're actually on BSC Testnet (block number check)
   const verifyBSCTestnet = useCallback(async (provider: ethers.BrowserProvider): Promise<NetworkDiagnostics> => {
     const diagnostics: NetworkDiagnostics = {
       isValidChain: false,
       blockNumber: null,
       contractCodeExists: null,
       rpcError: null,
     };
 
     try {
       // 1. Check chain ID
       const network = await provider.getNetwork();
       const chainId = Number(network.chainId);
       diagnostics.isValidChain = chainId === BSC_TESTNET_CHAIN_ID;
 
       if (!diagnostics.isValidChain) {
         diagnostics.rpcError = `Wrong chain: expected 97, got ${chainId}`;
         return diagnostics;
       }
 
       // 2. Check block number (BSC Testnet should be >80M blocks)
       const blockNumber = await provider.getBlockNumber();
       diagnostics.blockNumber = blockNumber;
 
       if (blockNumber < 10_000_000) {
         diagnostics.rpcError = `Block number too low (${blockNumber}). RPC might be wrong network.`;
         diagnostics.isValidChain = false;
         return diagnostics;
       }
 
       // 3. Check if FUN Money contract has code
       const contractAddress = BSC_TOKENS.find((t) => t.symbol === "FUN")?.address;
       if (contractAddress && contractAddress !== "native") {
         const code = await provider.getCode(contractAddress);
         diagnostics.contractCodeExists = code !== "0x" && code.length > 2;
 
         if (!diagnostics.contractCodeExists) {
           diagnostics.rpcError = "FUN Money contract not found at address. Wrong network or not deployed.";
           diagnostics.isValidChain = false;
         }
       }
 
       return diagnostics;
     } catch (error: any) {
       diagnostics.rpcError = error.message || "Failed to verify network";
       return diagnostics;
     }
   }, []);
 
   // Switch to BSC network
   const switchToBSC = useCallback(async () => {
     if (!hasWallet) return false;
 
     const ethereum = (window as any).ethereum;
     try {
       // First try to add/update the chain with proper RPC list
       try {
         await ethereum.request({
           method: "wallet_addEthereumChain",
           params: [BSC_TESTNET_CONFIG],
         });
       } catch (addError: any) {
         // Chain might already exist, continue
         if (addError.code !== 4001) {
           console.log("wallet_addEthereumChain result:", addError);
         }
       }
 
       // Then switch to it
       await ethereum.request({
         method: "wallet_switchEthereumChain",
         params: [{ chainId: BSC_CHAIN_ID_HEX }],
       });
       return true;
     } catch (switchError: any) {
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
   }, [hasWallet]);
 
   // Force reset BSC Testnet network in wallet
   const resetBSCNetwork = useCallback(async () => {
     if (!hasWallet) return false;
 
     const ethereum = (window as any).ethereum;
     try {
       // Add fresh network config with multiple RPCs
       await ethereum.request({
         method: "wallet_addEthereumChain",
         params: [BSC_TESTNET_CONFIG],
       });
 
       await ethereum.request({
         method: "wallet_switchEthereumChain",
         params: [{ chainId: BSC_CHAIN_ID_HEX }],
       });
 
       return true;
     } catch (error) {
       console.error("Failed to reset BSC network:", error);
       return false;
     }
   }, [hasWallet]);
 
   // Fetch token balances
   const fetchBalances = useCallback(
     async (address: string) => {
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
     },
     [hasWallet]
   );
 
    // Connect wallet
    const connect = useCallback(async () => {
      // Block wallet connection inside iframes (preview environments)
      if (isInIframe()) {
        setState((prev) => ({
          ...prev,
          error: "Vui lòng mở trang web trong tab mới để kết nối ví.",
        }));
        return;
      }

       if (!hasWallet) {
         // On mobile, open MetaMask deep link instead of download page
         if (isMobileDevice()) {
           window.location.href = getMetaMaskDeepLink();
           setState((prev) => ({ ...prev, isConnecting: false }));
           connectingRef.current = false;
           return;
         }
         setState((prev) => ({ ...prev, error: "Vui lòng cài đặt MetaMask hoặc ví Web3 tương thích" }));
         window.open("https://metamask.io/download/", "_blank");
         return;
       }
 
     // Prevent multiple connection attempts
     if (state.isConnecting || connectingRef.current) {
       console.log("Connection already in progress, skipping...");
       return;
     }
 
     connectingRef.current = true;
     setState((prev) => ({ ...prev, isConnecting: true, error: null, networkDiagnostics: null }));
 
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
             setState((prev) => ({
               ...prev,
               isConnecting: false,
               error: "MetaMask đang chờ xác nhận. Vui lòng mở MetaMask và xác nhận yêu cầu.",
             }));
             connectingRef.current = false;
             return;
           }
           throw requestError;
         }
       }
 
       if (accounts.length === 0) {
         throw new Error("Không có tài khoản nào được chọn");
       }
 
       const address = accounts[0];
 
       // Read chainId AFTER potential switch
       let chainId = parseInt(await ethereum.request({ method: "eth_chainId" }), 16);
       let isCorrectChain = chainId === BSC_CHAIN_ID;
 
       // Switch to BSC if not on correct chain
       if (!isCorrectChain) {
         const switched = await switchToBSC();
         if (!switched) {
           setState((prev) => ({
             ...prev,
             isConnecting: false,
             error: "Vui lòng chuyển sang mạng BSC Testnet",
           }));
           connectingRef.current = false;
           return;
         }
         // Re-read chainId after switching
         chainId = parseInt(await ethereum.request({ method: "eth_chainId" }), 16);
         isCorrectChain = chainId === BSC_CHAIN_ID;
       }
 
       // Verify network is actually BSC Testnet
       const provider = new ethers.BrowserProvider(ethereum);
       const diagnostics = await verifyBSCTestnet(provider);
 
       if (!diagnostics.isValidChain) {
         setState((prev) => ({
           ...prev,
           isConnecting: false,
           isConnected: true,
           address,
           shortAddress: getShortAddress(address),
           chainId,
           isCorrectChain: false,
           error: diagnostics.rpcError || "Network không hợp lệ",
           networkDiagnostics: diagnostics,
         }));
         connectingRef.current = false;
         return;
       }
 
       // Fetch balances
       const balances = await fetchBalances(address);
 
       setState({
         isConnected: true,
         isConnecting: false,
         address,
         shortAddress: getShortAddress(address),
         chainId,
         isCorrectChain: diagnostics.isValidChain,
         balances,
         totalUsdValue: 0,
         error: null,
         networkDiagnostics: diagnostics,
       });
 
       // Save connection state
       localStorage.setItem("wallet_connected", "true");
    } catch (error: any) {
        console.error("Connection error:", error);

        // Don't show error for user rejection or MetaMask internal failures
        if (error.code === 4001 || error.message?.includes("User rejected") || error.message?.includes("user rejected")) {
          setState((prev) => ({
            ...prev,
            isConnecting: false,
            error: null,
          }));
          connectingRef.current = false;
          return;
        }

        // Handle MetaMask "Failed to connect" gracefully
        if (error.message?.includes("Failed to connect")) {
          setState((prev) => ({
            ...prev,
            isConnecting: false,
            error: "Không thể kết nối MetaMask. Vui lòng thử lại hoặc khởi động lại trình duyệt.",
          }));
          connectingRef.current = false;
          return;
        }

        setState((prev) => ({
          ...prev,
          isConnecting: false,
          error: error.message || "Không thể kết nối ví",
        }));
      } finally {
       connectingRef.current = false;
     }
   }, [hasWallet, fetchBalances, state.isConnecting, switchToBSC, verifyBSCTestnet]);
 
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
       networkDiagnostics: null,
     });
     localStorage.removeItem("wallet_connected");
   }, []);
 
   // Refresh balances
   const refreshBalances = useCallback(async () => {
     if (!state.address) return;
     const balances = await fetchBalances(state.address);
     setState((prev) => ({ ...prev, balances }));
   }, [state.address, fetchBalances]);
 
    // Listen for account and chain changes
    useEffect(() => {
      if (!hasWallet) return;

      const ethereum = (window as any).ethereum;

      // Guard: ensure ethereum provider has .on / .removeListener
      if (typeof ethereum?.on !== "function" || typeof ethereum?.removeListener !== "function") {
        return;
      }

      const handleAccountsChanged = async (accounts: string[]) => {
        try {
          if (accounts.length === 0) {
            // MetaMask locked or account removed — keep wallet_connected flag
            // so we auto-reconnect when user unlocks MetaMask
            setState((prev) => ({
              ...prev,
              isConnected: false,
              address: null,
              shortAddress: null,
              balances: [],
              error: null,
            }));
            // DO NOT remove wallet_connected — user didn't explicitly disconnect
          } else if (state.isConnected || localStorage.getItem("wallet_connected") === "true") {
            const newAddress = accounts[0];
            const balances = await fetchBalances(newAddress);
            setState((prev) => ({
              ...prev,
              isConnected: true,
              address: newAddress,
              shortAddress: getShortAddress(newAddress),
              balances,
              error: null,
            }));
          }
        } catch (err) {
          console.warn("[Angel AI] accountsChanged handler error:", err);
        }
      };

      const handleChainChanged = (chainIdHex: string) => {
        try {
          const chainId = parseInt(chainIdHex, 16);
          const isCorrectChain = chainId === BSC_CHAIN_ID;
          setState((prev) => ({
            ...prev,
            chainId,
            isCorrectChain,
          }));

          if (isCorrectChain && state.address) {
            refreshBalances();
          }
        } catch (err) {
          console.warn("[Angel AI] chainChanged handler error:", err);
        }
      };

      try {
        ethereum.on("accountsChanged", handleAccountsChanged);
        ethereum.on("chainChanged", handleChainChanged);
      } catch (err) {
        console.warn("[Angel AI] Failed to attach wallet listeners:", err);
      }

      return () => {
        try {
          ethereum.removeListener("accountsChanged", handleAccountsChanged);
          ethereum.removeListener("chainChanged", handleChainChanged);
        } catch {
          // Extension may already be torn down
        }
      };
    }, [hasWallet, state.isConnected, state.address, disconnect, fetchBalances, refreshBalances]);
 
     // Auto-reconnect on page load + periodic retry
     useEffect(() => {
       // Skip auto-reconnect entirely when inside an iframe
       if (isInIframe()) {
         return;
       }

       const wasConnected = localStorage.getItem("wallet_connected") === "true";
       if (!wasConnected || !hasWallet) return;

       const silentReconnect = async () => {
         // Don't reconnect if already connected
         if (state.isConnected || state.isConnecting || connectingRef.current) return;

         try {
           const ethereum = (window as any).ethereum;

           // Check if ethereum provider is ready
           if (!ethereum || typeof ethereum.request !== "function") {
             console.log("[Angel AI] Ethereum provider not ready, will retry...");
             return; // Don't remove flag — retry later
           }

           // Use eth_accounts only (never eth_requestAccounts for silent reconnect)
           let accounts: string[] = [];
           try {
             const timeoutPromise = new Promise<string[]>((_, reject) =>
               setTimeout(() => reject(new Error("Timeout")), 5000)
             );
             accounts = await Promise.race([
               ethereum.request({ method: "eth_accounts" }),
               timeoutPromise,
             ]);
           } catch {
             console.log("[Angel AI] Silent reconnect: eth_accounts failed, will retry...");
             return; // Don't remove flag — retry later
           }

           if (!accounts || accounts.length === 0) {
             // MetaMask is locked — keep flag, will reconnect when unlocked
             console.log("[Angel AI] No accounts available (wallet may be locked), will retry...");
             return;
           }

           const address = accounts[0];

           let chainIdHex = "0x0";
           try {
             chainIdHex = await ethereum.request({ method: "eth_chainId" });
           } catch {
             return; // Don't remove flag — retry later
           }

           const chainId = parseInt(chainIdHex, 16);
           const isCorrectChain = chainId === BSC_CHAIN_ID;

           let balances: TokenBalance[] = [];
           if (isCorrectChain) {
             try {
               balances = await fetchBalances(address);
             } catch {
               // Balance fetch failed, still show connected
             }
           }

           setState({
             isConnected: true,
             isConnecting: false,
             address,
             shortAddress: getShortAddress(address),
             chainId,
             isCorrectChain,
             balances,
             totalUsdValue: 0,
             error: isCorrectChain ? null : "Vui lòng chuyển sang mạng BSC Testnet",
             networkDiagnostics: null,
           });
         } catch (error) {
           // Catch-all: never let auto-reconnect crash the app
           console.log("[Angel AI] Silent reconnect failed, will retry:", error);
         }
       };

       // Initial reconnect with delay for MetaMask to initialize
       const initialTimer = setTimeout(silentReconnect, 1000);

       // Periodic retry every 5 seconds if not yet connected
       const retryInterval = setInterval(() => {
         const stillWantsConnection = localStorage.getItem("wallet_connected") === "true";
         if (stillWantsConnection && !state.isConnected && !connectingRef.current) {
           silentReconnect();
         } else if (state.isConnected) {
           clearInterval(retryInterval);
         }
       }, 5000);

       return () => {
         clearTimeout(initialTimer);
         clearInterval(retryInterval);
       };
     }, [hasWallet, state.isConnected]);
 
   return {
     ...state,
     hasWallet,
     connect,
     disconnect,
     switchToBSC,
     resetBSCNetwork,
     refreshBalances,
     verifyBSCTestnet,
   };
 }