
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { MessageSquare, Send, User } from 'lucide-react';

// Interface for comments
interface Comment {
  id: string;
  author: string;
  date: Date;
  text: string;
}

interface InterventionCommentsProps {
  interventionId: string;
  initialComments?: Comment[];
}

const InterventionComments = ({ interventionId, initialComments = [] }: InterventionCommentsProps) => {
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitComment = () => {
    if (!newComment.trim()) {
      toast({
        title: "Error",
        description: "El comentario no puede estar vacío",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    // In a real app, you'd send this to your backend
    // Simulating an API call with a timeout
    setTimeout(() => {
      const comment: Comment = {
        id: Date.now().toString(),
        author: "Profesor Actual", // In a real app, get the current user's name
        date: new Date(),
        text: newComment.trim()
      };

      setComments([...comments, comment]);
      setNewComment('');
      setIsSubmitting(false);
      
      toast({
        title: "Comentario agregado",
        description: "Tu observación ha sido añadida correctamente."
      });
    }, 500);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  };

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
                  <span className="font-medium">{comment.author}</span>
                </div>
                <span className="text-xs text-gray-500">{formatDate(comment.date)}</span>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{comment.text}</p>
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
            <Send size={14} /> Añadir observación
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InterventionComments;
