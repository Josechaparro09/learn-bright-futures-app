import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import InterventionComments from "@/components/InterventionComments";
import { 
  Calendar, ChevronDown, ChevronUp, Plus, Search, User, 
  BookOpen, Filter, ClipboardList, MessageSquare, Loader2
} from "lucide-react";
import { 
  Intervention 
} from "@/data/sampleData";
import { Link } from "react-router-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

// Definir interfaces para los datos de Supabase
interface SupabaseIntervention {
  id: string;
  teacher_id: string;
  student_id: string;
  activity_id: string;
  observations?: string;
  date: string;
  created_at: string;
  updated_at?: string;
}

interface SupabaseProfile {
  id: string;
  name: string;
  email: string;
}

interface SupabaseStudent {
  id: string;
  name: string;
  grade: string;
}

interface SupabaseActivity {
  id: string;
  name: string;
  objective: string;
}

interface SupabaseBarrier {
  id: string;
  name: string;
}

interface SupabaseLearningStyle {
  id: string;
  name: string;
}

// Interfaz para intervención completa
interface CompleteIntervention {
  id: string;
  teacherName: string;
  teacherId: string;
  student: {
    id: string;
    name: string;
    grade: string;
  };
  activity: string;
  activityName: string;
  barriers: string[];
  learningStyles: string[];
  date: Date;
  observations: string;
}

