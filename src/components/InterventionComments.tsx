import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { MessageSquare, Send, User, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Interface for comments
interface Comment {
  id: string;
  author_id: string;
  author_name: string;
  created_at: string;
  content: string;
}

interface InterventionCommentsProps {
  interventionId: string;
}

const InterventionComments = ({ interventionId }: InterventionCommentsProps) => {
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar comentarios al montar el componente
  useEffect(() => {
    fetchComments();
  }, [interventionId]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      // Obtener comentarios de la intervención
      const { data: commentsData, error: commentsError } = await supabase
        .from('intervention_comments')
        .select('*')
        .eq('intervention_id', interventionId)
        .order('created_at', { ascending: true });
      
      if (commentsError) throw commentsError;

      // Obtener los perfiles de los autores de los comentarios
      const processedComments = await Promise.all((commentsData || []).map(async (comment) => {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('id', comment.author_id)
          .single();
        
        return {
          id: comment.id,
          author_id: comment.author_id,
          author_name: profileData?.name || profileData?.email || 'Usuario desconocido',
          created_at: comment.created_at,
          content: comment.content
        };
      }));

      setComments(processedComments);
    } catch (error) {
      console.error('Error al cargar comentarios:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los comentarios",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
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
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No se pudo identificar al usuario actual');
      }

      // Guardar comentario en la base de datos
      const { data: commentData, error: commentError } = await supabase
        .from('intervention_comments')
        .insert([{
          intervention_id: interventionId,
          author_id: user.id,
          content: newComment.trim()
        }])
        .select()
        .single();
      
      if (commentError) throw commentError;

      // Obtener perfil del usuario para mostrar el nombre
      const { data: profileData } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', user.id)
        .single();

      const newCommentObj: Comment = {
        id: commentData.id,
        author_id: user.id,
        author_name: profileData?.name || profileData?.email || 'Tú',
        created_at: commentData.created_at,
        content: commentData.content
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
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
        <span className="ml-2">Cargando comentarios...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare size={18} className="text-primary" />
        <h3 className="text-lg font-medium">Observaciones y seguimiento</h3>
      </div>
      
      {comments.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <p>No hay observaciones registradas. Sé el primero en añadir un comentario de seguimiento.</p>
        </div>
      ) : (
        <div className="space-y-4 mb-4">
          {comments.map(comment => (
            <div key={comment.id} className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-gray-500" />
                  <span className="font-medium">{comment.author_name}</span>
                </div>
                <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))}
        </div>
      )}
      
      <div className="bg-gray-50 p-4 rounded-lg border">
        <Textarea
          placeholder="Escriba un comentario de seguimiento para esta intervención..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="mb-2"
          rows={3}
        />
        <div className="flex justify-end">
          <Button 
            onClick={handleSubmitComment} 
            disabled={isSubmitting} 
            size="sm" 
            className="gap-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Enviando...
              </>
            ) : (
              <>
                <Send size={14} /> Añadir observación
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InterventionComments;
