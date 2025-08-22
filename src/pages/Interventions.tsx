import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import InterventionComments from "@/components/InterventionComments";
import { 
  Calendar, ChevronDown, ChevronUp, Plus, Search, User, 
  BookOpen, Filter, ClipboardList, MessageSquare, Loader2, Eye, Info, X
} from "lucide-react";
import { 
  Intervention 
} from "@/data/sampleData";
import { Link } from "react-router-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  subject_id?: string; // Agregar campo para el área
}

interface SupabaseSubject {
  id: string;
  name: string;
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
  subjectName?: string; // Agregar campo para el área de la actividad
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
  const [students, setStudents] = useState<SupabaseStudent[]>([]);
  const [subjects, setSubjects] = useState<SupabaseSubject[]>([]); // Estado para áreas/subjects
  
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedInterventions, setExpandedInterventions] = useState<Record<string, boolean>>({});
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [teacherFilter, setTeacherFilter] = useState<string>("");
  const [activityFilter, setActivityFilter] = useState<string>("");
  const [studentFilter, setStudentFilter] = useState<string>("");
  const [areaFilter, setAreaFilter] = useState<string>(""); // Agregar estado para filtro de área
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState<{type: string, value: string, label: string}[]>([]);
  
  const { toast } = useToast();

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 1. Obtener actividades
        const { data: activityData, error: activityError } = await supabase
          .from('activities')
          .select('id, name, objective, subject_id');
        
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

        // 5. Obtener lista de estudiantes para el filtro
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select('id, name, grade')
          .order('name');
        
        if (studentsError) throw studentsError;
        setStudents(studentsData || []);

        // 6. Obtener áreas/subjects para mostrar en las intervenciones
        const { data: subjectsData, error: subjectsError } = await supabase
          .from('subjects')
          .select('id, name');
        
        if (subjectsError) throw subjectsError;
        setSubjects(subjectsData || []);

        // 6. Obtener intervenciones
        const { data: interventionData, error: interventionError } = await supabase
          .from('interventions')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (interventionError) throw interventionError;

        console.log('Intervenciones obtenidas de la BD:', interventionData); // Log de depuración

        // 7. Procesar cada intervención para obtener datos relacionados
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
          
          // Buscar el área/subject para la actividad
          const activity = activityData?.find(a => a.id === intervention.activity_id);
          const subjectName = activity ? subjectsData?.find(s => s.id === activity.subject_id)?.name : "Área desconocida";

          console.log('Intervención procesada:', { // Log de depuración
            id: intervention.id,
            teacher_id: intervention.teacher_id,
            teacher: teacher,
            teacherName: teacher?.name || teacher?.email || "Profesor desconocido",
            activity: activity,
            subjectName: subjectName
          });

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
            activityName: activity?.name || "Actividad desconocida",
            subjectName: subjectName,
            barriers: interventionBarriers?.map(b => b.barrier_id) || [],
            learningStyles: interventionStyles?.map(s => s.learning_style_id) || [],
            date: new Date(intervention.date),
            observations: intervention.observations || ""
          };
        }));

        console.log('Intervenciones procesadas:', processedInterventions); // Log de depuración
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

  // Función para aplicar filtros
  const applyTeacherFilter = (teacherName: string) => {
    if (!teacherName) return;

    // Remover filtro previo si existe
    const updatedFilters = activeFilters.filter(f => f.type !== 'teacher');
    
    // Agregar nuevo filtro
    setActiveFilters([...updatedFilters, {
      type: 'teacher',
      value: teacherName,
      label: `Profesor: ${teacherName}`
    }]);
    
    setTeacherFilter("");
  };

  const applyActivityFilter = (activityId: string) => {
    if (!activityId) return;
    
    const activity = activities.find(a => a.id === activityId);
    if (!activity) return;
    
    // Remover filtro previo si existe
    const updatedFilters = activeFilters.filter(f => f.type !== 'activity');
    
    // Agregar nuevo filtro
    setActiveFilters([...updatedFilters, {
      type: 'activity',
      value: activityId,
      label: `Actividad: ${activity.name}`
    }]);
    
    setActivityFilter("");
  };

  const applyStudentFilter = (studentId: string) => {
    if (!studentId) return;
    
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    
    // Remover filtro previo si existe
    const updatedFilters = activeFilters.filter(f => f.type !== 'student');
    
    // Agregar nuevo filtro
    setActiveFilters([...updatedFilters, {
      type: 'student',
      value: studentId,
      label: `Estudiante: ${student.name}`
    }]);
    
    setStudentFilter("");
  };

  const applyAreaFilter = (subjectId: string) => {
    if (!subjectId) {
      // Si no hay área seleccionada, limpiar el filtro
      const updatedFilters = activeFilters.filter(f => f.type !== 'area');
      setActiveFilters(updatedFilters);
      setAreaFilter("");
      return;
    }

    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;

    // Remover filtro previo si existe
    const updatedFilters = activeFilters.filter(f => f.type !== 'area');
    
    // Agregar nuevo filtro
    setActiveFilters([...updatedFilters, {
      type: 'area',
      value: subject.name, // Usar el nombre del área para el filtro
      label: `Área: ${subject.name}`
    }]);
    
    setAreaFilter(subjectId);
  };

  const removeFilter = (filterType: string) => {
    setActiveFilters(activeFilters.filter(f => f.type !== filterType));
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    setSearchTerm("");
  };

  // Filtrar intervenciones según los filtros activos
  const filteredInterventions = interventions.filter((intervention) => {
    // Filtro de búsqueda por texto
    const matchesSearch =
      searchTerm === "" ||
      intervention.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intervention.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intervention.activityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (intervention.subjectName && intervention.subjectName.toLowerCase().includes(searchTerm.toLowerCase())); // Agregar búsqueda por área

    // Filtro por profesor
    const teacherFilterItem = activeFilters.find(f => f.type === 'teacher');
    const matchesTeacher = !teacherFilterItem || 
      intervention.teacherName === teacherFilterItem.value;

    // Filtro por actividad
    const activityFilterItem = activeFilters.find(f => f.type === 'activity');
    const matchesActivity = !activityFilterItem || 
      intervention.activity === activityFilterItem.value;
    
    // Filtro por estudiante
    const studentFilterItem = activeFilters.find(f => f.type === 'student');
    const matchesStudent = !studentFilterItem ||
      intervention.student.id === studentFilterItem.value;

    // Filtro por área
    const areaFilterItem = activeFilters.find(f => f.type === 'area');
    const matchesArea = !areaFilterItem ||
      intervention.subjectName === areaFilterItem.value;

    const result = matchesSearch && matchesTeacher && matchesActivity && matchesStudent && matchesArea;
    
    // Log de depuración para la primera intervención
    if (interventions.indexOf(intervention) === 0) {
      console.log('Filtrado de intervención:', {
        intervention: intervention.teacherName,
        searchTerm,
        matchesSearch,
        teacherFilter: teacherFilterItem?.value,
        matchesTeacher,
        areaFilter: areaFilterItem?.value,
        matchesArea,
        result
      });
    }

    return result;
  });

  // Log de depuración para ver el estado de las intervenciones
  useEffect(() => {
    console.log('Estado actual de intervenciones:', {
      total: interventions.length,
      filtered: filteredInterventions.length,
      activeFilters: activeFilters.length,
      searchTerm
    });
  }, [interventions, filteredInterventions, activeFilters, searchTerm]);

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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Intervenciones Educativas</h1>
            <p className="text-gray-600">
              Gestiona y realiza seguimiento de las intervenciones personalizadas
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
            <Button 
              className="gap-2"
              asChild
            >
              <Link to="/intervenciones/nueva">
                <Plus size={18} /> Nueva Intervención
              </Link>
            </Button>
            
            <Button 
              variant="outline"
              className="gap-2"
              asChild
            >
              <Link to="/intervenciones/asistente">
                <ClipboardList size={18} /> Asistente de Intervención
              </Link>
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-8">
          <div className="flex flex-col space-y-4 mb-4">
            <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                  placeholder="Buscar por nombre de estudiante, profesor, actividad o área..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/70"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
              
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-shrink-0">
                      <Filter size={16} className="mr-2" />
                      Filtros
                      {activeFilters.length > 0 && (
                        <span className="ml-1.5 bg-primary text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                          {activeFilters.length}
                        </span>
                      )}
            </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72">
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">Filtrar por:</h4>

                  <div className="space-y-2">
                        <label className="text-sm text-gray-700">Profesor</label>
                        <Select
                          value={teacherFilter}
                          onValueChange={(value) => applyTeacherFilter(value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Seleccionar profesor" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from(new Set(interventions.map(i => i.teacherName))).map(name => (
                              <SelectItem key={name} value={name}>
                                {name}
                              </SelectItem>
                    ))}
                          </SelectContent>
                        </Select>
                </div>

                      <div className="space-y-2">
                        <label className="text-sm text-gray-700">Actividad</label>
                        <Select
                          value={activityFilter}
                          onValueChange={(value) => applyActivityFilter(value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Seleccionar actividad" />
                          </SelectTrigger>
                          <SelectContent className="max-h-56 overflow-y-auto">
                            {activities.map(activity => (
                              <SelectItem key={activity.id} value={activity.id}>
                                <div className="flex flex-col">
                                  <span>{activity.name}</span>
                                  {activity.subject_id && (
                                    <span className="text-xs text-gray-500">
                                      {subjects.find(s => s.id === activity.subject_id)?.name || 'Sin área'}
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm text-gray-700">Área</label>
                        <Select
                          value={areaFilter}
                          onValueChange={(value) => applyAreaFilter(value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Seleccionar área" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Todas las áreas</SelectItem>
                            {subjects.map(subject => (
                              <SelectItem key={subject.id} value={subject.id}>
                                {subject.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm text-gray-700">Estudiante</label>
                        <Select
                          value={studentFilter}
                          onValueChange={(value) => applyStudentFilter(value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Seleccionar estudiante" />
                          </SelectTrigger>
                          <SelectContent className="max-h-56 overflow-y-auto">
                            {students.map(student => (
                              <SelectItem key={student.id} value={student.id}>
                                {student.name} <span className="text-xs text-gray-500">({student.grade})</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                  </div>
                  </PopoverContent>
                </Popover>

                {activeFilters.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={clearAllFilters}
                    className="flex-shrink-0"
                  >
                    Limpiar
                </Button>
                )}
              </div>
            </div>
            
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {activeFilters.map((filter) => (
                  <Badge 
                    key={filter.type} 
                    variant="secondary"
                    className="flex items-center gap-1 px-2 py-1 text-sm"
                  >
                    {filter.label}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-4 w-4 p-0 ml-1 text-gray-500 hover:text-gray-700"
                      onClick={() => removeFilter(filter.type)}
                    >
                      <X size={12} />
                      <span className="sr-only">Eliminar filtro</span>
                    </Button>
                  </Badge>
                ))}
            </div>
          )}
          </div>

          {filteredInterventions.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No se encontraron intervenciones</h3>
              <p className="text-gray-500 mb-4">
                {activeFilters.length > 0 
                  ? "Prueba a modificar los filtros de búsqueda o eliminar alguno" 
                  : "Crea una nueva intervención para comenzar"}
              </p>
              {activeFilters.length > 0 ? (
                <Button variant="outline" onClick={clearAllFilters}>
                  Limpiar filtros
                </Button>
              ) : (
                <div className="flex justify-center flex-wrap gap-2">
                  <Button asChild>
                    <Link to="/intervenciones/nueva">
                      <Plus size={16} className="mr-2" /> Nueva Intervención
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/intervenciones/asistente">
                      <ClipboardList size={16} className="mr-2" /> Usar Asistente
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInterventions.length > 0 && (
                <p className="text-sm text-gray-500 mb-2">
                  Mostrando {filteredInterventions.length} {filteredInterventions.length === 1 ? 'intervención' : 'intervenciones'} de {interventions.length} totales
                </p>
              )}
              {filteredInterventions.map((intervention) => (
                <div
                  key={intervention.id}
                  className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
                      <div className="flex items-center gap-2 mb-2 sm:mb-0">
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-gray-500" />
                          <span className="text-xs">{formatDate(intervention.date)}</span>
                        </Badge>
                        
                        {intervention.student.grade && (
                          <Badge variant="outline" className="bg-gray-50 text-gray-700">
                            <span className="text-xs">{intervention.student.grade}</span>
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpand(intervention.id)}
                          className="h-8 px-2"
                        >
                          {expandedInterventions[intervention.id] ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )}
                          <span className="sr-only sm:not-sr-only sm:ml-1">
                            {expandedInterventions[intervention.id] ? "Colapsar" : "Detalles"}
                          </span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleComments(intervention.id)}
                          className="h-8 px-2"
                        >
                          <MessageSquare size={16} />
                          <span className="sr-only sm:not-sr-only sm:ml-1">Comentarios</span>
                        </Button>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex items-start gap-2">
                        <div className="bg-primary/10 rounded-full p-1.5 flex-shrink-0 mt-0.5">
                          <User size={18} className="text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">{intervention.student.name}</h3>
                          <p className="text-sm text-gray-600 flex items-center mt-0.5">
                            <User size={14} className="mr-1 text-gray-400" />
                            {intervention.teacherName}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mb-3 bg-gray-50 p-2 rounded-md">
                      <div className="flex items-start gap-2">
                        <div className="bg-primary/10 rounded-full p-1 flex-shrink-0 mt-0.5">
                          <BookOpen size={16} className="text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-gray-800 font-medium">{intervention.activityName}</p>
                              {intervention.subjectName && (
                                <div className="mt-1">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    <BookOpen size={10} className="mr-1" />
                                    {intervention.subjectName}
                                  </span>
                                </div>
                              )}
                            </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                                  className="h-6 w-6 p-0 rounded-full hover:bg-gray-100"
                              onClick={(e) => e.stopPropagation()}
                            >
                                  <Eye size={14} className="text-primary" />
                                  <span className="sr-only">Ver detalles</span>
                            </Button>
                          </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="text-xl flex items-center gap-2 text-primary">
                                <Info className="h-5 w-5" />
                                Detalles de la Actividad
                              </DialogTitle>
                              <DialogDescription>
                                Información completa de la actividad: {intervention.activityName}
                              </DialogDescription>
                            </DialogHeader>
                            <ActivityDetailContent activityId={intervention.activity} />
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline">Cerrar</Button>
                              </DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {intervention.barriers.map((barrierId) => (
                        <span
                          key={barrierId}
                          className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs"
                        >
                          {getBarrierName(barrierId)}
                        </span>
                      ))}
                      {intervention.learningStyles.map((styleId) => (
                        <span
                          key={styleId}
                          className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs"
                        >
                          {getStyleName(styleId)}
                        </span>
                      ))}
                    </div>

                    {expandedInterventions[intervention.id] && (
                      <div className="mt-3 border-t pt-3 animate-fadeIn">
                        <div className="mb-3">
                          <h4 className="font-medium text-gray-900">Observaciones:</h4>
                          <p className="text-gray-700 whitespace-pre-wrap text-sm">
                            {intervention.observations || "No hay observaciones registradas."}
                          </p>
                        </div>

                        {intervention.barriers.length > 0 && (
                          <div className="mb-3">
                            <h4 className="font-medium text-gray-900 text-sm">Barreras:</h4>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {intervention.barriers.map((barrierId) => (
                                <span
                                  key={barrierId}
                                  className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs"
                                >
                                  {getBarrierName(barrierId)}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {intervention.subjectName && (
                          <div className="mb-3">
                            <h4 className="font-medium text-gray-900 text-sm">Área Académica:</h4>
                            <div className="mt-1">
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                <BookOpen size={12} className="mr-1" />
                                {intervention.subjectName}
                              </span>
                            </div>
                          </div>
                        )}

                        {intervention.learningStyles.length > 0 && (
                          <div className="mb-3">
                            <h4 className="font-medium text-gray-900 text-sm">Estilos de aprendizaje:</h4>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {intervention.learningStyles.map((styleId) => (
                                <span
                                  key={styleId}
                                  className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs"
                                >
                                  {getStyleName(styleId)}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-end">
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
                      <div className="mt-3 border-t pt-3 animate-fadeIn">
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

// Componente para obtener y mostrar detalles de la actividad
const ActivityDetailContent = ({ activityId }: { activityId: string }) => {
  const [activity, setActivity] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchActivityDetails = async () => {
      setIsLoading(true);
      try {
        // Obtener la actividad
        const { data: activityData, error: activityError } = await supabase
          .from('activities')
          .select('*')
          .eq('id', activityId)
          .single();
        
        if (activityError) throw activityError;

        // Obtener barreras relacionadas
        const { data: barriersData, error: barriersError } = await supabase
          .from('activity_barriers')
          .select('barriers(id, name)')
          .eq('activity_id', activityId);
        
        if (barriersError) throw barriersError;

        // Obtener estilos de aprendizaje relacionados
        const { data: stylesData, error: stylesError } = await supabase
          .from('activity_learning_styles')
          .select('learning_styles(id, name)')
          .eq('activity_id', activityId);
        
        if (stylesError) throw stylesError;

        // Procesar los datos
        let development = activityData.development;
        if (typeof development === 'string') {
          try {
            development = JSON.parse(development);
          } catch (e) {
            console.error('Error parsing development JSON', e);
            development = { description: '', steps: [] };
          }
        }

        let materials = activityData.materials;
        if (typeof materials === 'string') {
          try {
            materials = JSON.parse(materials);
          } catch (e) {
            console.error('Error parsing materials JSON', e);
            materials = [];
          }
        }

        // Crear objeto de actividad completo
        const fullActivity = {
          ...activityData,
          development,
          materials,
          barriers: barriersData.map((b: any) => b.barriers),
          learningStyles: stylesData.map((s: any) => s.learning_styles)
        };

        setActivity(fullActivity);
      } catch (error) {
        console.error('Error al cargar detalles de actividad:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los detalles de la actividad",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivityDetails();
  }, [activityId, toast]);

  if (isLoading) {
    return (
      <div className="py-8 flex justify-center items-center">
        <Loader2 className="h-6 w-6 text-primary animate-spin mr-2" />
        <span>Cargando detalles...</span>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="py-4 text-center text-gray-500">
        No se encontraron detalles para esta actividad.
      </div>
    );
  }

  return (
    <div className="space-y-4 my-2 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
      <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
        <h3 className="font-semibold text-primary mb-2 flex items-center gap-2">
          <span className="bg-primary text-white p-1 rounded-full w-6 h-6 flex items-center justify-center text-xs">1</span>
          Objetivo
        </h3>
        <p className="text-gray-700">{activity.objective}</p>
      </div>
      
      <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
        <h3 className="font-semibold text-primary mb-2 flex items-center gap-2">
          <span className="bg-primary text-white p-1 rounded-full w-6 h-6 flex items-center justify-center text-xs">2</span>
          Materiales
        </h3>
        {activity.materials && activity.materials.length > 0 ? (
          <ul className="list-disc pl-5 space-y-1 text-gray-700">
            {activity.materials.map((material: string, idx: number) => (
              <li key={idx}>{material}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 italic">No se especificaron materiales</p>
        )}
      </div>
      
      <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
        <h3 className="font-semibold text-primary mb-2 flex items-center gap-2">
          <span className="bg-primary text-white p-1 rounded-full w-6 h-6 flex items-center justify-center text-xs">3</span>
          Desarrollo
        </h3>
        {activity.development?.description && (
          <p className="mb-2 text-gray-700">{activity.development.description}</p>
        )}
        {activity.development?.steps && activity.development.steps.length > 0 ? (
          <ol className="space-y-3 pl-5 list-decimal">
            {activity.development.steps.map((step: any, idx: number) => (
              <li key={step.id || idx} className="text-gray-700">
                <p>{step.description}</p>
                {step.durationMin && step.durationMax && (
                  <p className="text-sm text-gray-500 mt-1 italic">
                    Duración estimada: {step.durationMin}-{step.durationMax} {step.durationUnit || 'minutos'}
                  </p>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-gray-500 italic">No se especificaron pasos de desarrollo</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        <h3 className="font-semibold text-gray-700 w-full mb-1">Barreras que atiende:</h3>
        {activity.barriers && activity.barriers.length > 0 ? (
          activity.barriers.map((barrier: any) => (
            <span key={barrier.id} className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
              {barrier.name}
            </span>
          ))
        ) : (
          <span className="text-gray-500 italic">No especificadas</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mt-2">
        <h3 className="font-semibold text-gray-700 w-full mb-1">Estilos de aprendizaje:</h3>
        {activity.learningStyles && activity.learningStyles.length > 0 ? (
          activity.learningStyles.map((style: any) => (
            <span key={style.id} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {style.name}
            </span>
          ))
        ) : (
          <span className="text-gray-500 italic">No especificados</span>
        )}
      </div>
    </div>
  );
};

export default Interventions;
