import { Shield, Clock, Layers, AlertTriangle, Search, Fingerprint, Bot, MessageSquare, Users, Mail, ArrowDown, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const LayerCard = ({ 
  layer, icon: Icon, title, subtitle, children, color 
}: { 
  layer: number; 
  icon: React.ElementType; 
  title: string; 
  subtitle: string; 
  children: React.ReactNode;
  color: string;
}) => (
  <Card className="border-l-4" style={{ borderLeftColor: color }}>
    <CardHeader className="pb-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20`, color }}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <CardTitle className="text-base flex items-center gap-2">
            Lớp {layer} — {title}
            <Badge variant="outline" className="text-emerald-600 border-emerald-600 text-[10px]">
              <CheckCircle className="w-3 h-3 mr-1" /> Đang hoạt động
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs mt-0.5">{subtitle}</CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

const AntiSybilProcessTab = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          🛡️ Quy trình Chống Sybil Attack — ANGEL AI
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Hệ thống 5 lớp bảo vệ tự động + hệ thống phát hiện bổ trợ, bảo vệ giá trị token và quỹ thưởng khỏi tài khoản ảo farming.
        </p>
      </div>

      {/* Flow diagram */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">📊 Luồng xử lý khi User thực hiện hành động kiếm thưởng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-1 text-xs">
            {[
              { text: "User thực hiện hành động (hỏi, viết nhật ký, đăng bài...)", bg: "bg-primary/10 text-primary" },
              { text: "Lớp 1: Kiểm tra tuổi tài khoản → giảm thưởng nếu mới", bg: "bg-blue-500/10 text-blue-600" },
              { text: "Lớp 3: Kiểm tra rate limit theo Tier → chặn nếu vượt", bg: "bg-amber-500/10 text-amber-600" },
              { text: "Fraud Scanner: Bot / Spam / Collusion / Device check", bg: "bg-orange-500/10 text-orange-600" },
              { text: "Lớp 4: Tính risk score → đình chỉ / đóng băng nếu cao", bg: "bg-destructive/10 text-destructive" },
              { text: "Lớp 2: Pending nếu Tier thấp + tài khoản mới", bg: "bg-violet-500/10 text-violet-600" },
              { text: "✅ Cấp phần thưởng (đã nhân hệ số Age Gate)", bg: "bg-emerald-500/10 text-emerald-600" },
            ].map((step, i) => (
              <div key={i} className="w-full max-w-lg">
                <div className={`rounded-lg px-4 py-2.5 text-center font-medium ${step.bg}`}>
                  {step.text}
                </div>
                {i < 6 && <div className="flex justify-center"><ArrowDown className="w-4 h-4 text-muted-foreground my-0.5" /></div>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 5 Layers */}
      <div className="space-y-4">
        {/* Layer 1 */}
        <LayerCard layer={1} icon={Clock} title="Cổng Thời Gian Tài Khoản" subtitle="Account Age Gate — Giảm thưởng & giới hạn hành động cho tài khoản mới" color="#3b82f6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tuổi tài khoản</TableHead>
                <TableHead>Hệ số thưởng</TableHead>
                <TableHead>Giới hạn/ngày</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Dưới 3 ngày</TableCell>
                <TableCell><Badge variant="destructive">50% (×0.5)</Badge></TableCell>
                <TableCell>Tối đa 3 hành động</TableCell>
                <TableCell><Badge variant="outline" className="text-destructive border-destructive">new</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">3 – 7 ngày</TableCell>
                <TableCell><Badge className="bg-amber-500">75% (×0.75)</Badge></TableCell>
                <TableCell>Tối đa 5 hành động</TableCell>
                <TableCell><Badge variant="outline" className="text-amber-600 border-amber-600">probation</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Trên 7 ngày</TableCell>
                <TableCell><Badge className="bg-emerald-500 text-white">100% (×1.0)</Badge></TableCell>
                <TableCell>Không giới hạn</TableCell>
                <TableCell><Badge variant="outline" className="text-emerald-600 border-emerald-600">verified</Badge></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </LayerCard>

        {/* Layer 2 */}
        <LayerCard layer={2} icon={Clock} title="Trì Hoãn Phần Thưởng" subtitle="Pending Rewards — Giữ phần thưởng trước khi cấp cho tài khoản Tier thấp" color="#8b5cf6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Điều kiện</TableHead>
                <TableHead>Thời gian chờ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Tier 0-1, tài khoản {"<"} 3 ngày</TableCell>
                <TableCell><Badge variant="destructive">48 giờ</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Tier 0-1, tài khoản 3-7 ngày</TableCell>
                <TableCell><Badge className="bg-amber-500">24 giờ</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Tier 0-1, tài khoản 7-14 ngày</TableCell>
                <TableCell><Badge className="bg-blue-500 text-white">12 giờ</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Tier 2+ hoặc trên 14 ngày</TableCell>
                <TableCell><Badge className="bg-emerald-500 text-white">Cấp ngay ✅</Badge></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </LayerCard>

        {/* Layer 3 */}
        <LayerCard layer={3} icon={Layers} title="Giới Hạn Theo Cấp Bậc Tin Cậy" subtitle="Tiered Rate Limits — Hệ số giới hạn hành động theo Trust Tier" color="#f59e0b">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tier</TableHead>
                <TableHead>Hệ số giới hạn</TableHead>
                <TableHead>Ý nghĩa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { tier: "Tier 0", multiplier: "0.4×", meaning: "Chỉ được 40% giới hạn bình thường", color: "text-destructive" },
                { tier: "Tier 1", multiplier: "0.7×", meaning: "Được 70% giới hạn bình thường", color: "text-amber-600" },
                { tier: "Tier 2", multiplier: "1.0×", meaning: "Chuẩn — giới hạn bình thường", color: "text-foreground" },
                { tier: "Tier 3", multiplier: "1.5×", meaning: "Thưởng thêm 50% giới hạn", color: "text-blue-600" },
                { tier: "Tier 4", multiplier: "2.0×", meaning: "Gấp đôi giới hạn bình thường", color: "text-emerald-600" },
              ].map((row) => (
                <TableRow key={row.tier}>
                  <TableCell className={`font-bold ${row.color}`}>{row.tier}</TableCell>
                  <TableCell className="font-mono font-bold">{row.multiplier}</TableCell>
                  <TableCell className="text-muted-foreground">{row.meaning}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </LayerCard>

        {/* Layer 4 */}
        <LayerCard layer={4} icon={AlertTriangle} title="Tự Động Xử Lý Khi Rủi Ro Cao" subtitle="Auto Fraud Response — Hành động tự động dựa trên Risk Score" color="#ef4444">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Risk Score</TableHead>
                <TableHead>Hành động tự động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell><Badge variant="destructive" className="font-mono">{">"}70</Badge></TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium text-destructive">🚫 Tự động đình chỉ 24 giờ</p>
                    <p className="text-xs text-muted-foreground">+ Gửi Healing Message + Tạo Fraud Alert</p>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell><Badge className="bg-amber-500 font-mono">{">"}50</Badge></TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium text-amber-600">🧊 Đóng băng phần thưởng pending</p>
                    <p className="text-xs text-muted-foreground">Phần thưởng chờ sẽ không được giải ngân</p>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell><Badge variant="outline" className="font-mono">{">"}25</Badge></TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium">👁️ Theo dõi (Monitoring)</p>
                    <p className="text-xs text-muted-foreground">Ghi nhận và theo dõi, chưa hành động</p>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </LayerCard>

        {/* Layer 5 */}
        <LayerCard layer={5} icon={Search} title="Kiểm Tra Ngẫu Nhiên" subtitle="Random Audit — Cron job kiểm tra tự động mỗi 6 giờ" color="#06b6d4">
          <div className="space-y-3">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
              <p>⏰ <strong>Tần suất:</strong> Cron job chạy mỗi <strong>6 giờ</strong></p>
              <p>🎯 <strong>Phạm vi:</strong> Kiểm tra ngẫu nhiên <strong>5%</strong> hành động đã mint trong 24 giờ qua</p>
              <p>🚩 <strong>Ngưỡng ban:</strong> Tích luỹ <strong>3 lần</strong> bị gắn cờ → <strong>Tự động đình chỉ vĩnh viễn</strong></p>
            </div>
          </div>
        </LayerCard>
      </div>

      {/* Auxiliary Detection Systems */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            🔍 Hệ thống phát hiện bổ trợ
          </CardTitle>
          <CardDescription>Các module quét chạy song song với 5 lớp bảo vệ chính</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { icon: Fingerprint, title: "Device Fingerprint", desc: "Kiểm tra device_hash trùng lặp giữa các tài khoản. Phát hiện 1 thiết bị đăng nhập nhiều account.", color: "#8b5cf6" },
              { icon: Bot, title: "Bot Detection", desc: "Phân tích tần suất hành động & timing pattern. Phát hiện hành vi đều đặn bất thường (bot script).", color: "#ef4444" },
              { icon: MessageSquare, title: "Spam Detection", desc: "Phát hiện nội dung ngắn (<30 ký tự), nội dung trùng lặp, copy-paste giữa các tài khoản.", color: "#f59e0b" },
              { icon: Users, title: "Collusion Detection", desc: "Phát hiện tương tác tập trung bất thường: nhóm tài khoản chỉ like/tip cho nhau.", color: "#06b6d4" },
              { icon: Mail, title: "Pattern Registry", desc: "Quét email prefix/suffix trùng lặp, phát hiện bulk registration (đăng ký hàng loạt cùng thời điểm).", color: "#10b981" },
            ].map((item) => (
              <div key={item.title} className="border border-border rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: `${item.color}15`, color: item.color }}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <h4 className="font-semibold text-sm">{item.title}</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Source reference */}
      <div className="bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
        <p>📁 <strong>Source code:</strong> <code>supabase/functions/_shared/anti-sybil.ts</code> · <code>supabase/functions/fraud-scanner/</code> · <code>supabase/functions/pplp-detect-fraud/</code></p>
        <p className="mt-1">📋 Quy trình này được thực thi tự động — không cần can thiệp thủ công trừ khi admin cần xem xét fraud alert.</p>
      </div>
    </div>
  );
};

export default AntiSybilProcessTab;
