
import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, BookOpen, Activity, Users, BarChart2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const navItems = [
    { text: "Inicio", href: "/", icon: <BookOpen className="w-5 h-5 mr-2" /> },
    { text: "Barreras de Aprendizaje", href: "/barreras", icon: <BarChart2 className="w-5 h-5 mr-2" /> },
    { text: "Estilos de Aprendizaje", href: "/estilos", icon: <Activity className="w-5 h-5 mr-2" /> },
    { text: "Actividades", href: "/actividades", icon: <Layers className="w-5 h-5 mr-2" /> },
    { text: "Intervenciones", href: "/intervenciones", icon: <Users className="w-5 h-5 mr-2" /> },
  ];

  return (
    <nav className="bg-white shadow-md w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <BookOpen className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-display font-bold text-gray-900">EduIntervención</span>
            </Link>
          </div>
          
          {/* Desktop navigation */}
          <div className="hidden md:flex md:space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-primary/10 hover:text-primary transition-colors"
              >
                {item.icon}
                {item.text}
              </Link>
            ))}
          </div>

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
      <div className={cn("md:hidden", isMenuOpen ? "block" : "hidden")}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white shadow-lg rounded-b-lg">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-primary/10 hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              {item.icon}
              {item.text}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
