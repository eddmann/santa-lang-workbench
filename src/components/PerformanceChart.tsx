import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ClockIcon } from "@heroicons/react/20/solid";
import type { ExecutionInstance } from "../lib/types";
import { formatDurationForChart } from "../lib/utils";

interface Props {
  executions: ExecutionInstance[];
}

interface ChartData {
  name: string;
  partOne: number | null;
  partTwo: number | null;
  total: number | null;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div
        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-3 shadow-lg"
        style={{ minWidth: "140px" }}
      >
        <p className="text-sm font-medium text-[var(--color-text-primary)] mb-2">
          {label}
        </p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 text-sm">
            <span style={{ color: entry.color }}>{entry.name}</span>
            <span className="font-mono text-[var(--color-text-secondary)]">
              {formatDurationForChart(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export function PerformanceChart({ executions }: Props) {
  // Transform execution data into chart format
  const { chartData, hasData, isScriptMode } = useMemo(() => {
    const completedExecutions = executions.filter(
      (e) => e.status === "complete" && e.result !== null
    );

    if (completedExecutions.length === 0) {
      return { chartData: [], hasData: false, isScriptMode: false };
    }

    // Check if we're in script mode (all executions are script type)
    const scriptMode = completedExecutions.every(
      (e) => e.result?.type === "script"
    );

    const data: ChartData[] = completedExecutions.map((execution) => {
      const { reindeer, result } = execution;
      const name = `${reindeer.name} ${reindeer.version}`;

      if (result?.type === "solution") {
        const partOne = result.part_one.duration_ms;
        const partTwo = result.part_two.duration_ms;
        const total =
          partOne !== null && partTwo !== null ? partOne + partTwo : null;

        return { name, partOne, partTwo, total };
      } else if (result?.type === "script") {
        return {
          name,
          partOne: null,
          partTwo: null,
          total: result.duration_ms,
        };
      }

      return { name, partOne: null, partTwo: null, total: null };
    });

    // Check if we have any actual duration data
    const hasAnyData = data.some(
      (d) => d.partOne !== null || d.partTwo !== null || d.total !== null
    );

    return { chartData: data, hasData: hasAnyData, isScriptMode: scriptMode };
  }, [executions]);

  // No data state
  if (!hasData) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--color-surface-elevated)] to-[var(--color-surface)]
                        border border-[var(--color-border)] flex items-center justify-center"
          >
            <ClockIcon className="w-7 h-7 text-[var(--color-text-muted)]" />
          </div>
          <p className="text-[var(--color-text-secondary)] font-medium">
            No timing data available
          </p>
          <p className="text-sm text-[var(--color-text-muted)] mt-2">
            Run solutions or scripts to see performance comparison
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border-subtle)"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
              tickLine={{ stroke: "var(--color-border-subtle)" }}
              axisLine={{ stroke: "var(--color-border-subtle)" }}
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis
              tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
              tickLine={{ stroke: "var(--color-border-subtle)" }}
              axisLine={{ stroke: "var(--color-border-subtle)" }}
              tickFormatter={(value) => formatDurationForChart(value)}
              width={70}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                paddingTop: "20px",
              }}
              formatter={(value) => (
                <span style={{ color: "var(--color-text-secondary)" }}>
                  {value}
                </span>
              )}
            />
            {isScriptMode ? (
              <Bar
                dataKey="total"
                name="Duration"
                fill="#fbbf24"
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
              />
            ) : (
              <>
                <Bar
                  dataKey="partOne"
                  name="Part 1"
                  fill="#60a5fa"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="partTwo"
                  name="Part 2"
                  fill="#4ade80"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
