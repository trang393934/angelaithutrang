import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";

// PancakeSwap V2 Router on BSC
const PANCAKE_ROUTER_ADDRESS = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
const WBNB_ADDRESS = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
const CAMLY_ADDRESS = "0x0910320181889fefde0bb1ca63962b0a8882e413"; // Correct Camly Coin contract

// Supported tokens for swap
export const SWAP_TOKENS = [
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
    address: CAMLY_ADDRESS,
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
];

// Router ABI (minimal for swap functions)
const ROUTER_ABI = [
  "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)",
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
  "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
];

// ERC20 ABI for approvals
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function allowance(address owner, address spender) public view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
];

export interface SwapQuote {
  amountIn: string;
  amountOut: string;
  amountOutMin: string;
  priceImpact: number;
  path: string[];
  isLoading: boolean;
  error: string | null;
}

export function usePancakeSwap() {
  const [isSwapping, setIsSwapping] = useState(false);
  const [quote, setQuote] = useState<SwapQuote>({
    amountIn: "0",
    amountOut: "0",
    amountOutMin: "0",
    priceImpact: 0,
    path: [],
    isLoading: false,
    error: null,
  });

  const getProvider = useCallback(() => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      throw new Error("Wallet not connected");
    }
    return new ethers.BrowserProvider((window as any).ethereum);
  }, []);

  // Get swap path
  const getSwapPath = useCallback((fromToken: string, toToken: string): string[] => {
    const from = fromToken === "native" ? WBNB_ADDRESS : fromToken;
    const to = toToken === "native" ? WBNB_ADDRESS : toToken;
    
    // Direct path if one is WBNB
    if (from === WBNB_ADDRESS || to === WBNB_ADDRESS) {
      return [from, to];
    }
    
    // Route through WBNB for other pairs
    return [from, WBNB_ADDRESS, to];
  }, []);

  // Get quote for swap
  const getQuote = useCallback(async (
    fromToken: typeof SWAP_TOKENS[0],
    toToken: typeof SWAP_TOKENS[0],
    amountIn: string,
    slippage: number = 0.5
  ) => {
    if (!amountIn || parseFloat(amountIn) <= 0) {
      setQuote(prev => ({ ...prev, amountOut: "0", amountOutMin: "0", isLoading: false, error: null }));
      return;
    }

    setQuote(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const provider = getProvider();
      const router = new ethers.Contract(PANCAKE_ROUTER_ADDRESS, ROUTER_ABI, provider);
      
      const path = getSwapPath(fromToken.address, toToken.address);
      const amountInWei = ethers.parseUnits(amountIn, fromToken.decimals);
      
      const amounts = await router.getAmountsOut(amountInWei, path);
      const amountOut = amounts[amounts.length - 1];
      const amountOutFormatted = ethers.formatUnits(amountOut, toToken.decimals);
      
      // Calculate minimum amount with slippage
      const slippageMultiplier = BigInt(Math.floor((100 - slippage) * 100));
      const amountOutMin = (amountOut * slippageMultiplier) / BigInt(10000);
      const amountOutMinFormatted = ethers.formatUnits(amountOutMin, toToken.decimals);

      // Simple price impact calculation
      const priceImpact = Math.min(parseFloat(amountIn) * 0.003, 5); // Simplified

      setQuote({
        amountIn,
        amountOut: amountOutFormatted,
        amountOutMin: amountOutMinFormatted,
        priceImpact,
        path,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error("Quote error:", error);
      setQuote(prev => ({
        ...prev,
        amountOut: "0",
        amountOutMin: "0",
        isLoading: false,
        error: "Không thể lấy giá. Thanh khoản có thể không đủ.",
      }));
    }
  }, [getProvider, getSwapPath]);

  // Check and approve token
  const checkAndApprove = useCallback(async (
    tokenAddress: string,
    amount: string,
    decimals: number
  ): Promise<boolean> => {
    if (tokenAddress === "native") return true;

    try {
      const provider = getProvider();
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      const amountWei = ethers.parseUnits(amount, decimals);
      
      const allowance = await token.allowance(address, PANCAKE_ROUTER_ADDRESS);
      
      if (allowance < amountWei) {
        // Approve max amount
        const tx = await token.approve(PANCAKE_ROUTER_ADDRESS, ethers.MaxUint256);
        await tx.wait();
      }
      
      return true;
    } catch (error) {
      console.error("Approval error:", error);
      return false;
    }
  }, [getProvider]);

  // Execute swap
  const executeSwap = useCallback(async (
    fromToken: typeof SWAP_TOKENS[0],
    toToken: typeof SWAP_TOKENS[0],
    amountIn: string,
    amountOutMin: string,
    deadline: number = 20 // minutes
  ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    setIsSwapping(true);

    try {
      const provider = getProvider();
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      const router = new ethers.Contract(PANCAKE_ROUTER_ADDRESS, ROUTER_ABI, signer);
      const path = getSwapPath(fromToken.address, toToken.address);
      const deadlineTimestamp = Math.floor(Date.now() / 1000) + deadline * 60;
      
      const amountInWei = ethers.parseUnits(amountIn, fromToken.decimals);
      const amountOutMinWei = ethers.parseUnits(amountOutMin, toToken.decimals);

      let tx;

      if (fromToken.address === "native") {
        // BNB -> Token
        tx = await router.swapExactETHForTokens(
          amountOutMinWei,
          path,
          address,
          deadlineTimestamp,
          { value: amountInWei }
        );
      } else if (toToken.address === "native") {
        // Token -> BNB
        const approved = await checkAndApprove(fromToken.address, amountIn, fromToken.decimals);
        if (!approved) throw new Error("Token approval failed");
        
        tx = await router.swapExactTokensForETH(
          amountInWei,
          amountOutMinWei,
          path,
          address,
          deadlineTimestamp
        );
      } else {
        // Token -> Token
        const approved = await checkAndApprove(fromToken.address, amountIn, fromToken.decimals);
        if (!approved) throw new Error("Token approval failed");
        
        tx = await router.swapExactTokensForTokens(
          amountInWei,
          amountOutMinWei,
          path,
          address,
          deadlineTimestamp
        );
      }

      const receipt = await tx.wait();
      setIsSwapping(false);
      
      return { success: true, txHash: receipt.hash };
    } catch (error: any) {
      console.error("Swap error:", error);
      setIsSwapping(false);
      
      let errorMessage = "Giao dịch thất bại";
      if (error.code === "ACTION_REJECTED") {
        errorMessage = "Bạn đã hủy giao dịch";
      } else if (error.message?.includes("insufficient")) {
        errorMessage = "Số dư không đủ";
      } else if (error.message?.includes("INSUFFICIENT_OUTPUT_AMOUNT")) {
        errorMessage = "Trượt giá quá cao, hãy tăng slippage";
      }
      
      return { success: false, error: errorMessage };
    }
  }, [getProvider, getSwapPath, checkAndApprove]);

  // Get token balance
  const getTokenBalance = useCallback(async (
    tokenAddress: string,
    decimals: number
  ): Promise<string> => {
    try {
      const provider = getProvider();
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      if (tokenAddress === "native") {
        const balance = await provider.getBalance(address);
        return ethers.formatUnits(balance, decimals);
      }

      const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const balance = await token.balanceOf(address);
      return ethers.formatUnits(balance, decimals);
    } catch (error) {
      console.error("Balance error:", error);
      return "0";
    }
  }, [getProvider]);

  return {
    quote,
    isSwapping,
    getQuote,
    executeSwap,
    getTokenBalance,
    SWAP_TOKENS,
  };
}
