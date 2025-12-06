import { QueryClient } from "@tanstack/react-query";

/**
 * Invalida queries relacionadas a ideias de forma inteligente
 * Garante sincronização entre páginas (lista, detalhe, calendário, dashboard)
 */
export function invalidateIdeaQueries(
  queryClient: QueryClient,
  ideaId?: number,
) {
  // Invalida lista de ideias (afeta: dashboard, /ideas, filtros)
  queryClient.invalidateQueries({ queryKey: ["ideas"] });

  // Invalida ideias próximas (afeta: dashboard sidebar)
  queryClient.invalidateQueries({ queryKey: ["upcoming-ideas"] });

  // Invalida timeline (afeta: dashboard timeline, /timeline)
  queryClient.invalidateQueries({ queryKey: ["timeline-ideas"] });

  // Invalida stats gerais (afeta: dashboard cards)
  queryClient.invalidateQueries({ queryKey: ["stats"] });

  // Se tem ID específico, invalida detalhe da ideia
  if (ideaId) {
    queryClient.invalidateQueries({ queryKey: ["idea", String(ideaId)] });
    queryClient.invalidateQueries({ queryKey: ["idea", ideaId] });
  }
}

/**
 * Invalida queries relacionadas ao perfil do usuário
 */
export function invalidateUserQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["profile"] });
  queryClient.invalidateQueries({ queryKey: ["user-stats"] });
  queryClient.invalidateQueries({ queryKey: ["auth"] });
}

/**
 * Invalida queries relacionadas a notificações
 */
export function invalidateNotificationQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["notifications"] });
  queryClient.invalidateQueries({ queryKey: ["unread-count"] });
}

/**
 * Invalida queries relacionadas a comentários de uma ideia
 */
export function invalidateCommentQueries(
  queryClient: QueryClient,
  ideaId: number,
) {
  queryClient.invalidateQueries({ queryKey: ["comments", ideaId] });
  queryClient.invalidateQueries({ queryKey: ["idea", String(ideaId)] });
  queryClient.invalidateQueries({ queryKey: ["idea", ideaId] });
}

/**
 * Invalida queries relacionadas a tags
 */
export function invalidateTagQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["tags"] });
}

/**
 * Invalida TODAS as queries (uso em casos extremos como logout)
 */
export function invalidateAllQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries();
}

/**
 * Remove queries específicas do cache (quando dados foram deletados)
 */
export function removeIdeaFromCache(queryClient: QueryClient, ideaId: number) {
  // Remove da cache específica
  queryClient.removeQueries({ queryKey: ["idea", String(ideaId)] });
  queryClient.removeQueries({ queryKey: ["idea", ideaId] });

  // Invalida listas para refetch
  invalidateIdeaQueries(queryClient);
}

/**
 * Atualiza optimistically uma ideia no cache
 * Útil para updates instantâneos antes da resposta da API
 */
export function updateIdeaInCache(
  queryClient: QueryClient,
  ideaId: number,
  updater: (oldData: any) => any,
) {
  // Atualiza cache de detalhe (apenas se existir)
  queryClient.setQueryData(["idea", String(ideaId)], (oldData: any) => {
    if (!oldData) return oldData;
    return updater(oldData);
  });
  queryClient.setQueryData(["idea", ideaId], (oldData: any) => {
    if (!oldData) return oldData;
    return updater(oldData);
  });

  // Atualiza em listas paginadas
  queryClient.setQueriesData({ queryKey: ["ideas"] }, (oldData: any) => {
    if (!oldData?.results) return oldData;
    return {
      ...oldData,
      results: oldData.results.map((idea: any) =>
        idea.id === ideaId ? updater(idea) : idea,
      ),
    };
  });

  // Atualiza em upcoming
  queryClient.setQueriesData(
    { queryKey: ["upcoming-ideas"] },
    (oldData: any) => {
      if (!oldData?.results) return oldData;
      return {
        ...oldData,
        results: oldData.results.map((idea: any) =>
          idea.id === ideaId ? updater(idea) : idea,
        ),
      };
    },
  );

  // Atualiza em timeline
  queryClient.setQueriesData(
    { queryKey: ["timeline-ideas"] },
    (oldData: any) => {
      if (!oldData?.results) return oldData;
      return {
        ...oldData,
        results: oldData.results.map((idea: any) =>
          idea.id === ideaId ? updater(idea) : idea,
        ),
      };
    },
  );
}

/**
 * Força refetch de todas as queries de ideias
 * Garante que dados estejam 100% sincronizados com o servidor
 */
export async function refetchAllIdeaQueries(queryClient: QueryClient) {
  await Promise.all([
    queryClient.refetchQueries({ queryKey: ["ideas"] }),
    queryClient.refetchQueries({ queryKey: ["upcoming-ideas"] }),
    queryClient.refetchQueries({ queryKey: ["timeline-ideas"] }),
    queryClient.refetchQueries({ queryKey: ["stats"] }),
  ]);
}
