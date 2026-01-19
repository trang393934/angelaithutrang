import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Camera, Check, Sparkles, User, Mail, Calendar, Shield, Loader2, Lock, Eye, EyeOff, Key, Wallet } from "lucide-react";
import angelAvatar from "@/assets/angel-avatar.png";
import LightPointsDisplay from "@/components/LightPointsDisplay";
import DailyGratitude from "@/components/DailyGratitude";
import HealingMessagesPanel from "@/components/HealingMessagesPanel";
import CamlyCoinDisplay from "@/components/CamlyCoinDisplay";
import CoinWithdrawal from "@/components/CoinWithdrawal";
import GratitudeJournal from "@/components/GratitudeJournal";

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [hasAgreedToLightLaw, setHasAgreedToLightLaw] = useState(false);
  const [agreedAt, setAgreedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");

  // Wallet address state
  const [walletAddress, setWalletAddress] = useState("");
  const [walletChangeCount, setWalletChangeCount] = useState(0);
  const [isSavingWallet, setIsSavingWallet] = useState(false);
  const [originalWalletAddress, setOriginalWalletAddress] = useState("");

  // Change password state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    
    if (user) {
      fetchProfile();
      checkLightAgreement();
      fetchWalletAddress();
    }
  }, [user, authLoading]);

  const fetchProfile = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setDisplayName(data.display_name || "");
        setBio(data.bio || "");
      } else {
        // Create profile if not exists
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({ user_id: user.id })
          .select()
          .single();

        if (insertError) throw insertError;
        setProfile(newProfile);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: t("common.error"),
        description: t("profile.errorLoad"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkLightAgreement = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("user_light_agreements")
      .select("agreed_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setHasAgreedToLightLaw(true);
      setAgreedAt(data.agreed_at);
    }
  };

  const fetchWalletAddress = async () => {
    if (!user) return;
    
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    const { data } = await supabase
      .from("user_wallet_addresses")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setWalletAddress(data.wallet_address || "");
      setOriginalWalletAddress(data.wallet_address || "");
      
      // Reset count if new month
      if (data.last_change_month !== currentMonth) {
        setWalletChangeCount(0);
      } else {
        setWalletChangeCount(data.change_count_this_month || 0);
      }
    }
  };

  const handleSaveWalletAddress = async () => {
    if (!user) return;
    
    // Validate wallet address format (basic check for ETH/BSC address)
    const walletRegex = /^0x[a-fA-F0-9]{40}$/;
    if (walletAddress && !walletRegex.test(walletAddress)) {
      toast({
        title: "Lỗi",
        description: "Địa chỉ ví không hợp lệ. Vui lòng nhập địa chỉ ví BSC/ETH đúng định dạng.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if actually changed
    if (walletAddress === originalWalletAddress) {
      toast({
        title: "Thông báo",
        description: "Địa chỉ ví không thay đổi.",
      });
      return;
    }
    
    // Check monthly limit
    if (walletChangeCount >= 2) {
      toast({
        title: "Đã đạt giới hạn",
        description: "Bạn chỉ được đổi địa chỉ ví tối đa 2 lần/tháng. Vui lòng thử lại vào tháng sau.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingWallet(true);
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    try {
      // Check if record exists
      const { data: existing } = await supabase
        .from("user_wallet_addresses")
        .select("id, change_count_this_month, last_change_month")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        // Calculate new change count
        let newChangeCount = 1;
        if (existing.last_change_month === currentMonth) {
          newChangeCount = (existing.change_count_this_month || 0) + 1;
        }

        const { error } = await supabase
          .from("user_wallet_addresses")
          .update({
            wallet_address: walletAddress || null,
            change_count_this_month: newChangeCount,
            last_change_month: currentMonth,
          })
          .eq("user_id", user.id);

        if (error) throw error;
        setWalletChangeCount(newChangeCount);
      } else {
        const { error } = await supabase
          .from("user_wallet_addresses")
          .insert({
            user_id: user.id,
            wallet_address: walletAddress || null,
            change_count_this_month: 1,
            last_change_month: currentMonth,
          });

        if (error) throw error;
        setWalletChangeCount(1);
      }

      setOriginalWalletAddress(walletAddress);
      toast({
        title: "Thành công!",
        description: "Địa chỉ ví đã được lưu ✨",
      });
    } catch (error) {
      console.error("Error saving wallet address:", error);
      toast({
        title: "Lỗi",
        description: "Không thể lưu địa chỉ ví. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsSavingWallet(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !profile) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName || null,
          bio: bio || null,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: t("common.success"),
        description: t("profile.successSave"),
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: t("common.error"),
        description: t("profile.errorSave"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn file hình ảnh.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Lỗi",
        description: "Kích thước file tối đa là 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      // Update profile with avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: urlData.publicUrl })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, avatar_url: urlData.publicUrl } : null);

      toast({
        title: "Thành công!",
        description: "Avatar đã được cập nhật ✨",
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải lên avatar.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu mới không khớp. Vui lòng kiểm tra lại.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu mới phải có ít nhất 6 ký tự.",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Thành công!",
        description: "Mật khẩu đã được đổi thành công ✨",
      });
      
      setShowChangePassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error changing password:", error);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể đổi mật khẩu. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-pale via-background to-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-divine-gold animate-pulse" />
          <span className="text-foreground-muted">{t("profile.loading")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-pale via-background to-background py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            to="/" 
            className="p-2 rounded-full hover:bg-primary-pale transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-primary" />
          </Link>
          <h1 className="text-2xl font-bold text-foreground">
            {t("profile.pageTitle")}
          </h1>
        </div>

        <div className="space-y-6">
          {/* Camly Coin & Light Points Section */}
          <div className="grid gap-6 md:grid-cols-2">
            <CamlyCoinDisplay />
            <LightPointsDisplay />
          </div>

          {/* Coin Withdrawal Section */}
          <CoinWithdrawal />

          {/* Wallet Address Card */}
          <Card className="border-blue-500/20 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wallet className="w-5 h-5 text-blue-500" />
                Địa chỉ ví Web3
              </CardTitle>
              <CardDescription>
                Nhập địa chỉ ví BSC/BNB Chain để nhận Camly Coin khi rút. Bạn chỉ được đổi tối đa 2 lần/tháng.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="walletAddress">Địa chỉ ví (BSC Network)</Label>
                <Input
                  id="walletAddress"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="0x..."
                  className="border-blue-500/20 focus:border-blue-500 font-mono text-sm"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Số lần đổi trong tháng: <span className="font-semibold text-foreground">{walletChangeCount}/2</span>
                </span>
                {walletChangeCount >= 2 && (
                  <span className="text-red-500 text-xs">Đã đạt giới hạn</span>
                )}
              </div>

              <Button
                onClick={handleSaveWalletAddress}
                disabled={isSavingWallet || walletChangeCount >= 2}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              >
                {isSavingWallet ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang lưu...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Lưu địa chỉ ví
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Gratitude & Journal Section */}
          <div className="grid gap-6 md:grid-cols-2">
            <DailyGratitude />
            <GratitudeJournal />
          </div>

          {/* Healing Messages from Angel AI */}
          <HealingMessagesPanel />
          {/* Avatar Card */}
          <Card className="border-divine-gold/20 shadow-divine">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-divine-gold/30 shadow-divine">
                    {isUploadingAvatar ? (
                      <div className="w-full h-full bg-divine-gold/10 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-divine-gold animate-spin" />
                      </div>
                    ) : (
                      <img 
                        src={profile?.avatar_url || angelAvatar} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <button
                    onClick={handleAvatarClick}
                    className="absolute bottom-0 right-0 p-2 rounded-full bg-gray-900 text-white shadow-lg hover:bg-black transition-colors"
                    disabled={isUploadingAvatar}
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("profile.avatarHint")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Profile Info Card */}
          <Card className="border-divine-gold/20 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-divine-gold" />
                {t("profile.personalInfo")}
              </CardTitle>
              <CardDescription>
                {t("profile.personalInfoDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">{t("profile.displayNameLabel")}</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t("profile.displayNamePlaceholder")}
                  className="border-divine-gold/20 focus:border-divine-gold"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">{t("profile.bioLabel")}</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={t("profile.bioPlaceholder")}
                  className="border-divine-gold/20 focus:border-divine-gold min-h-[100px]"
                />
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="w-full bg-sapphire-gradient hover:opacity-90"
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("profile.saving")}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    {t("profile.saveChanges")}
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Account Info Card */}
          <Card className="border-divine-gold/20 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Mail className="w-5 h-5 text-divine-gold" />
                {t("profile.accountInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-divine-gold/10">
                <span className="text-foreground">{t("profile.email")}</span>
                <span className="font-medium text-foreground">{user?.email}</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-divine-gold/10">
                <span className="text-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {t("profile.joinDate")}
                </span>
                <span className="font-medium text-foreground">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : 'N/A'}
                </span>
              </div>

              {/* Change Password Button */}
              <div className="pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowChangePassword(true)}
                  className="w-full border-divine-gold/30 hover:bg-divine-gold/5"
                >
                  <Key className="w-4 h-4 mr-2" />
                  {t("profile.changePassword")}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Light Law Agreement Status */}
          <Card className={`border-2 shadow-soft ${hasAgreedToLightLaw ? 'border-green-500/30 bg-green-50/30' : 'border-red-500/30 bg-red-50/30'}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className={`w-5 h-5 ${hasAgreedToLightLaw ? 'text-green-600' : 'text-red-500'}`} />
                {t("profile.lightLawStatus")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hasAgreedToLightLaw ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-700">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">{t("profile.lightLawAgreed")}</span>
                  </div>
                  {agreedAt && (
                    <p className="text-sm text-muted-foreground">
                      {t("profile.lightLawAgreedDate")} {new Date(agreedAt).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                  <p className="text-sm text-green-600 mt-2">
                    {t("profile.lightLawAccess")}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-red-600">
                    {t("profile.lightLawNotAgreed")}
                  </p>
                  <Link
                    to="/auth"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-divine-gold text-white hover:bg-divine-light transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    {t("profile.readLightLaw")}
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sign Out Button */}
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            {t("profile.signOut")}
          </Button>
        </div>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
        <DialogContent className="max-w-md bg-card border-divine-gold/20">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center bg-gradient-to-r from-divine-gold via-divine-light to-divine-gold bg-clip-text text-transparent">
              🔐 {t("profile.changePasswordTitle")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-foreground">{t("profile.newPassword")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10 pr-10 bg-background/50 border-divine-gold/20 focus:border-divine-gold"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground">{t("profile.confirmPassword")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10 bg-background/50 border-divine-gold/20 focus:border-divine-gold"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowChangePassword(false);
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="flex-1"
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isChangingPassword}
                className="flex-1 bg-sapphire-gradient hover:opacity-90"
              >
                {isChangingPassword ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("profile.changing")}
                  </span>
                ) : (
                  t("profile.confirmChange")
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
