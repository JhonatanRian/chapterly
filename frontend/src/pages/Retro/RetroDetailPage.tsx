import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { retrosService } from "../../services/retros.service";
import type { RetroItemFormData, RetroStatus } from "../../types";
import {
  ArrowLeft,
  Calendar,
  Users,
  Edit,
  Trash2,
  UserPlus,
  UserMinus,
  ThumbsUp,
  Plus,
  MessageSquare,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuthStore } from "@/stores/authStore";
import {
  MainLayout,
  Button,
  Loading,
  EmptyState,
} from "@/components";
import { AnimatedPage } from "@/components/animations";

const RetroDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [categoryInputs, setCategoryInputs] = useState<Record<string, string>>({});

  // Carregar retro com polling para atualização em tempo real
  const { data: retro, isLoading } = useQuery({
    queryKey: ["retro", id],
    queryFn: () => retrosService.getById(Number(id)),
    refetchInterval: 5000, // Refetch a cada 5 segundos
    refetchIntervalInBackground: false, // Pausa quando aba não está focada
    refetchOnWindowFocus: true, // Refetch quando usuário volta para a aba
  });

  // Mutation para deletar
  const deleteMutation = useMutation({
    mutationFn: () => retrosService.delete(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["retros"] });
      toast.success("Retrospectiva deletada com sucesso!");
      navigate("/retros");
    },
    onError: () => {
      toast.error("Erro ao deletar retrospectiva");
    },
  });

  // Mutation para entrar
  const joinMutation = useMutation({
    mutationFn: () => retrosService.join(Number(id)),
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        queryKey: ["retro", id],
        type: 'active'
      });
      toast.success("Você entrou na retrospectiva!");
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.detail || "Erro ao entrar na retrospectiva";
      toast.error(errorMsg);
      console.error("Erro ao entrar na retro:", error);
    },
  });

  // Mutation para sair
  const leaveMutation = useMutation({
    mutationFn: () => retrosService.leave(Number(id)),
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        queryKey: ["retro", id],
        type: 'active'
      });
      toast.success("Você saiu da retrospectiva");
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.detail || "Erro ao sair da retrospectiva";
      toast.error(errorMsg);
      console.error("Erro ao sair da retro:", error);
    },
  });

  // Mutation para adicionar item
  const addItemMutation = useMutation({
    mutationFn: (data: RetroItemFormData) =>
      retrosService.addItem(Number(id), data),
    onSuccess: async (newItem, variables) => {
      // Forçar refetch imediato da retro
      await queryClient.refetchQueries({ 
        queryKey: ["retro", id],
        type: 'active'
      });
      toast.success("Item adicionado com sucesso!");
      // Limpar apenas o input da categoria específica
      setCategoryInputs(prev => ({ ...prev, [variables.categoria]: "" }));
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.detail || "Erro ao adicionar item";
      toast.error(errorMsg);
      console.error("Erro ao adicionar item:", error);
    },
  });

  // Mutation para votar
  const voteMutation = useMutation({
    mutationFn: (itemId: number) =>
      retrosService.voteItem(Number(id), itemId),
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        queryKey: ["retro", id],
        type: 'active'
      });
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.detail || "Erro ao votar";
      toast.error(errorMsg);
      console.error("Erro ao votar:", error);
    },
  });

  const handleDelete = () => {
    if (
      window.confirm(
        "Tem certeza que deseja deletar esta retrospectiva? Esta ação não pode ser desfeita."
      )
    ) {
      deleteMutation.mutate();
    }
  };

  const handleAddItem = (categoria: string) => {
    const content = categoryInputs[categoria]?.trim();
    if (!content) {
      toast.error("Digite algo antes de adicionar");
      return;
    }
    addItemMutation.mutate({
      conteudo: content,
      categoria,
      ordem: 0,
    });
  };

  const handleInputChange = (categoria: string, value: string) => {
    setCategoryInputs(prev => ({ ...prev, [categoria]: value }));
  };

  const handleKeyPress = (e: React.KeyboardEvent, categoria: string) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddItem(categoria);
    }
  };

  const getStatusBadge = (status: RetroStatus) => {
    const statusConfig = {
      rascunho: { label: "Rascunho", className: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200" },
      em_andamento: {
        label: "Em Andamento",
        className: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
      },
      concluida: {
        label: "Concluída",
        className: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
      },
    };

    const config = statusConfig[status];
    return (
      <span
        className={`px-3 py-1 text-sm font-semibold rounded-full ${config.className}`}
      >
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isAuthor = retro?.autor.id === user?.id;
  const isAdmin = user?.is_staff || false;
  
  // Lógica de permissões para adicionar itens:
  // - Admin/Autor podem sempre
  // - Participantes normais só podem quando status = "em_andamento"
  const canAddItems = retro?.is_participante && (
    isAdmin || 
    isAuthor || 
    retro?.status === "em_andamento"
  );

  if (isLoading) {
    return (
      <MainLayout>
        <AnimatedPage>
          <Loading />
        </AnimatedPage>
      </MainLayout>
    );
  }

  if (!retro) {
    return (
      <MainLayout>
        <AnimatedPage>
          <EmptyState
            title="Retrospectiva não encontrada"
            description="A retrospectiva que você procura não existe ou foi removida."
            icon={
              <MessageSquare className="w-24 h-24 text-red-400 dark:text-red-500" />
            }
            action={{
              label: "Voltar para lista",
              onClick: () => navigate("/retros"),
              variant: "primary",
            }}
          />
        </AnimatedPage>
      </MainLayout>
    );
  }

  // Agrupar items por categoria
  const itemsByCategory = retro.template.categorias.reduce((acc, cat) => {
    acc[cat.slug] = retro.items
      .filter((item) => item.categoria === cat.slug)
      .sort((a, b) => b.vote_count - a.vote_count);
    return acc;
  }, {} as Record<string, typeof retro.items>);

  return (
    <MainLayout>
      <AnimatedPage>
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/retros")}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            Voltar para lista
          </button>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{retro.titulo}</h1>
                {getStatusBadge(retro.status)}
              </div>
              {retro.descricao && (
                <p className="text-gray-600 dark:text-gray-400 mt-2">{retro.descricao}</p>
              )}
            </div>

            {isAuthor && (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/retros/${id}/edit`)}
                  title="Editar"
                >
                  <Edit size={20} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  title="Deletar"
                  className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 size={20} />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <Calendar className="text-gray-400 dark:text-gray-500" size={24} />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Data</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{formatDate(retro.data)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Users className="text-gray-400 dark:text-gray-500" size={24} />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Participantes</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {retro.total_participantes}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MessageSquare className="text-gray-400 dark:text-gray-500" size={24} />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Itens / Votos</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {retro.total_items} / {retro.total_votos}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Template</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{retro.template.nome}</p>
            </div>

            {retro.is_participante ? (
              retro.status !== "concluida" && (
                <Button
                  variant="secondary"
                  onClick={() => leaveMutation.mutate()}
                  disabled={leaveMutation.isPending || isAuthor}
                  className="flex items-center gap-2"
                >
                  <UserMinus size={18} />
                  {isAuthor ? "Autor (não pode sair)" : "Sair"}
                </Button>
              )
            ) : retro.status !== "concluida" ? (
              <Button
                variant="primary"
                onClick={() => joinMutation.mutate()}
                disabled={joinMutation.isPending}
                className="flex items-center gap-2"
              >
                <UserPlus size={18} />
                Participar
              </Button>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                Retrospectiva concluída
              </p>
            )}
          </div>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {retro.template.categorias.map((category) => (
            <div key={category.slug} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              {/* Category Header */}
              <div
                className="flex items-center gap-2 mb-4 pb-3 border-b-2"
                style={{ borderColor: category.color }}
              >
                <span className="text-2xl">{category.icon}</span>
                <h3
                  className="text-lg font-semibold"
                  style={{ color: category.color }}
                >
                  {category.name}
                </h3>
              </div>

              {/* Quick Add Input */}
              {canAddItems && (
                <div className="mb-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={categoryInputs[category.slug] || ""}
                      onChange={(e) => handleInputChange(category.slug, e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, category.slug)}
                      placeholder="Digite e pressione Enter..."
                      disabled={addItemMutation.isPending}
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddItem(category.slug)}
                      disabled={addItemMutation.isPending || !categoryInputs[category.slug]?.trim()}
                      className="px-3 py-2 text-white rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center"
                      style={{
                        backgroundColor: categoryInputs[category.slug]?.trim() ? category.color : '#9CA3AF'
                      }}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* Items */}
              <div className="space-y-3">
                {itemsByCategory[category.slug]?.length > 0 ? (
                  itemsByCategory[category.slug].map((item) => (
                    <div
                      key={item.id}
                      className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
                    >
                      <p className="text-sm text-gray-800 dark:text-gray-200 mb-2">{item.conteudo}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>{item.autor.username}</span>
                        <button
                          onClick={() => voteMutation.mutate(item.id)}
                          disabled={voteMutation.isPending}
                          className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                            item.has_voted
                              ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300"
                              : "hover:bg-gray-200 dark:hover:bg-gray-600"
                          }`}
                        >
                          <ThumbsUp size={14} />
                          <span>{item.vote_count}</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                    Nenhum item ainda
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </AnimatedPage>
    </MainLayout>
  );
};

export default RetroDetailPage;
