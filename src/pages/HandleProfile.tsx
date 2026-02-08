import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

/**
 * Resolves /@handle routes to the actual user profile page /user/:userId
 */
const HandleProfile = () => {
  const { handle } = useParams<{ handle: string }>();
  const navigate = useNavigate();
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!handle) {
      navigate("/", { replace: true });
      return;
    }

    const resolveHandle = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id")
        .ilike("handle", handle)
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
        return;
      }

      navigate(`/user/${data.user_id}`, { replace: true });
    };

    resolveHandle();
  }, [handle, navigate]);

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-divine-deep via-background to-background">
        <div className="text-center space-y-4 p-8">
          <div className="text-6xl">🔍</div>
          <h1 className="text-2xl font-bold text-foreground">
            Không tìm thấy hồ sơ
          </h1>
          <p className="text-muted-foreground">
            Link <span className="font-mono font-medium text-divine-gold">fun.rich/{handle}</span> chưa có ai sử dụng.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 rounded-full bg-sapphire-gradient text-white hover:opacity-90 transition-opacity"
          >
            Về Trang Chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-divine-deep via-background to-background">
      <div className="flex items-center gap-3">
        <Loader2 className="w-6 h-6 text-divine-gold animate-spin" />
        <span className="text-muted-foreground">Đang tải hồ sơ...</span>
      </div>
    </div>
  );
};

export default HandleProfile;
