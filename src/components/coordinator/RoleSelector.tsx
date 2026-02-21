import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const ROLES = [
  { id: "product_architect", label: "Product Architect" },
  { id: "smart_contract_architect", label: "Smart Contract Architect" },
  { id: "tokenomics_guardian", label: "Tokenomics Guardian" },
  { id: "growth_strategist", label: "Growth Strategist" },
  { id: "legal_architect", label: "Legal & Compliance Architect" },
  { id: "pplp_guardian", label: "PPLP Guardian" },
] as const;

interface Props {
  selected: string;
  onSelect: (role: string) => void;
}

export function RoleSelector({ selected, onSelect }: Props) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">Act As</p>
      <Select value={selected} onValueChange={onSelect}>
        <SelectTrigger className="w-full text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ROLES.map((r) => (
            <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
