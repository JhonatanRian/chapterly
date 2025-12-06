interface LegendItem {
  label: string;
  color: string;
  type: 'status' | 'priority';
}

const STATUS_ITEMS: LegendItem[] = [
  { label: 'Pendente', color: '#94a3b8', type: 'status' },
  { label: 'Agendado', color: '#3b82f6', type: 'status' },
  { label: 'Concluído', color: '#10b981', type: 'status' },
  { label: 'Cancelado', color: '#ef4444', type: 'status' },
];

const PRIORITY_ITEMS: LegendItem[] = [
  { label: 'Baixa', color: '#22c55e', type: 'priority' },
  { label: 'Média', color: '#f59e0b', type: 'priority' },
  { label: 'Alta', color: '#ef4444', type: 'priority' },
];

export function CalendarLegend() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
        Legenda
      </h3>

      {/* Status Section */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          Status (Fundo)
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {STATUS_ITEMS.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600 flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Priority Section */}
      <div>
        <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          Prioridade (Borda)
        </h4>
        <div className="grid grid-cols-1 gap-2">
          {PRIORITY_ITEMS.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded bg-white dark:bg-gray-900 flex-shrink-0"
                style={{
                  borderLeft: `4px solid ${item.color}`,
                  borderTop: `1px solid ${item.color}`,
                  borderRight: `1px solid ${item.color}`,
                  borderBottom: `1px solid ${item.color}`,
                }}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          💡 <strong>Dica:</strong> Arraste e solte eventos para reagendar
        </p>
      </div>
    </div>
  );
}
