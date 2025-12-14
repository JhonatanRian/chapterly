import { useQuery } from "@tanstack/react-query";
import { retrosService } from "@/services/retros.service";
import type { RetroMetrics, RetroMetricsFilters } from "@/types";

/**
 * Hook para buscar métricas agregadas de retrospectivas
 * @param filters - Filtros opcionais para as métricas
 * @returns Query object com dados, loading e erro
 */
export const useRetroMetrics = (filters?: RetroMetricsFilters) => {
  return useQuery<RetroMetrics>({
    queryKey: ["retros", "metrics", filters],
    queryFn: () => retrosService.getMetrics(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1, // Retry apenas 1 vez (403 não deve retentar muito)
  });
};
