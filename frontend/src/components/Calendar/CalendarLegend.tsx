/**
 * CalendarLegend component
 * Shows usage tips for the calendar
 */
export function CalendarLegend() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
        💡 Dicas de Uso
      </h3>

      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <span className="text-lg">🖱️</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Arrastar e Soltar
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Arraste eventos para reagendar
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <span className="text-lg">👆</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Clique
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Clique em um evento para ver detalhes
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <span className="text-lg">👁️</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Visualização
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Passe o mouse para ver informações rápidas
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
