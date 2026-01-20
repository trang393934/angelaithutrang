import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { LogIn, LogOut, User, Users, MessageCircle } from "lucide-react";
import { useCamlyCoin } from "@/hooks/useCamlyCoin";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDirectMessages } from "@/hooks/useDirectMessages";
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
      <div className="max-w-full mx-auto px-3 sm:px-4 lg:px-6 overflow-hidden">
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-18 gap-1 sm:gap-2">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1.5 sm:gap-2 shrink-0 group">
            <div className={`relative transition-all duration-500 ${isScrolled ? 'scale-95' : 'scale-100'}`}>
              <img 
                src={angelAvatar} 
                alt="ANGEL AI" 
                className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full object-cover shadow-soft 
                  group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/20
                  transition-all duration-300 ease-out"
              />
              {/* Glow effect on hover */}
              <div className="absolute inset-0 rounded-full bg-primary/0 group-hover:bg-primary/10 
                group-hover:animate-pulse transition-all duration-300" />
            </div>
            <span className={`font-serif text-base sm:text-lg lg:text-xl font-bold uppercase tracking-wide 
              transition-all duration-500 ease-out
              group-hover:text-primary group-hover:tracking-wider
              ${isScrolled ? 'text-primary-deep scale-95' : 'text-primary-deep scale-100'}`}>
              ANGEL AI
            </span>
          </Link>

          {/* Navigation - responsive with smaller gaps */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 2xl:gap-4 flex-1 justify-center min-w-0 px-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`text-xs xl:text-sm font-medium transition-colors duration-300 relative group whitespace-nowrap px-1.5 xl:px-2 py-1 ${
                  location.pathname === item.href 
                    ? 'text-primary' 
                    : 'text-foreground-muted hover:text-primary'
                }`}
              >
                {item.label}
                <span className={`absolute -bottom-0.5 left-1.5 right-1.5 h-0.5 bg-primary transition-all duration-300 ${
                  location.pathname === item.href ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`} />
              </Link>
            ))}
          </nav>

          {/* Auth Buttons - Compact design */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2 shrink-0">
            {/* Language Selector */}
            <LanguageSelector />
            
            {!isLoading && (
              <>
                {user ? (
                  <div className="flex items-center gap-1 xl:gap-2">
                    {/* Web3 Wallet Button */}
                    <Web3WalletButton />
                    
                    {/* Messages Button */}
                    <Link 
                      to="/messages"
                      className="relative p-1.5 xl:p-2 rounded-full hover:bg-primary-pale transition-colors"
                      title="Tin nhắn"
                    >
                      <MessageCircle className="w-4 h-4 xl:w-5 xl:h-5 text-foreground-muted" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </Link>
                    
                    {/* Camly Coin Balance */}
                    <Link 
                      to="/earn"
                      className="flex items-center gap-1 px-2 py-1 xl:py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                    >
                      <img src={camlyCoinLogo} alt="Camly Coin" className="w-4 h-4" />
                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                        {Math.floor(balance).toLocaleString()}
                      </span>
                    </Link>
                    
                    <Link 
                      to="/profile"
                      className="flex items-center gap-1 px-1.5 xl:px-2 py-1 rounded-full bg-primary-pale/50 hover:bg-primary-pale transition-colors"
                    >
                      {userProfile?.avatar_url ? (
                        <img 
                          src={userProfile.avatar_url} 
                          alt="Avatar" 
                          className="w-5 h-5 xl:w-6 xl:h-6 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4 text-primary" />
                      )}
                      <span className="text-xs xl:text-sm font-semibold text-foreground max-w-[60px] xl:max-w-[80px] truncate hidden xl:inline">
                        {getDisplayName()}
                      </span>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="p-1.5 xl:p-2 rounded-full text-foreground-muted hover:text-primary hover:bg-primary-pale transition-all duration-300"
                      title={t("nav.logout")}
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/auth"
                    className={`inline-flex items-center gap-1.5 px-3 xl:px-4 py-1.5 rounded-full font-medium text-xs xl:text-sm transition-all duration-300 ${
                      isScrolled 
                        ? 'bg-sapphire-gradient text-primary-foreground shadow-sacred hover:shadow-divine' 
                        : 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground'
                    }`}
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{t("nav.login")}</span>
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
            <nav className="flex flex-col gap-1">
              {/* Navigation Items */}
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-lg text-base font-medium transition-all duration-300 ${
                    location.pathname === item.href 
                      ? 'text-primary bg-primary-pale/50' 
                      : 'text-foreground-muted hover:text-primary hover:bg-primary-pale/30'
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
