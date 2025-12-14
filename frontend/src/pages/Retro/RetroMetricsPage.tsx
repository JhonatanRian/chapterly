import { useState } from "react";
import {
  MainLayout,
  EmptyState,
  ErrorEmptyState,
} from "@/components";
import { AnimatedPage } from "@/components/animations";
import { StatsCardSkeleton } from "@/components/common/LoadingSkeleton";
import { AlertCircle, BarChart3 } from "lucide-react";
import { useRetroMetrics } from "@/hooks/useRetroMetrics";
import { MetricsGrid } from "@/components/metrics/MetricsGrid";
import { EngagementAnalysis } from "@/components/metrics/EngagementAnalysis";
import { PatternAnalysis } from "@/components/metrics/PatternAnalysis";
import { MetricsFilters } from "@/components/metrics/MetricsFilters";
import type { RetroMetricsFilters } from "@/types";
import { useAuthStore } from "@/stores/authStore";

const RetroMetricsPage = () => {
  const { user } = useAuthStore();
  const [filters, setFilters] = useState<RetroMetricsFilters>({});

  const { data: metrics, isLoading, error } = useRetroMetrics(filters);

  // Verificação de permissão no frontend (UX - backend valida)
  const isAdmin = user?.is_staff || false;

  if (!isAdmin) {
    return (
      <MainLayout>
        <AnimatedPage>
          <EmptyState
            title="Acesso Restrito"
            description="Apenas administradores podem visualizar métricas globais."
            icon={
              <AlertCircle className="w-24 h-24 text-red-400 dark:text-red-500" />
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
            Métricas de Retrospectivas
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Análise e estatísticas das retrospectivas do time
          </p>
        </div>

        {/* Filters */}
        <MetricsFilters filters={filters} onFiltersChange={setFilters} />

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
            </div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <ErrorEmptyState
            message={
              error instanceof Error
                ? error.message
                : "Não foi possível carregar as métricas. Tente novamente."
            }
            onRetry={() => window.location.reload()}
          />
        )}

        {/* Empty State */}
        {!isLoading &&
          !error &&
          metrics?.metricas_gerais.total_retros === 0 && (
            <EmptyState
              title="Nenhuma Retrospectiva Ainda"
              description="Crie sua primeira retrospectiva para visualizar métricas."
              icon={
                <BarChart3 className="w-24 h-24 text-gray-400 dark:text-gray-500" />
              }
              action={{
                label: "Criar Retrospectiva",
                onClick: () => (window.location.href = "/retros/new"),
              }}
            />
          )}

        {/* Metrics Content */}
        {!isLoading &&
          !error &&
          metrics &&
          metrics.metricas_gerais.total_retros > 0 && (
            <>
              <MetricsGrid metrics={metrics.metricas_gerais} />
              <EngagementAnalysis analise={metrics.analise_engajamento} />
              <PatternAnalysis analise={metrics.analise_padroes} />
            </>
          )}
      </AnimatedPage>
    </MainLayout>
  );
};

export default RetroMetricsPage;
