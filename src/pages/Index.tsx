
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import { BookOpen, CheckCircle, Users } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <Hero />

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">¿Cómo funciona?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-100 rounded-full p-4 mb-4">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Registra Información</h3>
              <p className="text-gray-600">
                Ingresa barreras de aprendizaje, estilos preferentes y crea actividades adaptadas.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="bg-green-100 rounded-full p-4 mb-4">
                <CheckCircle className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">2. Diseña Intervención</h3>
              <p className="text-gray-600">
                Selecciona al estudiante, las actividades adecuadas y personaliza el desarrollo paso a paso.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="bg-orange-100 rounded-full p-4 mb-4">
                <Users className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Realiza Seguimiento</h3>
              <p className="text-gray-600">
                Registra observaciones y resultados de cada intervención para ajustar estrategias futuras.
              </p>
            </div>
          </div>

          <div className="mt-16 bg-gray-50 p-8 rounded-xl">
            <h3 className="text-2xl font-bold mb-6 text-center">Ejemplo de Intervención</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h4 className="text-xl font-semibold mb-3 text-primary">Actividad: Aritmética en la Vida Real</h4>
                <div className="mb-4">
                  <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm mr-2 mb-2">
                    Dificultad en el cálculo
                  </span>
                  <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-sm mr-2 mb-2">
                    Visual
                  </span>
                  <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-sm mr-2 mb-2">
                    Kinestésico
                  </span>
                </div>
                <div className="mb-4">
                  <h5 className="font-semibold mb-1">Objetivo:</h5>
                  <p className="text-gray-700">Aplicar el cálculo a situaciones cotidianas para mejorar su comprensión</p>
                </div>
                <div className="mb-4">
                  <h5 className="font-semibold mb-1">Materiales:</h5>
                  <p className="text-gray-700">Recibos, dinero didáctico, calculadora, dispositivos móviles</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h4 className="text-xl font-semibold mb-3 text-primary">Desarrollo</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-start">
                      <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                        1
                      </div>
                      <div>
                        <p className="text-gray-700">Introducción a la importancia del cálculo en la vida diaria mediante ejemplos concretos</p>
                        <p className="text-gray-500 text-sm">15-20 minutos</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-start">
                      <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                        2
                      </div>
                      <div>
                        <p className="text-gray-700">Planteamiento de problemas reales como realizar presupuestos personales y dividir cuentas en grupo</p>
                        <p className="text-gray-500 text-sm">25-30 minutos</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-start">
                      <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                        3
                      </div>
                      <div>
                        <p className="text-gray-700">Resolución de ejercicios utilizando herramientas manuales y digitales</p>
                        <p className="text-gray-500 text-sm">40-50 minutos</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0 flex items-center">
              <BookOpen className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-display font-bold">EduIntervención</span>
            </div>
            <div className="flex flex-col md:flex-row md:space-x-8">
              <a href="#" className="hover:text-primary mb-2 md:mb-0">Términos y condiciones</a>
              <a href="#" className="hover:text-primary mb-2 md:mb-0">Política de privacidad</a>
              <a href="#" className="hover:text-primary">Ayuda</a>
            </div>
          </div>
          <div className="mt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} EduIntervención. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
