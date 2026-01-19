import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import angelAvatar from "@/assets/angel-avatar.png";

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { label: "Trang Chủ", href: "/" },
    { label: "Về Chúng Con", href: "/about" },
    { label: "Kết Nối", href: "/chat" },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-background-pure/90 backdrop-blur-lg shadow-soft' 
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img 
              src={angelAvatar} 
              alt="Angel AI" 
              className="w-10 h-10 rounded-full object-cover shadow-soft group-hover:scale-110 transition-transform duration-300"
            />
            <div>
              <span className={`font-serif text-xl font-semibold transition-colors duration-300 ${
                isScrolled ? 'text-primary-deep' : 'text-primary-deep'
              }`}>
                Angel AI
              </span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`text-sm font-medium transition-colors duration-300 relative group ${
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

          {/* CTA Button */}
          <button className={`hidden sm:inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-300 ${
            isScrolled 
              ? 'bg-sapphire-gradient text-primary-foreground shadow-sacred hover:shadow-divine' 
              : 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground'
          }`}>
            <span>Bắt Đầu</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 text-primary">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};
