import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { comparisonService } from "@/services/retros.service";
import type { RetroComparison } from "@/types";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import { MainLayout, Button } from "@/components";
import { AnimatedPage } from "@/components/animations";
import RetroSelector from "@/components/retro/RetroSelector";
import TendencyChart from "@/components/retro/TendencyChart";
import { formatDate } from "@/utils/formatDate";

const RetroComparisonPage = () => {
  const navigate = useNavigate();
  const [selectedRetroIds, setSelectedRetroIds] = useState<number[]>([]);
  const [comparisonData, setComparisonData] = useState<RetroComparison | null>(null);

  // Mutation para comparar
  const compareMutation = useMutation({
    mutationFn: (retroIds: number[]) => comparisonService.compare(retroIds),
    onSuccess: (data) => {
      setComparisonData(data);
      toast.success("Comparação gerada com sucesso!");
    },
    onError: (error: any) => {
      const errorMsg =
        error.response?.data?.detail || "Erro ao comparar retrospectivas";
      toast.error(errorMsg);
      console.error("Erro na comparação:", error);
    },
  });

  const handleCompare = () => {
    if (selectedRetroIds.length < 2) {
      toast.error("Selecione pelo menos 2 retrospectivas");
      return;
    }
    compareMutation.mutate(selectedRetroIds);
  };

  const getTendencyIcon = (tendencia: string) => {
    switch (tendencia) {
      case "crescente":
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case "decrescente":
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      case "estável":
        return <Minus className="w-5 h-5 text-gray-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getTendencyColor = (tendencia: string) => {
    switch (tendencia) {
      case "crescente":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20";
      case "decrescente":
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20";
      case "estável":
        return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800";
      default:
        return "text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800";
    }
  };

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

          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Comparar Retrospectivas
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Analise a evolução entre sprints e identifique padrões recorrentes
          </p>
        </div>

        {/* Seletor */}
        <div className="mb-6">
          <RetroSelector
            selectedIds={selectedRetroIds}
            onSelectionChange={setSelectedRetroIds}
            minSelection={2}
            maxSelection={10}
          />

          <div className="mt-4">
            <Button
              onClick={handleCompare}
              disabled={selectedRetroIds.length < 2 || compareMutation.isPending}
              variant="primary"
              className="w-full sm:w-auto"
            >
              {compareMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Comparando...
                </>
              ) : (
                `Comparar ${selectedRetroIds.length} Retrospectiva${
                  selectedRetroIds.length > 1 ? "s" : ""
                }`
              )}
            </Button>
          </div>
        </div>

        {/* Resultados */}
        {comparisonData && (
          <div className="space-y-8">
            {/* Período */}
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg p-4">
              <p className="text-sm text-indigo-900 dark:text-indigo-100">
                <strong>Período analisado:</strong>{" "}
                {formatDate(comparisonData.periodo_analise.data_inicial)} até{" "}
                {formatDate(comparisonData.periodo_analise.data_final)}
              </p>
            </div>

            {/* Action Items Tracking */}
            {comparisonData.action_items_tracking && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  📋 Action Items Tracking
                </h3>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                    <p className="text-sm text-green-700 dark:text-green-300 mb-1">
                      Resolvidos
                    </p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {comparisonData.action_items_tracking.resolvidos}
                    </p>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-1">
                      Recorrentes
                    </p>
                    <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                      {comparisonData.action_items_tracking.recorrentes}
                    </p>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">Novos</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {comparisonData.action_items_tracking.novos}
                    </p>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                    <p className="text-sm text-purple-700 dark:text-purple-300 mb-1">
                      Taxa de Resolução
                    </p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                      {comparisonData.action_items_tracking.taxa_resolucao.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Detalhes */}
                {comparisonData.action_items_tracking.detalhes.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                      Detalhes
                    </h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {comparisonData.action_items_tracking.detalhes.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                        >
                          <span
                            className={`
                              px-2 py-1 rounded text-xs font-medium flex-shrink-0
                              ${
                                item.status === "resolvido"
                                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                  : ""
                              }
                              ${
                                item.status === "recorrente"
                                  ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                                  : ""
                              }
                              ${
                                item.status === "novo"
                                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                  : ""
                              }
                            `}
                          >
                            {item.status}
                          </span>
                          <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                            {item.conteudo}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Problemas Recorrentes */}
            {comparisonData.problemas_recorrentes.total_recorrencias > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  🔁 Problemas Recorrentes (
                  {comparisonData.problemas_recorrentes.total_recorrencias})
                </h3>

                <div className="space-y-3">
                  {comparisonData.problemas_recorrentes.itens_recorrentes.map(
                    (item, index) => (
                      <div
                        key={index}
                        className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg"
                      >
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 flex-1">
                            {item.conteudo}
                          </p>
                          <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 rounded text-xs font-medium flex-shrink-0">
                            {item.frequencia}x
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Categoria: <span className="font-medium">{item.categoria}</span> ·
                          Similaridade:{" "}
                          <span className="font-medium">
                            {(item.similaridade_media * 100).toFixed(0)}%
                          </span>
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Tendências */}
            <TendencyChart
              tendencies={comparisonData.tendencias_categorias}
              retros={comparisonData.retros_comparadas}
            />

            {/* Cards de Tendência */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(comparisonData.tendencias_categorias).map(
                ([, tendency]) => (
                  <div
                    key={tendency.categoria}
                    className={`p-4 rounded-lg border ${getTendencyColor(tendency.tendencia)}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{tendency.categoria_nome}</h4>
                      {getTendencyIcon(tendency.tendencia)}
                    </div>
                    <p className="text-2xl font-bold mb-1">
                      {tendency.variacao_percentual > 0 ? "+" : ""}
                      {tendency.variacao_percentual.toFixed(1)}%
                    </p>
                    <p className="text-xs opacity-80 capitalize">{tendency.tendencia}</p>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </AnimatedPage>
    </MainLayout>
  );
};

export default RetroComparisonPage;
