import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { MainLayout, TimelineCard, Loading, Button } from "@/components";
import { AnimatedPage } from "@/components/animations";
import { ideasService } from "@/services/ideas.service";
import { useState } from "react";
import type { IdeaStatus } from "@/types";

export function TimelinePage() {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState<IdeaStatus | "all">("all");

  // Fetch timeline
  const { data: timelineData, isLoading } = useQuery({
    queryKey: ["timeline-full"],
    queryFn: () => ideasService.getTimeline(100),
  });

  const allIdeas = timelineData?.results || [];

  // Filter by status
  const filteredIdeas =
    filterStatus === "all"
      ? allIdeas
      : allIdeas.filter((idea) => idea.status === filterStatus);

  // Group by date
  const groupedByDate = filteredIdeas.reduce(
    (acc, idea) => {
      if (!idea.data_agendada) return acc;

      const date = new Date(idea.data_agendada);
      const dateKey = date.toLocaleDateString("pt-BR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(idea);

      return acc;
    },
    {} as Record<string, typeof allIdeas>,
  );

  const dates = Object.keys(groupedByDate).sort((a, b) => {
    const dateA = new Date(groupedByDate[a][0].data_agendada || "").getTime();
    const dateB = new Date(groupedByDate[b][0].data_agendada || "").getTime();
    return dateA - dateB;
  });

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
            Timeline
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Acompanhe todas as atividades e apresentações agendadas
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Filtrar por status:
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === "all"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                Todos ({allIdeas.length})
              </button>
              <button
                onClick={() => setFilterStatus("agendado")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === "agendado"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                Agendado (
                {allIdeas.filter((i) => i.status === "agendado").length})
              </button>
              <button
                onClick={() => setFilterStatus("concluido")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === "concluido"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                Concluído (
                {allIdeas.filter((i) => i.status === "concluido").length})
              </button>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {filteredIdeas.length}{" "}
            {filteredIdeas.length === 1 ? "apresentação" : "apresentações"}
          </p>
        </div>

        {/* Timeline */}
        <div className="space-y-8">
          {dates.length > 0 ? (
            dates.map((dateKey, dateIndex) => {
              const ideas = groupedByDate[dateKey];
              const isUpcoming =
                new Date(ideas[0].data_agendada || "") > new Date();
              const isPast =
                new Date(ideas[0].data_agendada || "") < new Date();

              return (
                <div key={dateKey}>
                  {/* Date Header */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-shrink-0">
                      <div
                        className={`px-4 py-2 rounded-lg font-semibold ${
                          isUpcoming
                            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                            : isPast
                              ? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                              : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        }`}
                      >
                        {dateKey}
                      </div>
                    </div>
                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                    {isUpcoming && (
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                        Em breve
                      </span>
                    )}
                    {isPast && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        Concluído
                      </span>
                    )}
                  </div>

                  {/* Ideas for this date */}
                  <div className="space-y-4 pl-6 border-l-2 border-gray-200 dark:border-gray-700">
                    {ideas.map((idea, ideaIndex) => {
                      // Check if presentation is today
                      const isToday = idea.data_agendada
                        ? new Date(idea.data_agendada).toDateString() ===
                          new Date().toDateString()
                        : false;

                      // Highlight if it's today or the very first presentation in the timeline
                      const isFirstInTimeline =
                        dateIndex === 0 && ideaIndex === 0;
                      const shouldHighlight = isToday || isFirstInTimeline;

                      return (
                        <TimelineCard
                          key={idea.id}
                          idea={idea}
                          onClick={() => navigate(`/ideas/${idea.id}`)}
                          showDate={false}
                          highlighted={shouldHighlight}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Nenhuma atividade encontrada
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {filterStatus === "all"
                  ? "Não há apresentações agendadas no momento"
                  : `Não há apresentações com status "${filterStatus}"`}
              </p>
              <Button onClick={() => navigate("/ideas")}>
                Ver todas as ideias
              </Button>
            </div>
          )}
        </div>

        {/* Stats Footer */}
        {filteredIdeas.length > 0 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-6 border border-indigo-200 dark:border-indigo-800">
              <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                {allIdeas.filter((i) => i.status === "agendado").length}
              </div>
              <div className="text-sm text-indigo-900 dark:text-indigo-200">
                Apresentações agendadas
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                {allIdeas.filter((i) => i.status === "concluido").length}
              </div>
              <div className="text-sm text-green-900 dark:text-green-200">
                Apresentações concluídas
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-6 border border-amber-200 dark:border-amber-800">
              <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-2">
                {
                  allIdeas.filter(
                    (i) => i.status === "agendado" && !i.apresentador,
                  ).length
                }
              </div>
              <div className="text-sm text-amber-900 dark:text-amber-200">
                Aguardando apresentador
              </div>
            </div>
          </div>
        )}
      </AnimatedPage>
    </MainLayout>
  );
}