const Interventions = () => {
  const [interventions, setInterventions] = useState<CompleteIntervention[]>([]);
  const [activities, setActivities] = useState<SupabaseActivity[]>([]);
  const [barriers, setBarriers] = useState<SupabaseBarrier[]>([]);
  const [learningStyles, setLearningStyles] = useState<SupabaseLearningStyle[]>([]);
  const [teachers, setTeachers] = useState<SupabaseProfile[]>([]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedInterventions, setExpandedInterventions] = useState<Record<string, boolean>>({});
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [teacherFilter, setTeacherFilter] = useState<string[]>([]);
  const [activityFilter, setActivityFilter] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { toast } = useToast();

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 1. Obtener actividades
        const { data: activityData, error: activityError } = await supabase
          .from('activities')
          .select('id, name, objective');
        
        if (activityError) throw activityError;
        setActivities(activityData || []);

        // 2. Obtener barreras
        const { data: barrierData, error: barrierError } = await supabase
          .from('barriers')
          .select('id, name');
        
        if (barrierError) throw barrierError;
        setBarriers(barrierData || []);

        // 3. Obtener estilos de aprendizaje
        const { data: styleData, error: styleError } = await supabase
          .from('learning_styles')
          .select('id, name');
        
        if (styleError) throw styleError;
        setLearningStyles(styleData || []);

        // 4. Obtener perfiles de profesores
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, email');
        
        if (profileError) throw profileError;
        setTeachers(profileData || []);

        // 5. Obtener intervenciones
        const { data: interventionData, error: interventionError } = await supabase
          .from('interventions')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (interventionError) throw interventionError;

        // 6. Procesar cada intervención para obtener datos relacionados
        const processedInterventions = await Promise.all((interventionData || []).map(async (intervention: SupabaseIntervention) => {
          // Obtener estudiante
          const { data: studentData, error: studentError } = await supabase
            .from('students')
            .select('*')
            .eq('id', intervention.student_id)
            .single();
          
          if (studentError && studentError.code !== 'PGRST116') {
            console.error("Error al obtener estudiante:", studentError);
          }

          // Obtener barreras
          const { data: interventionBarriers, error: interventionBarriersError } = await supabase
            .from('intervention_barriers')
            .select('barrier_id')
            .eq('intervention_id', intervention.id);
          
          if (interventionBarriersError) {
            console.error("Error al obtener barreras:", interventionBarriersError);
          }

          // Obtener estilos de aprendizaje
          const { data: interventionStyles, error: interventionStylesError } = await supabase
            .from('intervention_learning_styles')
            .select('learning_style_id')
            .eq('intervention_id', intervention.id);
          
          if (interventionStylesError) {
            console.error("Error al obtener estilos:", interventionStylesError);
          }

          // Buscar el profesor
          const teacher = profileData?.find(p => p.id === intervention.teacher_id);

          return {
            id: intervention.id,
            teacherId: intervention.teacher_id,
            teacherName: teacher?.name || teacher?.email || "Profesor desconocido",
            student: {
              id: studentData?.id || intervention.student_id,
              name: studentData?.name || "Estudiante desconocido",
              grade: studentData?.grade || ""
            },
            activity: intervention.activity_id,
            activityName: activityData?.find(a => a.id === intervention.activity_id)?.name || "Actividad desconocida",
            barriers: interventionBarriers?.map(b => b.barrier_id) || [],
            learningStyles: interventionStyles?.map(s => s.learning_style_id) || [],
            date: new Date(intervention.date),
            observations: intervention.observations || ""
          };
        }));

        setInterventions(processedInterventions);
      } catch (error) {
        console.error("Error al cargar datos:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las intervenciones",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const toggleExpand = (id: string) => {
    setExpandedInterventions({
      ...expandedInterventions,
      [id]: !expandedInterventions[id],
    });
  };

  const toggleComments = (id: string) => {
    setShowComments({
      ...showComments,
      [id]: !showComments[id],
    });
  };

  // Obtiene una lista de todos los profesores únicos
  const uniqueTeachers = Array.from(
    new Set(interventions.map((i) => i.teacherName))
  );

  // Función para manejar cambios en el filtro de profesores
  const handleTeacherFilterChange = (teacherName: string) => {
    if (teacherFilter.includes(teacherName)) {
      setTeacherFilter(teacherFilter.filter((name) => name !== teacherName));
    } else {
      setTeacherFilter([...teacherFilter, teacherName]);
    }
  };

  // Función para manejar cambios en el filtro de actividades
  const handleActivityFilterChange = (activityId: string) => {
    if (activityFilter.includes(activityId)) {
      setActivityFilter(activityFilter.filter((id) => id !== activityId));
    } else {
      setActivityFilter([...activityFilter, activityId]);
    }
  };

  const clearFilters = () => {
    setTeacherFilter([]);
    setActivityFilter([]);
    setSearchTerm("");
  };

  const filteredInterventions = interventions.filter((intervention) => {
    // Filtro de búsqueda por texto
    const matchesSearch =
      searchTerm === "" ||
      intervention.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intervention.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intervention.activityName.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro por profesor
    const matchesTeacher =
      teacherFilter.length === 0 ||
      teacherFilter.includes(intervention.teacherName);

    // Filtro por actividad
    const matchesActivity =
      activityFilter.length === 0 ||
      activityFilter.includes(intervention.activity);

    return matchesSearch && matchesTeacher && matchesActivity;
  });

  // Función para obtener nombre de barrera por ID
  const getBarrierName = (id: string) => {
    const barrier = barriers.find((b) => b.id === id);
    return barrier ? barrier.name : "Desconocido";
  };

  // Función para obtener nombre de estilo por ID
  const getStyleName = (id: string) => {
    const style = learningStyles.find((s) => s.id === id);
    return style ? style.name : "Desconocido";
  };

  // Función para formatear fechas
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex-grow flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-gray-600">Cargando intervenciones...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Intervenciones Educativas</h1>
            <p className="text-gray-600">
              Gestiona y realiza seguimiento de las intervenciones personalizadas
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex space-x-2">
            <Button 
              className="gap-2"
              asChild
            >
              <Link to="/intervenciones/asistente">
                <Plus size={18} /> Asistente de Intervención
              </Link>
            </Button>
            
            <Button 
              variant="outline"
              asChild
              className="gap-2"
            >
              <Link to="/intervenciones/nueva">
                <Plus size={18} /> Creación Manual
              </Link>
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por profesor, estudiante o actividad..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/70"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={18} />
              Filtros {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>
          </div>

          {showFilters && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-gray-700">Profesores</h3>
                  <div className="space-y-2">
                    {uniqueTeachers.map((teacher) => (
                      <div key={teacher} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`teacher-${teacher}`}
                          className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                          checked={teacherFilter.includes(teacher)}
                          onChange={() => handleTeacherFilterChange(teacher)}
                        />
                        <label htmlFor={`teacher-${teacher}`} className="ml-2 text-sm text-gray-700">
                          {teacher}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2 text-gray-700">Actividades</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`activity-${activity.id}`}
                          className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                          checked={activityFilter.includes(activity.id)}
                          onChange={() => handleActivityFilterChange(activity.id)}
                        />
                        <label htmlFor={`activity-${activity.id}`} className="ml-2 text-sm text-gray-700">
                          {activity.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              </div>
            </div>
          )}

          {filteredInterventions.length === 0 ? (
            <div className="text-center py-16">
              <ClipboardList className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No se encontraron intervenciones</h3>
              <p className="text-gray-500 mb-4">Crea una nueva intervención o modifica tus filtros de búsqueda</p>
              <Button asChild>
                <Link to="/intervenciones/nueva">
                  <Plus size={16} className="mr-2" /> Nueva Intervención
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredInterventions.map((intervention) => (
                <div
                  key={intervention.id}
                  className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="p-5">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                        <span className="text-sm text-gray-600">{formatDate(intervention.date)}</span>
                      </div>
                      <div className="flex items-center mt-2 md:mt-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpand(intervention.id)}
                          className="gap-1"
                        >
                          {expandedInterventions[intervention.id] ? "Colapsar" : "Detalles"}
                          {expandedInterventions[intervention.id] ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleComments(intervention.id)}
                          className="gap-1"
                        >
                          Comentarios <MessageSquare size={16} />
                        </Button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h3 className="text-xl font-semibold">{intervention.student.name}</h3>
                      <div className="text-sm text-gray-600 flex items-center mt-1">
                        <User size={16} className="mr-1" />
                        {intervention.teacherName} | <BookOpen size={16} className="mx-1" /> {intervention.student.grade}
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900">Actividad:</h4>
                      <p className="text-gray-800">{intervention.activityName}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {intervention.barriers.map((barrierId) => (
                        <span
                          key={barrierId}
                          className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm"
                        >
                          {getBarrierName(barrierId)}
                        </span>
                      ))}
                      {intervention.learningStyles.map((styleId) => (
                        <span
                          key={styleId}
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                        >
                          {getStyleName(styleId)}
                        </span>
                      ))}
                    </div>

                    {expandedInterventions[intervention.id] && (
                      <div className="mt-4 border-t pt-4 animate-fadeIn">
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900">Observaciones:</h4>
                          <p className="text-gray-700 whitespace-pre-wrap">
                            {intervention.observations || "No hay observaciones registradas."}
                          </p>
                        </div>

                        <div className="flex justify-end space-x-2 mt-4">
                          <Button 
                            variant="outline" 
                            size="sm"
                            asChild
                          >
                            <Link to={`/intervenciones/editar/${intervention.id}`}>
                              Editar
                            </Link>
                          </Button>
                        </div>
                      </div>
                    )}

                    {showComments[intervention.id] && (
                      <div className="mt-4 border-t pt-4 animate-fadeIn">
                        <InterventionComments interventionId={intervention.id} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Interventions;
