import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export interface Student {
  id: string;
  name: string;
  grade: string;
}

interface StudentSelectorProps {
  selectedStudent: Student | null;
  onStudentChange: (student: Student) => void;
}

export const StudentSelector = ({ selectedStudent, onStudentChange }: StudentSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newStudent, setNewStudent] = useState<Omit<Student, "id">>({
    name: "",
    grade: "",
  });

  // Cargar los estudiantes de la base de datos
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("students")
          .select("id, name, grade")
          .order("name");

        if (error) throw error;
        setStudents(data || []);
      } catch (error) {
        console.error("Error al cargar estudiantes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const handleNewStudentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewStudent((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectStudent = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (student) {
      onStudentChange(student);
      setOpen(false);
    }
  };

  const handleCreateNewStudent = () => {
    if (newStudent.name && newStudent.grade) {
      const tempStudent: Student = {
        id: "new", // Este ID será reemplazado en el componente principal
        name: newStudent.name,
        grade: newStudent.grade,
      };
      
      onStudentChange(tempStudent);
      setNewStudent({ name: "", grade: "" });
      setIsCreatingNew(false);
      setOpen(false);
    }
  };

  const filteredStudents = searchQuery
    ? students.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.grade.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : students;

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedStudent
              ? selectedStudent.name
              : "Seleccionar estudiante..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0">
          <Command>
            <CommandInput 
              placeholder="Buscar estudiante..." 
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            {loading ? (
              <div className="py-6 text-center text-sm">Cargando estudiantes...</div>
            ) : (
              <>
                <CommandEmpty>
                  {isCreatingNew ? (
                    <div className="p-2">
                      <div className="space-y-4 p-2">
                        <div>
                          <Label htmlFor="name">Nombre del estudiante</Label>
                          <Input
                            id="name"
                            name="name"
                            value={newStudent.name}
                            onChange={handleNewStudentChange}
                            placeholder="Nombre completo"
                          />
                        </div>
                        <div>
                          <Label htmlFor="grade">Grado/Curso</Label>
                          <Input
                            id="grade"
                            name="grade"
                            value={newStudent.grade}
                            onChange={handleNewStudentChange}
                            placeholder="Ej. 3° Básico"
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setIsCreatingNew(false)}
                          >
                            Cancelar
                          </Button>
                          <Button 
                            size="sm"
                            onClick={handleCreateNewStudent}
                            disabled={!newStudent.name || !newStudent.grade}
                          >
                            Crear
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 text-center text-sm">
                      <p>No se encontraron estudiantes</p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => setIsCreatingNew(true)}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Crear nuevo estudiante
                      </Button>
                    </div>
                  )}
                </CommandEmpty>
                <CommandGroup>
                  {filteredStudents.map((student) => (
                    <CommandItem
                      key={student.id}
                      value={student.id}
                      onSelect={() => handleSelectStudent(student.id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedStudent?.id === student.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span>{student.name}</span>
                        <span className="text-xs text-gray-500">{student.grade}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
                {!isCreatingNew && filteredStudents.length > 0 && (
                  <div className="border-t p-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start"
                      onClick={() => setIsCreatingNew(true)}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Crear nuevo estudiante
                    </Button>
                  </div>
                )}
              </>
            )}
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default StudentSelector; 