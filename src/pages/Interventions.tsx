
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import InterventionWizard from "@/components/InterventionWizard";
import { 
  Calendar, ChevronDown, ChevronUp, Plus, Search, User, 
  BookOpen, Filter, ClipboardList 
} from "lucide-react";
import { 
  interventions as initialInterventions, 
  activities, 
  barriers, 
  learningStyles,
  Intervention 
} from "@/data/sampleData";
import { Link } from "react-router-dom";

const Interventions = () => {
  const [interventions, setInterventions] = useState<Intervention[]>(initialInterventions);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedInterventions, setExpandedInterventions] = useState<Record<string, boolean>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [teacherFilter, setTeacherFilter] = useState<string[]>([]);
  const [activityFilter, setActivityFilter] = useState<string[]>([]);
  const [wizardOpen, setWizardOpen] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedInterventions({
      ...expandedInterventions,
      [id]: !expandedInterventions[id],
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
      getActivityName(intervention.activity).toLowerCase().includes(searchTerm.toLowerCase());

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

  // Función para obtener nombre de una actividad por su ID
  const getActivityName = (id: string) => {
    const activity = activities.find((a) => a.id === id);
    return activity ? activity.name : "Actividad desconocida";
  };

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
            <Sheet open={wizardOpen} onOpenChange={setWizardOpen}>
              <SheetTrigger asChild>
                <Button className="gap-2">
                  <Plus size={18} /> Asistente de Intervención
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="sm:max-w-xl w-[90vw]">
                <InterventionWizard onClose={() => setWizardOpen(false)} />
              </SheetContent>
            </Sheet>
            
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
                  <div className="space-y-2">
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
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpand(intervention.id)}
                        className="h-8 w-8 p-0 ml-2"
                        title={expandedInterventions[intervention.id] ? "Colapsar" : "Expandir"}
                      >
                        {expandedInterventions[intervention.id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </Button>
                    </div>
                    
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 md:mb-0">
                        {getActivityName(intervention.activity)}
                      </h3>
                      
                      <div className="flex items-center">
                        <User className="h-5 w-5 text-gray-500 mr-2" />
                        <span className="text-gray-700 font-medium">{intervention.student.name}</span>
                        <span className="text-gray-500 text-sm ml-2">({intervention.student.grade})</span>
                      </div>
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
                    </div>
                    
                    <div className="flex flex-col md:flex-row md:items-center text-gray-600 gap-2 md:gap-6">
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-1 text-primary" />
                        <span>Profesor: {intervention.teacherName}</span>
                      </div>
                    </div>

                    {expandedInterventions[intervention.id] && (
                      <div className="mt-6 border-t pt-4 animate-fade-in">
                        <h4 className="font-semibold text-gray-800 mb-2">Estilos de aprendizaje:</h4>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {intervention.learningStyles.map((styleId) => (
                            <span
                              key={styleId}
                              className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                            >
                              {getStyleName(styleId)}
                            </span>
                          ))}
                        </div>
                        
                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-800 mb-2">Observaciones:</h4>
                          <p className="text-gray-700 bg-gray-50 p-3 rounded-md border border-gray-100">
                            {intervention.observations}
                          </p>
                        </div>
                        
                        <div className="flex justify-between mt-4">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/intervenciones/editar/${intervention.id}`}>
                              Editar Intervención
                            </Link>
                          </Button>
                          <Button size="sm" asChild>
                            <Link to={`/actividades/${intervention.activity}`}>
                              Ver Actividad
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

export default Interventions;
