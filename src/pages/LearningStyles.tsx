import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, X, Save, Search, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

interface LearningStyle {
  id: string;
  name: string;
  description: string;
}

const LearningStyles = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [styles, setStyles] = useState<LearningStyle[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [newStyle, setNewStyle] = useState<Omit<LearningStyle, "id">>({
    name: "",
    description: "",
  });
  const [editStyle, setEditStyle] = useState<LearningStyle>({
    id: "",
    name: "",
    description: "",
  });
  const [styleToDelete, setStyleToDelete] = useState<LearningStyle | null>(null);

  useEffect(() => {
    fetchLearningStyles();
  }, []);

  const fetchLearningStyles = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("learning_styles")
        .select("*")
        .order("name");

      if (error) throw error;
      if (data) setStyles(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los estilos de aprendizaje",
        variant: "destructive",
      });
      console.error("Error fetching learning styles:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStyle.name || !newStyle.description) {
      toast({
        title: "Error",
        description: "Todos los campos son requeridos",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("learning_styles")
        .insert([
          { ...newStyle, created_by: user?.id }
        ])
        .select()
        .single();

      if (error) throw error;

      setStyles([...styles, data]);
      setNewStyle({ name: "", description: "" });
      setIsAddDialogOpen(false);
      toast({
        title: "Estilo de aprendizaje agregado",
        description: `Se ha agregado "${newStyle.name}" correctamente.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al agregar el estilo de aprendizaje",
        variant: "destructive",
      });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStyle.name || !editStyle.description) {
      toast({
        title: "Error",
        description: "Todos los campos son requeridos",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("learning_styles")
        .update({
          name: editStyle.name,
          description: editStyle.description
        })
        .eq("id", editStyle.id);

      if (error) throw error;

      setStyles(
        styles.map((style) =>
          style.id === editStyle.id ? editStyle : style
        )
      );
      setIsEditDialogOpen(false);
      toast({
        title: "Estilo de aprendizaje actualizado",
        description: `Se ha actualizado "${editStyle.name}" correctamente.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el estilo de aprendizaje",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = (style: LearningStyle) => {
    setStyleToDelete(style);
  };

  const handleDelete = async () => {
    if (!styleToDelete) return;
    
      try {
        const { error } = await supabase
          .from("learning_styles")
          .delete()
        .eq("id", styleToDelete.id);

        if (error) throw error;

      setStyles(styles.filter((style) => style.id !== styleToDelete.id));
        toast({
          title: "Estilo de aprendizaje eliminado",
        description: `Se ha eliminado "${styleToDelete.name}" correctamente.`,
        });
      setStyleToDelete(null);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Error al eliminar el estilo de aprendizaje",
          variant: "destructive",
        });
    }
  };

  const startEditing = (style: LearningStyle) => {
    setEditStyle({ ...style });
    setIsEditDialogOpen(true);
  };

  const filteredStyles = styles.filter(
    (style) =>
      style.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      style.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Estilos de Aprendizaje</h1>
            <p className="text-sm md:text-base text-gray-600">
              Gestiona los estilos de aprendizaje para personalizar intervenciones educativas
            </p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
          <Button 
                className="mt-4 md:mt-0 gap-2 w-full md:w-auto"
          >
            <Plus size={18} /> Agregar Estilo
          </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleAddSubmit}>
                <DialogHeader>
                  <DialogTitle>Nuevo Estilo de Aprendizaje</DialogTitle>
                  <DialogDescription>
                    Ingresa los datos para crear un nuevo estilo de aprendizaje
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label htmlFor="new-name" className="text-sm font-medium">
                    Nombre del Estilo
                  </label>
                  <input
                    id="new-name"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/70"
                    value={newStyle.name}
                    onChange={(e) => setNewStyle({ ...newStyle, name: e.target.value })}
                      placeholder="Ej. Visual, Auditivo, Kinestésico"
                    required
                  />
                </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="new-description" className="text-sm font-medium">
                    Descripción
                  </label>
                  <textarea
                    id="new-description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/70"
                    rows={3}
                    value={newStyle.description}
                    onChange={(e) => setNewStyle({ ...newStyle, description: e.target.value })}
                      placeholder="Describe brevemente este estilo de aprendizaje"
                    required
                  />
                  </div>
                </div>
                
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                    Cancelar
                  </Button>
                  </DialogClose>
                  <Button type="submit">
                    <Save size={16} className="mr-2" /> Guardar
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
            </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar estilos..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/70"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
              <span className="sr-only">Cargando estilos de aprendizaje...</span>
            </div>
          ) : (
            <>
              {filteredStyles.length === 0 ? (
                <div className="text-center py-10">
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No se encontraron estilos</h3>
                  <p className="text-gray-500 mb-4">Crea un nuevo estilo o modifica tu búsqueda</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStyles.map((style) => (
                    <Card
                  key={style.id}
                      className="overflow-hidden h-full transition-all"
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center">
                          <span className={`px-2 py-1 rounded text-sm ${getStyleColor(style.name)}`}>
                            {style.name}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      
                      <CardContent className="py-2">
                        <p className="text-gray-600 text-sm">{style.description}</p>
                      </CardContent>
                      
                      <CardFooter className="flex justify-end gap-2 pt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditing(style)}
                          className="h-8 w-8 p-0"
                          title="Editar"
                        >
                          <Edit size={16} />
                          <span className="sr-only">Editar</span>
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              title="Eliminar"
                              onClick={() => confirmDelete(style)}
                            >
                              <Trash2 size={16} />
                              <span className="sr-only">Eliminar</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción eliminará el estilo "{style.name}" permanentemente 
                                y no se podrá recuperar.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={handleDelete}
                                className="bg-destructive text-white hover:bg-destructive/90"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
              
              {/* Diálogo para editar estilo */}
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                  <form onSubmit={handleEditSubmit}>
                    <DialogHeader>
                      <DialogTitle>Editar Estilo de Aprendizaje</DialogTitle>
                      <DialogDescription>
                        Actualiza los datos del estilo de aprendizaje
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label htmlFor="edit-name" className="text-sm font-medium">
                          Nombre del Estilo
                        </label>
                        <input
                          id="edit-name"
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/70"
                          value={editStyle.name}
                          onChange={(e) => setEditStyle({ ...editStyle, name: e.target.value })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="edit-description" className="text-sm font-medium">
                          Descripción
                        </label>
                        <textarea
                          id="edit-description"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/70"
                          rows={3}
                          value={editStyle.description}
                          onChange={(e) => setEditStyle({ ...editStyle, description: e.target.value })}
                        />
                      </div>
                      </div>
                      
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button" variant="outline">
                          Cancelar
                        </Button>
                      </DialogClose>
                      <Button type="submit">
                        <Save size={16} className="mr-2" /> Guardar
                        </Button>
                    </DialogFooter>
                    </form>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearningStyles;
