import {
  MainLayout,
  EmptyState,
} from "@/components";
import { AnimatedPage } from "@/components/animations";
import { BarChart3 } from "lucide-react";

const RetroMetricsPage = () => {
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

        {/* Placeholder */}
        <EmptyState
          title="Métricas em desenvolvimento"
          description="Esta funcionalidade estará disponível em breve."
          icon={
            <BarChart3 className="w-24 h-24 text-indigo-400 dark:text-indigo-500" />
          }
        />
      </AnimatedPage>
    </MainLayout>
  );
};

export default RetroMetricsPage;
