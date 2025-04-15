
import { ArrowRight, BookOpen, Users, BarChart2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <div className="bg-gradient-to-b from-blue-50 to-white py-12 md:py-20">
      <div className="container px-4 mx-auto">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
            Planifica <span className="text-primary">Intervenciones Educativas</span> Personalizadas
          </h1>
          <p className="text-lg md:text-xl text-gray-700 mb-8">
            Herramienta diseñada para docentes que necesitan crear estrategias educativas 
            específicas para estudiantes con diferentes barreras de aprendizaje.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="gap-2">
              <Link to="/intervenciones">
                Crear Intervención <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link to="/actividades">
                Explorar Actividades <BookOpen className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
            <div className="bg-blue-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <BarChart2 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Barreras de Aprendizaje</h3>
            <p className="text-gray-600 mb-4">
              Registra y gestiona diferentes barreras de aprendizaje para identificar las necesidades específicas de cada estudiante.
            </p>
            <Link to="/barreras" className="text-primary font-medium hover:underline inline-flex items-center">
              Gestionar barreras <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
            <div className="bg-green-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <BookOpen className="h-6 w-6 text-secondary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Actividades Adaptadas</h3>
            <p className="text-gray-600 mb-4">
              Diseña y reutiliza actividades didácticas específicas con objetivos pedagógicos claros y materiales necesarios.
            </p>
            <Link to="/actividades" className="text-secondary font-medium hover:underline inline-flex items-center">
              Explorar actividades <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
            <div className="bg-orange-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Intervenciones Personalizadas</h3>
            <p className="text-gray-600 mb-4">
              Crea intervenciones completas asociando estudiantes, actividades y seguimiento de resultados.
            </p>
            <Link to="/intervenciones" className="text-accent font-medium hover:underline inline-flex items-center">
              Ver intervenciones <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
