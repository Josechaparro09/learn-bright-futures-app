import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, BookOpen, Brain, Users, Clock, AlertCircle, Activity, ChevronRight, BarChart2, User } from "lucide-react";
import DashboardStats from "@/components/DashboardStats";

// Tipos para los datos extraídos de la base de datos
type ActivityCount = {
  count: number;
};

type BarrierCount = {
  count: number;
};

type InterventionCount = {
  count: number;
};

type StudentCount = {
  count: number;
};

type RecentActivity = {
  id: string;
  name: string;
  created_at: string;
  objective: string;
};

type RecentIntervention = {
  id: string;
  date: string;
  student_name: string;
  activity_name: string;
};

type BarrierData = {
  name: string;
  count: number;
};

type LearningStyleData = {
  name: string;
  count: number;
  color: string;
};

type ActivityByMonth = {
  month: string;
  count: number;
};

// Tipos para los resultados de las consultas RPC
type BarrierActivityCount = {
  name: string;
  count: number;
};

type LearningStyleActivityCount = {
  name: string;
  count: number;
  color: string;
};

type ActivityMonthCount = {
  month: string;
  count: number;
};

// Tipo para el perfil del usuario
type ProfileData = {
  id: string;
  name: string | null;
  email: string;
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [activityCount, setActivityCount] = useState<number>(0);
  const [barrierCount, setBarrierCount] = useState<number>(0);
  const [interventionCount, setInterventionCount] = useState<number>(0);
  const [studentCount, setStudentCount] = useState<number>(0);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [recentInterventions, setRecentInterventions] = useState<RecentIntervention[]>([]);
  const [barrierStats, setBarrierStats] = useState<BarrierData[]>([]);
  const [learningStyleStats, setLearningStyleStats] = useState<LearningStyleData[]>([]);
  const [activityByMonth, setActivityByMonth] = useState<ActivityByMonth[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, email')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error('Error fetching profile:', error);
        } else if (data) {
          setProfileData(data);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };
    
    fetchProfileData();
  }, [user]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Obtener conteo de actividades
        const { data: activityData, error: activityError } = await supabase
          .from('activities')
          .select('count', { count: 'exact' });
          
        if (activityError) throw new Error(activityError.message);
        setActivityCount((activityData as unknown as ActivityCount[])[0]?.count || 0);
        
        // Obtener conteo de barreras
        const { data: barrierData, error: barrierError } = await supabase
          .from('barriers')
          .select('count', { count: 'exact' });
          
        if (barrierError) throw new Error(barrierError.message);
        setBarrierCount((barrierData as unknown as BarrierCount[])[0]?.count || 0);
        
        // Obtener conteo de intervenciones
        const { data: interventionData, error: interventionError } = await supabase
          .from('interventions')
          .select('count', { count: 'exact' });
          
        if (interventionError) throw new Error(interventionError.message);
        setInterventionCount((interventionData as unknown as InterventionCount[])[0]?.count || 0);
        
        // Obtener conteo de estudiantes
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('count', { count: 'exact' });
          
        if (studentError) throw new Error(studentError.message);
        setStudentCount((studentData as unknown as StudentCount[])[0]?.count || 0);
        
        // Obtener actividades recientes
        const { data: recentActivitiesData, error: recentActivitiesError } = await supabase
          .from('activities')
          .select('id, name, created_at, objective')
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (recentActivitiesError) throw new Error(recentActivitiesError.message);
        setRecentActivities(recentActivitiesData || []);
        
        // Obtener intervenciones recientes con nombres de estudiantes y actividades
        const { data: recentInterventionsData, error: recentInterventionsError } = await supabase
          .from('interventions')
          .select(`
            id, 
            date,
            students!inner(name),
            activities!inner(name)
          `)
          .order('date', { ascending: false })
          .limit(5);
          
        if (recentInterventionsError) throw new Error(recentInterventionsError.message);
        
        // Transformar los datos para un formato más fácil de usar
        const formattedInterventions = recentInterventionsData?.map(item => ({
          id: item.id,
          date: item.date,
          student_name: item.students?.name || "Sin nombre",
          activity_name: item.activities?.name || "Sin nombre"
        })) || [];
        
        setRecentInterventions(formattedInterventions);

        // Obtener estadísticas de barreras
        try {
          // En lugar de usar la función RPC, consultamos directamente las tablas
          const { data: barrierStatsData, error: barrierStatsError } = await supabase
            .from('barriers')
            .select(`
              id,
              name
            `);
          
          if (barrierStatsError) throw barrierStatsError;
          
          // Si tenemos barreras, obtenemos los conteos de actividades para cada una
          if (barrierStatsData && barrierStatsData.length > 0) {
            // Obtenemos todos los activity_barriers
            const { data: activityBarriersData, error: activityBarriersError } = await supabase
              .from('activity_barriers')
              .select('barrier_id');
              
            if (activityBarriersError) throw activityBarriersError;
            
            // Contamos las actividades para cada barrera
            const barrierCounts: Record<string, number> = {};
            if (activityBarriersData) {
              activityBarriersData.forEach(ab => {
                barrierCounts[ab.barrier_id] = (barrierCounts[ab.barrier_id] || 0) + 1;
              });
            }
            
            // Procesamos los datos para obtener el formato que necesitamos
            const processedData = barrierStatsData.map(barrier => ({
              name: barrier.name,
              count: barrierCounts[barrier.id] || 0
            }));
            
            // Ordenamos por conteo descendente
            processedData.sort((a, b) => b.count - a.count);
            
            setBarrierStats(processedData);
          } else {
            // Datos de demostración para las gráficas
            setBarrierStats([
              { name: "Dificultad de lectura", count: 12 },
              { name: "Dificultad de cálculo", count: 8 },
              { name: "Déficit de atención", count: 15 },
              { name: "Dislexia", count: 10 },
              { name: "Discalculia", count: 6 }
            ]);
          }
        } catch (e) {
          console.warn("No se pudo obtener estadísticas de barreras:", e);
          // Usar datos de demostración
          setBarrierStats([
            { name: "Dificultad de lectura", count: 12 },
            { name: "Dificultad de cálculo", count: 8 },
            { name: "Déficit de atención", count: 15 },
            { name: "Dislexia", count: 10 },
            { name: "Discalculia", count: 6 }
          ]);
        }

        // Obtener estadísticas de estilos de aprendizaje
        try {
          // En lugar de usar la función RPC, consultamos directamente las tablas
          const { data: styleStatsData, error: styleStatsError } = await supabase
            .from('learning_styles')
            .select(`
              id,
              name,
              color
            `);
          
          if (styleStatsError) throw styleStatsError;
          
          // Si tenemos estilos, obtenemos los conteos de actividades para cada uno
          if (styleStatsData && styleStatsData.length > 0) {
            // Obtenemos todas las relaciones entre actividades y estilos
            const { data: activityStylesData, error: activityStylesError } = await supabase
              .from('activity_learning_styles')
              .select('learning_style_id');
              
            if (activityStylesError) throw activityStylesError;
            
            // Contamos las actividades para cada estilo
            const styleCounts: Record<string, number> = {};
            if (activityStylesData) {
              activityStylesData.forEach(als => {
                styleCounts[als.learning_style_id] = (styleCounts[als.learning_style_id] || 0) + 1;
              });
            }
            
            // Procesamos los datos para obtener el formato que necesitamos
            const processedData = styleStatsData.map(style => ({
              name: style.name,
              count: styleCounts[style.id] || 0,
              color: style.color || "#3b82f6" // Color por defecto si no tiene uno asignado
            }));
            
            // Ordenamos por conteo descendente
            processedData.sort((a, b) => b.count - a.count);
            
            setLearningStyleStats(processedData);
          } else {
            // Datos de demostración para las gráficas
            setLearningStyleStats([
              { name: "Visual", count: 25, color: "#3b82f6" },
              { name: "Auditivo", count: 18, color: "#10b981" },
              { name: "Kinestésico", count: 15, color: "#f97316" },
              { name: "Lector/Escritor", count: 12, color: "#8b5cf6" }
            ]);
          }
        } catch (e) {
          console.warn("No se pudo obtener estadísticas de estilos de aprendizaje:", e);
          // Usar datos de demostración
          setLearningStyleStats([
            { name: "Visual", count: 25, color: "#3b82f6" },
            { name: "Auditivo", count: 18, color: "#10b981" },
            { name: "Kinestésico", count: 15, color: "#f97316" },
            { name: "Lector/Escritor", count: 12, color: "#8b5cf6" }
          ]);
        }

        // Obtener estadísticas de actividades por mes
        try {
          // En lugar de usar la función RPC, consultamos directamente las tablas y procesamos los datos
          const { data: activitiesData, error: activitiesError } = await supabase
            .from('activities')
            .select('created_at')
            .gte('created_at', new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString());
          
          if (activitiesError) throw activitiesError;
          
          if (activitiesData && activitiesData.length > 0) {
            // Procesamos los datos para agrupar por mes
            const monthCounts: Record<string, number> = {};
            
            // Nombres de meses en español
            const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
            
            // Inicializamos todos los meses de los últimos 6 meses con 0
            const today = new Date();
            for (let i = 0; i < 6; i++) {
              const d = new Date();
              d.setMonth(today.getMonth() - i);
              const monthKey = monthNames[d.getMonth()];
              monthCounts[monthKey] = 0;
            }
            
            // Contamos las actividades por mes
            activitiesData.forEach(activity => {
              const date = new Date(activity.created_at);
              const monthKey = monthNames[date.getMonth()];
              monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
            });
            
            // Convertimos a array para el gráfico
            const processedData = Object.entries(monthCounts).map(([month, count]) => ({
              month,
              count
            }));
            
            // Ordenamos cronológicamente
            const monthOrder: Record<string, number> = {};
            monthNames.forEach((month, index) => {
              monthOrder[month] = index;
            });
            
            processedData.sort((a, b) => monthOrder[a.month] - monthOrder[b.month]);
            
            setActivityByMonth(processedData);
          } else {
            // Datos de demostración para las gráficas
            setActivityByMonth([
              { month: "Ene", count: 5 },
              { month: "Feb", count: 8 },
              { month: "Mar", count: 12 },
              { month: "Abr", count: 7 },
              { month: "May", count: 15 },
              { month: "Jun", count: 10 }
            ]);
          }
        } catch (e) {
          console.warn("No se pudo obtener estadísticas de actividades por mes:", e);
          // Usar datos de demostración
          setActivityByMonth([
            { month: "Ene", count: 5 },
            { month: "Feb", count: 8 },
            { month: "Mar", count: 12 },
            { month: "Abr", count: 7 },
            { month: "May", count: 15 },
            { month: "Jun", count: 10 }
          ]);
        }
      } catch (error) {
        console.error("Error al cargar los datos del dashboard:", error);
        setError("No se pudieron cargar algunos datos del dashboard. Se están mostrando datos de ejemplo para visualizar la interfaz.");
        
        // Asegurarse de que siempre tenemos datos para mostrar
        setBarrierStats([
          { name: "Dificultad de lectura", count: 12 },
          { name: "Dificultad de cálculo", count: 8 },
          { name: "Déficit de atención", count: 15 },
          { name: "Dislexia", count: 10 },
          { name: "Discalculia", count: 6 }
        ]);
        
        setLearningStyleStats([
          { name: "Visual", count: 25, color: "#3b82f6" },
          { name: "Auditivo", count: 18, color: "#10b981" },
          { name: "Kinestésico", count: 15, color: "#f97316" },
          { name: "Lector/Escritor", count: 12, color: "#8b5cf6" }
        ]);
        
        setActivityByMonth([
          { month: "Ene", count: 5 },
          { month: "Feb", count: 8 },
          { month: "Mar", count: 12 },
          { month: "Abr", count: 7 },
          { month: "May", count: 15 },
          { month: "Jun", count: 10 }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Formatear la fecha para mostrarla en un formato legible
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Determinar el texto de bienvenida
  const welcomeName = profileData?.name || user?.email || 'Usuario';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="mb-6">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-none shadow-sm">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="bg-white p-3 rounded-full shadow-sm">
                  {profileData?.name ? (
                    <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-xl font-semibold text-white">
                      {profileData.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center">
                      <User size={30} className="text-gray-500" />
                    </div>
                  )}
                </div>
                <div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary mb-2">
                    Profesor/a
                  </span>
                  <h1 className="text-3xl font-bold text-gray-900">¡Bienvenido/a {welcomeName}!</h1>
                  <p className="text-gray-600 mt-2">
                    Este es tu dashboard educativo donde puedes gestionar actividades e intervenciones.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total de Actividades</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-12 w-20" />
              ) : (
                <div className="flex items-center">
                  <BookOpen className="mr-3 h-8 w-8 text-primary/70" />
                  <div className="text-3xl font-bold">{activityCount}</div>
                </div>
              )}
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="ghost" size="sm" asChild className="text-primary">
                <a href="/actividades">Ver todas <ChevronRight className="ml-1 h-4 w-4" /></a>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Barreras de Aprendizaje</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-12 w-20" />
              ) : (
                <div className="flex items-center">
                  <BarChart2 className="mr-3 h-8 w-8 text-secondary/70" />
                  <div className="text-3xl font-bold">{barrierCount}</div>
                </div>
              )}
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="ghost" size="sm" asChild className="text-secondary">
                <a href="/barreras">Ver todas <ChevronRight className="ml-1 h-4 w-4" /></a>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Intervenciones</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-12 w-20" />
              ) : (
                <div className="flex items-center">
                  <Brain className="mr-3 h-8 w-8 text-accent/70" />
                  <div className="text-3xl font-bold">{interventionCount}</div>
                </div>
              )}
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="ghost" size="sm" asChild className="text-accent">
                <a href="/intervenciones">Ver todas <ChevronRight className="ml-1 h-4 w-4" /></a>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Estudiantes</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-12 w-20" />
              ) : (
                <div className="flex items-center">
                  <Users className="mr-3 h-8 w-8 text-gray-600" />
                  <div className="text-3xl font-bold">{studentCount}</div>
                </div>
              )}
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="ghost" size="sm" className="text-gray-600">
                <span>Ver todos <ChevronRight className="ml-1 h-4 w-4" /></span>
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Acciones rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Button onClick={() => navigate('/actividades/nueva')} className="h-auto py-4 gap-3">
            <PlusCircle className="h-5 w-5" />
            <div className="flex flex-col items-start">
              <span>Nueva Actividad</span>
              <span className="text-xs opacity-90">Crea una actividad adaptada</span>
            </div>
          </Button>
          
          <Button onClick={() => navigate('/intervenciones/nueva')} className="h-auto py-4 gap-3" variant="secondary">
            <PlusCircle className="h-5 w-5" />
            <div className="flex flex-col items-start">
              <span>Nueva Intervención</span>
              <span className="text-xs opacity-90">Planifica una intervención</span>
            </div>
          </Button>
          
          <Button onClick={() => navigate('/intervenciones/asistente')} className="h-auto py-4 gap-3" variant="outline">
            <Activity className="h-5 w-5 text-accent" />
            <div className="flex flex-col items-start">
              <span className="text-accent">Asistente de Intervención</span>
              <span className="text-xs opacity-90">Wizard paso a paso</span>
            </div>
          </Button>
        </div>

        {/* Layout flexible para estadísticas y actividad reciente */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Gráficos estadísticos */}
          <Card className="lg:col-span-2">
            {isLoading ? (
              <div className="p-6 space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-[300px] w-full" />
              </div>
            ) : (
              <DashboardStats 
                barrierData={barrierStats}
                learningStyleData={learningStyleStats}
                activityData={activityByMonth}
              />
            )}
          </Card>

          {/* Contenido reciente en pestañas */}
          <Card className="lg:col-span-1">
            <Tabs defaultValue="activities">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Actividad Reciente</CardTitle>
                  <TabsList>
                    <TabsTrigger value="activities">Actividades</TabsTrigger>
                    <TabsTrigger value="interventions">Intervenciones</TabsTrigger>
                  </TabsList>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                <TabsContent value="activities" className="m-0">
                  {isLoading ? (
                    <div className="p-4 space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex flex-col space-y-3">
                          <Skeleton className="h-5 w-40" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                        </div>
                      ))}
                    </div>
                  ) : recentActivities.length > 0 ? (
                    <div className="divide-y">
                      {recentActivities.map((activity) => (
                        <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-medium text-primary">{activity.name}</h3>
                            <span className="text-sm text-gray-500">{formatDate(activity.created_at)}</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1 line-clamp-2">{activity.objective}</p>
                          <Button variant="link" asChild className="text-sm px-0 h-auto">
                            <a href={`/actividades/editar/${activity.id}`}>Ver detalles</a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <BookOpen className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No hay actividades recientes</h3>
                      <p className="text-gray-500 mb-4">Comienza creando tu primera actividad adaptada</p>
                      <Button onClick={() => navigate('/actividades/nueva')}>
                        Crear Actividad
                      </Button>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="interventions" className="m-0">
                  {isLoading ? (
                    <div className="p-4 space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex flex-col space-y-3">
                          <Skeleton className="h-5 w-40" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                        </div>
                      ))}
                    </div>
                  ) : recentInterventions.length > 0 ? (
                    <div className="divide-y">
                      {recentInterventions.map((intervention) => (
                        <div key={intervention.id} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-medium text-primary">{intervention.activity_name}</h3>
                            <span className="text-sm text-gray-500">{formatDate(intervention.date)}</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Estudiante:</strong> {intervention.student_name}
                          </p>
                          <Button variant="link" asChild className="text-sm px-0 h-auto">
                            <a href={`/intervenciones/editar/${intervention.id}`}>Ver detalles</a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <Clock className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No hay intervenciones recientes</h3>
                      <p className="text-gray-500 mb-4">Planifica tu primera intervención para un estudiante</p>
                      <Button onClick={() => navigate('/intervenciones/nueva')}>
                        Crear Intervención
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </main>

      {/* Sección de ayuda rápida */}
      <footer className="bg-white border-t py-6 mt-auto">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-3">Recursos</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-primary hover:underline">Guía de usuario</a></li>
                <li><a href="#" className="text-primary hover:underline">Tutoriales en video</a></li>
                <li><a href="/admin/migrations" className="text-primary hover:underline">Configuración avanzada</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3">Ayuda</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-primary hover:underline">Centro de soporte</a></li>
                <li><a href="#" className="text-primary hover:underline">Preguntas frecuentes</a></li>
                <li><a href="#" className="text-primary hover:underline">Contactar soporte</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3">Acciones rápidas</h3>
              <ul className="space-y-2">
                <li><a href="/actividades/nueva" className="text-primary hover:underline">Crear actividad</a></li>
                <li><a href="/intervenciones/nueva" className="text-primary hover:underline">Planificar intervención</a></li>
                <li><a href="/intervenciones/asistente" className="text-primary hover:underline">Asistente de intervención</a></li>
                <li><a href="/actividades/asistente" className="text-primary hover:underline">Generar con IA</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3">Sobre SINBAR</h3>
              <p className="text-sm text-gray-600 mb-3">
                Herramienta diseñada para docentes que necesitan crear estrategias educativas 
                específicas para estudiantes con diferentes barreras de aprendizaje.
              </p>
              <p className="text-sm text-gray-600">
                © {new Date().getFullYear()} SINBAR. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard; 