import { TrendingUp, TrendingDown, Minus, Users } from "lucide-react";
import type { RetroMetrics } from "@/types";

interface EngagementAnalysisProps {
  analise: RetroMetrics["analise_engajamento"];
}

/**
 * Seção de análise de engajamento com trend indicator
 */
export function EngagementAnalysis({ analise }: EngagementAnalysisProps) {
  const getTrendIcon = () => {
    switch (analise.trend_participacao) {
      case "crescente":
        return <TrendingUp className="w-6 h-6 text-green-500" />;
      case "decrescente":
        return <TrendingDown className="w-6 h-6 text-red-500" />;
      default:
        return <Minus className="w-6 h-6 text-gray-400" />;
    }
  };

  const getTrendColor = () => {
    switch (analise.trend_participacao) {
      case "crescente":
        return "text-green-600 dark:text-green-400";
      case "decrescente":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
        <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        Análise de Engajamento
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Média de Itens por Pessoa */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Média de Itens por Participante
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {analise.media_itens_por_pessoa.toFixed(1)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Itens criados por pessoa única
          </p>
        </div>

        {/* Trend de Participação */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Tendência de Participação
          </p>
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <p className={`text-2xl font-bold capitalize ${getTrendColor()}`}>
              {analise.trend_participacao}
            </p>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Comparado às 5 retros anteriores
          </p>
        </div>
      </div>

      {/* Insights */}
      <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
        <p className="text-sm text-indigo-900 dark:text-indigo-200">
          <strong>💡 Insight:</strong>{" "}
          {analise.trend_participacao === "crescente" &&
            "Time está cada vez mais engajado! Continue incentivando a participação."}
          {analise.trend_participacao === "decrescente" &&
            "Participação está diminuindo. Considere revisar o formato ou timing das retros."}
          {analise.trend_participacao === "estável" &&
            "Participação está consistente. Mantenha o ritmo e busque novas formas de engajar."}
        </p>
      </div>
    </div>
  );
}
