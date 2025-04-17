
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

const InterventionForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEditing = Boolean(id);

  // Parsear parámetros de búsqueda si vienen de la URL
  const params = new URLSearchParams(location.search);
  const activityIdFromURL = params.get("activity");
  const barrierIdFromURL = params.get("barrier");
  const stylesFromURL = params.get("styles")?.split(",") || [];

  // Estado de la intervención
  const [intervention, setIntervention] = useState<Intervention>({
    id: isEditing && id ? id : uuidv4(),
    teacherName: "",
    student: {
      id: uuidv4(),
      name: "",
      grade: "",
    },
    activity: activityIdFromURL || "",
    barriers: barrierIdFromURL ? [barrierIdFromURL] : [],
    learningStyles: stylesFromURL,
    date: new Date(),
    observations: "",
  });

  // Cargar datos si estamos editando
  useEffect(() => {
    if (isEditing && id) {
      const existingIntervention = interventions.find((i) => i.id === id);
      if (existingIntervention) {
        setIntervention(existingIntervention);
      } else {
        toast({
          title: "Error",
          description: "Intervención no encontrada",
          variant: "destructive",
        });
        navigate("/intervenciones");
      }
    }
  }, [isEditing, id, navigate]);

  // Obtener actividad seleccionada
  const selectedActivity = activities.find(
    (act) => act.id === intervention.activity
  );

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validación básica
    if (!intervention.teacherName || !intervention.student.name || !intervention.activity) {
      toast({
        title: "Error en el formulario",
        description: "Por favor complete todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    // Aquí iría la lógica para guardar en la base de datos
    toast({
      title: isEditing ? "Intervención actualizada" : "Intervención creada",
      description: `La intervención para ${intervention.student.name} ha sido ${
        isEditing ? "actualizada" : "creada"
      } con éxito`,
    });

    navigate("/intervenciones");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isEditing ? "Editar" : "Nueva"} Intervención Educativa
          </h1>
          <p className="text-gray-600">
            Complete los datos para {isEditing ? "actualizar la" : "crear una nueva"} intervención
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
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
                    <Input
                      id="teacherName"
                      name="teacherName"
                      value={intervention.teacherName}
                      onChange={handleInputChange}
                      placeholder="Ej. Juan Pérez"
                      required
                    />
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

            {/* Actividad seleccionada */}
            <div className="bg-gray-50 p-4 rounded-md border">
              <h2 className="text-xl font-semibold mb-2">Actividad seleccionada</h2>
              
              {selectedActivity ? (
                <div>
                  <p className="font-medium text-lg">{selectedActivity.name}</p>
                  <p className="text-gray-600 mb-2">{selectedActivity.objective}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {intervention.barriers.map((barrierId) => {
                      const barrier = barriers.find((b) => b.id === barrierId);
                      return (
                        <span
                          key={barrierId}
                          className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm"
                        >
                          {barrier?.name || "Barrera desconocida"}
                        </span>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-2">
                    {intervention.learningStyles.map((styleId) => {
                      const style = learningStyles.find((s) => s.id === styleId);
                      return (
                        <span
                          key={styleId}
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                        >
                          {style?.name || "Estilo desconocido"}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">No se ha seleccionado ninguna actividad</div>
              )}
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
              >
                Cancelar
              </Button>
              <Button type="submit">
                {isEditing ? "Actualizar" : "Crear"} Intervención
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InterventionForm;
