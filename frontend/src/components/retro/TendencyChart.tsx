import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { CategoryTendency, RetroSummary } from "@/types";

interface TendencyChartProps {
  tendencies: Record<string, CategoryTendency>;
  retros: RetroSummary[];
}

const TendencyChart = ({ tendencies, retros }: TendencyChartProps) => {
  // Preparar dados para o gráfico
  const chartData = retros.map((retro, index) => {
    const dataPoint: any = {
      name: retro.titulo.replace("Retro ", ""), // Simplificar nome
    };

    // Adicionar valores de cada categoria
    Object.entries(tendencies).forEach(([, tendency]) => {
      dataPoint[tendency.categoria_nome] = tendency.valores[index] || 0;
    });

    return dataPoint;
  });

  // Cores por categoria
  const colors = [
    "#10b981", // green
    "#f59e0b", // amber
    "#ef4444", // red
    "#3b82f6", // blue
    "#8b5cf6", // purple
    "#ec4899", // pink
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Evolução por Categoria
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: "12px" }} />
          <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1f2937",
              border: "1px solid #374151",
              borderRadius: "8px",
              color: "#fff",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />

          {/* Linhas para cada categoria */}
          {Object.entries(tendencies).map(([, tendency], index) => (
            <Line
              key={tendency.categoria}
              type="monotone"
              dataKey={tendency.categoria_nome}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TendencyChart;
