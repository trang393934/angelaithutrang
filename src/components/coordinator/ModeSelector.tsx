import { cn } from "@/lib/utils";
import { FileText, Code, Coins, Layout, Rocket, Shield } from "lucide-react";

export const MODES = [
  { id: "product_spec", label: "Product Spec", icon: FileText, description: "PRD, features, roadmap" },
  { id: "smart_contract", label: "Smart Contract", icon: Code, description: "Token logic, security" },
  { id: "tokenomics", label: "Tokenomics", icon: Coins, description: "Supply, incentives" },
  { id: "ux_flow", label: "UX Flow", icon: Layout, description: "Journeys, screens" },
  { id: "growth", label: "Growth", icon: Rocket, description: "Launch, viral loops" },
  { id: "governance", label: "Governance", icon: Shield, description: "PPLP, compliance" },
] as const;

interface Props {
  selected: string;
  onSelect: (mode: string) => void;
}

export function ModeSelector({ selected, onSelect }: Props) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1 mb-2">Mode</p>
      {MODES.map((mode) => {
        const Icon = mode.icon;
        const isActive = selected === mode.id;
        return (
          <button
            key={mode.id}
            onClick={() => onSelect(mode.id)}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-colors",
              isActive
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <div className="min-w-0">
              <span className="block leading-tight">{mode.label}</span>
              <span className="block text-[11px] text-muted-foreground leading-tight">{mode.description}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
