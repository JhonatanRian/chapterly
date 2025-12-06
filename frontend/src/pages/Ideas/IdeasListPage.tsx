import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  MainLayout,
  IdeaCard,
  Button,
  FAB,
  SkeletonGrid,
  NoIdeasEmptyState,
  NoSearchResultsEmptyState,
} from "@/components";
import {
  AnimatedPage,
  AnimatedGrid,
  AnimatedGridItem,
} from "@/components/animations";
import { ideasService } from "@/services/ideas.service";
import type { IdeaFilters, IdeaStatus, IdeaPriority } from "@/types";
import { toast } from "sonner";
import { handleApiError } from "@/utils/errorHandler";

export function IdeasListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Get filters from URL
  const filters: IdeaFilters = {
    status: (searchParams.get("status") as IdeaStatus) || undefined,
    prioridade: (searchParams.get("prioridade") as IdeaPriority) || undefined,
    search: searchParams.get("search") || undefined,
    precisa_apresentador:
      searchParams.get("precisa_apresentador") === "true" ? true : undefined,
    ordering: searchParams.get("ordering") || "-created_at",
    page: parseInt(searchParams.get("page") || "1"),
  };

  // Fetch ideas with filters
  const { data, isLoading } = useQuery({
    queryKey: ["ideas", filters],
    queryFn: () => ideasService.getIdeas(filters),
  });

  const ideas = data?.results || [];
  const totalPages = data?.count ? Math.ceil(data.count / 10) : 1;

  // Vote mutation
  const voteMutation = useMutation({
    mutationKey: ["vote-idea"],
    mutationFn: (ideaId: number) => ideasService.vote(ideaId),
    onSuccess: (data, ideaId) => {
      // Invalidar a lista de ideias para refletir a mudança
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
      // Também invalidar a ideia específica se estiver em cache
      queryClient.invalidateQueries({ queryKey: ["idea", ideaId] });
      toast.success(data.voted ? "Hypado!" : "Hype removido!");
    },
    onError: (error: any) => {
      handleApiError(error, "Erro ao hypar");
    },
  });

  // Volunteer mutation
  const volunteerMutation = useMutation({
    mutationKey: ["volunteer-idea"],
    mutationFn: (ideaId: number) => ideasService.volunteer(ideaId),
    onSuccess: (_, ideaId) => {
      // Invalidar a lista de ideias para refletir a mudança
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
      // Também invalidar a ideia específica se estiver em cache
      queryClient.invalidateQueries({ queryKey: ["idea", ideaId] });
      toast.success("Você se voluntariou para apresentar esta ideia!");
    },
    onError: (error: any) => {
      handleApiError(error, "Erro ao voluntariar-se");
    },
  });

  const handleFilterChange = (key: string, value: string | undefined) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set("page", "1"); // Reset to first page
    setSearchParams(newParams);
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get("search") as string;
    handleFilterChange("search", search || undefined);
  };

  const handleVote = (ideaId: number) => {
    voteMutation.mutate(ideaId);
  };

  const handleVolunteer = (ideaId: number) => {
    volunteerMutation.mutate(ideaId);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const hasFilters = Array.from(searchParams.keys()).some(
    (key) => key !== "page" && key !== "ordering",
  );

  return (
    <MainLayout>
      <AnimatedPage>
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Ideias
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Explore e vote nas ideias para as próximas apresentações
          </p>
        </div>

        {/* Filters Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <input
                  type="search"
                  name="search"
                  placeholder="Buscar ideias..."
                  defaultValue={filters.search}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </form>

            {/* Status Filter */}
            <select
              value={filters.status || ""}
              onChange={(e) =>
                handleFilterChange("status", e.target.value || undefined)
              }
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Todos os status</option>
              <option value="pendente">Pendente</option>
              <option value="agendado">Agendado</option>
              <option value="concluido">Concluído</option>
              <option value="cancelado">Cancelado</option>
            </select>

            {/* Priority Filter */}
            <select
              value={filters.prioridade || ""}
              onChange={(e) =>
                handleFilterChange("prioridade", e.target.value || undefined)
              }
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Todas as prioridades</option>
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
            </select>

            {/* Ordering */}
            <select
              value={filters.ordering || "-created_at"}
              onChange={(e) => handleFilterChange("ordering", e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="-created_at">Mais recentes</option>
              <option value="created_at">Mais antigas</option>
              <option value="-vote_count">Mais votadas</option>
              <option value="vote_count">Menos votadas</option>
              <option value="titulo">A-Z</option>
              <option value="-titulo">Z-A</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "grid"
                    ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
                aria-label="Visualização em grade"
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
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "list"
                    ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
                aria-label="Visualização em lista"
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
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Active Filters & Clear Button */}
          {hasFilters && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Filtros ativos:
              </span>
              {filters.status && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded text-xs">
                  Status: {filters.status}
                  <button
                    onClick={() => handleFilterChange("status", undefined)}
                    className="hover:text-indigo-900 dark:hover:text-indigo-200"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.prioridade && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded text-xs">
                  Prioridade: {filters.prioridade}
                  <button
                    onClick={() => handleFilterChange("prioridade", undefined)}
                    className="hover:text-indigo-900 dark:hover:text-indigo-200"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.search && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded text-xs">
                  Busca: "{filters.search}"
                  <button
                    onClick={() => handleFilterChange("search", undefined)}
                    className="hover:text-indigo-900 dark:hover:text-indigo-200"
                  >
                    ×
                  </button>
                </span>
              )}
              <button
                onClick={clearFilters}
                className="ml-auto text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                Limpar tudo
              </button>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {data?.count || 0}{" "}
            {data?.count === 1 ? "ideia encontrada" : "ideias encontradas"}
          </p>
        </div>

        {/* Ideas Grid/List */}
        {isLoading ? (
          <SkeletonGrid count={6} type="idea" />
        ) : ideas.length > 0 ? (
          viewMode === "grid" ? (
            <AnimatedGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ideas.map((idea) => (
                <AnimatedGridItem key={idea.id}>
                  <IdeaCard
                    idea={idea}
                    onClick={() => navigate(`/ideas/${idea.id}`)}
                    onVote={handleVote}
                    onVolunteer={handleVolunteer}
                    isVoting={voteMutation.isPending}
                  />
                </AnimatedGridItem>
              ))}
            </AnimatedGrid>
          ) : (
            <div className="space-y-4">
              {ideas.map((idea) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  onClick={() => navigate(`/ideas/${idea.id}`)}
                  onVote={handleVote}
                  onVolunteer={handleVolunteer}
                  isVoting={voteMutation.isPending}
                />
              ))}
            </div>
          )
        ) : hasFilters ? (
          <NoSearchResultsEmptyState onClearFilters={clearFilters} />
        ) : (
          <NoIdeasEmptyState onCreate={() => navigate("/ideas/new")} />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() =>
                handleFilterChange("page", String(filters.page! - 1))
              }
              disabled={filters.page === 1}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Anterior
            </button>

            <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
              Página {filters.page} de {totalPages}
            </span>

            <button
              onClick={() =>
                handleFilterChange("page", String(filters.page! + 1))
              }
              disabled={filters.page === totalPages}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Próxima
            </button>
          </div>
        )}

        {/* FAB for new idea */}
        <FAB
          onClick={() => navigate("/ideas/new")}
          label="Nova Ideia"
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
      </AnimatedPage>
    </MainLayout>
  );
}
