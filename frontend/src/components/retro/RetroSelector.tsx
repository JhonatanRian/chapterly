import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { retrosService } from "@/services/retros.service";
import { Calendar, CheckSquare, Square } from "lucide-react";
import { formatDate } from "@/utils/formatDate";

interface RetroSelectorProps {
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
  minSelection?: number;
  maxSelection?: number;
}

const RetroSelector = ({
  selectedIds,
  onSelectionChange,
  minSelection = 2,
  maxSelection = 10,
}: RetroSelectorProps) => {
  const [statusFilter] = useState<string>("concluida");

  // Buscar retros concluídas
  const { data, isLoading } = useQuery({
    queryKey: ["retros", { status: statusFilter }],
    queryFn: () => retrosService.getAll({ status: statusFilter as any }),
  });

  const handleToggleRetro = (retroId: number) => {
    if (selectedIds.includes(retroId)) {
      // Remover
      onSelectionChange(selectedIds.filter((id) => id !== retroId));
    } else {
      // Adicionar (respeitando máximo)
      if (selectedIds.length < maxSelection) {
        onSelectionChange([...selectedIds, retroId]);
      }
    }
  };

  const canSelectMore = selectedIds.length < maxSelection;
  const isValid = selectedIds.length >= minSelection;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Selecione as Retrospectivas
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Escolha entre {minSelection} e {maxSelection} retrospectivas para comparar.
          {selectedIds.length > 0 && (
            <span className="ml-2 font-medium text-indigo-600 dark:text-indigo-400">
              {selectedIds.length} selecionada{selectedIds.length > 1 ? "s" : ""}
            </span>
          )}
        </p>
      </div>

      {/* Lista de Retros */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {isLoading ? (
          <p className="text-sm text-gray-500">Carregando retrospectivas...</p>
        ) : data?.results && data.results.length > 0 ? (
          data.results.map((retro: any) => {
            const isSelected = selectedIds.includes(retro.id);
            const canSelect = canSelectMore || isSelected;

            return (
              <button
                key={retro.id}
                onClick={() => canSelect && handleToggleRetro(retro.id)}
                disabled={!canSelect}
                className={`
                  w-full flex items-start gap-3 p-3 rounded-lg border transition-all
                  ${
                    isSelected
                      ? "border-indigo-500 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }
                  ${!canSelect && !isSelected ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                `}
              >
                {/* Checkbox */}
                <div className="flex-shrink-0 mt-0.5">
                  {isSelected ? (
                    <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 text-left">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                    {retro.titulo}
                  </h4>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {formatDate(retro.data)}
                    </span>
                    <span>{retro.total_items} itens</span>
                  </div>
                </div>
              </button>
            );
          })
        ) : (
          <p className="text-sm text-gray-500">
            Nenhuma retrospectiva concluída encontrada.
          </p>
        )}
      </div>

      {/* Alerta de Validação */}
      {!isValid && selectedIds.length > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ Selecione pelo menos {minSelection} retrospectivas para comparar.
          </p>
        </div>
      )}
    </div>
  );
};

export default RetroSelector;
