import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLightAgreement } from "@/hooks/useLightAgreement";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Camera, Check, Sparkles, User, Mail, Calendar, Shield, Loader2, Lock, Eye, EyeOff, Key, Wallet, History, AlertCircle, PartyPopper, ImageIcon } from "lucide-react";
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
  cover_photo_url: string | null;
  created_at: string;
  updated_at: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { hasAgreed, isChecking: isCheckingAgreement } = useLightAgreement();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [hasAgreedToLightLaw, setHasAgreedToLightLaw] = useState(false);
  const [agreedAt, setAgreedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  
  // Setup mode: Profile is incomplete
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [setupStep, setSetupStep] = useState(1); // 1: Avatar, 2: Info, 3: Wallet (optional)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  
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
    if (!authLoading && !isCheckingAgreement && !user) {
      navigate("/auth");
      return;
    }
    
    // If user hasn't agreed to light law, redirect to auth
    if (!authLoading && !isCheckingAgreement && user && hasAgreed === false) {
      navigate("/auth");
      return;
    }
    
    if (user && hasAgreed) {
      fetchProfile();
      checkLightAgreement();
      fetchWalletAddress();
    }
  }, [user, authLoading, hasAgreed, isCheckingAgreement]);

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
        
        // Check if profile is incomplete - enter setup mode
        const isIncomplete = !data.display_name || !data.avatar_url || !data.bio;
        setIsSetupMode(isIncomplete);
        
        // Determine which step to start
        if (isIncomplete) {
          if (!data.avatar_url) {
            setSetupStep(1);
          } else if (!data.display_name || !data.bio) {
            setSetupStep(2);
          } else {
            setSetupStep(3);
          }
        }
      } else {
        // Create profile if not exists - new user, start setup
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({ user_id: user.id })
          .select()
          .single();

        if (insertError) throw insertError;
        setProfile(newProfile);
        setIsSetupMode(true);
        setSetupStep(1);
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

    // Validation for setup mode
    if (isSetupMode) {
      if (!displayName.trim()) {
        toast({
          title: "Vui lòng nhập tên hiển thị",
          description: "Tên hiển thị là bắt buộc để tiếp tục.",
          variant: "destructive",
        });
        return;
      }
      if (!bio.trim()) {
        toast({
          title: "Vui lòng nhập giới thiệu",
          description: "Giới thiệu bản thân là bắt buộc để tiếp tục.",
          variant: "destructive",
        });
        return;
      }
    }

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

      // Update local profile state
      setProfile(prev => prev ? { ...prev, display_name: displayName, bio } : null);

      if (isSetupMode) {
        // Move to next step or complete
        if (setupStep === 2) {
          setSetupStep(3); // Go to wallet step (optional)
        }
      } else {
        toast({
          title: t("common.success"),
          description: t("profile.successSave"),
        });
      }
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

  const handleCompleteSetup = () => {
    // Check if all required fields are filled
    if (!profile?.avatar_url) {
      toast({
        title: "Thiếu ảnh đại diện",
        description: "Vui lòng tải lên ảnh đại diện để tiếp tục.",
        variant: "destructive",
      });
      setSetupStep(1);
      return;
    }
    if (!displayName.trim() || !bio.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng điền đầy đủ tên hiển thị và giới thiệu.",
        variant: "destructive",
      });
      setSetupStep(2);
      return;
    }

    // Profile complete!
    setShowSuccessDialog(true);
  };

  const handleGoToHome = () => {
    setShowSuccessDialog(false);
    setIsSetupMode(false);
    navigate("/");
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

      // If in setup mode, move to next step
      if (isSetupMode && setupStep === 1) {
        setSetupStep(2);
      }
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

  const handleCoverClick = () => {
    coverInputRef.current?.click();
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    // Validate file size (max 10MB for cover photos)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Lỗi",
        description: "Kích thước file tối đa là 10MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingCover(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/cover.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      // Update profile with cover photo URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ cover_photo_url: urlData.publicUrl })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, cover_photo_url: urlData.publicUrl } : null);

      toast({
        title: "Thành công!",
        description: "Ảnh bìa đã được cập nhật ✨",
      });
    } catch (error) {
      console.error("Error uploading cover photo:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải lên ảnh bìa.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingCover(false);
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

  // Setup Mode UI
  if (isSetupMode) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-divine-deep via-background to-background py-8 px-4">
        <div className="container mx-auto max-w-xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 relative">
              <div className="absolute inset-0 bg-divine-gold/30 rounded-full blur-xl animate-pulse-divine" />
              <div className="relative z-10 w-full h-full rounded-full bg-gradient-to-r from-divine-gold to-divine-light flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-divine-gold via-divine-light to-divine-gold bg-clip-text text-transparent">
              Hoàn Thiện Hồ Sơ Cá Nhân
            </h1>
            <p className="text-muted-foreground mt-2">
              Thiết lập hồ sơ của bạn để bắt đầu hành trình trong Cổng Ánh Sáng
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8 gap-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    step < setupStep
                      ? "bg-green-500 text-white"
                      : step === setupStep
                      ? "bg-divine-gold text-white shadow-lg"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step < setupStep ? <Check className="w-5 h-5" /> : step}
                </div>
                {step < 3 && (
                  <div className={`w-12 h-1 mx-1 rounded ${step < setupStep ? "bg-green-500" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Avatar */}
          {setupStep === 1 && (
            <Card className="border-divine-gold/30 shadow-divine bg-gradient-to-b from-background to-divine-deep/20">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl flex items-center justify-center gap-2 bg-gradient-to-r from-divine-gold via-divine-light to-divine-gold bg-clip-text text-transparent">
                  <Camera className="w-6 h-6 text-divine-gold" />
                  Bước 1: Ảnh Đại Diện
                </CardTitle>
                <CardDescription className="text-base">
                  Tải lên ảnh đại diện của bạn. Đây là bắt buộc để tiếp tục.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Clickable Avatar Area */}
                <button
                  onClick={handleAvatarClick}
                  disabled={isUploadingAvatar}
                  className="relative group w-full flex flex-col items-center gap-4 cursor-pointer"
                >
                  {/* Glowing ring effect */}
                  <div className="relative">
                    <div className="absolute -inset-3 bg-gradient-to-r from-divine-gold via-divine-light to-divine-gold rounded-full opacity-40 blur-lg group-hover:opacity-70 group-hover:blur-xl transition-all duration-500 animate-pulse-divine" />
                    <div className="relative w-44 h-44 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-divine-gold shadow-[0_0_30px_rgba(212,175,55,0.4)] group-hover:shadow-[0_0_50px_rgba(212,175,55,0.6)] transition-all duration-500 group-hover:scale-105">
                      {isUploadingAvatar ? (
                        <div className="w-full h-full bg-gradient-to-br from-divine-gold/20 to-divine-deep/30 flex items-center justify-center">
                          <Loader2 className="w-12 h-12 text-divine-gold animate-spin" />
                        </div>
                      ) : profile?.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt="Avatar" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-divine-gold/10 to-divine-deep/20 flex flex-col items-center justify-center gap-2">
                          <User className="w-20 h-20 text-divine-gold/60 group-hover:text-divine-gold group-hover:scale-110 transition-all duration-300" />
                        </div>
                      )}
                    </div>
                    {/* Floating camera button */}
                    <div className="absolute -bottom-1 -right-1 p-3.5 rounded-full bg-gradient-to-r from-divine-gold to-divine-light text-white shadow-lg shadow-divine-gold/40 group-hover:shadow-divine-gold/60 group-hover:scale-110 transition-all duration-300">
                      <Camera className="w-6 h-6" />
                    </div>
                  </div>
                  
                  {/* Call to action text */}
                  <div className="text-center space-y-1">
                    <p className="text-lg font-semibold text-divine-gold group-hover:text-divine-light transition-colors">
                      {profile?.avatar_url ? "Thay đổi ảnh đại diện" : "Nhấn để tải ảnh lên"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Chọn ảnh rõ nét, thể hiện bạn tốt nhất
                    </p>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </button>

                {profile?.avatar_url && (
                  <Button
                    onClick={() => setSetupStep(2)}
                    className="w-full bg-gradient-to-r from-divine-gold to-divine-light hover:opacity-90 text-lg py-6 shadow-lg shadow-divine-gold/30 hover:shadow-divine-gold/50 transition-all duration-300"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Tiếp tục <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 2: Display Name & Bio */}
          {setupStep === 2 && (
            <Card className="border-divine-gold/30 shadow-divine">
              <CardHeader className="text-center">
                <CardTitle className="text-lg flex items-center justify-center gap-2">
                  <User className="w-5 h-5 text-divine-gold" />
                  Bước 2: Thông Tin Cá Nhân
                </CardTitle>
                <CardDescription>
                  Điền tên hiển thị và giới thiệu về bản thân bạn. Đây là bắt buộc.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="setupDisplayName" className="flex items-center gap-1">
                    Tên hiển thị <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="setupDisplayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Nhập tên hiển thị của bạn"
                    className="border-divine-gold/20 focus:border-divine-gold"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="setupBio" className="flex items-center gap-1">
                    Giới thiệu bản thân <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="setupBio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Chia sẻ một chút về bản thân bạn..."
                    className="border-divine-gold/20 focus:border-divine-gold min-h-[120px]"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setSetupStep(1)}
                    className="flex-1 border-divine-gold/30"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
                  </Button>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isSaving || !displayName.trim() || !bio.trim()}
                    className="flex-1 bg-gradient-to-r from-divine-gold to-divine-light hover:opacity-90"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>Tiếp tục <ArrowLeft className="w-4 h-4 ml-2 rotate-180" /></>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Wallet Address (Optional) */}
          {setupStep === 3 && (
            <Card className="border-divine-gold/30 shadow-divine">
              <CardHeader className="text-center">
                <CardTitle className="text-lg flex items-center justify-center gap-2">
                  <Wallet className="w-5 h-5 text-blue-500" />
                  Bước 3: Địa Chỉ Ví Web3
                </CardTitle>
                <CardDescription>
                  Nhập địa chỉ ví BSC/BNB Chain để nhận Camly Coin. 
                  <span className="block mt-1 text-green-600 font-medium">Bước này không bắt buộc, bạn có thể thêm sau.</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="setupWallet">
                    Địa chỉ ví (BSC Network) - Không bắt buộc
                  </Label>
                  <Input
                    id="setupWallet"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="0x..."
                    className="border-blue-500/20 focus:border-blue-500 font-mono text-sm"
                  />
                </div>

                <div className="bg-muted/50 rounded-lg p-4 text-sm">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <p className="text-muted-foreground">
                      Địa chỉ ví dùng để nhận Camly Coin khi bạn yêu cầu rút. Bạn có thể bỏ qua bước này và thêm sau trong phần Hồ sơ.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setSetupStep(2)}
                    className="flex-1 border-divine-gold/30"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
                  </Button>
                  <Button
                    onClick={async () => {
                      if (walletAddress.trim()) {
                        await handleSaveWalletAddress();
                      }
                      handleCompleteSetup();
                    }}
                    disabled={isSavingWallet}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90"
                  >
                    {isSavingWallet ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        {walletAddress.trim() ? "Lưu & Hoàn thành" : "Bỏ qua & Hoàn thành"}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Success Dialog */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="max-w-md bg-card border-divine-gold/20 text-center">
            <div className="py-6">
              <div className="w-24 h-24 mx-auto mb-4 relative">
                <div className="absolute inset-0 bg-green-500/30 rounded-full blur-xl animate-pulse" />
                <div className="relative z-10 w-full h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                  <PartyPopper className="w-12 h-12 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-divine-gold via-divine-light to-divine-gold bg-clip-text text-transparent mb-2">
                🎉 Chúc Mừng!
              </h2>
              <p className="text-muted-foreground mb-6">
                Bạn đã hoàn thiện hồ sơ cá nhân thành công. Giờ bạn có thể khám phá đầy đủ các tính năng của FUN Ecosystem!
              </p>
              <Button
                onClick={handleGoToHome}
                className="w-full bg-gradient-to-r from-divine-gold to-divine-light hover:opacity-90 text-lg py-6"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Bắt Đầu Hành Trình
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
          {/* Activity History Link */}
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-divine-gold/5 hover:shadow-md transition-shadow cursor-pointer">
            <Link to="/activity-history">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <History className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Lịch Sử Hoạt Động</h3>
                      <p className="text-sm text-foreground-muted">Xem lại các cuộc trò chuyện với Angel AI</p>
                    </div>
                  </div>
                  <ArrowLeft className="w-5 h-5 text-foreground-muted rotate-180" />
                </div>
              </CardContent>
            </Link>
          </Card>

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

          {/* Cover Photo Card */}
          <Card className="border-divine-gold/30 shadow-divine overflow-hidden bg-gradient-to-b from-background to-divine-deep/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg bg-gradient-to-r from-divine-gold via-divine-light to-divine-gold bg-clip-text text-transparent">
                <ImageIcon className="w-5 h-5 text-divine-gold" />
                Ảnh Bìa
              </CardTitle>
              <CardDescription>
                Tùy chỉnh ảnh bìa cho trang cá nhân của bạn (tối đa 10MB)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Clickable Cover Preview */}
              <button
                onClick={handleCoverClick}
                disabled={isUploadingCover}
                className="relative w-full h-[150px] sm:h-[200px] rounded-xl overflow-hidden bg-gradient-to-br from-divine-gold/20 via-divine-deep/30 to-divine-gold/20 group cursor-pointer transition-all duration-500 hover:shadow-[0_0_30px_rgba(212,175,55,0.3)]"
              >
                {profile?.cover_photo_url ? (
                  <img 
                    src={profile.cover_photo_url} 
                    alt="Cover photo" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="p-4 rounded-full bg-gradient-to-r from-divine-gold/30 to-divine-light/30 group-hover:from-divine-gold/50 group-hover:to-divine-light/50 transition-all duration-300">
                      <ImageIcon className="w-10 h-10 text-divine-gold group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <p className="text-divine-gold font-medium group-hover:text-divine-light transition-colors">Nhấn để tải ảnh bìa</p>
                  </div>
                )}
                
                {isUploadingCover && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-divine-gold animate-spin" />
                  </div>
                )}
                
                {/* Hover overlay for existing cover */}
                {profile?.cover_photo_url && !isUploadingCover && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                    <div className="flex items-center gap-2 px-4 py-2 bg-divine-gold/90 rounded-full text-white font-medium">
                      <Camera className="w-4 h-4" />
                      Đổi ảnh bìa
                    </div>
                  </div>
                )}
              </button>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                className="hidden"
              />
            </CardContent>
          </Card>

          {/* Avatar Card */}
          <Card className="border-divine-gold/30 shadow-divine bg-gradient-to-b from-background to-divine-deep/10">
            <CardContent className="pt-6">
              <button
                onClick={handleAvatarClick}
                disabled={isUploadingAvatar}
                className="w-full flex flex-col items-center gap-4 cursor-pointer group"
              >
                <div className="relative">
                  {/* Glowing effect */}
                  <div className="absolute -inset-2 bg-gradient-to-r from-divine-gold via-divine-light to-divine-gold rounded-full opacity-30 blur-lg group-hover:opacity-60 group-hover:blur-xl transition-all duration-500" />
                  <div className="relative w-36 h-36 rounded-full overflow-hidden border-4 border-divine-gold shadow-[0_0_20px_rgba(212,175,55,0.3)] group-hover:shadow-[0_0_40px_rgba(212,175,55,0.5)] transition-all duration-500 group-hover:scale-105">
                    {isUploadingAvatar ? (
                      <div className="w-full h-full bg-gradient-to-br from-divine-gold/20 to-divine-deep/30 flex items-center justify-center">
                        <Loader2 className="w-10 h-10 text-divine-gold animate-spin" />
                      </div>
                    ) : (
                      <img 
                        src={profile?.avatar_url || angelAvatar} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  {/* Camera button */}
                  <div className="absolute -bottom-1 -right-1 p-3 rounded-full bg-gradient-to-r from-divine-gold to-divine-light text-white shadow-lg shadow-divine-gold/40 group-hover:shadow-divine-gold/60 group-hover:scale-110 transition-all duration-300">
                    <Camera className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-divine-gold font-medium group-hover:text-divine-light transition-colors">
                  {t("profile.avatarHint")}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </button>
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
