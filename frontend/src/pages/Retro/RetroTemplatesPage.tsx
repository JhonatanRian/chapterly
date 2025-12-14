import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { retroTemplatesService } from "../../services/retros.service";
import {
  MainLayout,
  Loading,
  EmptyState,
  Button,
  FAB,
} from "@/components";
import { AnimatedPage, AnimatedGrid, AnimatedGridItem } from "@/components/animations";
import { Layers, Plus, Edit, Trash2, Star, Shield, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuthStore } from "@/stores/authStore";

const RetroTemplatesPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.is_staff || false;
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get("page") || "1");

  const { data: templates, isLoading, error } = useQuery({
    queryKey: ["retro-templates", currentPage],
    queryFn: () => retroTemplatesService.getAll({ page: currentPage }),
  });

  // Mutation para deletar
  const deleteMutation = useMutation({
    mutationFn: (id: number) => retroTemplatesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["retro-templates"] });
      toast.success("Template deletado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Erro ao deletar template");
    },
  });

  // Mutation para definir como padrão
  const setDefaultMutation = useMutation({
    mutationFn: (id: number) => retroTemplatesService.setDefault(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["retro-templates"] });
      toast.success("Template padrão atualizado!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Erro ao definir template padrão");
    },
  });

  const handleDelete = (id: number, nome: string) => {
    if (window.confirm(`Tem certeza que deseja deletar o template "${nome}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handlePageChange = (page: number) => {
    setSearchParams({ page: String(page) });
  };

  const totalPages = templates?.count ? Math.ceil(templates.count / 12) : 1;

  if (isLoading) {
    return (
      <MainLayout>
        <AnimatedPage>
          <Loading />
        </AnimatedPage>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <AnimatedPage>
          <EmptyState
            title="Erro ao carregar templates"
            description="Ocorreu um erro ao carregar os templates. Tente novamente."
            icon={<Layers className="w-24 h-24 text-gray-400 dark:text-gray-500" />}
          />
        </AnimatedPage>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <AnimatedPage>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Templates de Retrospectiva
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Escolha um template para criar sua retrospectiva
          </p>
        </div>

        {/* Templates List */}
        {templates?.results && templates.results.length > 0 ? (
          <AnimatedGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.results.map((template) => (
              <AnimatedGridItem key={template.id}>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700 transition-all duration-200 h-full flex flex-col">
                  {/* Header */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 flex-1">
                        {template.nome}
                      </h3>
                      <div className="flex flex-col gap-1">
                        {template.is_system && (
                          <span 
                            className="px-1.5 py-0.5 text-xs font-semibold rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 flex items-center gap-1 whitespace-nowrap"
                            title="Template do sistema"
                          >
                            <Shield size={10} />
                          </span>
                        )}
                        {template.is_default && (
                          <span 
                            className="px-1.5 py-0.5 text-xs font-semibold rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 flex items-center gap-1 whitespace-nowrap"
                            title="Template padrão"
                          >
                            <Star size={10} />
                          </span>
                        )}
                      </div>
                    </div>

                    {template.descricao && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                        {template.descricao}
                      </p>
                    )}
                  </div>

                  {/* Categorias */}
                  {template.categorias && template.categorias.length > 0 && (
                    <div className="p-4 flex-1">
                      <div className="flex flex-wrap gap-1.5">
                        {template.categorias.slice(0, 4).map((cat) => (
                          <div
                            key={cat.slug}
                            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                            style={{
                              backgroundColor: `${cat.color}15`,
                              color: cat.color,
                              borderColor: `${cat.color}40`,
                              borderWidth: '1px'
                            }}
                          >
                            <span className="text-sm">{cat.icon}</span>
                            <span className="font-medium">{cat.name}</span>
                          </div>
                        ))}
                        {template.categorias.length > 4 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                            +{template.categorias.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Footer com ações */}
                  <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {template.total_retros || 0} retro{template.total_retros !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Ações de Admin */}
                    {isAdmin && (
                      <div className="flex gap-1.5">
                        {!template.is_system ? (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/retros/templates/${template.id}/edit`);
                              }}
                              className="flex-1 text-xs py-1 h-7"
                            >
                              <Edit size={12} />
                            </Button>
                            {!template.is_default && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDefaultMutation.mutate(template.id);
                                }}
                                disabled={setDefaultMutation.isPending}
                                className="h-7 w-7 p-0"
                                title="Definir como padrão"
                              >
                                <Star size={12} />
                              </Button>
                            )}
                            {template.total_retros === 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(template.id, template.nome);
                                }}
                                disabled={deleteMutation.isPending}
                                className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 h-7 w-7 p-0"
                                title="Deletar"
                              >
                                <Trash2 size={12} />
                              </Button>
                            )}
                          </>
                        ) : (
                          <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                            Template do sistema
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </AnimatedGridItem>
            ))}
          </AnimatedGrid>
        ) : (
          <EmptyState
            title="Nenhum template disponível"
            description="Não há templates de retrospectiva cadastrados."
            icon={
              <Layers className="w-24 h-24 text-gray-400 dark:text-gray-500" />
            }
          />
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
              Anterior
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    page === currentPage
                      ? "bg-indigo-600 text-white"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Próxima
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* FAB para criar novo template (apenas admin) */}
        {isAdmin && (
          <FAB 
            onClick={() => navigate("/retros/templates/new")} 
            icon={<Plus size={24} />} 
            label="Novo Template" 
          />
        )}
      </AnimatedPage>
    </MainLayout>
  );
};

export default RetroTemplatesPage;
