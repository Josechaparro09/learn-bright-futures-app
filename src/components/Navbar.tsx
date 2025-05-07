import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Activity, Users, BarChart2, Layers, Sparkles, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import NavbarAuth from "@/components/NavbarAuth";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  // Detectar scroll para cambiar apariencia del navbar
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const navItems = [
    { text: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { text: "Barreras", href: "/barreras", icon: <BarChart2 className="w-5 h-5" /> },
    { text: "Estilos", href: "/estilos", icon: <Activity className="w-5 h-5" /> },
    { text: "Actividades", href: "/actividades", icon: <Layers className="w-5 h-5" /> },
    { 
      text: "Asistente IA", 
      href: "/actividades/asistente", 
      icon: <Sparkles className="w-5 h-5" />,
      highlight: true
    },
    { text: "Intervenciones", href: "/intervenciones", icon: <Users className="w-5 h-5" /> },
  ];

  return (
    <nav
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-all duration-300",
        scrolled 
          ? "bg-white/95 backdrop-blur-sm shadow-md" 
          : "bg-white"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center mr-4">
            <Link to="/dashboard" className="flex items-center group">
              <img 
                src="/logo name horizontal.svg" 
                alt="SINBAR Logo" 
                className="h-10 my-2 transition-transform duration-200 hover:scale-105"
              />
            </Link>
          </div>
          
          {/* Desktop navigation */}
          <div className="hidden md:flex md:items-center md:space-x-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href || 
                              (item.href !== "/dashboard" && location.pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex flex-col items-center px-3 py-2 rounded-md text-sm font-medium relative transition-all duration-200 mx-1",
                    isActive
                      ? "text-primary"
                      : item.highlight 
                        ? "text-primary" 
                        : "text-gray-700 hover:text-primary"
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center transition-all",
                    isActive ? "scale-110" : "hover:scale-110"
                  )}>
                    {item.icon}
                    <span className="ml-1.5">{item.text}</span>
                  </div>
                  
                  {/* Indicator line for active item */}
                  {isActive && (
                    <div 
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                    />
                  )}
                  
                  {/* Special highlight for AI Assistant */}
                  {item.highlight && !isActive && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Auth component */}
          <NavbarAuth />

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <Button
              variant="ghost"
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-primary hover:bg-primary/10"
            >
              <span className="sr-only">Abrir menú</span>
              {isMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div 
        className={cn(
          "md:hidden overflow-hidden transition-all duration-300",
          isMenuOpen ? "h-auto opacity-100" : "h-0 opacity-0"
        )}
      >
        <div className="px-3 py-3 space-y-1.5 bg-white shadow-lg rounded-b-lg">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href || 
                            (item.href !== "/dashboard" && location.pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center justify-between px-4 py-3 rounded-lg text-base font-medium transition-all",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : item.highlight 
                      ? "bg-primary/5 text-primary border border-primary/20" 
                      : "text-gray-700 hover:bg-primary/5 hover:text-primary"
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="flex items-center">
                  <div className={cn(
                    "p-1.5 rounded-md mr-3",
                    isActive ? "bg-primary/20" : "bg-primary/5"
                  )}>
                    {item.icon}
                  </div>
                  {item.text}
                </div>
                
                {isActive && (
                  <div 
                    className="w-2 h-2 bg-primary rounded-full"
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
