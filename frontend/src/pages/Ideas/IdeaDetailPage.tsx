import { useState } from "react";
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
} from "@/components";
import type { CommentsSection } from "@/components/common/CommentsSection";
import { ideasService } from "@/services/ideas.service";
import { useAuthStore } from "@/stores/authStore";
import { formatDate } from "@/utils/formatDate";

export function IdeaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Fetch idea details
  const { data: idea, isLoading } = useQuery({
    queryKey: ["idea", id],
    queryFn: () => ideasService.getIdea(Number(id)),
    enabled: !!id,
  });

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: () => ideasService.vote(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["idea", id] });
      toast.success("Voto registrado!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Erro ao votar");
    },
  });

  // Volunteer mutation
  const volunteerMutation = useMutation({
    mutationFn: () => ideasService.volunteer(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["idea", id] });
      toast.success("Você se voluntariou para apresentar esta ideia!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Erro ao voluntariar-se");
    },
  });

  // Unvolunteer mutation
  const unvolunteerMutation = useMutation({
    mutationFn: () => ideasService.unvolunteer(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["idea", id] });
      toast.success("Você removeu sua candidatura");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.detail || "Erro ao remover candidatura",
      );
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
            Ideia não encontrada
          </h2>
          <Button onClick={() => navigate("/ideas")}>Voltar para ideias</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6"
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
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                {idea.titulo}
              </h1>
              {idea.is_owner && (
                <Button
                  variant="ghost"
                  onClick={() => navigate(`/ideas/${id}/edit`)}
                >
                  Editar
                </Button>
              )}
            </div>

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
              <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                {idea.vote_count}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {idea.vote_count === 1 ? "voto" : "votos"}
              </div>
            </div>
            <Button
              onClick={handleVote}
              disabled={voteMutation.isPending}
              className="w-full"
              variant={idea.has_voted ? "secondary" : "primary"}
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
                    <path d="M5 15l7-7 7 7" />
                  </svg>
                  Votado
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                  Votar
                </>
              )}
            </Button>
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
                    variant="ghost"
                    className="w-full"
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

            {idea.data_agendada && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Data agendada
                </div>
                <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
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
              </div>
            )}
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
    </MainLayout>
  );
}
