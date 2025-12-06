import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { handleApiError } from "@/utils/errorHandler";
import { invalidateIdeaQueries } from "@/utils/queryInvalidation";
import {
  MainLayout,
  Loading,
  Button,
  CalendarView,
  CalendarLegend,
  Modal,
} from "@/components";
import { AnimatedPage } from "@/components/animations";
import { ideasService } from "@/services/ideas.service";
import type { IdeaListItem } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function CalendarPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedIdea, setSelectedIdea] = useState<IdeaListItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch all scheduled ideas for the calendar
  const { data: timelineData, isLoading } = useQuery({
    queryKey: ["timeline-ideas"],
    queryFn: () => ideasService.getTimeline(1000), // Get all scheduled ideas
  });

  const scheduledIdeas = timelineData?.results || [];

  // Mutation for rescheduling
  const rescheduleMutation = useMutation({
    mutationFn: ({ id, date }: { id: number; date: string }) =>
      ideasService.reschedule(id, date),
    onMutate: async ({ id, date }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["timeline-ideas"] });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(["timeline-ideas"]);

      // Optimistically update
      queryClient.setQueryData(["timeline-ideas"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          results: old.results.map((idea: IdeaListItem) =>
            idea.id === id ? { ...idea, data_agendada: date } : idea,
          ),
        };
      });

      return { previousData };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(["timeline-ideas"], context.previousData);
      }
      handleApiError(error, "Erro ao reagendar apresentação");
      console.error("Reschedule error:", error);
    },
    onSuccess: (data) => {
      toast.success("Apresentação reagendada com sucesso!");
      // Invalida todas as queries relacionadas para sincronizar todas as páginas
      invalidateIdeaQueries(queryClient, data.id);
    },
  });

  // Handle event drop (drag & drop)
  const handleEventDrop = (ideaId: number, newDate: string) => {
    rescheduleMutation.mutate({ id: ideaId, date: newDate });
  };

  // Handle event click
  const handleEventClick = (idea: IdeaListItem) => {
    setSelectedIdea(idea);
    setIsModalOpen(true);
  };

  // Handle close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedIdea(null);
  };

  // Handle view details
  const handleViewDetails = () => {
    if (selectedIdea) {
      navigate(`/ideas/${selectedIdea.id}`);
    }
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

  return (
    <MainLayout>
      <AnimatedPage>
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Calendário Interativo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Visualize e gerencie as apresentações agendadas com drag & drop
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600 dark:text-blue-400"
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
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {scheduledIdeas.length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Apresentações Agendadas
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <svg
                  className="w-6 h-6 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {
                    scheduledIdeas.filter((idea) => idea.apresentador !== null)
                      .length
                  }
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Com Apresentador
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <svg
                  className="w-6 h-6 text-amber-600 dark:text-amber-400"
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
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {
                    scheduledIdeas.filter((idea) => idea.apresentador === null)
                      .length
                  }
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sem Apresentador
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar + Legend */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-3">
            <CalendarView
              ideas={scheduledIdeas}
              onEventDrop={handleEventDrop}
              onEventClick={handleEventClick}
              editable={true}
              loading={rescheduleMutation.isPending}
            />
          </div>

          {/* Legend */}
          <div className="lg:col-span-1">
            <CalendarLegend />

            {/* Quick Actions */}
            <div className="mt-4 space-y-2">
              <Button
                onClick={() => navigate("/ideas/new")}
                className="w-full"
                variant="primary"
              >
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Nova Ideia
              </Button>

              <Button
                onClick={() => navigate("/ideas")}
                className="w-full"
                variant="secondary"
              >
                Ver Todas as Ideias
              </Button>

              <Button
                onClick={() => navigate("/timeline")}
                className="w-full"
                variant="secondary"
              >
                Timeline
              </Button>
            </div>
          </div>
        </div>

        {/* Event Details Modal */}
        {selectedIdea && (
          <Modal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            title={selectedIdea.titulo}
          >
            <div className="space-y-4">
              {/* Image */}
              {selectedIdea.imagem && (
                <img
                  src={selectedIdea.imagem}
                  alt={selectedIdea.titulo}
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}

              {/* Description */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descrição
                </h4>
                <p className="text-gray-900 dark:text-gray-100">
                  {selectedIdea.descricao}
                </p>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Autor
                  </h4>
                  <p className="text-gray-900 dark:text-gray-100">
                    {selectedIdea.autor.username}
                  </p>
                </div>

                {selectedIdea.apresentador && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Apresentador
                    </h4>
                    <p className="text-gray-900 dark:text-gray-100">
                      {selectedIdea.apresentador.username}
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </h4>
                  <p className="text-gray-900 dark:text-gray-100 capitalize">
                    {selectedIdea.status}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Prioridade
                  </h4>
                  <p className="text-gray-900 dark:text-gray-100 capitalize">
                    {selectedIdea.prioridade}
                  </p>
                </div>

                {selectedIdea.data_agendada && (
                  <div className="col-span-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Data Agendada
                    </h4>
                    <p className="text-gray-900 dark:text-gray-100">
                      {format(
                        new Date(selectedIdea.data_agendada),
                        "dd 'de' MMMM 'de' yyyy 'às' HH:mm",
                        { locale: ptBR },
                      )}
                    </p>
                  </div>
                )}

                <div className="col-span-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Votos
                  </h4>
                  <p className="text-gray-900 dark:text-gray-100">
                    ❤️ {selectedIdea.vote_count || 0}
                  </p>
                </div>
              </div>

              {/* Tags */}
              {selectedIdea.tags && selectedIdea.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedIdea.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="px-2 py-1 text-xs rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                      >
                        {tag.nome}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button onClick={handleViewDetails} className="flex-1">
                  Ver Detalhes Completos
                </Button>
                <Button onClick={handleCloseModal} variant="secondary">
                  Fechar
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Help Section */}
        <div className="mt-8 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
          <div className="flex gap-3">
            <svg
              className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="text-sm text-indigo-900 dark:text-indigo-200">
              <p className="font-medium mb-1">Como usar o calendário</p>
              <ul className="list-disc list-inside text-indigo-700 dark:text-indigo-300 space-y-1">
                <li>Clique em um evento para ver detalhes</li>
                <li>Arraste e solte eventos para reagendar apresentações</li>
                <li>
                  Use os botões no topo para alternar entre visualizações (Mês,
                  Semana, Dia, Lista)
                </li>
                <li>
                  As cores de fundo indicam o status e a borda a prioridade
                </li>
              </ul>
            </div>
          </div>
        </div>
      </AnimatedPage>
    </MainLayout>
  );
}
