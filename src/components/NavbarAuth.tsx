import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Settings, UserCircle, Bell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface ProfileData {
  id: string;
  name: string | null;
  email: string;
}

const NavbarAuth = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, email')
          .eq('id', user.id)
          .maybeSingle();
          
        if (error) {
          console.error('Error fetching profile:', error);
        } else if (data) {
          setProfileData(data);
        } else {
          // Si no existe el perfil, crearlo automáticamente
          console.log('Profile not found, creating one...');
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([{
              id: user.id,
              email: user.email || '',
              name: user.user_metadata?.name || user.email || 'Usuario'
            }])
            .select()
            .single();
            
          if (createError) {
            console.error('Error creating profile:', createError);
            // Usar datos del usuario de auth como fallback
            setProfileData({
              id: user.id,
              email: user.email || '',
              name: user.user_metadata?.name || null
            });
          } else {
            setProfileData(newProfile);
          }
        }
      } catch (error) {
        console.error('Error:', error);
        // Usar datos del usuario de auth como fallback
        setProfileData({
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || null
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, [user]);
  
  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };
  
  // Determinar el texto a mostrar (nombre del profesor o email como fallback)
  const displayName = profileData?.name || user?.email || 'Usuario';
  
  // Generar las iniciales para el avatar
  const getInitials = () => {
    if (!profileData?.name) return 'U';
    
    const nameParts = profileData.name.split(' ').filter(part => part.length > 0);
    if (nameParts.length === 0) return 'U';
    
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };
  
  // Generar un color semialeatório basado en el ID del usuario para el avatar
  const getUserColor = () => {
    if (!user) return "bg-primary";
    
    // Generar un color basado en el uid del usuario
    const colors = [
      "bg-blue-600", "bg-emerald-600", "bg-indigo-600", "bg-rose-600", 
      "bg-amber-600", "bg-purple-600", "bg-teal-600", "bg-fuchsia-600"
    ];
    
    const hash = user.id.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    
    return colors[hash % colors.length];
  };
  
  return (
    <div className="flex items-center gap-2">
      {/* Notificaciones (disabled in this version) */}
      <div className="hidden sm:block">
        <Button variant="ghost" size="icon" className="text-gray-500 hover:text-primary transition-colors" disabled>
          <Badge className="h-2 w-2 absolute top-2.5 right-2.5" />
          <Bell className="h-5 w-5" />
        </Button>
      </div>

      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 pl-2 h-9 hover:bg-primary/5 transition-all duration-200"
            >
              <div
                className="transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                {profileData?.name ? (
                  <Avatar className="h-7 w-7 border-2 border-white shadow-sm">
                    <AvatarFallback className={`text-xs text-white ${getUserColor()}`}>
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <UserCircle className="h-7 w-7 text-primary" />
                )}
              </div>
              <span className="hidden md:inline font-medium text-sm">
                {loading ? (
                  <span className="inline-block w-20 h-4 bg-gray-200 animate-pulse rounded" />
                ) : (
                  <span className="truncate max-w-[140px]">{displayName}</span>
                )}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-xl">
            {/* Header del menú */}
            <div className="px-3 py-2.5 mb-1">
              <div className="font-medium">{profileData?.name || 'Usuario'}</div>
              <div className="text-xs text-muted-foreground truncate">{user.email}</div>
            </div>
            <DropdownMenuSeparator />
            
            {/* Opciones principales */}
            <DropdownMenuItem className="cursor-pointer px-3 py-2.5 flex gap-2.5 hover:bg-primary/5 rounded-md">
              <UserCircle className="h-4 w-4" />
              <span>Mi perfil</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem className="cursor-pointer px-3 py-2.5 flex gap-2.5 hover:bg-primary/5 rounded-md">
              <Settings className="h-4 w-4" />
              <span>Configuración</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            {/* Cerrar sesión */}
            <DropdownMenuItem 
              className="cursor-pointer px-3 py-2.5 flex gap-2.5 hover:bg-red-50 hover:text-red-600 text-red-500 rounded-md transition-colors" 
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button asChild size="sm" variant="default" className="bg-primary rounded-full">
          <Link to="/auth">Iniciar sesión</Link>
        </Button>
      )}
    </div>
  );
};

export default NavbarAuth;
