import { StatsCard } from "@/components/cards";
import {
  Users,
  FileText,
  ThumbsUp,
  TrendingUp,
  CheckCircle,
  ListTodo,
} from "lucide-react";
import type { RetroMetrics } from "@/types";

interface MetricsGridProps {
  metrics: RetroMetrics["metricas_gerais"];
}

/**
 * Grid responsivo com 6 cards de métricas gerais de retrospectivas
 */
export function MetricsGrid({ metrics }: MetricsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <StatsCard
        title="Total de Retros"
        value={metrics.total_retros}
        icon={<ListTodo className="w-5 h-5" />}
        description={`${metrics.retros_por_status.concluida || 0} concluídas`}
      />

      <StatsCard
        title="Taxa de Conclusão"
        value={`${metrics.taxa_conclusao.toFixed(1)}%`}
        icon={<CheckCircle className="w-5 h-5" />}
        trend={
          metrics.taxa_conclusao >= 70
            ? { value: metrics.taxa_conclusao, isPositive: true }
            : undefined
        }
      />

      <StatsCard
        title="Total de Itens"
        value={metrics.total_items}
        icon={<FileText className="w-5 h-5" />}
        description={`Média: ${metrics.media_items_por_retro.toFixed(1)} por retro`}
      />

      <StatsCard
        title="Total de Votos"
        value={metrics.total_votos}
        icon={<ThumbsUp className="w-5 h-5" />}
      />

      <StatsCard
        title="Participantes Médios"
        value={metrics.media_participantes_por_retro.toFixed(1)}
        icon={<Users className="w-5 h-5" />}
        description="Por retrospectiva"
      />

      <StatsCard
        title="Itens por Pessoa"
        value={metrics.media_items_por_retro.toFixed(1)}
        icon={<TrendingUp className="w-5 h-5" />}
        description="Média de contribuição"
      />
    </div>
  );
}
