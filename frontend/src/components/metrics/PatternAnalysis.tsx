import { BarChart3, Trophy, Target } from "lucide-react";
import { Link } from "react-router-dom";
import type { RetroMetrics } from "@/types";

interface PatternAnalysisProps {
  analise: RetroMetrics["analise_padroes"];
}

/**
 * Seção de análise de padrões com distribuição por categoria e top 10 itens
 */
export function PatternAnalysis({ analise }: PatternAnalysisProps) {
  // Ordenar categorias por quantidade descrescente
  const sortedCategories = Object.entries(analise.itens_por_categoria).sort(
    ([, a], [, b]) => b - a
  );

  // Tradução de categorias (baseado em templates padrão)
  const categoryLabels: Record<string, string> = {
    went_well: "Funcionou Bem",
    to_improve: "A Melhorar",
    action_items: "Ações",
    stop: "Parar",
    start: "Começar",
    continue: "Continuar",
  };

  const getCategoryLabel = (categoria: string) => {
    return categoryLabels[categoria] || categoria;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
        <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        Identificação de Padrões
      </h2>

      {/* Itens por Categoria */}
      <div className="mb-6">
        <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">
          Distribuição por Categoria
        </h3>
        <div className="space-y-3">
          {sortedCategories.map(([categoria, total]) => {
            const percentage = (
              (total /
                (Object.values(analise.itens_por_categoria).reduce(
                  (a, b) => a + b,
                  0
                ) || 1)) *
              100
            ).toFixed(1);

            return (
              <div key={categoria}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 dark:text-gray-300">
                    {getCategoryLabel(categoria)}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {total} ({percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Items */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
          <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">
            Action Items Propostos
          </h3>
        </div>
        <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {analise.total_action_items}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Melhorias identificadas pelo time
        </p>
      </div>

      {/* Top 10 Itens Mais Votados */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">
            Top 10 Pontos Críticos (Mais Votados)
          </h3>
        </div>

        {analise.top_itens_votados.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            Nenhum item votado ainda
          </p>
        ) : (
          <div className="space-y-2">
            {analise.top_itens_votados.map((item, index) => (
              <Link
                key={item.id}
                to={`/retros/${item.retro}`}
                className="block p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div className="flex-grow min-w-0">
                    <p className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
                      {item.conteudo}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span className="capitalize">
                        {getCategoryLabel(item.categoria)}
                      </span>
                      <span>•</span>
                      <span>{item.autor.username}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 rounded text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                    {item.vote_count} votos
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
