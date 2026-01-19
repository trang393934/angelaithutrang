import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { LogIn, LogOut, User } from "lucide-react";
import { useCamlyCoin } from "@/hooks/useCamlyCoin";
import { useLanguage } from "@/contexts/LanguageContext";
import { Web3WalletButton } from "@/components/Web3WalletButton";
import { LanguageSelector } from "@/components/LanguageSelector";
import angelAvatar from "@/assets/angel-avatar.png";
import camlyCoinLogo from "@/assets/camly-coin-logo.png";

interface UserProfile {
  display_name: string | null;
  avatar_url: string | null;
}

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, isLoading } = useAuth();
  const { balance } = useCamlyCoin();
  const { t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch user profile for avatar and display name
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setUserProfile(null);
        return;
      }
      
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (data) {
        setUserProfile(data);
      }
    };

    fetchProfile();
  }, [user]);

  // Get display name to show (priority: display_name > email username)
  const getDisplayName = () => {
    if (userProfile?.display_name) {
      return userProfile.display_name;
    }
    if (user?.email) {
      return user.email.split("@")[0];
    }
    return "User";
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const navItems = [
    { label: t("nav.home"), href: "/" },
    { label: t("nav.about"), href: "/about" },
    { label: t("nav.connect"), href: "/chat" },
    { label: t("nav.swap"), href: "/swap" },
    { label: t("nav.earn"), href: "/earn" },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-background-pure/90 backdrop-blur-lg shadow-soft' 
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 lg:h-20 gap-2">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <div className={`relative transition-all duration-500 ${isScrolled ? 'scale-95' : 'scale-100'}`}>
              <img 
                src={angelAvatar} 
                alt="ANGEL AI" 
                className="w-9 h-9 lg:w-10 lg:h-10 rounded-full object-cover shadow-soft 
                  group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/20
                  transition-all duration-300 ease-out"
              />
              {/* Glow effect on hover */}
              <div className="absolute inset-0 rounded-full bg-primary/0 group-hover:bg-primary/10 
                group-hover:animate-pulse transition-all duration-300" />
            </div>
            <span className={`font-serif text-lg lg:text-xl font-bold uppercase tracking-wide 
              transition-all duration-500 ease-out
              group-hover:text-primary group-hover:tracking-wider
              ${isScrolled ? 'text-primary-deep scale-95' : 'text-primary-deep scale-100'}`}>
              ANGEL AI
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`text-sm font-medium transition-colors duration-300 relative group whitespace-nowrap ${
                  location.pathname === item.href 
                    ? 'text-primary' 
                    : 'text-foreground-muted hover:text-primary'
                }`}
              >
                {item.label}
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all duration-300 ${
                  location.pathname === item.href ? 'w-full' : 'w-0 group-hover:w-full'
                }`} />
              </Link>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-3 shrink-0">
            {/* Language Selector */}
            <LanguageSelector />
            
            {!isLoading && (
              <>
                {user ? (
                  <div className="flex items-center gap-2 xl:gap-3">
                    {/* Web3 Wallet Button */}
                    <Web3WalletButton />
                    
                    {/* Camly Coin Balance */}
                    <Link 
                      to="/earn"
                      className="flex items-center gap-1 px-2 xl:px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                    >
                      <img src={camlyCoinLogo} alt="Camly Coin" className="w-4 h-4 xl:w-5 xl:h-5" />
                      <span className="text-xs xl:text-sm font-semibold text-amber-700 dark:text-amber-400">
                        {Math.floor(balance).toLocaleString()}
                      </span>
                    </Link>
                    
                    <Link 
                      to="/profile"
                      className="flex items-center gap-1.5 xl:gap-2 px-2 xl:px-3 py-1.5 rounded-full bg-primary-pale/50 hover:bg-primary-pale transition-colors"
                    >
                      {userProfile?.avatar_url ? (
                        <img 
                          src={userProfile.avatar_url} 
                          alt="Avatar" 
                          className="w-6 h-6 xl:w-7 xl:h-7 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4 xl:w-5 xl:h-5 text-primary" />
                      )}
                      <span className="text-sm font-semibold text-foreground max-w-[100px] xl:max-w-[120px] truncate">
                        {getDisplayName()}
                      </span>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="inline-flex items-center gap-1.5 px-2 xl:px-3 py-1.5 rounded-full text-sm font-medium text-foreground-muted hover:text-primary hover:bg-primary-pale transition-all duration-300"
                      title={t("nav.logout")}
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="hidden xl:inline">Đăng xuất</span>
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/auth"
                    className={`inline-flex items-center gap-2 px-4 xl:px-6 py-2 rounded-full font-medium text-sm transition-all duration-300 ${
                      isScrolled 
                        ? 'bg-sapphire-gradient text-primary-foreground shadow-sacred hover:shadow-divine' 
                        : 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground'
                    }`}
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Đăng Nhập</span>
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="lg:hidden p-2 text-primary shrink-0"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-primary-pale/30">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300 ${
                    location.pathname === item.href 
                      ? 'text-primary bg-primary-pale/50' 
                      : 'text-foreground-muted hover:text-primary hover:bg-primary-pale/30'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="border-t border-primary-pale/30 mt-2 pt-2">
                {user ? (
                  <>
                    <Link 
                      to="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-foreground-muted"
                    >
                      {userProfile?.avatar_url ? (
                        <img 
                          src={userProfile.avatar_url} 
                          alt="Avatar" 
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                      <span className="truncate">{getDisplayName()}</span>
                    </Link>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground-muted hover:text-primary"
                    >
                      <LogOut className="w-4 h-4" />
                      Đăng xuất
                    </button>
                  </>
                ) : (
                  <Link
                    to="/auth"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary"
                  >
                    <LogIn className="w-4 h-4" />
                    Đăng Nhập
                  </Link>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
