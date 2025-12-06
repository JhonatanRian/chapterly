import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { ReactNode } from "react";

// Configurar QueryClient
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 segundos (dados ficam "frescos" por menos tempo)
      gcTime: 5 * 60 * 1000, // 5 minutos (garbage collection)
      retry: 1,
      refetchOnWindowFocus: true, // ✅ Refetch quando volta para a aba
      refetchOnMount: true, // ✅ Refetch quando componente monta
      refetchOnReconnect: true, // ✅ Refetch quando reconecta à internet
    },
    mutations: {
      retry: 0,
    },
  },
});

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools apenas em desenvolvimento */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

export default QueryProvider;
