import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, X, Save, Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface Barrier {
  id: string;
  name: string;
  description: string;
}

const Barriers = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [barriers, setBarriers] = useState<Barrier[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [newBarrier, setNewBarrier] = useState<Omit<Barrier, "id">>({
    name: "",
    description: "",
  });
  const [editBarrier, setEditBarrier] = useState<Barrier>({
    id: "",
    name: "",
    description: "",
  });

  useEffect(() => {
    fetchBarriers();
  }, []);

  const fetchBarriers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("barriers")
        .select("*")
        .order("name");

      if (error) throw error;
      if (data) setBarriers(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las barreras",
        variant: "destructive",
      });
      console.error("Error fetching barriers:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBarrier.name || !newBarrier.description) {
      toast({
        title: "Error",
        description: "Todos los campos son requeridos",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("barriers")
        .insert([
          { ...newBarrier, created_by: user?.id }
        ])
        .select()
        .single();

      if (error) throw error;

      setBarriers([...barriers, data]);
      setNewBarrier({ name: "", description: "" });
      setIsAdding(false);
      toast({
        title: "Barrera agregada",
        description: `Se ha agregado "${newBarrier.name}" correctamente.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al agregar la barrera",
        variant: "destructive",
      });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBarrier.name || !editBarrier.description) {
      toast({
        title: "Error",
        description: "Todos los campos son requeridos",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("barriers")
        .update({
          name: editBarrier.name,
          description: editBarrier.description
        })
        .eq("id", isEditing);

      if (error) throw error;

      setBarriers(
        barriers.map((barrier) =>
          barrier.id === isEditing ? editBarrier : barrier
        )
      );
      setIsEditing(null);
      toast({
        title: "Barrera actualizada",
        description: `Se ha actualizado "${editBarrier.name}" correctamente.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar la barrera",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de eliminar la barrera "${name}"?`)) {
      try {
        const { error } = await supabase
          .from("barriers")
          .delete()
          .eq("id", id);

        if (error) throw error;

        setBarriers(barriers.filter((barrier) => barrier.id !== id));
        toast({
          title: "Barrera eliminada",
          description: `Se ha eliminado "${name}" correctamente.`,
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Error al eliminar la barrera",
          variant: "destructive",
        });
      }
    }
  };

  const startEditing = (barrier: Barrier) => {
    setEditBarrier({ ...barrier });
    setIsEditing(barrier.id);
  };

  const cancelAction = () => {
    setIsAdding(false);
    setIsEditing(null);
    setNewBarrier({ name: "", description: "" });
  };

  const filteredBarriers = barriers.filter(
    (barrier) =>
      barrier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      barrier.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Barreras de Aprendizaje</h1>
            <p className="text-gray-600">
              Gestiona las barreras de aprendizaje para identificar necesidades específicas
            </p>
          </div>
          <Button 
            onClick={() => setIsAdding(true)} 
            className="mt-4 md:mt-0 gap-2"
            disabled={isAdding}
          >
            <Plus size={18} /> Agregar Barrera
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar barreras..."
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
            <div className="bg-white rounded-lg shadow-md p-6">
              {isAdding && (
                <form onSubmit={handleAddSubmit} className="mb-8 bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Agregar Nueva Barrera</h3>
                    <Button variant="ghost" size="sm" onClick={cancelAction} className="h-8 w-8 p-0">
                      <X size={18} />
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre de la Barrera
                      </label>
                      <input
                        id="name"
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/70"
                        value={newBarrier.name}
                        onChange={(e) => setNewBarrier({ ...newBarrier, name: e.target.value })}
                        placeholder="Ej. Dificultad en la memoria de trabajo"
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
                        value={newBarrier.description}
                        onChange={(e) => setNewBarrier({ ...newBarrier, description: e.target.value })}
                        placeholder="Describe brevemente esta barrera de aprendizaje"
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

              {filteredBarriers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No se encontraron barreras de aprendizaje.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBarriers.map((barrier) => (
                    <div
                      key={barrier.id}
                      className={`bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
                        isEditing === barrier.id ? "ring-2 ring-primary" : ""
                      }`}
                    >
                      {isEditing === barrier.id ? (
                        <form onSubmit={handleEditSubmit} className="p-4">
                          <div className="mb-4">
                            <label htmlFor={`edit-name-${barrier.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                              Nombre de la Barrera
                            </label>
                            <input
                              id={`edit-name-${barrier.id}`}
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/70"
                              value={editBarrier.name}
                              onChange={(e) => setEditBarrier({ ...editBarrier, name: e.target.value })}
                            />
                          </div>
                          
                          <div className="mb-4">
                            <label htmlFor={`edit-description-${barrier.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                              Descripción
                            </label>
                            <textarea
                              id={`edit-description-${barrier.id}`}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/70"
                              rows={3}
                              value={editBarrier.description}
                              onChange={(e) => setEditBarrier({ ...editBarrier, description: e.target.value })}
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
                          <h3 className="text-lg font-semibold mb-2 text-gray-900">{barrier.name}</h3>
                          <p className="text-gray-600 text-sm mb-4">{barrier.description}</p>
                          
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEditing(barrier)}
                              className="h-8 w-8 p-0"
                              title="Editar"
                            >
                              <Edit size={16} />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(barrier.id, barrier.name)}
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
          )}
        </div>
      </div>
    </div>
  );
};

export default Barriers;
