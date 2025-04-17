
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, X, Save, Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface LearningStyle {
  id: string;
  name: string;
  description: string;
}

const LearningStyles = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [styles, setStyles] = useState<LearningStyle[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
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
      setIsAdding(false);
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
        .eq("id", isEditing);

      if (error) throw error;

      setStyles(
        styles.map((style) =>
          style.id === isEditing ? editStyle : style
        )
      );
      setIsEditing(null);
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

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de eliminar el estilo de aprendizaje "${name}"?`)) {
      try {
        const { error } = await supabase
          .from("learning_styles")
          .delete()
          .eq("id", id);

        if (error) throw error;

        setStyles(styles.filter((style) => style.id !== id));
        toast({
          title: "Estilo de aprendizaje eliminado",
          description: `Se ha eliminado "${name}" correctamente.`,
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Error al eliminar el estilo de aprendizaje",
          variant: "destructive",
        });
      }
    }
  };

  const startEditing = (style: LearningStyle) => {
    setEditStyle({ ...style });
    setIsEditing(style.id);
  };

  const cancelAction = () => {
    setIsAdding(false);
    setIsEditing(null);
    setNewStyle({ name: "", description: "" });
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
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Estilos de Aprendizaje</h1>
            <p className="text-gray-600">
              Gestiona los estilos de aprendizaje para personalizar intervenciones educativas
            </p>
          </div>
          <Button 
            onClick={() => setIsAdding(true)} 
            className="mt-4 md:mt-0 gap-2"
            disabled={isAdding}
          >
            <Plus size={18} /> Agregar Estilo
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
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
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStyles.map((style) => (
                <div
                  key={style.id}
                  className={`bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
                    isEditing === style.id ? "ring-2 ring-primary" : ""
                  }`}
                >
                  {isEditing === style.id ? (
                    <form onSubmit={handleEditSubmit} className="p-4">
                      <div className="mb-4">
                        <label htmlFor={`edit-name-${style.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre del Estilo
                        </label>
                        <input
                          id={`edit-name-${style.id}`}
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/70"
                          value={editStyle.name}
                          onChange={(e) => setEditStyle({ ...editStyle, name: e.target.value })}
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label htmlFor={`edit-description-${style.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                          Descripción
                        </label>
                        <textarea
                          id={`edit-description-${style.id}`}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/70"
                          rows={3}
                          value={editStyle.description}
                          onChange={(e) => setEditStyle({ ...editStyle, description: e.target.value })}
                        />
                      </div>
                      
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={cancelAction}>
                          Cancelar
                        </Button>
                        <Button type="submit" size="sm">
                          <Save size={16} className="mr-1" /> Actualizar
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="p-4">
                      <div className="flex items-center mb-3">
                        <span className={`px-2 py-1 rounded text-sm ${getStyleColor(style.name)}`}>
                          {style.name}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-4">{style.description}</p>
                      
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditing(style)}
                          className="h-8 w-8 p-0"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(style.id, style.name)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearningStyles;
