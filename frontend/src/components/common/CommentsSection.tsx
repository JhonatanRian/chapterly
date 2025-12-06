import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Comment } from '@/types';
import { commentsService } from '@/services/comments.service';
import { Avatar } from './Avatar';
import { Textarea } from '../forms/Textarea';
import { Button } from '../buttons/Button';
import { ConfirmModal } from './ConfirmModal';
import { formatDate } from '@/utils/formatDate';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/authStore';

interface CommentsSectionProps {
  ideaId: number;
  comments: Comment[];
  className?: string;
}

interface CommentItemProps {
  comment: Comment;
  ideaId: number;
  onReply: (commentId: number) => void;
  level?: number;
}

function CommentItem({ comment, ideaId, onReply, level = 0 }: CommentItemProps) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.conteudo);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isOwner = user?.id === comment.user.id;
  const maxLevel = 2; // Limit nesting to 2 levels

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: () => commentsService.updateComment(comment.id, editContent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['idea', ideaId] });
      toast.success('Comentário atualizado!');
      setIsEditing(false);
    },
    onError: () => {
      toast.error('Erro ao atualizar comentário');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => commentsService.deleteComment(comment.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['idea', ideaId] });
      toast.success('Comentário excluído!');
      setShowDeleteModal(false);
    },
    onError: () => {
      toast.error('Erro ao excluir comentário');
    },
  });

  const handleUpdate = () => {
    if (!editContent.trim()) {
      toast.error('Comentário não pode estar vazio');
      return;
    }
    updateMutation.mutate();
  };

  const handleCancelEdit = () => {
    setEditContent(comment.conteudo);
    setIsEditing(false);
  };

  return (
    <div className={cn('space-y-3', level > 0 && 'ml-8')}>
      <div className="flex items-start gap-3">
        <Avatar user={comment.user} size="sm" />

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
              {comment.user.first_name} {comment.user.last_name}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(comment.created_at, 'relative')}
            </span>
            {comment.updated_at !== comment.created_at && (
              <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                (editado)
              </span>
            )}
          </div>

          {/* Content */}
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                disabled={updateMutation.isPending}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleUpdate}
                  disabled={updateMutation.isPending}
                >
                  Salvar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  disabled={updateMutation.isPending}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">
              {comment.conteudo}
            </p>
          )}

          {/* Actions */}
          {!isEditing && (
            <div className="flex items-center gap-3 mt-2">
              {level < maxLevel && (
                <button
                  onClick={() => onReply(comment.id)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                >
                  Responder
                </button>
              )}
              {isOwner && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-medium"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
                  >
                    Excluir
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {comment.respostas && comment.respostas.length > 0 && (
        <div className="space-y-3">
          {comment.respostas.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              ideaId={ideaId}
              onReply={onReply}
              level={level + 1}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Excluir Comentário"
        message="Tem certeza que deseja excluir este comentário? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        confirmVariant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

export function CommentsSection({ ideaId, comments, className }: CommentsSectionProps) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: { conteudo: string; parentId?: number }) =>
      commentsService.createComment(ideaId, data.conteudo, data.parentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['idea', ideaId] });
      toast.success('Comentário adicionado!');
      setCommentText('');
      setReplyTo(null);
    },
    onError: () => {
      toast.error('Erro ao adicionar comentário');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) {
      toast.error('Comentário não pode estar vazio');
      return;
    }
    createMutation.mutate({
      conteudo: commentText,
      parentId: replyTo || undefined,
    });
  };

  const handleReply = (commentId: number) => {
    setReplyTo(commentId);
    // Scroll to form (optional)
    const form = document.getElementById('comment-form');
    form?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const replyToComment = replyTo
    ? comments.find((c) => c.id === replyTo) ||
      comments.flatMap((c) => c.respostas || []).find((r) => r.id === replyTo)
    : null;

  return (
    <div className={cn('space-y-6', className)}>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        Comentários ({comments.length})
      </h2>

      {/* Comment Form */}
      <form id="comment-form" onSubmit={handleSubmit} className="space-y-3">
        {replyTo && replyToComment && (
          <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-sm">
            <span className="text-gray-700 dark:text-gray-300">
              Respondendo a{' '}
              <span className="font-medium">
                {replyToComment.user.first_name} {replyToComment.user.last_name}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="ml-auto text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        <div className="flex items-start gap-3">
          <Avatar user={user} size="sm" />
          <div className="flex-1">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Deixe seu comentário..."
              rows={3}
              disabled={createMutation.isPending}
            />
            <div className="flex items-center justify-end gap-2 mt-2">
              {replyTo && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyTo(null)}
                  disabled={createMutation.isPending}
                >
                  Cancelar
                </Button>
              )}
              <Button
                type="submit"
                size="sm"
                disabled={createMutation.isPending || !commentText.trim()}
              >
                {createMutation.isPending ? 'Enviando...' : 'Comentar'}
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              ideaId={ideaId}
              onReply={handleReply}
            />
          ))
        ) : (
          <div className="text-center py-8">
            <svg
              className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">
              Nenhum comentário ainda. Seja o primeiro!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
