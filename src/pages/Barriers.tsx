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

interface Barrier {
  id: string;
  name: string;
  description: string;
}

const Barriers = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [barriers, setBarriers] = useState<Barrier[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
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
  const [barrierToDelete, setBarrierToDelete] = useState<Barrier | null>(null);

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
      setIsAddDialogOpen(false);
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
        .eq("id", editBarrier.id);

      if (error) throw error;

      setBarriers(
        barriers.map((barrier) =>
          barrier.id === editBarrier.id ? editBarrier : barrier
        )
      );
      setIsEditDialogOpen(false);
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

  const confirmDelete = (barrier: Barrier) => {
    setBarrierToDelete(barrier);
  };

  const handleDelete = async () => {
    if (!barrierToDelete) return;
    
      try {
        const { error } = await supabase
          .from("barriers")
          .delete()
        .eq("id", barrierToDelete.id);

        if (error) throw error;

      setBarriers(barriers.filter((barrier) => barrier.id !== barrierToDelete.id));
        toast({
          title: "Barrera eliminada",
        description: `Se ha eliminado "${barrierToDelete.name}" correctamente.`,
        });
      setBarrierToDelete(null);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Error al eliminar la barrera",
          variant: "destructive",
        });
    }
  };

  const startEditing = (barrier: Barrier) => {
    setEditBarrier({ ...barrier });
    setIsEditDialogOpen(true);
  };

  const filteredBarriers = barriers.filter(
    (barrier) =>
      barrier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      barrier.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Barreras de Aprendizaje</h1>
            <p className="text-sm md:text-base text-gray-600">
              Gestiona las barreras de aprendizaje para identificar necesidades específicas
            </p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
          <Button 
                className="mt-4 md:mt-0 gap-2 w-full md:w-auto"
          >
            <Plus size={18} /> Agregar Barrera
          </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleAddSubmit}>
                <DialogHeader>
                  <DialogTitle>Agregar Nueva Barrera</DialogTitle>
                  <DialogDescription>
                    Ingresa los datos para crear una nueva barrera de aprendizaje
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
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
                    
                  <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-medium">
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
              placeholder="Buscar barreras..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/70"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
                  </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
              <span className="sr-only">Cargando barreras...</span>
            </div>
          ) : (
            <>
              {filteredBarriers.length === 0 ? (
                <div className="text-center py-10">
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No se encontraron barreras</h3>
                  <p className="text-gray-500 mb-4">Crea una nueva barrera o modifica tu búsqueda</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBarriers.map((barrier) => (
                    <Card
                      key={barrier.id}
                      className="overflow-hidden h-full transition-all"
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-semibold">{barrier.name}</CardTitle>
                      </CardHeader>
                      
                      <CardContent className="py-0">
                        <p className="text-gray-600 text-sm">{barrier.description}</p>
                      </CardContent>
                      
                      <CardFooter className="flex justify-end gap-2 pt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEditing(barrier)}
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
                              onClick={() => confirmDelete(barrier)}
                            >
                              <Trash2 size={16} />
                              <span className="sr-only">Eliminar</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción eliminará la barrera "{barrier.name}" permanentemente 
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
              
              {/* Diálogo para editar barrera */}
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                  <form onSubmit={handleEditSubmit}>
                    <DialogHeader>
                      <DialogTitle>Editar Barrera</DialogTitle>
                      <DialogDescription>
                        Actualiza los datos de la barrera de aprendizaje
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label htmlFor="edit-name" className="text-sm font-medium">
                          Nombre de la Barrera
                        </label>
                        <input
                          id="edit-name"
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/70"
                          value={editBarrier.name}
                          onChange={(e) => setEditBarrier({ ...editBarrier, name: e.target.value })}
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
                          value={editBarrier.description}
                          onChange={(e) => setEditBarrier({ ...editBarrier, description: e.target.value })}
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

export default Barriers;
