import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  MainLayout,
  StatsCard,
  TimelineCard,
  FAB,
  StatsCardSkeleton,
  TimelineCardSkeleton,
} from "@/components";
import {
  AnimatedPage,
  AnimatedGrid,
  AnimatedGridItem,
} from "@/components/animations";
import { ideasService } from "@/services/ideas.service";
import { authService } from "@/services/auth.service";
import { useState, useMemo } from "react";

export function DashboardPage() {
  const navigate = useNavigate();
  const [showNewIdeaModal, setShowNewIdeaModal] = useState(false);

  // Fetch general stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: () => ideasService.getStats(),
  });

  // Fetch user stats
  const { data: userStats, isLoading: userStatsLoading } = useQuery({
    queryKey: ["user-stats"],
    queryFn: () => authService.getStats(),
  });

  // Fetch upcoming talks
  const { data: upcomingData, isLoading: upcomingLoading } = useQuery({
    queryKey: ["upcoming-talks"],
    queryFn: () => ideasService.getUpcoming(3),
  });

  // Fetch timeline (recent activities)
  const { data: timelineData, isLoading: timelineLoading } = useQuery({
    queryKey: ["timeline"],
    queryFn: () => ideasService.getTimeline(5),
  });

  const upcoming = upcomingData?.results || [];
  const timeline = timelineData?.results || [];

  // Find all presentations that should be highlighted
  // 1. All presentations scheduled for today (regardless of time)
  // 2. All presentations at the same time as the next upcoming one (if not today)
  const nextPresentationIds = useMemo(() => {
    const now = new Date();
    const todayDateString = now.toDateString();

    // Get all presentations scheduled for today that haven't happened yet
    const todaysFutureIdeas = timeline.filter((idea) => {
      if (!idea.data_agendada) return false;
      const ideaDate = new Date(idea.data_agendada);
      return ideaDate.toDateString() === todayDateString && ideaDate > now;
    });

    // If there are presentations today, highlight all of them
    if (todaysFutureIdeas.length > 0) {
      return todaysFutureIdeas.map((idea) => idea.id);
    }

    // Otherwise, find all presentations at the same time as the next upcoming one
    const futureIdeas = timeline.filter((idea) => {
      if (!idea.data_agendada) return false;
      return new Date(idea.data_agendada) > now;
    });

    if (futureIdeas.length === 0) return [];

    // Sort by date to find the earliest one
    futureIdeas.sort((a, b) => {
      const dateA = new Date(a.data_agendada || "").getTime();
      const dateB = new Date(b.data_agendada || "").getTime();
      return dateA - dateB;
    });

    // Get the time of the next upcoming presentation
    const nextTime = futureIdeas[0]?.data_agendada;

    // Return ALL presentations with this same datetime
    return futureIdeas
      .filter((idea) => idea.data_agendada === nextTime)
      .map((idea) => idea.id);
  }, [timeline]);

  // Get future timeline for display
  const now = new Date();
  const futureTimeline = timeline
    .filter((idea) => {
      if (!idea.data_agendada) return false;
      return new Date(idea.data_agendada) > now;
    })
    .sort((a, b) => {
      const dateA = a.data_agendada
        ? new Date(a.data_agendada).getTime()
        : Infinity;
      const dateB = b.data_agendada
        ? new Date(b.data_agendada).getTime()
        : Infinity;
      return dateA - dateB;
    });

  const nextTalk = upcoming[0];

  return (
    <MainLayout>
      <AnimatedPage>
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Visão geral do Chapterly
          </p>
        </div>

        {/* Stats Grid */}
        {statsLoading || userStatsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </div>
        ) : (
          <AnimatedGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <AnimatedGridItem>
              <StatsCard
                title="Total de Temas"
                value={stats?.total_ideias || 0}
                icon={
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                }
                description="Cadastradas no sistema"
                onClick={() => navigate("/ideas")}
              />
            </AnimatedGridItem>

            <AnimatedGridItem>
              <StatsCard
                title="Pendentes"
                value={stats?.pendentes || 0}
                icon={
                  <svg
                    className="w-6 h-6"
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
                }
                description="Aguardando votação"
              />
            </AnimatedGridItem>

            <AnimatedGridItem>
              <StatsCard
                title="Agendadas"
                value={stats?.agendadas || 0}
                icon={
                  <svg
                    className="w-6 h-6"
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
                }
                description="Programadas"
                onClick={() => navigate("/calendar")}
              />
            </AnimatedGridItem>

            <AnimatedGridItem>
              <StatsCard
                title="Apresentações"
                value={stats?.concluidas || 0}
                icon={
                  <svg
                    className="w-6 h-6"
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
                }
                description="Já realizadas"
              />
            </AnimatedGridItem>
          </AnimatedGrid>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Next Talk & Upcoming */}
          <div className="lg:col-span-2 space-y-8">
            {/* Next Talk Highlight */}
            {upcomingLoading ? (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Próxima Apresentação
                  </h2>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                    <div className="flex gap-4 pt-4">
                      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                    </div>
                  </div>
                </div>
              </section>
            ) : (
              nextTalk && (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      Próxima Apresentação
                    </h2>
                  </div>

                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold mb-2">
                          {nextTalk.titulo}
                        </h3>
                        <p className="text-indigo-100 mb-4">
                          {nextTalk.descricao}
                        </p>
                      </div>
                      {nextTalk.imagem && (
                        <img
                          src={nextTalk.imagem}
                          alt={nextTalk.titulo}
                          className="w-24 h-24 rounded-lg object-cover ml-4"
                        />
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-indigo-400">
                      <div className="flex items-center gap-4">
                        {nextTalk.apresentador && (
                          <div className="flex items-center gap-2">
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
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            <span className="font-medium">
                              {nextTalk.apresentador.first_name}{" "}
                              {nextTalk.apresentador.last_name}
                            </span>
                          </div>
                        )}
                        {nextTalk.data_agendada && (
                          <div className="flex items-center gap-2">
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
                            <span>
                              {new Date(
                                nextTalk.data_agendada,
                              ).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "long",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => navigate(`/ideas/${nextTalk.id}`)}
                        className="px-4 py-2 bg-white text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
                      >
                        Ver detalhes
                      </button>
                    </div>
                  </div>
                </section>
              )
            )}

            {/* Próximas Apresentações */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Próximas Apresentações
                </h2>
                <button
                  onClick={() => navigate("/timeline")}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                >
                  Ver tudo
                </button>
              </div>

              <div className="space-y-4">
                {timelineLoading ? (
                  <>
                    <TimelineCardSkeleton />
                    <TimelineCardSkeleton />
                    <TimelineCardSkeleton />
                  </>
                ) : futureTimeline.length > 0 ? (
                  futureTimeline.map((idea) => {
                    // Highlight if it's one of the presentations scheduled for today or at the same time as next
                    const shouldHighlight = nextPresentationIds.includes(
                      idea.id,
                    );

                    return (
                      <TimelineCard
                        key={idea.id}
                        idea={idea}
                        onClick={() => navigate(`/ideas/${idea.id}`)}
                        showDate
                        highlighted={shouldHighlight}
                      />
                    );
                  })
                ) : (
                  <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <svg
                      className="w-12 h-12 mx-auto mb-4 text-gray-400"
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
                    <p className="text-gray-500 dark:text-gray-400">
                      Nenhuma apresentação agendada
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right Column - Quick Stats & Actions */}
          <div className="space-y-6">
            {/* Minhas Estatísticas */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Minhas Estatísticas
              </h2>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Temas criados
                  </span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {userStats?.ideias_criadas || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Apresentações
                  </span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {userStats?.apresentacoes || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Votos dados
                  </span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {userStats?.votos_dados || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Votos recebidos
                  </span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {userStats?.votos_recebidos || 0}
                  </span>
                </div>
              </div>
            </section>

            {/* Quick Actions */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Ações Rápidas
              </h2>
              <div className="space-y-3">
                <button
                  onClick={() => setShowNewIdeaModal(true)}
                  className="w-full flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition-all"
                >
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
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
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      Novo Tema
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Compartilhe seu tema
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => navigate("/ideas?precisa_apresentador=true")}
                  className="w-full flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition-all"
                >
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
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
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      Voluntariar-se
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {stats?.precisa_apresentador || 0} temas precisam
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => navigate("/calendar")}
                  className="w-full flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition-all"
                >
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
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
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      Ver Calendário
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Agenda completa
                    </p>
                  </div>
                </button>
              </div>
            </section>
          </div>
        </div>

        {/* FAB for new idea */}
        <FAB
          onClick={() => setShowNewIdeaModal(true)}
          label="Novo Tema"
          icon={
            <svg
              className="w-6 h-6"
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
          }
        />

        {/* TODO: Add New Idea Modal */}
        {showNewIdeaModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md">
              <p className="text-gray-900 dark:text-gray-100">
                Modal de Novo Tema - Em breve!
              </p>
              <button
                onClick={() => setShowNewIdeaModal(false)}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </AnimatedPage>
    </MainLayout>
  );
}
