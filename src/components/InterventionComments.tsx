import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { MessageSquare, Send, User, Loader2, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

// Interface for comments
interface Comment {
  id: string;
  author_id: string;
  author_name: string;
  author_lastname: string | null;
  author_subject: string | null;
  created_at: string;
  content: string;
  isCurrentUser: boolean;
}

interface Profile {
  id: string;
  name: string | null;
  lastname: string | null;
  subject: string | null;
}

interface InterventionCommentsProps {
  interventionId: string;
}

const InterventionComments = ({ interventionId }: InterventionCommentsProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar perfiles y comentarios al montar el componente
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [interventionId, user]);

  // Cargar todos los perfiles primero y luego los comentarios
  const loadData = async () => {
    setIsLoading(true);
    try {
      // Realizar una única consulta directa con JOIN a la base de datos
      const { data, error } = await supabase.rpc('get_comments_with_profiles', { 
        intervention_id_param: interventionId 
      });

      if (error) {
        console.error('Error al ejecutar RPC:', error);
        
        // Plan B: Usar una consulta SQL directa
        await fetchCommentsWithSQL();
      } else if (data && data.length > 0) {
        processComments(data);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos necesarios",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Consulta SQL directa como alternativa
  const fetchCommentsWithSQL = async () => {
    try {
      const { data, error } = await supabase.from('intervention_comments')
        .select(`
          id,
          author_id,
          content,
          created_at,
          profiles (
            id,
            name,
            lastname,
            subject
          )
        `)
        .eq('intervention_id', interventionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      if (data && data.length > 0) {
        console.log("Datos obtenidos con JOIN:", data);
        processComments(data);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error('Error en consulta SQL:', error);
      
      // Plan C: Cargar primero perfiles y luego comentarios
      const profilesMap = await loadAllProfiles();
      await loadCommentsWithProfiles(profilesMap);
    }
  };

  // Cargar todos los perfiles
  const loadAllProfiles = async () => {
    try {
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) throw error;

      // Crear mapa de perfiles indexado por ID
      const profilesMap: Record<string, Profile> = {};
      for (const profile of profilesData || []) {
        profilesMap[profile.id] = profile;
      }

      console.log("Todos los perfiles cargados:", profilesMap);
      setProfiles(profilesMap);
      return profilesMap;
    } catch (error) {
      console.error('Error al cargar perfiles:', error);
      return {};
    }
  };

  // Cargar comentarios usando los perfiles ya cargados
  const loadCommentsWithProfiles = async (profilesMap: Record<string, Profile>) => {
    try {
      const { data: commentsData, error } = await supabase
        .from('intervention_comments')
        .select('*')
        .eq('intervention_id', interventionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      console.log("Comentarios obtenidos separadamente:", commentsData);
      
      // Procesar los comentarios con los perfiles ya cargados
      const processedComments = (commentsData || []).map(comment => {
        const profile = profilesMap[comment.author_id];
        console.log(`Procesando comentario ${comment.id}, autor: ${comment.author_id}, perfil:`, profile);
        
        return {
          id: comment.id,
          author_id: comment.author_id,
          author_name: profile?.name || 'Usuario',
          author_lastname: profile?.lastname || '',
          author_subject: profile?.subject || 'Sin asignatura',
          created_at: comment.created_at,
          content: comment.content,
          isCurrentUser: comment.author_id === user?.id
        };
      });

      console.log("Comentarios procesados:", processedComments);
      setComments(processedComments);
    } catch (error) {
      console.error('Error al cargar comentarios:', error);
      setComments([]);
    }
  };

  // Procesar datos combinados de comentarios y perfiles
  const processComments = (data: any[]) => {
    const processedComments = data.map(item => {
      // Extraer perfil dependiendo de la estructura que venga
      const profile = item.profiles || {};
      
      return {
        id: item.id,
        author_id: item.author_id,
        author_name: profile.name || 'Usuario',
        author_lastname: profile.lastname || '',
        author_subject: profile.subject || 'Sin asignatura',
        created_at: item.created_at,
        content: item.content,
        isCurrentUser: item.author_id === user?.id
      };
    });
    
    console.log("Comentarios procesados finales:", processedComments);
    setComments(processedComments);
    
    // Extraer perfiles para reusar en nuevos comentarios
    const profilesMap: Record<string, Profile> = {};
    data.forEach(item => {
      const profile = item.profiles;
      if (profile && profile.id) {
        profilesMap[profile.id] = profile;
      }
    });
    
    setProfiles(profilesMap);
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      toast({
        title: "Error",
        description: "El comentario no puede estar vacío",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Obtener el ID del usuario actual
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        throw new Error('No se pudo identificar al usuario actual');
      }

      // Guardar comentario en la base de datos
      const { data: commentData, error: commentError } = await supabase
        .from('intervention_comments')
        .insert([{
          intervention_id: interventionId,
          author_id: currentUser.id,
          content: newComment.trim()
        }])
        .select()
        .single();
      
      if (commentError) throw commentError;

      // Obtener perfil del usuario actual
      let userProfile = profiles[currentUser.id];
      
      // Si no está en el caché, obtenerlo directamente
      if (!userProfile) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('name, lastname, subject')
          .eq('id', currentUser.id)
          .single();
          
        if (profileError) {
          console.error('Error al obtener perfil:', profileError);
        } else {
          userProfile = profile;
          // Actualizar el caché de perfiles
          setProfiles({
            ...profiles,
            [currentUser.id]: profile
          });
        }
      }

      // Crear objeto de comentario
      const newCommentObj: Comment = {
        id: commentData.id,
        author_id: currentUser.id,
        author_name: 'Tú', // Para comentarios propios, siempre mostrar "Tú"
        author_lastname: userProfile?.lastname || '',
        author_subject: userProfile?.subject || 'Sin asignatura',
        created_at: commentData.created_at,
        content: commentData.content,
        isCurrentUser: true
      };

      setComments([...comments, newCommentObj]);
      setNewComment('');
      
      toast({
        title: "Comentario agregado",
        description: "Tu observación ha sido añadida correctamente."
      });
    } catch (error: any) {
      console.error('Error al agregar comentario:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo agregar el comentario",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-4">
        <Loader2 className="h-5 w-5 text-primary animate-spin" />
        <span className="ml-2">Cargando comentarios...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <MessageSquare size={14} className="text-primary" />
        <h3 className="text-sm font-medium">Observaciones y seguimiento</h3>
      </div>
      
      {comments.length === 0 ? (
        <div className="text-center py-3 text-gray-500 text-xs">
          <p>No hay observaciones registradas. Sé el primero en añadir un comentario de seguimiento.</p>
        </div>
      ) : (
        <div className="space-y-2 mb-2 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
          {comments.map(comment => {
            return (
              <div 
                key={comment.id} 
                className={cn(
                  "p-2 rounded-lg border space-y-1 break-words",
                  comment.isCurrentUser 
                    ? "ml-auto bg-primary/10 border-primary/20 rounded-tr-none max-w-[75%]" 
                    : "mr-auto bg-gray-50 border-gray-200 rounded-tl-none max-w-[75%]"
                )}
              >
                <div className={cn(
                  "flex items-center gap-1",
                  comment.isCurrentUser ? "justify-end" : "justify-start"
                )}>
                  {!comment.isCurrentUser && <User size={12} className="text-gray-500" />}
                  <div className={cn(
                    "flex flex-col",
                    comment.isCurrentUser ? "items-end" : "items-start"
                  )}>
                    <span className="font-medium text-xs">
                      {comment.isCurrentUser 
                        ? "Tú"
                        : `${comment.author_name || 'Usuario'} ${comment.author_lastname || ''}`
                      }
                    </span>
                    <div className="flex items-center text-xs text-gray-500 gap-1">
                      <BookOpen size={9} />
                      <span className="text-[10px]">{comment.author_subject}</span>
                    </div>
                  </div>
                  {comment.isCurrentUser && <User size={12} className="text-primary" />}
                </div>
                <p className={cn(
                  "whitespace-pre-wrap text-xs overflow-hidden",
                  comment.isCurrentUser ? "text-gray-800" : "text-gray-700"
                )}>
                  {comment.content}
                </p>
                <div className={cn(
                  "text-[10px] text-gray-500",
                  comment.isCurrentUser ? "text-right" : "text-left"
                )}>
                  {formatDate(comment.created_at)}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <div className="bg-gray-50 p-2 rounded-lg border">
        <Textarea
          placeholder="Escriba un comentario de seguimiento para esta intervención..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="mb-1 text-xs p-2 min-h-[60px] max-h-[100px]"
          rows={2}
        />
        <div className="flex justify-end">
          <Button 
            onClick={handleSubmitComment} 
            disabled={isSubmitting} 
            size="sm" 
            className="gap-1 text-xs py-1 h-6"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={10} className="animate-spin" /> Enviando...
              </>
            ) : (
              <>
                <Send size={10} /> Añadir
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InterventionComments; 