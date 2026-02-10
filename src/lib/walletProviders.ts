/**
 * Multi-Wallet Provider Detection & Management
 * Supports: MetaMask, Trust Wallet, OKX Wallet, and generic EIP-1193 providers
 */

export interface DetectedWallet {
  id: string;
  name: string;
  icon: string;
  provider: any;
}

// Module-level active provider reference
let _activeProvider: any = null;

export function setActiveProvider(provider: any) {
  _activeProvider = provider;
  if (provider) {
    localStorage.setItem("selected_wallet_id", getProviderName(provider));
  }
}

export function getActiveProvider(): any {
  if (_activeProvider) return _activeProvider;
  
  const win = window as any;
  const savedId = localStorage.getItem("selected_wallet_id");
  
  // Restore from saved preference
  if (savedId === "OKX Wallet" && win.okxwallet) {
    _activeProvider = win.okxwallet;
    return _activeProvider;
  }
  if (savedId === "Trust Wallet" && (win.trustwallet?.ethereum || win.ethereum?.isTrust)) {
    _activeProvider = win.trustwallet?.ethereum || win.ethereum;
    return _activeProvider;
  }
  
  return win.ethereum || null;
}

function getProviderName(provider: any): string {
  if (provider?.isOKExWallet || provider?.isOkxWallet) return "OKX Wallet";
  if (provider?.isTrust || provider?.isTrustWallet) return "Trust Wallet";
  if (provider?.isMetaMask) return "MetaMask";
  return "Browser Wallet";
}

export function detectWallets(): DetectedWallet[] {
  const wallets: DetectedWallet[] = [];
  const win = window as any;
  const seen = new Set<string>();

  const addWallet = (id: string, name: string, icon: string, provider: any) => {
    if (!seen.has(id) && provider) {
      seen.add(id);
      wallets.push({ id, name, icon, provider });
    }
  };

  // Check for EIP-5749 multiple providers
  if (win.ethereum?.providers?.length) {
    for (const p of win.ethereum.providers) {
      if (p.isMetaMask && !p.isOKExWallet) addWallet("metamask", "MetaMask", "🦊", p);
      if (p.isTrust || p.isTrustWallet) addWallet("trust", "Trust Wallet", "🛡️", p);
      if (p.isOKExWallet || p.isOkxWallet) addWallet("okx", "OKX Wallet", "⭕", p);
    }
  }

  // Check individual provider objects
  if (win.okxwallet) addWallet("okx", "OKX Wallet", "⭕", win.okxwallet);
  if (win.trustwallet?.ethereum) addWallet("trust", "Trust Wallet", "🛡️", win.trustwallet.ethereum);
  
  // MetaMask via window.ethereum
  if (win.ethereum?.isMetaMask && !seen.has("metamask")) {
    addWallet("metamask", "MetaMask", "🦊", win.ethereum);
  }
  
  // Trust via window.ethereum flag
  if (win.ethereum?.isTrust && !seen.has("trust")) {
    addWallet("trust", "Trust Wallet", "🛡️", win.ethereum);
  }

  // Generic fallback
  if (wallets.length === 0 && win.ethereum) {
    addWallet("injected", "Browser Wallet", "🌐", win.ethereum);
  }

  return wallets;
}

export function hasAnyWallet(): boolean {
  const win = window as any;
  return !!(win.ethereum || win.okxwallet || win.trustwallet);
}
