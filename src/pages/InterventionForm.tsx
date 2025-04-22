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

  useEffect(() => {
    // Actualizar el ID del profesor cuando cambie el usuario
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
    } else {
      setIntervention({
        ...intervention,
        [name]: value,
      });
    }
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
      
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6">
            {isEditing ? "Editar Intervención" : "Nueva Intervención"}
          </h1>

          {/* Detalles de la actividad seleccionada */}
          {activityDetails.name && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <h2 className="text-lg font-semibold mb-2">Actividad Seleccionada</h2>
              <p className="font-medium">{activityDetails.name}</p>
              <p className="text-gray-600 mt-2">{activityDetails.objective}</p>
              
              {activityDetails.materials.length > 0 && (
                <div className="mt-2">
                  <h3 className="font-medium">Materiales:</h3>
                  <ul className="list-disc list-inside text-gray-600">
                    {activityDetails.materials.map((material, index) => (
                      <li key={index}>{material}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Formulario de intervención */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Datos del profesor */}
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  Datos del profesor
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="teacherName">Nombre del profesor</Label>
                    <div className="p-2 bg-gray-100 border rounded-md text-gray-800">
                      {teacherName || user?.email || "Usuario actual"}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Se usará tu cuenta actual para esta intervención
                    </p>
                  </div>
                </div>
              </div>

              {/* Datos del estudiante */}
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  Datos del estudiante
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="student.name">Nombre del estudiante</Label>
                    <Input
                      id="student.name"
                      name="student.name"
                      value={intervention.student.name}
                      onChange={handleInputChange}
                      placeholder="Ej. Ana López"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="student.grade">Grado/Curso</Label>
                    <Input
                      id="student.grade"
                      name="student.grade"
                      value={intervention.student.grade}
                      onChange={handleInputChange}
                      placeholder="Ej. 3° Básico"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Observaciones */}
            <div>
              <Label htmlFor="observations">Observaciones</Label>
              <Textarea
                id="observations"
                name="observations"
                value={intervention.observations}
                onChange={handleInputChange}
                placeholder="Agregue observaciones, recomendaciones o notas específicas para esta intervención..."
                rows={5}
                className="resize-none"
              />
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/intervenciones")}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Procesando...
                  </span>
                ) : (
                  <>{isEditing ? "Actualizar" : "Crear"} Intervención</>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InterventionForm;
