import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { retrosService } from "../../services/retros.service";
import type { RetroFilters, RetroStatus } from "../../types";
import { Calendar, Users, MessageSquare, ThumbsUp, Plus, Filter } from "lucide-react";
import {
  MainLayout,
  FAB,
  EmptyState,
  SkeletonGrid,
} from "@/components";
import {
  AnimatedPage,
  AnimatedGrid,
  AnimatedGridItem,
} from "@/components/animations";

const RetroListPage = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<RetroFilters>({
    page: 1,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["retros", filters],
    queryFn: () => retrosService.getAll(filters),
  });

  const getStatusBadge = (status: RetroStatus) => {
    const statusConfig = {
      rascunho: { label: "Rascunho", className: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200" },
      em_andamento: { label: "Em Andamento", className: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200" },
      concluida: { label: "Concluída", className: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200" },
    };

    const config = statusConfig[status];
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (error) {
    return (
      <MainLayout>
        <AnimatedPage>
          <EmptyState
            title="Erro ao carregar retrospectivas"
            description="Por favor, tente novamente."
            icon={
              <MessageSquare className="w-24 h-24 text-red-400 dark:text-red-500" />
            }
          />
        </AnimatedPage>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <AnimatedPage>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Retrospectivas
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie e participe de retrospectivas do time
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex items-center gap-4">
            <Filter size={20} className="text-gray-500 dark:text-gray-400" />
            <select
              value={filters.status || ""}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value as RetroStatus || undefined, page: 1 })
              }
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Todos os status</option>
              <option value="rascunho">Rascunho</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="concluida">Concluída</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && <SkeletonGrid count={6} />}

        {/* Retros List */}
        {!isLoading && data && (
          <>
            {data.results.length === 0 ? (
              <EmptyState
                title="Nenhuma retrospectiva encontrada"
                description="Comece criando sua primeira retrospectiva"
                icon={
                  <Calendar className="w-24 h-24 text-indigo-400 dark:text-indigo-500" />
                }
                action={{
                  label: "Criar Retrospectiva",
                  onClick: () => navigate("/retros/new"),
                  variant: "primary",
                }}
              />
            ) : (
              <>
                <AnimatedGrid>
                  {data.results.map((retro) => (
                    <AnimatedGridItem key={retro.id}>
                      <Link
                        to={`/retros/${retro.id}`}
                        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 p-6 block h-full"
                      >
                        {/* Header */}
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex-1 mr-2">
                            {retro.titulo}
                          </h3>
                          {getStatusBadge(retro.status)}
                        </div>

                        {/* Description */}
                        {retro.descricao && (
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                            {retro.descricao}
                          </p>
                        )}

                        {/* Metadata */}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <Calendar size={16} />
                            <span>{formatDate(retro.data)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-medium">{retro.template_nome}</span>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                            <MessageSquare size={16} />
                            <span>{retro.total_items}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                            <Users size={16} />
                            <span>{retro.total_participantes}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                            <ThumbsUp size={16} />
                            <span>{retro.total_votos}</span>
                          </div>
                        </div>

                        {/* Author */}
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2">
                            {retro.autor.avatar ? (
                              <img
                                src={retro.autor.avatar}
                                alt={retro.autor.username}
                                className="w-6 h-6 rounded-full"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-300">
                                  {retro.autor.username.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {retro.autor.username}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </AnimatedGridItem>
                  ))}
                </AnimatedGrid>

                {/* Pagination */}
                {(data.next || data.previous) && (
                  <div className="flex justify-center gap-2 mt-8">
                    <button
                      onClick={() =>
                        setFilters({ ...filters, page: (filters.page || 1) - 1 })
                      }
                      disabled={!data.previous}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Anterior
                    </button>
                    <span className="px-4 py-2 text-gray-600 dark:text-gray-400">
                      Página {filters.page || 1}
                    </span>
                    <button
                      onClick={() =>
                        setFilters({ ...filters, page: (filters.page || 1) + 1 })
                      }
                      disabled={!data.next}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Próxima
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* FAB */}
        <FAB onClick={() => navigate("/retros/new")} icon={<Plus size={24} />} label="Nova Retrospectiva" />
      </AnimatedPage>
    </MainLayout>
  );
};

export default RetroListPage;
