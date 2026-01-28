import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { LogIn, LogOut, User, MessageCircle, Search } from "lucide-react";
import { useCamlyCoin } from "@/hooks/useCamlyCoin";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDirectMessages } from "@/hooks/useDirectMessages";
import { Web3WalletButton } from "@/components/Web3WalletButton";
import { LanguageSelector } from "@/components/LanguageSelector";
import { GlobalSearch } from "@/components/GlobalSearch";
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
  const { unreadCount } = useDirectMessages();
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
    { label: t("nav.knowledge"), href: "/knowledge" },
    { label: t("nav.connect"), href: "/chat" },
    { label: t("nav.community") || "Cộng đồng", href: "/community" },
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
      <div className="max-w-full mx-auto px-2 sm:px-4 lg:px-4 xl:px-6 overflow-hidden">
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-16 gap-1">
          {/* Logo - Fixed width, hide text on smaller screens */}
          <Link to="/" className="flex items-center gap-1 sm:gap-1.5 shrink-0 group min-w-0">
            <div className={`relative transition-all duration-500 shrink-0 ${isScrolled ? 'scale-95' : 'scale-100'}`}>
              <img 
                src={angelAvatar} 
                alt="ANGEL AI" 
                className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 rounded-full object-cover shadow-soft 
                  group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/20
                  transition-all duration-300 ease-out"
              />
              {/* Glow effect on hover */}
              <div className="absolute inset-0 rounded-full bg-primary/0 group-hover:bg-primary/10 
                group-hover:animate-pulse transition-all duration-300" />
            </div>
            {/* Hide text on lg (1024-1279px), show on xl+ */}
            <span className={`hidden xl:inline font-serif text-base xl:text-lg font-bold uppercase tracking-wide 
              transition-all duration-500 ease-out whitespace-nowrap
              group-hover:text-primary group-hover:tracking-wider
              ${isScrolled ? 'text-primary-deep scale-95' : 'text-primary-deep scale-100'}`}>
              ANGEL AI
            </span>
          </Link>

          {/* Search Bar - Desktop - smaller on lg screens */}
          <div className="hidden lg:block w-32 xl:w-44 2xl:w-56 shrink-0">
            <GlobalSearch 
              variant="header" 
              placeholder="Tìm kiếm..." 
            />
          </div>

          {/* Navigation - Premium golden metallic border with shimmer */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 2xl:gap-2 justify-center min-w-0 mx-1 xl:mx-2 2xl:mx-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`relative text-[11px] lg:text-xs xl:text-[13px] 2xl:text-sm font-semibold transition-all duration-300 whitespace-nowrap px-2 lg:px-2.5 xl:px-3 2xl:px-4 py-1.5 xl:py-2 rounded-lg overflow-hidden ${
                  location.pathname === item.href 
                    ? 'bg-primary text-white' 
                    : 'bg-primary-deep/95 text-white/95 hover:bg-primary'
                }`}
                style={{
                  boxShadow: location.pathname === item.href 
                    ? '0 0 12px rgba(255,215,0,0.6), inset 0 1px 0 rgba(255,255,255,0.2)' 
                    : '0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
                  border: '2px solid transparent',
                  backgroundImage: location.pathname === item.href
                    ? 'linear-gradient(hsl(var(--primary)), hsl(var(--primary))), linear-gradient(135deg, #FFEB3B, #FFD700, #FFA500, #FFD700, #FFEB3B)'
                    : 'linear-gradient(hsl(217 91% 25% / 0.95), hsl(217 91% 25% / 0.95)), linear-gradient(135deg, #DAA520, #FFD700, #B8860B, #FFD700, #DAA520)',
                  backgroundOrigin: 'border-box',
                  backgroundClip: 'padding-box, border-box',
                }}
              >
                {/* Shimmer effect */}
                <span 
                  className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                    animation: 'shimmer 2s infinite',
                  }}
                />
                <span className="relative z-10">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Auth Buttons - More compact design */}
          <div className="hidden lg:flex items-center gap-0.5 lg:gap-1 xl:gap-1.5 shrink-0">
            {/* Language Selector - Compact on lg */}
            <LanguageSelector compact />
            
            {!isLoading && (
              <>
                {user ? (
                  <div className="flex items-center gap-0.5 lg:gap-1 xl:gap-1.5">
                    {/* Web3 Wallet Button - Compact on lg */}
                    <Web3WalletButton compact />
                    
                    {/* Messages Button */}
                    <Link 
                      to="/messages"
                      className="relative p-1 lg:p-1.5 xl:p-2 rounded-full hover:bg-primary-pale transition-colors"
                      title="Tin nhắn"
                    >
                      <MessageCircle className="w-3.5 h-3.5 lg:w-4 lg:h-4 xl:w-5 xl:h-5 text-foreground-muted" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] lg:text-[10px] font-bold w-3.5 h-3.5 lg:w-4 lg:h-4 rounded-full flex items-center justify-center">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </Link>
                    
                    {/* Camly Coin Balance */}
                    <Link 
                      to="/earn"
                      className="flex items-center gap-0.5 lg:gap-1 px-1.5 lg:px-2 py-1 lg:py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                    >
                      <img src={camlyCoinLogo} alt="Camly Coin" className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                      <span className="text-[10px] lg:text-xs font-semibold text-amber-700 dark:text-amber-400">
                        {Math.floor(balance).toLocaleString()}
                      </span>
                    </Link>
                    
                    {/* User Profile - Hide name on lg, show on xl+ */}
                    <Link 
                      to="/profile"
                      className="flex items-center gap-0.5 lg:gap-1 px-1 lg:px-1.5 xl:px-2 py-1 rounded-full bg-primary-pale/50 hover:bg-primary-pale transition-colors"
                    >
                      {userProfile?.avatar_url ? (
                        <img 
                          src={userProfile.avatar_url} 
                          alt="Avatar" 
                          className="w-5 h-5 lg:w-5 lg:h-5 xl:w-6 xl:h-6 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-primary" />
                      )}
                      {/* Only show name on xl+ screens */}
                      <span className="hidden xl:inline text-xs font-semibold text-foreground max-w-[70px] truncate">
                        {getDisplayName()}
                      </span>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="p-1 lg:p-1.5 xl:p-2 rounded-full text-foreground-muted hover:text-primary hover:bg-primary-pale transition-all duration-300"
                      title={t("nav.logout")}
                    >
                      <LogOut className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/auth"
                    className={`inline-flex items-center gap-1 px-2 lg:px-3 xl:px-4 py-1 lg:py-1.5 rounded-full font-medium text-[11px] lg:text-xs xl:text-sm transition-all duration-300 ${
                      isScrolled 
                        ? 'bg-sapphire-gradient text-primary-foreground shadow-sacred hover:shadow-divine' 
                        : 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground'
                    }`}
                  >
                    <LogIn className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                    <span className="hidden xl:inline">{t("nav.login")}</span>
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Mobile Actions - Always visible on mobile */}
          <div className="flex lg:hidden items-center gap-2 shrink-0">
            {/* Mobile Language Selector */}
            <LanguageSelector />
            
            {/* Mobile Menu Button */}
            <button 
              className="p-2 text-primary"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-primary-pale/30 bg-background-pure/95 backdrop-blur-lg animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col gap-2">
              {/* Navigation Items - Mobile with same styling */}
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-center px-4 py-3 rounded-md text-base font-semibold transition-all duration-300 border mx-2 ${
                    location.pathname === item.href 
                      ? 'bg-primary text-white border-amber-400/80 shadow-[0_0_8px_rgba(251,191,36,0.4)]' 
                      : 'bg-primary-deep/90 text-white/90 border-amber-500/40 hover:bg-primary hover:border-amber-400/70'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              
              {/* Divider */}
              <div className="border-t border-primary-pale/30 my-3" />
              
              {/* User Section */}
              {!isLoading && (
                <>
                  {user ? (
                    <div className="space-y-2">
                      {/* Web3 Wallet for Mobile */}
                      <div className="px-4 py-2">
                        <p className="text-xs text-foreground-muted mb-2 uppercase tracking-wide">{t("header.web3Wallet")}</p>
                        <Web3WalletButton />
                      </div>
                      
                      {/* Camly Coin Balance */}
                      <Link 
                        to="/earn"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-between px-4 py-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors mx-2"
                      >
                        <div className="flex items-center gap-2">
                          <img src={camlyCoinLogo} alt="Camly Coin" className="w-6 h-6" />
                          <span className="text-sm font-medium text-foreground">{t("header.camlyCoin")}</span>
                        </div>
                        <span className="text-base font-bold text-amber-700 dark:text-amber-400">
                          {Math.floor(balance).toLocaleString()}
                        </span>
                      </Link>
                      
                      {/* Profile Link */}
                      <Link 
                        to="/profile"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary-pale/30 transition-colors mx-2"
                      >
                        {userProfile?.avatar_url ? (
                          <img 
                            src={userProfile.avatar_url} 
                            alt="Avatar" 
                            className="w-10 h-10 rounded-full object-cover border-2 border-primary/20"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary-pale flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                        )}
                        <div>
                          <p className="text-base font-semibold text-foreground">{getDisplayName()}</p>
                          <p className="text-xs text-foreground-muted">{t("header.viewProfile")}</p>
                        </div>
                      </Link>
                      
                      {/* Sign Out Button */}
                      <button
                        onClick={() => {
                          handleSignOut();
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-6 py-3 text-base font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors mx-2"
                        style={{ width: 'calc(100% - 16px)' }}
                      >
                        <LogOut className="w-5 h-5" />
                        {t("nav.logout")}
                      </button>
                    </div>
                  ) : (
                    <Link
                      to="/auth"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 mx-4 py-3 text-base font-semibold text-primary-foreground bg-sapphire-gradient rounded-full shadow-sacred hover:shadow-divine transition-all"
                    >
                      <LogIn className="w-5 h-5" />
                      {t("nav.login")}
                    </Link>
                  )}
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
