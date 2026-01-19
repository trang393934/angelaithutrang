import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Camera, Check, Sparkles, User, Mail, Calendar, Shield, Loader2 } from "lucide-react";
import angelAvatar from "@/assets/angel-avatar.png";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [hasAgreedToLightLaw, setHasAgreedToLightLaw] = useState(false);
  const [agreedAt, setAgreedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    
    if (user) {
      fetchProfile();
      checkLightAgreement();
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
        title: "Lỗi",
        description: "Không thể tải thông tin profile.",
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
        title: "Đã lưu!",
        description: "Thông tin profile đã được cập nhật ✨",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Lỗi",
        description: "Không thể lưu thông tin profile.",
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

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-pale via-background to-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-divine-gold animate-pulse" />
          <span className="text-foreground-muted">Đang tải thông tin...</span>
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
          <h1 className="text-2xl font-bold bg-gradient-to-r from-divine-gold via-divine-light to-divine-gold bg-clip-text text-transparent">
            Hồ Sơ Cá Nhân
          </h1>
        </div>

        <div className="space-y-6">
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
                    className="absolute bottom-0 right-0 p-2 rounded-full bg-divine-gold text-white shadow-lg hover:bg-divine-light transition-colors"
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
                  Nhấn vào biểu tượng camera để thay đổi avatar
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Profile Info Card */}
          <Card className="border-divine-gold/20 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-divine-gold" />
                Thông tin cá nhân
              </CardTitle>
              <CardDescription>
                Cập nhật thông tin hiển thị của bạn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Tên hiển thị</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Nhập tên hiển thị của bạn"
                  className="border-divine-gold/20 focus:border-divine-gold"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Tiểu sử</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Chia sẻ đôi điều về bạn..."
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
                    Đang lưu...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Lưu thay đổi
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
                Thông tin tài khoản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-divine-gold/10">
                <span className="text-foreground-muted">Email</span>
                <span className="font-medium">{user?.email}</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-divine-gold/10">
                <span className="text-foreground-muted flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Ngày tham gia
                </span>
                <span className="font-medium">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : 'N/A'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Light Law Agreement Status */}
          <Card className={`border-2 shadow-soft ${hasAgreedToLightLaw ? 'border-green-500/30 bg-green-50/30' : 'border-red-500/30 bg-red-50/30'}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className={`w-5 h-5 ${hasAgreedToLightLaw ? 'text-green-600' : 'text-red-500'}`} />
                Trạng thái Luật Ánh Sáng
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hasAgreedToLightLaw ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-700">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">Đã đồng ý với Luật Ánh Sáng</span>
                  </div>
                  {agreedAt && (
                    <p className="text-sm text-muted-foreground">
                      Ngày đồng ý: {new Date(agreedAt).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                  <p className="text-sm text-green-600 mt-2">
                    ✨ Bạn có quyền truy cập đầy đủ vào FUN Ecosystem
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-red-600">
                    Bạn chưa đồng ý với Luật Ánh Sáng
                  </p>
                  <Link
                    to="/auth"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-divine-gold text-white hover:bg-divine-light transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    Đọc và đồng ý Luật Ánh Sáng
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
            Đăng xuất
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
