import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import AdminNavToolbar from "@/components/admin/AdminNavToolbar";
import { OnChainErrorBanner, OnChainErrorSummary } from "@/components/admin/OnChainErrorBanner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Shield,
  AlertCircle,
  Loader2,
  Send,
  FileCheck,
  Zap,
  CheckSquare,
} from "lucide-react";
import { MintExportButton } from "@/components/admin/MintExportButton";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";

interface MintRequestRow {
  id: string;
  action_id: string;
  actor_id: string;
  recipient_address: string;
  amount: number;
  action_hash: string;
  evidence_hash: string;
  status: string;
  signature: string | null;
  signer_address: string | null;
  tx_hash: string | null;
  nonce: number;
  created_at: string;
  minted_at: string | null;
  on_chain_error: string | null;
  // Joined data
  pplp_actions?: {
    action_type: string;
    platform_id: string;
    metadata: Record<string, unknown>;
  };
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

const ACTION_LABELS: Record<string, string> = {
  QUESTION_ASK: "💬 Hỏi AI",
  JOURNAL_WRITE: "📝 Nhật ký",
  CONTENT_CREATE: "📢 Đăng bài",
  POST_CREATE: "📢 Đăng bài",
  COMMENT_CREATE: "💬 Bình luận",
  DONATE: "🎁 Donate",
  SHARE_CONTENT: "🔗 Chia sẻ",
  DAILY_LOGIN: "📅 Đăng nhập",
  GRATITUDE_PRACTICE: "🙏 Biết ơn",
  VISION_CREATE: "🌟 Vision",
};

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Chờ duyệt", variant: "outline" },
  signed: { label: "Đã ký", variant: "secondary" },
  minted: { label: "Đã mint", variant: "default" },
  rejected: { label: "Từ chối", variant: "destructive" },
  expired: { label: "Hết hạn", variant: "outline" },
};

