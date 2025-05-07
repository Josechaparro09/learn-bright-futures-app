import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  BarChart2, Activity, Users, ArrowRight, Sparkles, 
  CheckCircle2, Brain, Lightbulb, Target, Layers, FileText, 
  PanelRight, Clock, Award, BookOpen
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import NavbarAuth from "@/components/NavbarAuth";

const LandingPage = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar si es dispositivo móvil para ajustar animaciones
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Configuración para las características destacadas
  const features = [
    {
      icon: <BarChart2 className="h-8 w-8 text-primary" />,
      title: "Catálogo de Barreras",
      description: "Identifica y gestiona las barreras que enfrentan tus estudiantes con un sistema de categorización intuitivo.",
      color: "bg-primary/10",
      textColor: "text-primary"
    },
    {
      icon: <Activity className="h-8 w-8 text-green-600" />,
      title: "Estilos de Aprendizaje",
      description: "Adapta tu enseñanza a los estilos visual, auditivo y kinestésico para maximizar la efectividad de tus intervenciones.",
      color: "bg-green-100",
      textColor: "text-green-600"
    },
    {
      icon: <Lightbulb className="h-8 w-8 text-amber-600" />,
      title: "Diseño de Actividades",
      description: "Crea y organiza actividades adaptadas con objetivos claros y materiales específicos para cada barrera.",
      color: "bg-amber-100",
      textColor: "text-amber-600"
    },
    {
      icon: <Sparkles className="h-8 w-8 text-blue-600" />,
      title: "Asistente IA",
      description: "Genera actividades personalizadas automáticamente con tecnología de inteligencia artificial.",
      color: "bg-blue-100",
      textColor: "text-blue-600"
    }
  ];

  // Rotar automáticamente entre características destacadas
  useEffect(() => {
    if (isMobile) return; // No auto-rotar en móviles

    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [features.length, isMobile]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="bg-white shadow-md w-full sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <img 
                  src="/logo name horizontal.svg" 
                  alt="SINBAR Logo" 
                  className="h-10 my-2 transition-transform duration-200 hover:scale-105" 
                />
              </Link>
            </div>
            <NavbarAuth />
          </div>
        </div>
      </nav>

      {/* Hero section */}
      <section className="bg-gradient-to-b from-primary/5 via-blue-50 to-white py-12 md:py-20 lg:py-28">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="max-w-2xl text-center lg:text-left">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 mb-4 py-1.5 pl-1.5 pr-2.5">
                <Brain className="h-4 w-4 mr-1" /> Educación inclusiva
              </Badge>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Supera las <span className="text-primary relative">barreras
                  <svg className="absolute w-full h-3 bottom-0 left-0 text-primary/30 -z-10" viewBox="0 0 100 20">
                    <path fill="currentColor" d="M0,20 Q25,0 50,20 Q75,40 100,20 L100,30 L0,30 Z" />
                  </svg>
                </span> en el aprendizaje
              </h1>
              <p className="text-base md:text-lg text-gray-700 mb-8 max-w-xl mx-auto lg:mx-0">
                SINBAR es la plataforma que ayuda a docentes a crear intervenciones educativas personalizadas 
                para estudiantes con diferentes necesidades y estilos de aprendizaje.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button asChild size="lg" className="gap-2 text-base shadow-md hover:shadow-lg transition-all">
                  <Link to="/auth">
                    Iniciar Sesión <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="gap-2 text-base border-2">
                  <Link to="/auth?tab=signup">
                    Registrarse <CheckCircle2 className="h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
            
            <div className="relative w-full max-w-md lg:max-w-xl aspect-square hidden md:block">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/5 to-primary/20 animate-pulse" style={{ animationDuration: '4s' }}></div>
              
              {/* Tarjetas animadas */}
              <div className="absolute top-[20%] left-[10%] w-48 transform -rotate-6 shadow-xl rounded-lg overflow-hidden animate-float-slow">
                <div className="bg-white p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart2 className="h-5 w-5 text-primary" />
                    <span className="font-medium">Barreras</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Badge className="bg-red-100 text-red-700 font-normal">Dislexia</Badge>
                    <Badge className="bg-orange-100 text-orange-700 font-normal">Atención</Badge>
                  </div>
                </div>
              </div>
              
              <div className="absolute top-[40%] right-[5%] w-56 transform rotate-6 shadow-xl rounded-lg overflow-hidden animate-float-slow" style={{ animationDelay: '1s' }}>
                <div className="bg-white p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                    <span className="font-medium">Actividad</span>
                  </div>
                  <p className="text-sm text-gray-600">Mapas mentales visuales para comprensión lectora</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Clock className="h-3 w-3 text-gray-500" />
                    <span className="text-xs text-gray-500">45 minutos</span>
                  </div>
                </div>
              </div>
              
              <div className="absolute bottom-[15%] left-[15%] w-52 transform rotate-3 shadow-xl rounded-lg overflow-hidden animate-float-slow" style={{ animationDelay: '2s' }}>
                <div className="bg-white p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Estilos</span>
                  </div>
                  <div className="space-y-1 mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '70%' }}></div>
                    </div>
                    <div className="text-xs text-gray-600">Visual: 70%</div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '40%' }}></div>
                    </div>
                    <div className="text-xs text-gray-600">Auditivo: 40%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Estadísticas */}
      

      {/* Características principales - versión móvil con tabs */}
      <section className="py-12 md:py-16 bg-gray-50 md:hidden">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">Características Principales</h2>
          
          <Tabs defaultValue="0" className="w-full">
            <TabsList className="grid grid-cols-4 mb-8">
              {features.map((feature, index) => (
                <TabsTrigger 
                  key={index} 
                  value={index.toString()}
                  className={`flex items-center justify-center p-2 ${index === parseInt(activeFeature.toString()) ? feature.textColor : ''}`}
                >
                  {React.cloneElement(feature.icon, { className: "h-5 w-5" })}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {features.map((feature, index) => (
              <TabsContent key={index} value={index.toString()} className="mt-0">
                <Card className={`border-0 shadow-md overflow-hidden`}>
                  <div className={`${feature.color} p-4`}>
                    <div className="flex items-center gap-3">
                      {React.cloneElement(feature.icon, { className: "h-6 w-6" })}
                      <h3 className={`text-xl font-semibold ${feature.textColor}`}>{feature.title}</h3>
                    </div>
                  </div>
                  <CardContent className="pt-4">
                    <p className="text-gray-700">{feature.description}</p>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* Características destacadas - versión desktop */}
      <section className="py-16 bg-gray-50 hidden md:block">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Características Destacadas</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`rounded-xl p-6 shadow-md transition-all duration-300 border-2 ${
                  activeFeature === index 
                    ? `border-${feature.textColor.split('-')[1]}-${feature.textColor.split('-')[2]} ${feature.color} transform -translate-y-2` 
                    : 'border-transparent hover:-translate-y-1 hover:shadow-lg bg-white'
                }`}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div className={`p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4 ${feature.color}`}>
                  {feature.icon}
                </div>
                <h3 className={`text-xl font-semibold mb-3 ${activeFeature === index ? feature.textColor : 'text-gray-900'}`}>
                  {feature.title}
                </h3>
                <p className="text-gray-700">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">¿Cómo funciona SINBAR?</h2>
          <p className="text-center text-gray-600 max-w-3xl mx-auto mb-16">Un enfoque integral para diseñar intervenciones educativas adaptadas a las necesidades específicas de cada estudiante</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative">
              <div className="absolute top-0 left-6 h-full w-0.5 bg-primary/20 hidden md:block"></div>
              <div className="bg-white rounded-xl shadow-md p-6 relative">
                <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center mb-6 -mt-10 relative z-10 md:absolute md:-left-6 border-4 border-white">
                  <Target className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-semibold mb-3 pt-0 md:pt-2">1. Identifica Barreras</h3>
                <p className="text-gray-600 mb-4">
                  Registra las barreras de aprendizaje específicas y estilos predominantes de tus estudiantes.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-gray-100 text-gray-700 font-normal">Déficit de atención</Badge>
                  <Badge className="bg-gray-100 text-gray-700 font-normal">Dislexia</Badge>
                  <Badge className="bg-gray-100 text-gray-700 font-normal">Visual</Badge>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute top-0 left-6 h-full w-0.5 bg-primary/20 hidden md:block"></div>
              <div className="bg-white rounded-xl shadow-md p-6 relative">
                <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center mb-6 -mt-10 relative z-10 md:absolute md:-left-6 border-4 border-white">
                  <Layers className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-semibold mb-3 pt-0 md:pt-2">2. Diseña Actividades</h3>
                <p className="text-gray-600 mb-4">
                  Crea o selecciona actividades adaptadas a las barreras y estilos identificados.
                </p>
                <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Mapas Conceptuales Visuales</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Actividad adaptada para dislexia y estilo visual</p>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white rounded-xl shadow-md p-6 relative">
                <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center mb-6 -mt-10 relative z-10 md:absolute md:-left-6 border-4 border-white">
                  <PanelRight className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-semibold mb-3 pt-0 md:pt-2">3. Implementa y Evalúa</h3>
                <p className="text-gray-600 mb-4">
                  Aplica las intervenciones, registra resultados y ajusta según el progreso observado.
                </p>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  <span className="text-sm text-gray-700">Mejora continua basada en resultados</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ejemplo de intervención */}
      <section className="py-16 bg-gradient-to-tr from-primary/5 to-blue-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Ejemplo de Intervención</h2>
          
          <div className="bg-white rounded-xl overflow-hidden shadow-lg max-w-4xl mx-auto">
            <div className="bg-primary/10 p-4 sm:p-6 border-b border-primary/20">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <h3 className="text-xl font-semibold text-gray-900">Comprensión Lectora Adaptada</h3>
                  </div>
                  <p className="text-gray-600 mt-1">Diseñada para estudiantes con dificultades en procesamiento visual</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Dislexia</Badge>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Auditivo</Badge>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Kinestésico</Badge>
                </div>
              </div>
            </div>
            
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-medium flex items-center gap-2 mb-4">
                    <Target className="h-4 w-4 text-primary" />
                    Objetivo
                  </h4>
                  <p className="text-gray-700 mb-6">Desarrollar estrategias de comprensión lectora utilizando múltiples sentidos para procesar la información textual.</p>
                  
                  <h4 className="text-lg font-medium flex items-center gap-2 mb-4">
                    <Layers className="h-4 w-4 text-primary" />
                    Materiales
                  </h4>
                  <ul className="list-disc text-gray-700 pl-5 space-y-1">
                    <li>Textos impresos con formato adaptado</li>
                    <li>Grabaciones de audio con los mismos textos</li>
                    <li>Marcadores de colores y papeles adhesivos</li>
                    <li>Tarjetas para crear mapas conceptuales</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-lg font-medium flex items-center gap-2 mb-4">
                    <Clock className="h-4 w-4 text-primary" />
                    Desarrollo
                  </h4>
                  <div className="space-y-4">
                    <div className="flex">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-3 mt-0.5">
                        <span className="font-semibold text-primary">1</span>
                      </div>
                      <div>
                        <p className="text-gray-800">Presentación multisensorial del texto: visual, auditivo y táctil</p>
                        <Badge className="bg-gray-100 text-gray-600 font-normal mt-1">15 minutos</Badge>
                      </div>
                    </div>
                    
                    <div className="flex">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-3 mt-0.5">
                        <span className="font-semibold text-primary">2</span>
                      </div>
                      <div>
                        <p className="text-gray-800">Identificación y subrayado de ideas principales con códigos de colores</p>
                        <Badge className="bg-gray-100 text-gray-600 font-normal mt-1">20 minutos</Badge>
                      </div>
                    </div>
                    
                    <div className="flex">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-3 mt-0.5">
                        <span className="font-semibold text-primary">3</span>
                      </div>
                      <div>
                        <p className="text-gray-800">Creación manual de mapas conceptuales con tarjetas movibles</p>
                        <Badge className="bg-gray-100 text-gray-600 font-normal mt-1">25 minutos</Badge>
                      </div>
                    </div>
                    
                    <div className="flex">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-3 mt-0.5">
                        <span className="font-semibold text-primary">4</span>
                      </div>
                      <div>
                        <p className="text-gray-800">Discusión y exposición oral del contenido comprendido</p>
                        <Badge className="bg-gray-100 text-gray-600 font-normal mt-1">15 minutos</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA section */}
      <section className="py-16 bg-primary/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            Comienza a transformar tu forma de enseñar
          </h2>
          <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
            Únete a cientos de docentes que ya están mejorando el aprendizaje de sus estudiantes con barreras específicas
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="gap-2 shadow-md">
              <Link to="/auth">
                Comenzar ahora <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0 flex items-center">
              <div className="bg-white/95 rounded-lg p-2">
                <img 
                  src="/logo name horizontal.svg" 
                  alt="SINBAR Logo" 
                  className="h-8 transition-transform duration-200 hover:scale-105" 
                />
              </div>
            </div>
            <div className="flex flex-col md:flex-row md:space-x-8">
              <a href="#" className="hover:text-primary mb-2 md:mb-0">Términos y condiciones</a>
              <a href="#" className="hover:text-primary mb-2 md:mb-0">Política de privacidad</a>
              <a href="#" className="hover:text-primary">Ayuda</a>
            </div>
          </div>
          <div className="mt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} SINBAR. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Estilos adicionales para animaciones */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(-6deg); }
          50% { transform: translateY(-10px) rotate(-6deg); }
        }
        .animate-float-slow {
          animation: float 5s ease-in-out infinite;
        }
        `
      }} />
    </div>
  );
};

export default LandingPage; 