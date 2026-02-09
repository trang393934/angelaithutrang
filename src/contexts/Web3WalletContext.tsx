import { createContext, useContext, ReactNode } from "react";
import { useWeb3WalletInternal, WalletState } from "@/hooks/useWeb3Wallet";
import { ethers } from "ethers";
import { NetworkDiagnostics } from "@/hooks/useWeb3Wallet";

interface Web3WalletContextValue extends WalletState {
  hasWallet: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToBSC: () => Promise<boolean>;
  resetBSCNetwork: () => Promise<boolean>;
  refreshBalances: () => Promise<void>;
  verifyBSCTestnet: (provider: ethers.BrowserProvider) => Promise<NetworkDiagnostics>;
}

const Web3WalletContext = createContext<Web3WalletContextValue | null>(null);

export function Web3WalletProvider({ children }: { children: ReactNode }) {
  const wallet = useWeb3WalletInternal();

  return (
    <Web3WalletContext.Provider value={wallet}>
      {children}
    </Web3WalletContext.Provider>
  );
}

export function useWeb3WalletContext() {
  const ctx = useContext(Web3WalletContext);
  if (!ctx) {
    throw new Error("useWeb3WalletContext must be used within Web3WalletProvider");
  }
  return ctx;
}
