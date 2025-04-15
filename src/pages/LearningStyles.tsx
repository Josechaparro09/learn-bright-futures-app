
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, X, Save, Search } from "lucide-react";
import { learningStyles as initialStyles, LearningStyle } from "@/data/sampleData";
import { useToast } from "@/components/ui/use-toast";

const LearningStyles = () => {
  const { toast } = useToast();
  const [styles, setStyles] = useState<LearningStyle[]>(initialStyles);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [newStyle, setNewStyle] = useState<Omit<LearningStyle, "id">>({
    name: "",
    description: "",
  });
  const [editStyle, setEditStyle] = useState<LearningStyle>({
    id: "",
    name: "",
    description: "",
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStyle.name || !newStyle.description) {
      toast({
        title: "Error",
        description: "Todos los campos son requeridos",
        variant: "destructive",
      });
      return;
    }

    const id = `${styles.length + 1}`;
    setStyles([...styles, { ...newStyle, id }]);
    setNewStyle({ name: "", description: "" });
    setIsAdding(false);
    toast({
      title: "Estilo de aprendizaje agregado",
      description: `Se ha agregado "${newStyle.name}" correctamente.`,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStyle.name || !editStyle.description) {
      toast({
        title: "Error",
        description: "Todos los campos son requeridos",
        variant: "destructive",
      });
      return;
    }

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
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de eliminar el estilo de aprendizaje "${name}"?`)) {
      setStyles(styles.filter((style) => style.id !== id));
      toast({
        title: "Estilo de aprendizaje eliminado",
        description: `Se ha eliminado "${name}" correctamente.`,
      });
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

          {isAdding && (
            <form onSubmit={handleAddSubmit} className="mb-8 bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Agregar Nuevo Estilo de Aprendizaje</h3>
                <Button variant="ghost" size="sm" onClick={cancelAction} className="h-8 w-8 p-0">
                  <X size={18} />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Estilo
                  </label>
                  <input
                    id="name"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/70"
                    value={newStyle.name}
                    onChange={(e) => setNewStyle({ ...newStyle, name: e.target.value })}
                    placeholder="Ej. Verbal-Lingüístico"
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    id="description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/70"
                    rows={3}
                    value={newStyle.description}
                    onChange={(e) => setNewStyle({ ...newStyle, description: e.target.value })}
                    placeholder="Describe brevemente este estilo de aprendizaje"
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={cancelAction}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    <Save size={18} className="mr-2" /> Guardar
                  </Button>
                </div>
              </div>
            </form>
          )}

          {filteredStyles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No se encontraron estilos de aprendizaje.</p>
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
