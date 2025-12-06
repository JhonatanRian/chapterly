interface LegendItem {
  label: string;
  color: string;
  type: "status" | "priority";
}

const STATUS_ITEMS: LegendItem[] = [
  { label: "Pendente", color: "#94a3b8", type: "status" },
  { label: "Agendado", color: "#3b82f6", type: "status" },
  { label: "Concluído", color: "#10b981", type: "status" },
];

const PRIORITY_ITEMS: LegendItem[] = [
  { label: "Baixa", color: "#22c55e", type: "priority" },
  { label: "Média", color: "#f59e0b", type: "priority" },
  { label: "Alta", color: "#ef4444", type: "priority" },
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
          Status (Cor de Fundo)
        </h4>
        <div className="space-y-2">
          {STATUS_ITEMS.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div
                className="h-6 flex-1 rounded text-white text-xs font-medium flex items-center justify-center shadow-sm"
                style={{
                  backgroundColor: item.color,
                  borderLeft: "5px solid rgba(0,0,0,0.2)",
                  textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                }}
              >
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Priority Section */}
      <div>
        <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          Prioridade (Borda Esquerda)
        </h4>
        <div className="space-y-2">
          {PRIORITY_ITEMS.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div
                className="h-6 flex-1 rounded text-white text-xs font-medium flex items-center justify-center bg-blue-500 shadow-sm"
                style={{
                  borderLeft: `5px solid ${item.color}`,
                  textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                }}
              >
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          💡 <strong>Dica:</strong> Arraste eventos para reagendar
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          🖱️ <strong>Hover:</strong> Passe o mouse para ver detalhes
        </p>
      </div>
    </div>
  );
}
