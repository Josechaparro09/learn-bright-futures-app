import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Mail, Lock, User, BookOpen, EyeOff, Eye, ArrowRight, Info, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";

type Subject = {
  id: string;
  name: string;
};

// Lista predeterminada de asignaturas
const DEFAULT_SUBJECTS: Subject[] = [
  { id: "1", name: "Matemáticas" },
  { id: "2", name: "Lenguaje" },
  { id: "3", name: "Ciencias" },
  { id: "4", name: "Historia" },
  { id: "5", name: "Arte" },
  { id: "6", name: "Educación Física" }
];

// Esquemas de validación con Zod
const loginSchema = z.object({
  email: z.string().email({ message: "Correo electrónico inválido" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
  rememberMe: z.boolean().optional(),
});

const registerSchema = z.object({
  email: z.string().email({ message: "Correo electrónico inválido" }),
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  lastname: z.string().min(2, { message: "El apellido debe tener al menos 2 caracteres" }),
  subject: z.string().min(1, { message: "Selecciona una asignatura" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

const Auth = () => {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>(DEFAULT_SUBJECTS);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const { toast } = useToast();
  const navigate = useNavigate();

  // Formulario de inicio de sesión
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  // Formulario de registro
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      name: "",
      lastname: "",
      subject: "",
      password: "",
    },
  });

  useEffect(() => {
    // Intentar cargar las asignaturas desde la base de datos
    const fetchSubjects = async () => {
      try {
        const { data, error } = await supabase
          .from('subjects')
          .select('id, name')
          .order('name');
          
        if (error) {
          console.error("Error al cargar asignaturas:", error.message);
          return; // Usar la lista predeterminada
        }
        
        if (data && data.length > 0) {
          setSubjects(data);
        }
      } catch (error: any) {
        console.error("Error al cargar asignaturas:", error.message);
      }
    };

    fetchSubjects();
  }, []);

  const handleSignUp = async (values: RegisterFormValues) => {
    try {
      setLoading(true);
      
      // 1. Registrar usuario
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            name: values.name,
            lastname: values.lastname,
            subject: values.subject
          }
        }
      });
      
      if (authError) throw authError;
      
      // 2. Actualizar perfil con los datos adicionales
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            name: values.name,
            lastname: values.lastname,
            subject: values.subject
          })
          .eq('id', authData.user.id);
        
        if (profileError) throw profileError;
      }
      
      toast({
        title: "Registro exitoso",
        description: "Felicidades ya puedes iniciar sesion en SINBAR",
      });
    } catch (error: any) {
      toast({
        title: "Error de registro",
        description: error.message || "Ocurrió un error durante el registro",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (values: LoginFormValues) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      
      if (error) throw error;
      
      if (data) {
        toast({
          title: "Inicio de sesión exitoso",
          description: "Bienvenido/a de nuevo",
        });
        navigate("/");
      }
    } catch (error: any) {
      toast({
        title: "Error de inicio de sesión",
        description: error.message || "Credenciales inválidas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail) {
      toast({
        title: "Error",
        description: "Por favor ingresa un email válido",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail);
      
      if (error) throw error;
      
      toast({
        title: "Solicitud enviada",
        description: "Se ha enviado un enlace para restablecer tu contraseña",
      });
      
      setForgotPassword(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el enlace de restablecimiento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Variantes para animaciones
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-white p-4 sm:py-12 sm:px-6 lg:px-8">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="w-full max-w-md"
      >
        {forgotPassword ? (
          <Card className="w-full max-w-md shadow-lg border-t-4 border-t-primary overflow-hidden">
            <CardHeader className="space-y-1 pb-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="absolute left-2 top-2 h-8 w-8 p-0 rounded-full" 
                onClick={() => setForgotPassword(false)}
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Volver</span>
              </Button>
              <div className="pt-4">
                <CardTitle className="text-xl font-bold text-center mt-2">Recuperar Contraseña</CardTitle>
                <CardDescription className="text-center">
                  Ingresa tu correo electrónico para recuperar tu contraseña
                </CardDescription>
              </div>
            </CardHeader>
            
            <form onSubmit={handlePasswordReset}>
              <CardContent className="space-y-4 px-4 sm:px-6">
                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="email" 
                      placeholder="Email" 
                      className="pl-10 h-11" 
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2 px-4 sm:px-6 pb-6">
                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar Instrucciones"
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full h-11 mt-2" 
                  onClick={() => setForgotPassword(false)}
                >
                  Volver al Inicio de Sesión
                </Button>
              </CardFooter>
            </form>
          </Card>
        ) : (
          <Card className="w-full max-w-md shadow-lg border-t-4 border-t-primary overflow-hidden">
            <CardHeader className="space-y-1 relative pb-2">
              <div className="absolute left-0 right-0 top-0 flex justify-center -translate-y-1/2">
                <div className="bg-primary p-2 rounded-full shadow-md">
                  <img 
                    src="/logo.svg"
                    alt="Logo"
                    className="h-10 w-10"
                  />
                </div>
              </div>
              <div className="pt-6">
                <CardTitle className="text-2xl font-bold text-center">INTERVENCIONES</CardTitle>
                <CardDescription className="text-center">
                  Plataforma de gestión de intervenciones educativas
                </CardDescription>
              </div>
            </CardHeader>
            
            <Tabs defaultValue={tabParam === 'signup' ? "signup" : "signin"} className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-none border-b">
                <TabsTrigger value="signin" className="rounded-none py-2.5 data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  Iniciar Sesión
                </TabsTrigger>
                <TabsTrigger value="signup" className="rounded-none py-2.5 data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  Registrarse
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="p-0">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(handleSignIn)} className="space-y-3">
                    <CardContent className="space-y-4 pt-4 px-4 sm:px-6">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                              <FormControl>
                                <Input 
                                  placeholder="Email" 
                                  className="pl-10 h-11 text-base" 
                                  {...field}
                                  disabled={loading}
                                />
                              </FormControl>
                            </div>
                            <FormMessage className="text-xs sm:text-sm" />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                              <FormControl>
                                <Input 
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Contraseña" 
                                  className="pl-10 pr-10 h-11 text-base" 
                                  {...field}
                                  disabled={loading}
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground"
                                onClick={togglePasswordVisibility}
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                <span className="sr-only">
                                  {showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                </span>
                              </Button>
                            </div>
                            <FormMessage className="text-xs sm:text-sm" />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2">
                        <FormField
                          control={loginForm.control}
                          name="rememberMe"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled={loading}
                                  id="rememberMe"
                                  className="mt-0.5"
                                />
                              </FormControl>
                              <FormLabel htmlFor="rememberMe" className="text-sm font-normal cursor-pointer">
                                Recordarme
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                        
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="p-0 h-auto text-sm font-normal text-primary -ml-2 xs:ml-0"
                          onClick={() => setForgotPassword(true)}
                        >
                          ¿Olvidaste tu contraseña?
                        </Button>
                      </div>
                    </CardContent>
                    <CardFooter className="px-4 sm:px-6 pb-6">
                      <Button type="submit" className="w-full h-11" disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Iniciando sesión...
                          </>
                        ) : (
                          <>
                            Iniciar Sesión
                            <ArrowRight className="ml-1 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="signup" className="p-0">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(handleSignUp)} className="space-y-3">
                    <CardContent className="space-y-4 pt-4 px-4 sm:px-6">
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                              <FormControl>
                                <Input 
                                  placeholder="Email" 
                                  className="pl-10 h-11 text-base" 
                                  {...field}
                                  disabled={loading}
                                />
                              </FormControl>
                            </div>
                            <FormMessage className="text-xs sm:text-sm" />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <FormField
                          control={registerForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <div className="relative">
                                <User className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                <FormControl>
                                  <Input 
                                    placeholder="Nombre" 
                                    className="pl-10 h-11 text-base" 
                                    {...field}
                                    disabled={loading}
                                  />
                                </FormControl>
                              </div>
                              <FormMessage className="text-xs sm:text-sm" />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="lastname"
                          render={({ field }) => (
                            <FormItem>
                              <div className="relative">
                                <User className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                <FormControl>
                                  <Input 
                                    placeholder="Apellido" 
                                    className="pl-10 h-11 text-base" 
                                    {...field}
                                    disabled={loading}
                                  />
                                </FormControl>
                              </div>
                              <FormMessage className="text-xs sm:text-sm" />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={registerForm.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <div className="relative">
                              <BookOpen className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground z-10" />
                              <FormControl>
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                  disabled={loading}
                                >
                                  <SelectTrigger className="pl-10 h-11 text-base">
                                    <SelectValue placeholder="Selecciona tu asignatura" />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-60">
                                    {subjects.map(subj => (
                                      <SelectItem key={subj.id} value={subj.name}>
                                        {subj.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                            </div>
                            <FormMessage className="text-xs sm:text-sm" />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                              <FormControl>
                                <Input 
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Contraseña" 
                                  className="pl-10 pr-10 h-11 text-base" 
                                  {...field}
                                  disabled={loading}
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground"
                                onClick={togglePasswordVisibility}
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                <span className="sr-only">
                                  {showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                </span>
                              </Button>
                            </div>
                            <FormMessage className="text-xs sm:text-sm" />
                          </FormItem>
                        )}
                      />
                      
                      <div className="text-xs text-muted-foreground flex items-start space-x-2 bg-blue-50 p-2 rounded-md">
                        <Info className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                        <span>
                          Al registrarte aceptas nuestros términos y condiciones de uso. Tu contraseña debe tener al menos 6 caracteres.
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter className="px-4 sm:px-6 pb-6">
                      <Button type="submit" className="w-full h-11" disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Registrando...
                          </>
                        ) : (
                          <>
                            Registrarse
                            <ArrowRight className="ml-1 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </Card>
        )}
      </motion.div>
      
      {/* Note for responsive testing */}
      <div className="fixed bottom-2 right-2 text-[10px] text-gray-400 hidden sm:block md:hidden">
        SM
      </div>
      <div className="fixed bottom-2 right-2 text-[10px] text-gray-400 hidden md:block lg:hidden">
        MD
      </div>
      <div className="fixed bottom-2 right-2 text-[10px] text-gray-400 hidden lg:block xl:hidden">
        LG
      </div>
      <div className="fixed bottom-2 right-2 text-[10px] text-gray-400 hidden xl:block">
        XL
      </div>
    </div>
  );
};

export default Auth;
