import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { 
  ChevronDown, ChevronUp, Clock, Plus, Search, 
  Filter, ClipboardList, Loader2, X, BookOpen 
} from "lucide-react";
import { Activity } from "@/data/sampleData";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ActivityFromDB {
  id: string;
  name: string;
  objective: string;
  materials: string | string[];
  development: string | {
    description: string;
    steps: Array<{
      id: string;
      description: string;
      durationMin: number;
      durationMax: number;
      durationUnit: string;
    }>;
  };
}

interface Barrier {
  id: string;
  name: string;
}

interface LearningStyle {
  id: string;
  name: string;
}

const Activities = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [barriers, setBarriers] = useState<Barrier[]>([]);
  const [learningStyles, setLearningStyles] = useState<LearningStyle[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<{type: string, id: string, name: string}[]>([]);
  const [expandedActivities, setExpandedActivities] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Cargar datos desde Supabase
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Obtener barreras
        const { data: barriersData, error: barriersError } = await supabase
          .from('barriers')
          .select('*');
        
        if (barriersError) throw barriersError;
        setBarriers(barriersData);

        // Obtener estilos de aprendizaje
        const { data: stylesData, error: stylesError } = await supabase
          .from('learning_styles')
          .select('*');
        
        if (stylesError) throw stylesError;
        setLearningStyles(stylesData);

        // Obtener actividades
        const { data: activitiesData, error: activitiesError } = await supabase
          .from('activities')
          .select('*');

        if (activitiesError) throw activitiesError;

        // Para cada actividad, obtener sus barreras y estilos
        const activitiesWithRelations = await Promise.all(
          activitiesData.map(async (activity: ActivityFromDB) => {
            // Obtener barreras de la actividad
            const { data: activityBarriers, error: barriersError } = await supabase
              .from('activity_barriers')
              .select('barrier_id')
              .eq('activity_id', activity.id);

            if (barriersError) throw barriersError;

            // Obtener estilos de aprendizaje de la actividad
            const { data: activityStyles, error: stylesError } = await supabase
              .from('activity_learning_styles')
              .select('learning_style_id')
              .eq('activity_id', activity.id);

            if (stylesError) throw stylesError;

            // Convertir materiales de JSON a array si es necesario
            let materials: string[] = [];
            if (Array.isArray(activity.materials)) {
              materials = activity.materials;
            } else if (typeof activity.materials === 'string') {
              try {
                const parsedMaterials = JSON.parse(activity.materials);
                materials = Array.isArray(parsedMaterials) ? parsedMaterials : [];
              } catch (e) {
                console.error('Error parsing materials JSON', e);
                materials = [];
              }
            }

            // Convertir development de JSON a objeto si es necesario
            let development = {
              description: '',
              steps: []
            };
            if (typeof activity.development === 'object') {
              development = activity.development as typeof development;
            } else if (typeof activity.development === 'string') {
              try {
                const parsedDevelopment = JSON.parse(activity.development);
                development = {
                  description: parsedDevelopment.description || '',
                  steps: Array.isArray(parsedDevelopment.steps) ? parsedDevelopment.steps : []
                };
              } catch (e) {
                console.error('Error parsing development JSON', e);
              }
            }

            return {
              ...activity,
              materials,
              development,
              barriers: activityBarriers.map(ab => ab.barrier_id),
              learningStyles: activityStyles.map(als => als.learning_style_id)
            };
          })
        );

        setActivities(activitiesWithRelations);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const toggleExpand = (id: string) => {
    setExpandedActivities({
      ...expandedActivities,
      [id]: !expandedActivities[id],
    });
  };

  const addFilter = (type: 'barrier' | 'style', id: string, name: string) => {
    // Evitar duplicados
    if (!activeFilters.some(f => f.id === id)) {
      setActiveFilters([...activeFilters, { 
        type,
        id, 
        name
      }]);
    }
  };

  const removeFilter = (id: string) => {
    setActiveFilters(activeFilters.filter(filter => filter.id !== id));
  };

  const clearFilters = () => {
    setActiveFilters([]);
    setSearchTerm("");
  };

  const filteredActivities = activities.filter((activity) => {
    // Filtro de búsqueda por texto
    const matchesSearch =
      searchTerm === "" ||
      activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.objective.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro por barreras
    const barrierFilters = activeFilters.filter(f => f.type === 'barrier');
    const matchesBarriers =
      barrierFilters.length === 0 || 
      barrierFilters.some(filter => activity.barriers.includes(filter.id));

    // Filtro por estilos
    const styleFilters = activeFilters.filter(f => f.type === 'style');
    const matchesStyles =
      styleFilters.length === 0 || 
      styleFilters.some(filter => activity.learningStyles.includes(filter.id));

    return matchesSearch && matchesBarriers && matchesStyles;
  });

  // Función para obtener nombre de barrera por ID
  const getBarrierName = (id: string): string => {
    const barrier = barriers.find(b => b.id === id);
    return barrier ? barrier.name : "Desconocido";
  };

  // Función para obtener nombre de estilo por ID
  const getStyleName = (id: string): string => {
    const style = learningStyles.find(s => s.id === id);
    return style ? style.name : "Desconocido";
  };

  // Asignamos un color diferente a cada estilo
  const styleColors = {
    "Visual": "bg-blue-100 text-blue-800",
    "Auditivo": "bg-purple-100 text-purple-800",
    "Kinestésico": "bg-green-100 text-green-800",
    "Lector/Escritor": "bg-amber-100 text-amber-800"
  };

  const getStyleColor = (styleName: string) => {
    // @ts-ignore
    return styleColors[styleName] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex-grow flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-gray-600">Cargando actividades...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Actividades Educativas</h1>
            <p className="text-sm md:text-base text-gray-600">
              Explora y gestiona actividades adaptadas para diferentes barreras y estilos de aprendizaje
            </p>
          </div>
          <Button 
            asChild
            className="mt-4 md:mt-0 gap-2 w-full md:w-auto"
          >
            <Link to="/actividades/nueva">
              <Plus size={18} /> Nueva Actividad
            </Link>
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-8">
          <div className="flex flex-col space-y-4 mb-4">
            <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar actividades..."
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
            </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">Filtrar por:</h4>
                      
                      <Tabs defaultValue="barriers">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="barriers">Barreras</TabsTrigger>
                          <TabsTrigger value="styles">Estilos</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="barriers" className="mt-2">
                          <div className="space-y-2 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                    {barriers.map((barrier) => (
                      <div key={barrier.id} className="flex items-center">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="w-full justify-start h-auto py-1 px-2 rounded-md"
                                  onClick={() => addFilter('barrier', barrier.id, barrier.name)}
                                >
                                  <span className="bg-red-100 text-red-800 px-1.5 py-0.5 rounded text-xs mr-2">B</span>
                          {barrier.name}
                                </Button>
                      </div>
                    ))}
                  </div>
                        </TabsContent>

                        <TabsContent value="styles" className="mt-2">
                          <div className="space-y-2 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                    {learningStyles.map((style) => (
                      <div key={style.id} className="flex items-center">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="w-full justify-start h-auto py-1 px-2 rounded-md"
                                  onClick={() => addFilter('style', style.id, style.name)}
                                >
                                  <span className={`px-1.5 py-0.5 rounded text-xs mr-2 ${getStyleColor(style.name)}`}>
                                    E
                                  </span>
                          {style.name}
                                </Button>
                      </div>
                    ))}
                  </div>
                        </TabsContent>
                      </Tabs>
                </div>
                  </PopoverContent>
                </Popover>

                {(activeFilters.length > 0 || searchTerm) && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={clearFilters}
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
                    key={filter.id} 
                    variant="secondary"
                    className="flex items-center gap-1 px-2 py-1 text-sm"
                  >
                    {filter.type === 'barrier' ? (
                      <span className="bg-red-100 text-red-800 px-1 py-0.5 rounded-full text-xs mr-1">B</span>
                    ) : (
                      <span className={`px-1 py-0.5 rounded-full text-xs mr-1 ${getStyleColor(filter.name)}`}>E</span>
                    )}
                    {filter.name}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-4 w-4 p-0 ml-1 text-gray-500 hover:text-gray-700"
                      onClick={() => removeFilter(filter.id)}
                    >
                      <X size={12} />
                      <span className="sr-only">Eliminar filtro</span>
                    </Button>
                  </Badge>
                ))}
            </div>
          )}
          </div>

          {filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No se encontraron actividades</h3>
              <p className="text-gray-500 mb-4">Intenta con otros términos de búsqueda o añade una nueva actividad</p>
              <Button asChild>
                <Link to="/actividades/nueva">
                  <Plus size={16} className="mr-2" /> Nueva Actividad
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredActivities.map((activity) => (
                <Card
                  key={activity.id}
                  className="overflow-hidden transition-shadow hover:shadow-md"
                >
                  <CardHeader className="p-4 pb-0">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{activity.name}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpand(activity.id)}
                        className="h-8 w-8 p-0 rounded-full"
                        title={expandedActivities[activity.id] ? "Colapsar" : "Expandir"}
                      >
                        {expandedActivities[activity.id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </Button>
                    </div>
                  </CardHeader>
                    
                  <CardContent className="p-4 pt-2">
                    <p className="text-gray-700 mb-3 line-clamp-2">{activity.objective}</p>
                    
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {activity.barriers.slice(0, 2).map((barrierId) => (
                        <span
                          key={barrierId}
                          className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs"
                        >
                          {getBarrierName(barrierId)}
                        </span>
                      ))}
                      {activity.barriers.length > 2 && (
                        <span className="text-xs text-gray-500 px-1">
                          +{activity.barriers.length - 2}
                        </span>
                      )}
                      {activity.learningStyles.slice(0, 2).map((styleId) => (
                        <span
                          key={styleId}
                          className={`px-2 py-0.5 rounded text-xs ${getStyleColor(getStyleName(styleId))}`}
                        >
                          {getStyleName(styleId)}
                        </span>
                      ))}
                      {activity.learningStyles.length > 2 && (
                        <span className="text-xs text-gray-500 px-1">
                          +{activity.learningStyles.length - 2}
                        </span>
                      )}
                    </div>

                    {expandedActivities[activity.id] && (
                      <div className="mt-4 border-t pt-4 animate-fade-in">
                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-800 text-sm mb-2 flex items-center">
                            <BookOpen size={16} className="mr-2" />
                            Materiales necesarios:
                          </h4>
                          <ul className="list-disc pl-5 text-gray-700 text-sm space-y-1">
                            {activity.materials.map((material, index) => (
                              <li key={index}>{material}</li>
                            ))}
                            {activity.materials.length === 0 && (
                              <li className="text-gray-500">No se han especificado materiales</li>
                            )}
                          </ul>
                        </div>
                        
                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-800 text-sm mb-2">Desarrollo:</h4>
                          {activity.development.description && (
                            <p className="text-gray-700 text-sm mb-3">{activity.development.description}</p>
                          )}
                          
                          {activity.development.steps.length > 0 ? (
                            <div className="pl-4 border-l-2 border-primary/30 space-y-3">
                            {activity.development.steps.map((step, index) => (
                                <div key={step.id || index} className="relative">
                                <div className="flex items-start">
                                    <div className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5 text-xs">
                                    {index + 1}
                                  </div>
                                  <div>
                                      <p className="text-gray-700 text-sm">{step.description}</p>
                                      {(step.durationMin && step.durationMax) && (
                                        <div className="flex items-center mt-1 text-xs text-gray-500">
                                          <Clock size={12} className="mr-1" />
                                      <span>
                                            {step.durationMin}-{step.durationMax} {step.durationUnit || 'minutos'}
                                      </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm italic">No se han especificado pasos</p>
                          )}
                              </div>
                        
                        <div className="flex flex-wrap justify-between gap-2 mt-4 pt-2 border-t border-gray-100">
                          <div className="flex flex-wrap gap-1.5">
                            {activity.barriers.map((barrierId) => (
                              <span
                                key={barrierId}
                                className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs"
                              >
                                {getBarrierName(barrierId)}
                              </span>
                            ))}
                            {activity.learningStyles.map((styleId) => (
                              <span
                                key={styleId}
                                className={`px-2 py-0.5 rounded text-xs ${getStyleColor(getStyleName(styleId))}`}
                              >
                                {getStyleName(styleId)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                        
                  <CardFooter className="p-4 pt-0 flex justify-end gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/actividades/editar/${activity.id}`}>
                        Editar
                            </Link>
                          </Button>
                          <Button size="sm" asChild>
                            <Link to={`/intervenciones/nueva?activityId=${activity.id}`}>
                        Intervenir
                            </Link>
                          </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Activities;
