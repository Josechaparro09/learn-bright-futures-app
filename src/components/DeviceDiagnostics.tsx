import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";

const DeviceDiagnostics = () => {
  const { user, session } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<any>({});

  useEffect(() => {
    // Recopilar información del dispositivo
    setDeviceInfo({
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screenResolution: `${screen.width}x${screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: new Date().toISOString(),
      // Información adicional para diagnóstico
      localStorage: typeof localStorage !== 'undefined' ? 'Disponible' : 'No disponible',
      sessionStorage: typeof sessionStorage !== 'undefined' ? 'Disponible' : 'No disponible',
      cookies: document.cookie ? `${document.cookie.split(';').length} cookies` : 'Sin cookies',
      supabaseUrl: process.env.VITE_SUPABASE_URL || 'No configurado',
      supabaseKey: process.env.VITE_SUPABASE_ANON_KEY ? 'Configurado' : 'No configurado'
    });
  }, []);

  const testProfileQuery = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setProfileError(null);
    
    try {
      console.log('=== DIAGNÓSTICO DETALLADO ===');
      console.log('User ID:', user.id);
      console.log('User Email:', user.email);
      console.log('Session:', session);
      
      // Prueba 1: Consulta directa
      console.log('--- PRUEBA 1: Consulta directa ---');
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('id', user.id)
        .maybeSingle();
        
      console.log('Resultado maybeSingle:', { data, error });
      
      // Prueba 2: Consulta con select() normal
      console.log('--- PRUEBA 2: Consulta normal ---');
      const { data: data2, error: error2 } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('id', user.id);
        
      console.log('Resultado select normal:', { data: data2, error: error2 });
      
      // Prueba 3: Verificar RLS policies
      console.log('--- PRUEBA 3: Verificar permisos ---');
      const { data: authData } = await supabase.auth.getUser();
      console.log('Usuario autenticado:', authData);
      
      if (error) {
        console.error('Profile query error:', error);
        setProfileError(error.message);
      } else {
        console.log('Profile query result:', data);
        setProfileData(data);
      }
      
      // Prueba 4: Verificar conexión a Supabase
      console.log('--- PRUEBA 4: Verificar conexión ---');
      const { data: testData, error: testError } = await supabase
        .from('profiles')
        .select('count', { count: 'exact' })
        .limit(1);
        
      console.log('Test de conexión:', { testData, testError });
      
    } catch (error: any) {
      console.error('Profile query exception:', error);
      setProfileError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const refreshDiagnostics = () => {
    window.location.reload();
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Diagnóstico del Dispositivo
        </CardTitle>
        <CardDescription>
          Información para diagnosticar problemas específicos del dispositivo
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Información del Usuario */}
        <div>
          <h3 className="font-semibold mb-2">Información de Autenticación</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
            <div>
              <span className="text-sm font-medium">Usuario ID:</span>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-gray-200 px-2 py-1 rounded">
                  {user?.id || 'No disponible'}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(user?.id || '')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div>
              <span className="text-sm font-medium">Email:</span>
              <div className="text-sm">{user?.email || 'No disponible'}</div>
            </div>
            <div>
              <span className="text-sm font-medium">Estado de Sesión:</span>
              <Badge variant={session ? "default" : "destructive"}>
                {session ? 'Activa' : 'Inactiva'}
              </Badge>
            </div>
            <div>
              <span className="text-sm font-medium">Última Actualización:</span>
              <div className="text-sm">{new Date().toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Información del Dispositivo */}
        <div>
          <h3 className="font-semibold mb-2">Información del Dispositivo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
            <div>
              <span className="text-sm font-medium">Navegador:</span>
              <div className="text-sm">{deviceInfo.userAgent || 'Cargando...'}</div>
            </div>
            <div>
              <span className="text-sm font-medium">Plataforma:</span>
              <div className="text-sm">{deviceInfo.platform || 'Cargando...'}</div>
            </div>
            <div>
              <span className="text-sm font-medium">Idioma:</span>
              <div className="text-sm">{deviceInfo.language || 'Cargando...'}</div>
            </div>
            <div>
              <span className="text-sm font-medium">Cookies:</span>
              <Badge variant={deviceInfo.cookieEnabled ? "default" : "destructive"}>
                {deviceInfo.cookieEnabled ? 'Habilitadas' : 'Deshabilitadas'}
              </Badge>
            </div>
            <div>
              <span className="text-sm font-medium">Conexión:</span>
              <Badge variant={deviceInfo.onLine ? "default" : "destructive"}>
                {deviceInfo.onLine ? 'En línea' : 'Desconectado'}
              </Badge>
            </div>
            <div>
              <span className="text-sm font-medium">Resolución:</span>
              <div className="text-sm">{deviceInfo.screenResolution || 'Cargando...'}</div>
            </div>
            <div>
              <span className="text-sm font-medium">Zona Horaria:</span>
              <div className="text-sm">{deviceInfo.timezone || 'Cargando...'}</div>
            </div>
            <div>
              <span className="text-sm font-medium">Timestamp:</span>
              <div className="text-sm">{deviceInfo.timestamp || 'Cargando...'}</div>
            </div>
            <div>
              <span className="text-sm font-medium">localStorage:</span>
              <Badge variant={deviceInfo.localStorage === 'Disponible' ? "default" : "destructive"}>
                {deviceInfo.localStorage || 'Cargando...'}
              </Badge>
            </div>
            <div>
              <span className="text-sm font-medium">sessionStorage:</span>
              <Badge variant={deviceInfo.sessionStorage === 'Disponible' ? "default" : "destructive"}>
                {deviceInfo.sessionStorage || 'Cargando...'}
              </Badge>
            </div>
            <div>
              <span className="text-sm font-medium">Cookies:</span>
              <div className="text-sm">{deviceInfo.cookies || 'Cargando...'}</div>
            </div>
            <div>
              <span className="text-sm font-medium">Supabase URL:</span>
              <div className="text-sm">{deviceInfo.supabaseUrl || 'Cargando...'}</div>
            </div>
            <div>
              <span className="text-sm font-medium">Supabase Key:</span>
              <Badge variant={deviceInfo.supabaseKey === 'Configurado' ? "default" : "destructive"}>
                {deviceInfo.supabaseKey || 'Cargando...'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Prueba de Perfil */}
        <div>
          <h3 className="font-semibold mb-2">Prueba de Consulta de Perfil</h3>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4 mb-3">
              <Button 
                onClick={testProfileQuery} 
                disabled={isLoading || !user}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Probar Consulta
              </Button>
              <Button 
                onClick={refreshDiagnostics} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Actualizar Diagnóstico
              </Button>
              <Button 
                onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  document.cookie.split(";").forEach(function(c) { 
                    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
                  });
                  window.location.reload();
                }} 
                variant="destructive"
                className="flex items-center gap-2"
              >
                🗑️ Limpiar Caché Local
              </Button>
            </div>
            
            {isLoading && (
              <div className="text-sm text-gray-600">Probando consulta...</div>
            )}
            
            {profileError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Error en consulta:</span>
                </div>
                <code className="text-sm text-red-600 mt-1 block">{profileError}</code>
              </div>
            )}
            
            {profileData && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Perfil encontrado:</span>
                </div>
                <pre className="text-sm text-green-600 mt-1 whitespace-pre-wrap">
                  {JSON.stringify(profileData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Instrucciones */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Instrucciones para el Usuario Problemático:</h4>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Abra la consola del navegador (F12 → Console)</li>
            <li>Inicie sesión en la aplicación</li>
            <li>Haga clic en "Probar Consulta" y copie TODOS los mensajes de consola</li>
            <li>Si aparece "Profile not found", haga clic en "Limpiar Caché Local"</li>
            <li>Vuelva a iniciar sesión y pruebe nuevamente</li>
            <li>Envíe toda la información de diagnóstico mostrada arriba</li>
            <li>Si es posible, pruebe en modo incógnito o en otro navegador</li>
          </ol>
        </div>

        {/* Solución específica para el problema */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <h4 className="font-medium text-amber-800 mb-2">🚨 SOLUCIÓN INMEDIATA:</h4>
          <p className="text-sm text-amber-700 mb-3">
            Si el perfil existe en la base de datos pero la app dice "Profile not found", 
            es un problema de caché local del navegador.
          </p>
          <div className="space-y-2 text-sm text-amber-700">
            <p><strong>Paso 1:</strong> Haga clic en "Limpiar Caché Local" (botón rojo arriba)</p>
            <p><strong>Paso 2:</strong> Cierre completamente el navegador</p>
            <p><strong>Paso 3:</strong> Vuelva a abrir y acceda a la aplicación</p>
            <p><strong>Paso 4:</strong> Inicie sesión nuevamente</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeviceDiagnostics;
