import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

const PLATFORM_TYPES = [
  "FUN Profile", "FUN Play", "FUN Wallet", "FUN Farm", "FUN Academy",
  "FUN Life", "FUN Earth", "FUN Planet", "FUN Charity", "FUN Treasury",
  "FU Trading", "FU Legal",
];

const VALUE_MODELS = [
  "Learn & Earn", "Share & Have", "Play & Grow",
  "Create & Prosper", "Heal & Thrive", "Serve & Shine",
];

interface Props {
  onSubmit: (data: {
    name: string;
    platform_type: string;
    value_model: string;
    token_flow_model: string;
    vision_statement: string;
  }) => void;
  isPending?: boolean;
}

export function ProjectCreateDialog({ onSubmit, isPending }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [platformType, setPlatformType] = useState("");
  const [valueModel, setValueModel] = useState("");
  const [tokenFlow, setTokenFlow] = useState("");
  const [vision, setVision] = useState("");

  const handleSubmit = () => {
    if (!name.trim() || !platformType) return;
    onSubmit({ name: name.trim(), platform_type: platformType, value_model: valueModel, token_flow_model: tokenFlow, vision_statement: vision });
    setOpen(false);
    setName(""); setPlatformType(""); setValueModel(""); setTokenFlow(""); setVision("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <Plus className="h-5 w-5" /> Create New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Initialize New Project</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>Project Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. FUN Wallet v2" />
          </div>
          <div>
            <Label>Platform Type *</Label>
            <Select value={platformType} onValueChange={setPlatformType}>
              <SelectTrigger><SelectValue placeholder="Select platform" /></SelectTrigger>
              <SelectContent>
                {PLATFORM_TYPES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Value Model</Label>
            <Select value={valueModel} onValueChange={setValueModel}>
              <SelectTrigger><SelectValue placeholder="Select value model" /></SelectTrigger>
              <SelectContent>
                {VALUE_MODELS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Token Flow Logic</Label>
            <Input value={tokenFlow} onChange={(e) => setTokenFlow(e.target.value)} placeholder="e.g. FUN Money ↔ Camly Coin via PPLP" />
          </div>
          <div>
            <Label>Vision Statement</Label>
            <Textarea value={vision} onChange={(e) => setVision(e.target.value)} placeholder="Short vision for this project..." rows={3} />
          </div>
          <Button onClick={handleSubmit} disabled={!name.trim() || !platformType || isPending} className="w-full">
            {isPending ? "Creating..." : "Initialize Project"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
