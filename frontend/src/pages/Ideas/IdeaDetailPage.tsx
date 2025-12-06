import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  MainLayout,
  StatusBadge,
  PriorityBadge,
  TagBadge,
  UserBadge,
  Button,
  Loading,
  Avatar,
  Modal,
  DateTimePicker,
  ConfirmModal,
} from "@/components";
import {
  AnimatedPage,
  AnimatedCounter,
  AnimatedButton,
} from "@/components/animations";
import { CommentsSection } from "@/components/common/CommentsSection";
import { ideasService } from "@/services/ideas.service";
import { formatDate } from "@/utils/formatDate";
import { handleApiError } from "@/utils/errorHandler";
import {
  invalidateIdeaQueries,
  updateIdeaInCache,
} from "@/utils/queryInvalidation";
import { useConfetti } from "@/hooks/useConfetti";
import { useIdeaPermissions } from "@/hooks/useIdeaPermissions";

export function IdeaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const voteButtonRef = useRef<HTMLDivElement>(null);
  const { fireExplosion } = useConfetti();

  // Fetch idea details
  const { data: idea, isLoading } = useQuery({
    queryKey: ["idea", id],
    queryFn: () => ideasService.getIdea(Number(id)),
    enabled: !!id,
  });

  // Fetch user permissions for this idea
  const { data: permissions } = useIdeaPermissions(id);

  // Vote mutation
  const voteMutation = useMutation({
    mutationKey: ["vote-idea", id],
    mutationFn: () => ideasService.vote(Number(id)),
    onSuccess: (data) => {
      // Atualiza optimistically
      updateIdeaInCache(queryClient, Number(id), (old: any) => ({
        ...old,
        has_voted: data.voted,
        vote_count: data.voted ? old.vote_count + 1 : old.vote_count - 1,
      }));
      // Invalida todas as queries relacionadas
      invalidateIdeaQueries(queryClient, Number(id));
      toast.success(data.voted ? "Hypado!" : "Hype removido!");

      // Disparar explosão de confetti ao hypar
      if (data.voted && voteButtonRef.current) {
        fireExplosion(voteButtonRef.current);
      }
    },
    onError: (error: any) => {
      handleApiError(error, "Erro ao hypar");
    },
  });

  // Volunteer mutation
  const volunteerMutation = useMutation({
    mutationKey: ["volunteer-idea", id],
    mutationFn: () => ideasService.volunteer(Number(id)),
    onSuccess: () => {
      // Invalida todas as queries relacionadas para sincronizar
      invalidateIdeaQueries(queryClient, Number(id));
      toast.success("Você se voluntariou para apresentar este tema!");
    },
    onError: (error: any) => {
      handleApiError(error, "Erro ao voluntariar-se");
    },
  });

  // Unvolunteer mutation
  const unvolunteerMutation = useMutation({
    mutationKey: ["unvolunteer-idea", id],
    mutationFn: () => ideasService.unvolunteer(Number(id)),
    onSuccess: () => {
      // Invalida todas as queries relacionadas para sincronizar
      invalidateIdeaQueries(queryClient, Number(id));
      toast.success("Você removeu sua candidatura");
    },
    onError: (error: any) => {
      handleApiError(error, "Erro ao remover candidatura");
    },
  });

  const handleVote = () => {
    voteMutation.mutate();
  };

  const handleVolunteer = () => {
    volunteerMutation.mutate();
  };

  const handleUnvolunteer = () => {
    unvolunteerMutation.mutate();
  };

  // Reschedule mutation
  const rescheduleMutation = useMutation({
    mutationFn: (data: { id: number; date: string }) =>
      ideasService.reschedule(data.id, data.date),
    onSuccess: () => {
      // Invalida todas as queries relacionadas (afeta calendário, dashboard, listas)
      invalidateIdeaQueries(queryClient, Number(id));
      toast.success("Apresentação agendada com sucesso!");
      setShowScheduleModal(false);
      setScheduledDate("");
    },
    onError: (error: any) => {
      handleApiError(error, "Erro ao agendar apresentação");
    },
  });

  const handleSchedule = () => {
    if (!scheduledDate) {
      toast.error("Selecione uma data e hora");
      return;
    }
    rescheduleMutation.mutate({ id: Number(id), date: scheduledDate });
  };

  const openScheduleModal = () => {
    setScheduledDate(idea?.data_agendada || "");
    setShowScheduleModal(true);
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => ideasService.deleteIdea(Number(id)),
    onSuccess: () => {
      toast.success("Tema excluído com sucesso!");
      navigate("/ideas");
    },
    onError: (error: any) => {
      handleApiError(error, "Erro ao excluir tema");
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loading />
        </div>
      </MainLayout>
    );
  }

  if (!idea) {
    return (
      <MainLayout>
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Tema não encontrado
          </h2>
          <Button onClick={() => navigate("/ideas")}>Voltar para temas</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <AnimatedPage>
        {/* Header with Back Button and Action Buttons */}
        <div className="flex items-center justify-between gap-4 mb-6">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span>Voltar</span>
          </button>

          {/* Action Buttons - Edit and Delete */}
          {(permissions?.editable || permissions?.deletable) && (
            <div className="flex gap-2">
              {permissions?.editable && (
                <Button
                  onClick={() => navigate(`/ideas/${id}/edit`)}
                  className="bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 flex items-center gap-2"
                >
                  ✏️ Editar
                </Button>
              )}
              {permissions?.deletable && (
                <Button
                  onClick={() => setShowDeleteModal(true)}
                  className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Deletar Tema
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Image */}
            {idea.imagem && (
              <div className="relative h-96 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700">
                <img
                  src={idea.imagem}
                  alt={idea.titulo}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Title & Meta */}
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                {idea.titulo}
              </h1>

              <div className="flex flex-wrap items-center gap-3 mb-4">
                <StatusBadge status={idea.status} />
                <PriorityBadge priority={idea.prioridade} />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Criado {formatDate(idea.created_at, "relative")}
                </span>
              </div>

              {/* Tags */}
              {idea.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {idea.tags.map((tag) => (
                    <TagBadge key={tag.id} tag={tag} />
                  ))}
                </div>
              )}

              {/* Description */}
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
                {idea.descricao}
              </p>
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Detalhes
              </h2>
              <div
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: idea.conteudo }}
              />
            </div>

            {/* Comments Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <CommentsSection
                ideaId={Number(id)}
                comments={idea.comentarios || []}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Vote Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="text-center mb-4">
                <div className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  <AnimatedCounter value={idea.vote_count} />
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {idea.vote_count === 1 ? "voto" : "votos"}
                </div>
              </div>

              <div ref={voteButtonRef}>
                <AnimatedButton
                  onClick={handleVote}
                  disabled={voteMutation.isPending}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    idea.has_voted
                      ? "bg-orange-500 text-white dark:bg-orange-600 shadow-lg shadow-orange-500/30"
                      : "bg-orange-500 text-white hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-500 shadow-md hover:shadow-lg hover:shadow-orange-500/30"
                  } ${voteMutation.isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {voteMutation.isPending ? (
                    <Loading />
                  ) : idea.has_voted ? (
                    <>
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12.5 2.5c.39 0 .77.23.93.59l2.5 5.59 5.57.81c.78.11 1.09 1.03.52 1.56l-4.03 3.93.95 5.51c.13.77-.68 1.36-1.37 1l-4.98-2.62-4.98 2.62c-.69.36-1.5-.23-1.37-1l.95-5.51-4.03-3.93c-.57-.53-.26-1.45.52-1.56l5.57-.81 2.5-5.59c.16-.36.54-.59.93-.59z" />
                      </svg>
                      Hypado!
                    </>
                  ) : (
                    <>🔥 Hypar</>
                  )}
                </AnimatedButton>
              </div>
            </div>

            {/* Presenter Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Apresentação
              </h3>

              {idea.apresentador ? (
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Apresentador
                    </div>
                    <UserBadge user={idea.apresentador} />
                  </div>

                  {idea.is_presenter && (
                    <Button
                      onClick={handleUnvolunteer}
                      disabled={unvolunteerMutation.isPending}
                      className="w-full bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
                    >
                      Cancelar candidatura
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    Aguardando apresentador
                  </p>
                  <Button
                    onClick={handleVolunteer}
                    disabled={volunteerMutation.isPending}
                    className="w-full"
                  >
                    {volunteerMutation.isPending ? (
                      <Loading />
                    ) : (
                      "Voluntariar-se para apresentar"
                    )}
                  </Button>
                </div>
              )}

              {/* Schedule Section */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                {idea.data_agendada ? (
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Data agendada
                    </div>
                    <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100 mb-3">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="font-medium">
                        {formatDate(idea.data_agendada, "full")}
                      </span>
                    </div>
                    {(idea.is_owner || idea.is_presenter) && (
                      <Button
                        onClick={openScheduleModal}
                        className="w-full text-sm bg-yellow-500 text-white hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        Reagendar apresentação
                      </Button>
                    )}
                  </div>
                ) : (
                  (idea.is_owner || idea.is_presenter) && (
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Esta apresentação ainda não foi agendada
                      </div>
                      <Button
                        onClick={openScheduleModal}
                        className="w-full bg-yellow-500 text-white hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        Agendar apresentação
                      </Button>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Author Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Autor
              </h3>
              <UserBadge user={idea.autor} showEmail />
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Criado em {formatDate(idea.created_at, "full")}
                </div>
                {idea.updated_at !== idea.created_at && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Atualizado {formatDate(idea.updated_at, "relative")}
                  </div>
                )}
              </div>
            </div>

            {/* Voters List */}
            {idea.votos && idea.votos.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Votantes ({idea.votos.length})
                </h3>
                <div className="space-y-2">
                  {idea.votos.slice(0, 5).map((vote) => (
                    <div key={vote.id} className="flex items-center gap-2">
                      <Avatar user={vote.user} size="xs" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {vote.user.first_name} {vote.user.last_name}
                      </span>
                    </div>
                  ))}
                  {idea.votos.length > 5 && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 pt-2">
                      +{idea.votos.length - 5} mais
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Schedule Modal */}
        <Modal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          title={
            idea.data_agendada
              ? "Reagendar Apresentação"
              : "Agendar Apresentação"
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Escolha a data e hora para a apresentação deste tema.
            </p>

            <DateTimePicker
              label="Data e Hora"
              value={scheduledDate}
              onChange={setScheduledDate}
              error=""
              disabled={rescheduleMutation.isPending}
              required
            />

            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="ghost"
                onClick={() => setShowScheduleModal(false)}
                disabled={rescheduleMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSchedule}
                disabled={rescheduleMutation.isPending || !scheduledDate}
                className="bg-yellow-500 text-white hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700"
              >
                {rescheduleMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <Loading />
                    <span>Agendando...</span>
                  </div>
                ) : idea.data_agendada ? (
                  "Reagendar"
                ) : (
                  "Agendar"
                )}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          title="Deletar Tema"
          message={`Tem certeza que deseja excluir "${idea?.titulo}"? Todos os comentários e votos também serão removidos. Esta ação não pode ser desfeita.`}
          confirmText="Deletar"
          cancelText="Cancelar"
          confirmVariant="danger"
          isLoading={deleteMutation.isPending}
        />
      </AnimatedPage>
    </MainLayout>
  );
}