export default function AdminMintApproval() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<MintRequestRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("pending");
  const [isRetryingAll, setIsRetryingAll] = useState(false);
  const [retryProgress, setRetryProgress] = useState({ done: 0, total: 0 });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0 });

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("pplp_mint_requests")
        .select(`
          *,
          pplp_actions!inner(action_type, platform_id, metadata)
        `)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;

      // Fetch profiles separately for display names
      const actorIds = [...new Set((data || []).map((r: any) => r.actor_id))];
      let profilesMap: Record<string, { display_name: string | null; avatar_url: string | null }> = {};

      if (actorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url")
          .in("user_id", actorIds);

        (profiles || []).forEach((p: any) => {
          profilesMap[p.user_id] = { display_name: p.display_name, avatar_url: p.avatar_url };
        });
      }

      const enriched = (data || []).map((r: any) => ({
        ...r,
        profiles: profilesMap[r.actor_id] || { display_name: null, avatar_url: null },
      }));

      setRequests(enriched);
    } catch (error) {
      console.error("Error fetching mint requests:", error);
      toast.error("Lỗi tải danh sách mint requests");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Approve & sign a mint request (triggers backend to sign + execute on-chain)
  const handleApproveAndSign = useCallback(
    async (request: MintRequestRow) => {
      setProcessingIds((prev) => new Set(prev).add(request.id));

      try {
        toast.loading("Đang ký và gửi giao dịch on-chain...", { id: `approve-${request.id}` });

        const { data, error } = await supabase.functions.invoke("pplp-authorize-mint", {
          body: {
            action_id: request.action_id,
            wallet_address: request.recipient_address,
          },
        });

        // Handle 409 "already minted" gracefully
        if (error) {
          const errMsg = (error as any)?.message || '';
          const isAlreadyMinted = errMsg.includes('already minted') || errMsg.includes('409');
          
          if (isAlreadyMinted) {
            // Try to extract tx_hash from error message
            let txInfo = '';
            try {
              const jsonMatch = errMsg.match(/\{.*\}/s);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.tx_hash) txInfo = ` TX: ${parsed.tx_hash.slice(0, 10)}...`;
              }
            } catch { /* ignore parse errors */ }
            
            toast.info(`ℹ️ Action này đã được mint on-chain trước đó rồi.${txInfo}`, {
              id: `approve-${request.id}`,
              duration: 5000,
            });
            await fetchRequests();
            return;
          }
          throw error;
        }

        if (data?.tx_hash) {
          toast.success(`✅ Đã mint on-chain! TX: ${data.tx_hash.slice(0, 10)}...`, {
            id: `approve-${request.id}`,
          });
        } else if (data?.on_chain_error) {
          // Signed successfully but on-chain failed with classified error
          const errLabel = data.on_chain_error === "ATTESTER_NOT_REGISTERED" ? "Attester chưa đăng ký"
            : data.on_chain_error === "ACTION_NOT_REGISTERED" ? "Action chưa đăng ký"
            : data.on_chain_error === "INSUFFICIENT_GAS" ? "Thiếu tBNB"
            : data.on_chain_error === "RPC_FAILURE" ? "RPC thất bại"
            : "Contract revert";
          toast.warning(`⚠️ Đã ký nhưng on-chain thất bại: ${errLabel}`, {
            id: `approve-${request.id}`,
            duration: 8000,
          });
        } else if (data?.success) {
          toast.success("✅ Đã ký thành công. Chờ giao dịch on-chain.", {
            id: `approve-${request.id}`,
          });
        } else {
          toast.error(data?.error || "Lỗi không xác định", { id: `approve-${request.id}` });
        }

        await fetchRequests();
      } catch (error: any) {
        const errMsg = String(error?.message || error || '');
        const isAlreadyMinted = errMsg.includes('already minted') || errMsg.includes('"error":"Action already minted');
        
        if (isAlreadyMinted) {
          let txInfo = '';
          try {
            const jsonMatch = errMsg.match(/\{.*\}/s);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              if (parsed.tx_hash) txInfo = ` TX: ${parsed.tx_hash.slice(0, 10)}...`;
            }
          } catch { /* ignore */ }
          toast.info(`ℹ️ Action đã mint on-chain rồi.${txInfo}`, { id: `approve-${request.id}`, duration: 5000 });
          await fetchRequests();
        } else {
          console.error("Approve error:", error);
          toast.error(errMsg || "Lỗi khi phê duyệt", { id: `approve-${request.id}` });
        }
      } finally {
        setProcessingIds((prev) => {
          const next = new Set(prev);
          next.delete(request.id);
          return next;
        });
      }
    },
    [fetchRequests]
  );

  // Reject a mint request
  const handleReject = useCallback(
    async (request: MintRequestRow) => {
      setProcessingIds((prev) => new Set(prev).add(request.id));

      try {
        const { error } = await supabase
          .from("pplp_mint_requests")
          .update({ status: "rejected", updated_at: new Date().toISOString() })
          .eq("id", request.id);

        if (error) throw error;

        toast.success("❌ Đã từ chối mint request");
        await fetchRequests();
      } catch (error: any) {
        toast.error(error.message || "Lỗi khi từ chối");
      } finally {
        setProcessingIds((prev) => {
          const next = new Set(prev);
          next.delete(request.id);
          return next;
        });
      }
    },
    [fetchRequests]
  );

  // Retry all signed requests
  const handleRetryAll = useCallback(async () => {
    const signedRequests = requests.filter((r) => r.status === "signed");
    if (signedRequests.length === 0) {
      toast.info("Không có giao dịch nào cần retry");
      return;
    }

    const confirmed = window.confirm(
      `Bạn sẽ retry ${signedRequests.length} giao dịch on-chain. Tiếp tục?`
    );
    if (!confirmed) return;

    setIsRetryingAll(true);
    setRetryProgress({ done: 0, total: signedRequests.length });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < signedRequests.length; i++) {
      const req = signedRequests[i];
      try {
        const { data, error } = await supabase.functions.invoke("pplp-authorize-mint", {
          body: {
            action_id: req.action_id,
            wallet_address: req.recipient_address,
          },
        });

        if (error) {
          const errMsg = typeof error === 'object' ? JSON.stringify(error) : String(error);
          if (errMsg.includes('already minted')) { successCount++; continue; }
          throw error;
        }

        if (data?.tx_hash) {
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }

      setRetryProgress({ done: i + 1, total: signedRequests.length });
    }

    toast.success(
      `✅ Retry hoàn tất: ${successCount} thành công, ${failCount} thất bại`
    );

    setIsRetryingAll(false);
    await fetchRequests();
  }, [requests, fetchRequests]);

  // Filter by tab
  const filteredRequests = requests.filter((r) => {
    if (activeTab === "pending") return r.status === "pending";
    if (activeTab === "signed") return r.status === "signed";
    if (activeTab === "minted") return r.status === "minted";
    if (activeTab === "rejected") return r.status === "rejected" || r.status === "expired";
    return true;
  });

  const counts = {
    pending: requests.filter((r) => r.status === "pending").length,
    signed: requests.filter((r) => r.status === "signed").length,
    minted: requests.filter((r) => r.status === "minted").length,
    rejected: requests.filter((r) => r.status === "rejected" || r.status === "expired").length,
  };

  const allSelected = filteredRequests.length > 0 && filteredRequests.every((r) => selectedIds.has(r.id));
  const someSelected = selectedIds.size > 0;
  const selectedTotal = filteredRequests.filter((r) => selectedIds.has(r.id)).reduce((sum, r) => sum + r.amount, 0);

  // Clear selection when tab changes
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    setSelectedIds(new Set());
  }, []);

  // Toggle single selection
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Select/deselect all in current tab
  const toggleSelectAll = useCallback(() => {
    const currentIds = filteredRequests.map((r) => r.id);
    const allCurrentSelected = currentIds.length > 0 && currentIds.every((id) => selectedIds.has(id));
    if (allCurrentSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentIds));
    }
  }, [filteredRequests, selectedIds]);

  // Batch approve selected
  const handleBatchApprove = useCallback(async () => {
    const selected = filteredRequests.filter((r) => selectedIds.has(r.id) && r.status === "pending");
    if (selected.length === 0) return;

    const confirmed = window.confirm(`Approve & Sign ${selected.length} yêu cầu? Tiếp tục?`);
    if (!confirmed) return;

    setIsBatchProcessing(true);
    setBatchProgress({ done: 0, total: selected.length });

    let success = 0, fail = 0;
    for (let i = 0; i < selected.length; i++) {
      try {
        const { data, error } = await supabase.functions.invoke("pplp-authorize-mint", {
          body: { action_id: selected[i].action_id, wallet_address: selected[i].recipient_address },
        });
        if (error) {
          const errMsg = typeof error === 'object' ? JSON.stringify(error) : String(error);
          if (errMsg.includes('already minted')) { success++; continue; }
          throw error;
        }
        if (data?.tx_hash || data?.success) success++;
        else fail++;
      } catch { fail++; }
      setBatchProgress({ done: i + 1, total: selected.length });
    }

    toast.success(`✅ Batch: ${success} thành công, ${fail} thất bại`);
    setIsBatchProcessing(false);
    setSelectedIds(new Set());
    await fetchRequests();
  }, [filteredRequests, selectedIds, fetchRequests]);

  // Batch reject selected
  const handleBatchReject = useCallback(async () => {
    const selected = filteredRequests.filter((r) => selectedIds.has(r.id) && r.status === "pending");
    if (selected.length === 0) return;

    const confirmed = window.confirm(`Từ chối ${selected.length} yêu cầu? Tiếp tục?`);
    if (!confirmed) return;

    setIsBatchProcessing(true);
    setBatchProgress({ done: 0, total: selected.length });

    let success = 0;
    for (let i = 0; i < selected.length; i++) {
      try {
        const { error } = await supabase
          .from("pplp_mint_requests")
          .update({ status: "rejected", updated_at: new Date().toISOString() })
          .eq("id", selected[i].id);
        if (!error) success++;
      } catch {}
      setBatchProgress({ done: i + 1, total: selected.length });
    }

    toast.success(`❌ Đã từ chối ${success} yêu cầu`);
    setIsBatchProcessing(false);
    setSelectedIds(new Set());
    await fetchRequests();
  }, [filteredRequests, selectedIds, fetchRequests]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <AdminNavToolbar />

      <main className="flex-1 container mx-auto px-4 py-6 pt-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                <Shield className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Mint Approval</h1>
                <p className="text-sm text-muted-foreground">
                  Xem xét và phê duyệt yêu cầu mint FUN Money
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <MintExportButton />
              {counts.signed > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetryAll}
                  disabled={isLoading || isRetryingAll}
                  className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/30"
                >
                  {isRetryingAll ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      {retryProgress.done}/{retryProgress.total}
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-1" />
                      Retry All ({counts.signed})
                    </>
                  )}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={fetchRequests} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
                Làm mới
              </Button>
            </div>
          </div>

          {/* Info Alert */}
          <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/30">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700 dark:text-amber-300 text-sm">
              <strong>Flow:</strong> User request mint → Admin review ở đây → Approve & Sign → 
              Backend gọi <code>lockWithPPLP</code> on-chain → FUN locked vào contract → 
              User activate → User claim về ví.
            </AlertDescription>
          </Alert>

          {/* Batch/Retry Progress */}
          {(isRetryingAll || isBatchProcessing) && (
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <AlertDescription className="text-blue-700 dark:text-blue-300 text-sm">
                <strong>{isRetryingAll ? "Đang retry on-chain..." : "Đang xử lý batch..."}</strong>{" "}
                {(isRetryingAll ? retryProgress : batchProgress).done}/{(isRetryingAll ? retryProgress : batchProgress).total} giao dịch
                <div className="mt-2 w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((isRetryingAll ? retryProgress : batchProgress).done / (isRetryingAll ? retryProgress : batchProgress).total) * 100}%` }}
                  />
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* On-chain Error Summary */}
          <OnChainErrorSummary requests={requests} />

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pending" className="gap-1">
                <Clock className="h-3.5 w-3.5" />
                Chờ duyệt ({counts.pending})
              </TabsTrigger>
              <TabsTrigger value="signed" className="gap-1">
                <FileCheck className="h-3.5 w-3.5" />
                Đã ký ({counts.signed})
              </TabsTrigger>
              <TabsTrigger value="minted" className="gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Đã mint ({counts.minted})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="gap-1">
                <XCircle className="h-3.5 w-3.5" />
                Từ chối ({counts.rejected})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4 space-y-3">
              {/* Select All Bar */}
              {!isLoading && filteredRequests.length > 0 && (
                <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Chọn tất cả"
                    />
                    <span className="text-sm font-medium">
                      {someSelected
                        ? `Đã chọn ${selectedIds.size} / ${filteredRequests.length}`
                        : "Chọn tất cả"}
                    </span>
                    {someSelected && (
                      <Badge variant="secondary" className="text-xs">
                        💰 {selectedTotal.toLocaleString("vi-VN")} FUN
                      </Badge>
                    )}
                  </div>
                  {someSelected && activeTab === "pending" && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={handleBatchApprove}
                        disabled={isBatchProcessing}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      >
                        {isBatchProcessing ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <CheckSquare className="h-4 w-4 mr-1" />
                        )}
                        Duyệt ({selectedIds.size})
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleBatchReject}
                        disabled={isBatchProcessing}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Từ chối ({selectedIds.size})
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-lg" />
                  ))}
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Không có yêu cầu nào trong mục này</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRequests.map((req) => (
                    <MintRequestCard
                      key={req.id}
                      request={req}
                      isProcessing={processingIds.has(req.id)}
                      isSelected={selectedIds.has(req.id)}
                      onToggleSelect={() => toggleSelect(req.id)}
                      onApprove={() => handleApproveAndSign(req)}
                      onReject={() => handleReject(req)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// Individual mint request card
function MintRequestCard({
  request,
  isProcessing,
  isSelected,
  onToggleSelect,
  onApprove,
  onReject,
}: {
  request: MintRequestRow;
  isProcessing: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const actionType = (request.pplp_actions as any)?.action_type || "UNKNOWN";
  const displayName = request.profiles?.display_name || request.actor_id.slice(0, 8);
  const statusInfo = STATUS_CONFIG[request.status] || STATUS_CONFIG.pending;

  return (
    <Card className={`transition-all hover:shadow-sm ${isSelected ? "ring-2 ring-primary/50 bg-primary/5" : ""}`}>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Checkbox */}
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelect}
            aria-label={`Chọn yêu cầu ${request.id}`}
            className="shrink-0"
          />
          {/* Left: Info */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">
                {ACTION_LABELS[actionType] || actionType}
              </span>
              <Badge variant={statusInfo.variant} className="text-xs">
                {statusInfo.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(request.created_at), { addSuffix: true, locale: vi })}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>👤 {displayName}</span>
              <span>💰 <strong className="text-amber-600">{request.amount.toLocaleString("vi-VN")} FUN</strong></span>
              <span title={request.recipient_address}>
                🔗 {request.recipient_address.slice(0, 6)}...{request.recipient_address.slice(-4)}
              </span>
            </div>

            {request.tx_hash && (
              <a
                href={`https://testnet.bscscan.com/tx/${request.tx_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                TX: {request.tx_hash.slice(0, 14)}...
              </a>
            )}

            {request.signature && !request.tx_hash && (
              <p className="text-xs text-muted-foreground">
                ✍️ Đã ký bởi: {request.signer_address?.slice(0, 10)}...
              </p>
            )}

            {/* On-chain error diagnostic */}
            {request.status === "signed" && request.on_chain_error && (
              <OnChainErrorBanner
                error={request.on_chain_error}
                signerAddress={request.signer_address}
                actionType={actionType}
              />
            )}
          </div>

          {/* Right: Actions */}
          {request.status === "pending" && (
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                onClick={onApprove}
                disabled={isProcessing}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Send className="h-4 w-4 mr-1" />
                )}
                Approve & Sign
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onReject}
                disabled={isProcessing}
                className="text-red-600 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </div>
          )}

          {request.status === "signed" && (
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                onClick={onApprove}
                disabled={isProcessing}
                className="bg-gradient-to-r from-amber-500 to-orange-500"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Send className="h-4 w-4 mr-1" />
                )}
                Retry On-chain
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
