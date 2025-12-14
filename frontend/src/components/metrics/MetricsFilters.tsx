import { Filter, X } from "lucide-react";
import { useState } from "react";
import type { RetroMetricsFilters, RetroStatus } from "@/types";

interface MetricsFiltersProps {
  filters: RetroMetricsFilters;
  onFiltersChange: (filters: RetroMetricsFilters) => void;
}

/**
 * Barra de filtros para métricas com opções de status e range de datas
 */
export function MetricsFilters({
  filters,
  onFiltersChange,
}: MetricsFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleStatusChange = (status: RetroStatus | "") => {
    onFiltersChange({
      ...filters,
      status: status || undefined,
    });
  };

  const handleDateChange = (
    field: "data_inicio" | "data_fim",
    value: string
  ) => {
    onFiltersChange({
      ...filters,
      [field]: value || undefined,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
    setIsOpen(false);
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className="mb-6">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <Filter className="w-4 h-4" />
        <span className="text-sm font-medium">Filtros</span>
        {hasActiveFilters && (
          <span className="ml-2 px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs rounded-full">
            {Object.keys(filters).length}
          </span>
        )}
      </button>

      {/* Filters Panel */}
      {isOpen && (
        <div className="mt-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={filters.status || ""}
              onChange={(e) =>
                handleStatusChange(e.target.value as RetroStatus)
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">Todos</option>
              <option value="rascunho">Rascunho</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="concluida">Concluída</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data Início
              </label>
              <input
                type="date"
                value={filters.data_inicio || ""}
                onChange={(e) =>
                  handleDateChange("data_inicio", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data Fim
              </label>
              <input
                type="date"
                value={filters.data_fim || ""}
                onChange={(e) => handleDateChange("data_fim", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Clear Button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
            >
              <X className="w-4 h-4" />
              Limpar Filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
}
