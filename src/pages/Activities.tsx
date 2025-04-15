
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Clock, Plus, Search, Filter, ClipboardList } from "lucide-react";
import { Activity, activities as initialActivities, barriers, learningStyles } from "@/data/sampleData";
import { Link } from "react-router-dom";

const Activities = () => {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [searchTerm, setSearchTerm] = useState("");
  const [barrierFilter, setBarrierFilter] = useState<string[]>([]);
  const [styleFilter, setStyleFilter] = useState<string[]>([]);
  const [expandedActivities, setExpandedActivities] = useState<Record<string, boolean>>({});
  const [showFilters, setShowFilters] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedActivities({
      ...expandedActivities,
      [id]: !expandedActivities[id],
    });
  };

  const handleBarrierFilterChange = (id: string) => {
    if (barrierFilter.includes(id)) {
      setBarrierFilter(barrierFilter.filter((item) => item !== id));
    } else {
      setBarrierFilter([...barrierFilter, id]);
    }
  };

  const handleStyleFilterChange = (id: string) => {
    if (styleFilter.includes(id)) {
      setStyleFilter(styleFilter.filter((item) => item !== id));
    } else {
      setStyleFilter([...styleFilter, id]);
    }
  };

  const clearFilters = () => {
    setBarrierFilter([]);
    setStyleFilter([]);
    setSearchTerm("");
  };

  const filteredActivities = activities.filter((activity) => {
    // Filtro de búsqueda por texto
    const matchesSearch =
      searchTerm === "" ||
      activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.objective.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro por barreras
    const matchesBarriers =
      barrierFilter.length === 0 ||
      barrierFilter.some((filterId) => activity.barriers.includes(filterId));

    // Filtro por estilos
    const matchesStyles =
      styleFilter.length === 0 ||
      styleFilter.some((filterId) => activity.learningStyles.includes(filterId));

    return matchesSearch && matchesBarriers && matchesStyles;
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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Actividades Educativas</h1>
            <p className="text-gray-600">
              Explora y gestiona actividades adaptadas para diferentes barreras y estilos de aprendizaje
            </p>
          </div>
          <Button 
            asChild
            className="mt-4 md:mt-0 gap-2"
          >
            <Link to="/actividades/nueva">
              <Plus size={18} /> Nueva Actividad
            </Link>
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
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
                  <h3 className="text-sm font-semibold mb-2 text-gray-700">Barreras de aprendizaje</h3>
                  <div className="space-y-2">
                    {barriers.map((barrier) => (
                      <div key={barrier.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`barrier-${barrier.id}`}
                          className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                          checked={barrierFilter.includes(barrier.id)}
                          onChange={() => handleBarrierFilterChange(barrier.id)}
                        />
                        <label htmlFor={`barrier-${barrier.id}`} className="ml-2 text-sm text-gray-700">
                          {barrier.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2 text-gray-700">Estilos de aprendizaje</h3>
                  <div className="space-y-2">
                    {learningStyles.map((style) => (
                      <div key={style.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`style-${style.id}`}
                          className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                          checked={styleFilter.includes(style.id)}
                          onChange={() => handleStyleFilterChange(style.id)}
                        />
                        <label htmlFor={`style-${style.id}`} className="ml-2 text-sm text-gray-700">
                          {style.name}
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

          {filteredActivities.length === 0 ? (
            <div className="text-center py-16">
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
            <div className="space-y-6">
              {filteredActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="p-5">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{activity.name}</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpand(activity.id)}
                        className="h-8 w-8 p-0 ml-2"
                        title={expandedActivities[activity.id] ? "Colapsar" : "Expandir"}
                      >
                        {expandedActivities[activity.id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </Button>
                    </div>
                    
                    <p className="text-gray-700 mb-4">{activity.objective}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {activity.barriers.map((barrierId) => (
                        <span
                          key={barrierId}
                          className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm"
                        >
                          {getBarrierName(barrierId)}
                        </span>
                      ))}
                      {activity.learningStyles.map((styleId) => (
                        <span
                          key={styleId}
                          className={`px-2 py-1 rounded text-sm ${getStyleColor(getStyleName(styleId))}`}
                        >
                          {getStyleName(styleId)}
                        </span>
                      ))}
                    </div>

                    {expandedActivities[activity.id] && (
                      <div className="mt-6 border-t pt-4 animate-fade-in">
                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-800 mb-2">Materiales necesarios:</h4>
                          <ul className="list-disc pl-5 text-gray-700">
                            {activity.materials.map((material, index) => (
                              <li key={index}>{material}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-800 mb-2">Desarrollo:</h4>
                          <p className="text-gray-700 mb-3">{activity.development.description}</p>
                          
                          <div className="pl-4 border-l-2 border-primary/30">
                            {activity.development.steps.map((step, index) => (
                              <div key={step.id} className="mb-4">
                                <div className="flex items-start">
                                  <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                                    {index + 1}
                                  </div>
                                  <div>
                                    <p className="text-gray-700">{step.description}</p>
                                    <div className="flex items-center mt-1 text-sm text-gray-500">
                                      <Clock size={14} className="mr-1" />
                                      <span>
                                        {step.durationMin}-{step.durationMax} {step.durationUnit}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex justify-between mt-4">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/actividades/editar/${activity.id}`}>
                              Editar Actividad
                            </Link>
                          </Button>
                          <Button size="sm" asChild>
                            <Link to={`/intervenciones/nueva?activityId=${activity.id}`}>
                              Crear Intervención
                            </Link>
                          </Button>
                        </div>
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

export default Activities;
