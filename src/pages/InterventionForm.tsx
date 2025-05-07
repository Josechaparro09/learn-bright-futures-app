import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  interventions,
  activities,
  barriers,
  learningStyles,
  Intervention,
} from "@/data/sampleData";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Search, Plus, User, X, Calendar } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "@radix-ui/react-icons";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

// Definir la estructura de la tabla interventions en Supabase
interface SupabaseIntervention {
  id: string;
  activity_id: string;
  teacher_id: string;
  student_id: string;
  observations?: string;
  date?: string;
  created_at?: string;
  updated_at?: string;
}

// Estructura para estudiante
interface Student {
  id: string;
  name: string;
  grade: string;
  created_by?: string;
  created_at?: string;
}

// Definir estado para el formulario
interface StudentFormState {
  mode: 'create' | 'select';
  searchTerm: string;
  selectedStudent: Student | null;
  searchResults: Student[];
  isSearching: boolean;
}

const InterventionForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth(); // Obtener el usuario actual de la autenticación

  // Obtener datos del estado de navegación
  const interventionData = location.state;

  // Parsear parámetros de búsqueda si vienen del asistente
  const params = new URLSearchParams(location.search);
  const activityIdFromURL = params.get("activity") || interventionData?.activityId || "";
  const barrierIdFromURL = params.get("barrier") || interventionData?.barrierId || "";
  const stylesFromURL = params.get("styles")?.split(",") || 
                        (interventionData?.learningStyles?.map((style: any) => style.id) || []);

  // Estado de la intervención
  const [intervention, setIntervention] = useState<Intervention>({
    id: isEditing && id ? id : uuidv4(),
    teacherName: user?.id || "", // Usar el ID del usuario autenticado
    student: {
      id: uuidv4(),
      name: "",
      grade: "",
    },
    activity: activityIdFromURL,
    barriers: barrierIdFromURL ? [barrierIdFromURL] : [],
    learningStyles: stylesFromURL,
    date: new Date(),
    observations: "",
  });

  // Estado para mostrar detalles de la actividad
  const [activityDetails, setActivityDetails] = useState({
    name: interventionData?.activityName || "",
    objective: interventionData?.activityDetails?.objective || "",
    materials: interventionData?.activityDetails?.materials || [],
    development: interventionData?.activityDetails?.development || { description: "", steps: [] }
  });

  // Estado adicional para mostrar el nombre del profesor (solo para mostrar)
  const [teacherName, setTeacherName] = useState("");
  
  // Estado para la selección de estudiantes
  const [studentForm, setStudentForm] = useState<StudentFormState>({
    mode: 'create',
    searchTerm: "",
    selectedStudent: null,
    searchResults: [],
    isSearching: false
  });

  // Estado para el selector de fecha
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Cargar datos del usuario
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', user.id)
            .single();
            
          if (error) throw error;
          if (data) {
            setTeacherName(data.name || user.email || "");
          }
        } catch (error) {
          console.error("Error al obtener perfil del usuario:", error);
          setTeacherName(user.email || "");
        }
      }
    };
    
    fetchUserProfile();
  }, [user]);

  // Función para buscar estudiantes
  const searchStudents = async (searchTerm: string) => {
    setStudentForm(prev => ({...prev, isSearching: true}));
    
    try {
      // Si no hay término de búsqueda, mostramos todos los estudiantes (limitados)
      const query = supabase
        .from('students')
        .select('*')
        .order('name', { ascending: true });
      
      // Si hay término de búsqueda, filtramos por nombre
      if (searchTerm && searchTerm.trim().length >= 2) {
        query.ilike('name', `%${searchTerm}%`);
      }
      
      // Limitamos la cantidad de resultados
      const { data, error } = await query.limit(20);
      
      if (error) throw error;
      
      setStudentForm(prev => ({
        ...prev, 
        searchResults: data || [],
        isSearching: false
      }));
    } catch (error) {
      console.error("Error al buscar estudiantes:", error);
      setStudentForm(prev => ({...prev, isSearching: false, searchResults: []}));
    }
  };

  // Efectuar la búsqueda cuando cambia el término de búsqueda
  useEffect(() => {
    if (studentForm.mode === 'select') {
    const timer = setTimeout(() => {
        searchStudents(studentForm.searchTerm);
      }, 300); // Reducimos el debounce a 300ms para mayor respuesta

    return () => clearTimeout(timer);
    }
  }, [studentForm.searchTerm, studentForm.mode]);

  // Cargar lista inicial de estudiantes al cambiar a modo selección
  useEffect(() => {
    if (studentForm.mode === 'select') {
      searchStudents('');
    }
  }, [studentForm.mode]);

  // Seleccionar un estudiante existente
  const handleSelectStudent = (student: Student) => {
    setStudentForm(prev => ({
      ...prev,
      selectedStudent: student,
      searchTerm: "",
      searchResults: []
    }));
    
    setIntervention(prev => ({
      ...prev,
      student: {
        id: student.id,
        name: student.name,
        grade: student.grade
      }
    }));
  };

  // Borrar la selección de estudiante
  const clearStudentSelection = () => {
    setStudentForm(prev => ({
      ...prev,
      selectedStudent: null,
      searchTerm: ""
    }));
    
    setIntervention(prev => ({
      ...prev,
      student: {
        id: uuidv4(),
        name: "",
        grade: ""
      }
    }));
  };

  // Cambiar el modo del formulario (crear o seleccionar)
  const switchStudentFormMode = (mode: 'create' | 'select') => {
    setStudentForm(prev => ({
      ...prev,
      mode,
      selectedStudent: null,
      searchTerm: "",
      searchResults: []
    }));

    if (mode === 'create') {
      setIntervention(prev => ({
        ...prev,
        student: {
          id: uuidv4(),
          name: "",
          grade: ""
        }
      }));
    }
  };

  // Actualizar el ID del profesor cuando cambie el usuario
  useEffect(() => {
    if (user?.id) {
      setIntervention(prev => ({
        ...prev,
        teacherName: user.id
      }));
    }
  }, [user]);

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      // Si estamos editando, cargar la intervención existente
      if (isEditing && id) {
        try {
          // Obtener datos básicos de la intervención
          const { data: interventionData, error: interventionError } = await supabase
            .from('interventions')
            .select('*')
            .eq('id', id)
            .single();
          
          if (interventionError) throw interventionError;

          // Obtener las barreras asociadas
          const { data: barrierData, error: barrierError } = await supabase
            .from('intervention_barriers')
            .select('barrier_id')
            .eq('intervention_id', id);
          
          if (barrierError) throw barrierError;

          // Obtener los estilos de aprendizaje asociados
          const { data: styleData, error: styleError } = await supabase
            .from('intervention_learning_styles')
            .select('learning_style_id')
            .eq('intervention_id', id);
          
          if (styleError) throw styleError;

          // Obtener datos del estudiante
          const { data: studentData, error: studentError } = await supabase
            .from('students')
            .select('*')
            .eq('id', interventionData.student_id)
            .single();
          
          if (studentError && studentError.code !== 'PGRST116') {
            throw studentError;
          }

          if (interventionData) {
            // Formatear datos para el estado
            setIntervention({
              id: interventionData.id,
              teacherName: interventionData.teacher_id || user?.id || "",
              student: {
                id: interventionData.student_id,
                name: studentData?.name || "",
                grade: studentData?.grade || "",
              },
              activity: interventionData.activity_id,
              barriers: barrierData?.map(b => b.barrier_id) || [],
              learningStyles: styleData?.map(s => s.learning_style_id) || [],
              date: interventionData.date ? new Date(interventionData.date) : new Date(),
              observations: interventionData.observations || "",
            });
          }
        } catch (error) {
          console.error("Error fetching intervention:", error);
          toast({
            title: "Error",
            description: "No se pudo cargar la intervención",
            variant: "destructive",
          });
        }
      }

      // Cargar detalles de la actividad seleccionada
      if (activityIdFromURL) {
        try {
          const { data: activityData, error: activityError } = await supabase
            .from('activities')
            .select('*')
            .eq('id', activityIdFromURL)
            .single();
          
          if (activityError) throw activityError;
          
          if (activityData) {
            // Procesar materiales
            let materials: string[] = [];
            try {
              if (Array.isArray(activityData.materials)) {
                materials = activityData.materials.map(m => String(m));
              } else if (typeof activityData.materials === 'object') {
                materials = Array.isArray(activityData.materials) ? 
                  activityData.materials.map(m => String(m)) : [];
              } else if (typeof activityData.materials === 'string') {
                const parsedMaterials = JSON.parse(activityData.materials);
                materials = Array.isArray(parsedMaterials) ? 
                  parsedMaterials.map(m => String(m)) : [];
              }
            } catch (e) {
              console.error('Error parsing materials:', e);
            }

            // Procesar desarrollo
            let development = { description: "", steps: [] };
            try {
              if (typeof activityData.development === 'object' && activityData.development !== null) {
                const devObj = activityData.development;
                development = {
                  description: typeof devObj.description === 'string' ? devObj.description : "",
                  steps: Array.isArray(devObj.steps) ? devObj.steps : []
                };
              } else if (typeof activityData.development === 'string') {
                const parsedDevelopment = JSON.parse(activityData.development);
                development = {
                  description: parsedDevelopment.description || "",
                  steps: Array.isArray(parsedDevelopment.steps) ? parsedDevelopment.steps : []
                };
              }
            } catch (e) {
              console.error('Error processing development data:', e);
            }

            setActivityDetails({
              name: activityData.name || "",
              objective: activityData.objective || "",
              materials,
              development
            });
          }
        } catch (error) {
          console.error("Error fetching activity:", error);
        }
      } else if (interventionData?.activityName) {
        // Si no hay ID de actividad pero tenemos datos del asistente
        setActivityDetails({
          name: interventionData.activityName,
          objective: interventionData.activityDetails?.objective || "",
          materials: interventionData.activityDetails?.materials || [],
          development: interventionData.activityDetails?.development || { description: "", steps: [] }
        });
      }
    };

    fetchData();
  }, [id, isEditing, activityIdFromURL, interventionData, user]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name.startsWith("student.")) {
      const studentField = name.split(".")[1];
      setIntervention({
        ...intervention,
        student: {
          ...intervention.student,
          [studentField]: value,
        },
      });
    } else if (name === "date") {
      // Manejar la fecha si viene como string
      try {
        const newDate = value ? new Date(value) : new Date();
        setIntervention({
          ...intervention,
          date: newDate
        });
      } catch (e) {
        console.error("Error parsing date:", e);
      }
    } else {
      setIntervention({
        ...intervention,
        [name]: value,
      });
    }
  };

  // Manejar cambio de fecha con el calendario
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setIntervention({
        ...intervention,
        date
      });
    }
    setIsDatePickerOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validar que el usuario esté autenticado
    if (!user) {
      toast({
        title: "Error de autenticación",
        description: "Debe iniciar sesión para crear una intervención",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // Validar que los campos estén completos
    if (!intervention.student.name || !intervention.activity) {
      console.log("Validación fallida:", {
        studentName: intervention.student.name,
        activity: intervention.activity
      });
      toast({
        title: "Error en el formulario",
        description: "Por favor complete todos los campos obligatorios",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. Verificar si el estudiante existe o crear uno nuevo
      let studentId = intervention.student.id;
      
      // Si no es un UUID válido, creamos un nuevo estudiante
      if (!isEditing || !studentId || studentId.length < 32) {
        // Crear estudiante
        const newStudentId = uuidv4();
        const { error: studentError } = await supabase
          .from('students')
          .insert({
            id: newStudentId,
            name: intervention.student.name,
            grade: intervention.student.grade,
            created_by: user.id // ID real del usuario
          });
          
        if (studentError) throw studentError;
        studentId = newStudentId;
      }

      // 2. Preparar objeto para guardar en la tabla interventions
      const interventionData: SupabaseIntervention = {
        id: intervention.id,
        teacher_id: user.id, // ID real del usuario autenticado
        student_id: studentId,
        activity_id: intervention.activity,
        observations: intervention.observations,
        date: intervention.date.toISOString().split('T')[0], // Solo la fecha en formato YYYY-MM-DD
        created_at: isEditing ? undefined : new Date().toISOString()
      };

      console.log("Enviando datos a Supabase:", interventionData);

      // 3. Guardar intervención
      let result;
      if (isEditing) {
        // Actualizar intervención existente
        result = await supabase
          .from('interventions')
          .update(interventionData)
          .eq('id', intervention.id);
      } else {
        // Crear nueva intervención
        result = await supabase
          .from('interventions')
          .insert(interventionData);
      }

      if (result.error) {
        console.error("Error de Supabase al guardar intervención:", result.error);
        throw result.error;
      }

      // 4. Si es una edición, eliminar las relaciones existentes
      if (isEditing) {
        // Eliminar barreras
        await supabase
          .from('intervention_barriers')
          .delete()
          .eq('intervention_id', intervention.id);
          
        // Eliminar estilos de aprendizaje
        await supabase
          .from('intervention_learning_styles')
          .delete()
          .eq('intervention_id', intervention.id);
      }

      // 5. Guardar barreras
      for (const barrierId of intervention.barriers) {
        const { error: barrierError } = await supabase
          .from('intervention_barriers')
          .insert({
            intervention_id: intervention.id,
            barrier_id: barrierId
          });
          
        if (barrierError) {
          console.error("Error al guardar barrera:", barrierError);
        }
      }

      // 6. Guardar estilos de aprendizaje
      for (const styleId of intervention.learningStyles) {
        const { error: styleError } = await supabase
          .from('intervention_learning_styles')
          .insert({
            intervention_id: intervention.id,
            learning_style_id: styleId
          });
          
        if (styleError) {
          console.error("Error al guardar estilo de aprendizaje:", styleError);
        }
      }

      toast({
        title: isEditing ? "Intervención actualizada" : "Intervención creada",
        description: `La intervención para ${intervention.student.name} ha sido ${
          isEditing ? "actualizada" : "creada"
        } con éxito`,
      });

      navigate("/intervenciones");
    } catch (error) {
      console.error("Error saving intervention:", error);
      toast({
        title: "Error",
        description: `No se pudo ${isEditing ? "actualizar" : "crear"} la intervención`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? "Editar Intervención" : "Nueva Intervención"}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {isEditing ? "Modifica los detalles" : "Completa la información"}
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate("/intervenciones")}
            className="gap-1 text-sm h-9"
          >
            <X size={14} /> Cancelar
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Detalles de la actividad seleccionada - Simplificado */}
          {activityDetails.name && (
            <div className="p-4 border rounded-lg bg-white shadow-sm">
              <h3 className="font-medium text-primary mb-2 flex items-center gap-1">
                <span className="bg-primary/10 p-1 rounded text-xs text-primary">Actividad</span>
                {activityDetails.name}
              </h3>
              <p className="text-sm text-gray-700">{activityDetails.objective}</p>
            </div>
          )}

          {/* Formulario de intervención */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-white border rounded-lg shadow-sm divide-y">
              {/* Sección: Profesor */}
              <div className="p-4">
                <div className="flex items-center mb-2">
                  <User size={16} className="text-primary mr-2" />
                  <h3 className="font-medium text-gray-700">Profesor/a</h3>
                </div>
                <p className="text-sm">{teacherName || user?.email || "Usuario actual"}</p>
              </div>

              {/* Sección: Fecha */}
              <div className="p-4">
                <Label htmlFor="date" className="mb-1.5 block text-sm font-medium">Fecha</Label>
                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal text-sm h-9"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {intervention.date ? (
                        format(intervention.date, "PP", {locale: es})
                      ) : (
                        <span>Seleccionar fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={intervention.date}
                      onSelect={handleDateChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Sección: Estudiante */}
              <div className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-gray-700">Estudiante</h3>
                  <Tabs value={studentForm.mode} onValueChange={(value) => switchStudentFormMode(value as 'create' | 'select')} className="w-auto">
                    <TabsList className="grid grid-cols-2 h-8">
                      <TabsTrigger value="create" className="text-xs px-2">Nuevo</TabsTrigger>
                      <TabsTrigger value="select" className="text-xs px-2">Buscar</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                
                {studentForm.mode === 'create' ? (
                  <div className="space-y-3">
                    <div>
                      <Input
                        id="student.name"
                        name="student.name"
                        value={intervention.student.name}
                        onChange={handleInputChange}
                        placeholder="Nombre del estudiante"
                        required
                        className="text-sm h-9"
                      />
                    </div>
                    <div>
                      <Input
                        id="student.grade"
                        name="student.grade"
                        value={intervention.student.grade}
                        onChange={handleInputChange}
                        placeholder="Grado/Curso"
                        required
                        className="text-sm h-9"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    {studentForm.selectedStudent ? (
                      <div className="flex items-center justify-between bg-primary/5 rounded-md p-2 text-sm">
                        <div>
                          <p className="font-medium">{studentForm.selectedStudent.name}</p>
                          <p className="text-xs text-gray-600">{studentForm.selectedStudent.grade}</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={clearStudentSelection}
                          className="h-7 w-7 p-0 rounded-full"
                        >
                          <X size={14} />
                          <span className="sr-only">Borrar selección</span>
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center border rounded-md px-2 py-1.5 focus-within:ring-1 focus-within:ring-primary mb-2">
                          <Search className="h-3.5 w-3.5 text-gray-400 mr-2 flex-shrink-0" />
                          <input
                            type="text"
                            placeholder="Buscar estudiante..."
                            className="flex-1 outline-none text-sm"
                            value={studentForm.searchTerm}
                            onChange={(e) => setStudentForm(prev => ({...prev, searchTerm: e.target.value}))}
                          />
                          {studentForm.isSearching && (
                            <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full"></div>
                          )}
                        </div>
                        
                        {studentForm.searchResults.length > 0 ? (
                          <div className="border rounded-md max-h-40 overflow-y-auto">
                            <ul className="divide-y text-sm">
                            {studentForm.searchResults.map(student => (
                              <li 
                                key={student.id}
                                  className="p-2 cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => handleSelectStudent(student)}
                              >
                                <p className="font-medium">{student.name}</p>
                                <p className="text-xs text-gray-600">{student.grade}</p>
                              </li>
                            ))}
                          </ul>
                          </div>
                        ) : (
                          <div className="text-center py-3 text-sm text-gray-500 bg-gray-50 rounded-md">
                            {studentForm.searchTerm && !studentForm.isSearching ? (
                              "No se encontraron estudiantes"
                            ) : (
                              studentForm.isSearching ? "Buscando..." : "Selecciona un estudiante"
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sección: Observaciones */}
              <div className="p-4">
                <Label htmlFor="observations" className="mb-1.5 block text-sm font-medium">Observaciones</Label>
                <Textarea
                  id="observations"
                  name="observations"
                  value={intervention.observations}
                  onChange={handleInputChange}
                  placeholder="Observaciones o notas específicas..."
                  rows={3}
                  className="resize-none text-sm min-h-[80px]"
                />
              </div>
            </div>

            {/* Botón de envío */}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </span>
              ) : (
                <>{isEditing ? "Actualizar" : "Crear"} Intervención</>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InterventionForm;
