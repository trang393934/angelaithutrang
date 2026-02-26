import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import camlyCoinLogo from "@/assets/camly-coin-logo.png";
import funMoneyLogo from "@/assets/fun-money-logo.png";
import bitcoinLogo from "@/assets/bitcoin-logo.png";

const USDT_LOGO = "https://cryptologos.cc/logos/tether-usdt-logo.png?v=040";
const BNB_LOGO = "https://cryptologos.cc/logos/bnb-bnb-logo.png?v=040";

export type SelectedToken = "internal" | "camly_web3" | "fun_money" | "usdt" | "bnb" | "bitcoin";

export interface TokenOption {
  id: SelectedToken;
  name: string;
  symbol: string;
  logo: string;
  badge?: string;
  badgeColor?: string;
}

export const TOKEN_OPTIONS: TokenOption[] = [
  { id: "internal", name: "Camly Coin", symbol: "CAMLY", logo: camlyCoinLogo, badge: "Nội bộ", badgeColor: "bg-amber-100 text-amber-700 border-amber-300" },
  { id: "camly_web3", name: "Camly Coin", symbol: "CAMLY", logo: camlyCoinLogo, badge: "Web3", badgeColor: "bg-orange-100 text-orange-700 border-orange-300" },
  { id: "fun_money", name: "FUN Money", symbol: "FUN", logo: funMoneyLogo, badge: "Testnet", badgeColor: "bg-violet-100 text-violet-700 border-violet-300" },
  { id: "bnb", name: "Binance Coin", symbol: "BNB", logo: BNB_LOGO },
  { id: "usdt", name: "Tether USD", symbol: "USDT", logo: USDT_LOGO },
  { id: "bitcoin", name: "Bitcoin", symbol: "BTC", logo: bitcoinLogo },
];

interface TokenSelectorProps {
  selected: SelectedToken;
  onSelect: (token: SelectedToken) => void;
  balanceLabel?: string;
}

export function TokenSelector({ selected, onSelect, balanceLabel }: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedToken = TOKEN_OPTIONS.find((t) => t.id === selected) || TOKEN_OPTIONS[0];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-amber-800 flex items-center gap-1.5">
          Chọn Token 💰
        </label>
        {balanceLabel && (
          <span className="text-xs text-muted-foreground">{balanceLabel}</span>
        )}
      </div>

      <div className={`relative ${isOpen ? "overflow-visible" : ""}`}>
        {/* Selected Token Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-3 p-3 rounded-xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-yellow-50/80 to-amber-50 hover:border-amber-400 transition-colors shadow-[0_0_20px_-5px_rgba(218,165,32,0.15)]"
        >
          <div className="flex items-center gap-3">
            <img src={selectedToken.logo} alt="" className="w-8 h-8 rounded-full" />
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{selectedToken.name}</span>
                <span className="text-xs text-muted-foreground">({selectedToken.symbol})</span>
                {selectedToken.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${selectedToken.badgeColor}`}>
                    {selectedToken.badge}
                  </span>
                )}
              </div>
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {/* Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute z-[100] w-full mt-1 bg-card border-2 border-amber-300 rounded-xl shadow-2xl backdrop-blur-sm divide-y divide-amber-100"
            >
              {TOKEN_OPTIONS.map((token) => (
                <button
                  key={token.id}
                  type="button"
                  onClick={() => {
                    onSelect(token.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-amber-50/80 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                    selected === token.id ? "bg-amber-50 border-l-[3px] border-l-amber-400" : ""
                  }`}
                >
                  {selected === token.id ? (
                    <Check className="w-4 h-4 text-primary shrink-0" />
                  ) : (
                    <div className="w-4 h-4 shrink-0" />
                  )}
                  <img src={token.logo} alt="" className="w-7 h-7 rounded-full" />
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{token.name}</span>
                    <span className="text-xs text-muted-foreground">({token.symbol})</span>
                    {token.badge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${token.badgeColor}`}>
                        {token.badge}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
