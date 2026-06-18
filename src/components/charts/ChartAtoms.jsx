// ============================================================
// ChartAtoms — Recharts-based visualizations for TPDOP
// ------------------------------------------------------------
// All charts use the glass navy + gold design tokens.
// Lazy-friendly: each chart is small and composable.
// Color palette: navy-500 (#2E66C4), gold-500 (#D97706),
// success (#15803D), danger (#B91C1C), critical (#7C3AED),
// info (#075985), muted (#64748B).
// ============================================================

import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

// ── Color palette ──
export const CHART_COLORS = {
  navy:    "#2E66C4",
  gold:    "#D97706",
  success: "#15803D",
  danger:  "#B91C1C",
  critical:"#7C3AED",
  info:    "#075985",
  muted:   "#64748B",
  gold300: "#FCD34D",
};

const COLOR_WHEEL = [
  CHART_COLORS.navy, CHART_COLORS.gold, CHART_COLORS.success,
  CHART_COLORS.danger, CHART_COLORS.critical, CHART_COLORS.info,
];

// ── Shared tooltip style (glass) ──
const TOOLTIP_STYLE = {
  contentStyle: {
    background: "rgba(255,255,255,0.92)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    border: "1px solid rgba(13,52,119,0.14)",
    borderRadius: 10,
    boxShadow: "0 8px 24px rgba(3,16,43,0.12)",
    fontSize: 12,
    fontFamily: "var(--font-sans, 'IBM Plex Sans', sans-serif)",
    color: "#0F172A",
    padding: "8px 12px",
  },
  labelStyle: { fontWeight: 700, color: "#0D3477", marginBottom: 4 },
  itemStyle: { color: "#334155" },
};

// ── Axis styles ──
const AXIS_STYLE = {
  tick: { fill: "rgba(255,255,255,0.55)", fontSize: 10, fontFamily: "var(--font-mono, monospace)" },
  axisLine: { stroke: "rgba(255,255,255,0.10)" },
  tickLine: { stroke: "rgba(255,255,255,0.10)" },
};

const AXIS_STYLE_LIGHT = {
  tick: { fill: "#64748B", fontSize: 10, fontFamily: "var(--font-mono, monospace)" },
  axisLine: { stroke: "#E2E8F0" },
  tickLine: { stroke: "#E2E8F0" },
};

// ════════════════════════════════════════════════════════
// Sparkline — tiny inline trend line for KPI tiles
// ════════════════════════════════════════════════════════
export function Sparkline({ data, color = CHART_COLORS.gold, height = 30 }) {
  if (!data || data.length === 0) return null;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ════════════════════════════════════════════════════════
// TrendAreaChart — area chart for time-series
// ════════════════════════════════════════════════════════
export function TrendAreaChart({
  data, xKey = "date", yKey = "count",
  color = CHART_COLORS.navy, height = 200, dark = true,
}) {
  const axisStyle = dark ? AXIS_STYLE : AXIS_STYLE_LIGHT;
  const gridColor = dark ? "rgba(255,255,255,0.06)" : "#F1F5F9";
  const gradId = `grad-${yKey}-${color.replace("#","")}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -16 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.4} />
            <stop offset="95%" stopColor={color} stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis dataKey={xKey} {...axisStyle} />
        <YAxis {...axisStyle} width={32} />
        <Tooltip {...TOOLTIP_STYLE} />
        <Area
          type="monotone"
          dataKey={yKey}
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradId})`}
          isAnimationActive={true}
          animationDuration={600}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ════════════════════════════════════════════════════════
// TrendBarChart — bar chart for category comparisons
// ════════════════════════════════════════════════════════
export function TrendBarChart({
  data, xKey, yKey = "count",
  color = CHART_COLORS.navy, height = 200, dark = true,
  horizontal = false,
}) {
  const axisStyle = dark ? AXIS_STYLE : AXIS_STYLE_LIGHT;
  const gridColor = dark ? "rgba(255,255,255,0.06)" : "#F1F5F9";
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={{ top: 8, right: 12, bottom: 4, left: horizontal ? 20 : -16 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={!horizontal} horizontal={horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" {...axisStyle} />
            <YAxis type="category" dataKey={xKey} {...axisStyle} width={100} />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} {...axisStyle} />
            <YAxis {...axisStyle} width={32} />
          </>
        )}
        <Tooltip {...TOOLTIP_STYLE} cursor={{ fill: dark ? "rgba(255,255,255,0.04)" : "rgba(13,52,119,0.04)" }} />
        <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={600} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ════════════════════════════════════════════════════════
// StatusPieChart — donut chart for status breakdowns
// ════════════════════════════════════════════════════════
export function StatusPieChart({
  data, height = 200, dark = true, showLegend = true,
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={75}
          paddingAngle={2}
          dataKey="value"
          isAnimationActive={true}
          animationDuration={600}
        >
          {data.map((entry, i) => (
            <Cell
              key={`cell-${i}`}
              fill={entry.color || COLOR_WHEEL[i % COLOR_WHEEL.length]}
              stroke={dark ? "rgba(0,0,0,0.2)" : "#fff"}
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip {...TOOLTIP_STYLE} />
        {showLegend && (
          <Legend
            wrapperStyle={{
              fontSize: 11,
              fontFamily: "var(--font-sans, sans-serif)",
            }}
            iconType="circle"
          />
        )}
      </PieChart>
    </ResponsiveContainer>
  );
}

// ════════════════════════════════════════════════════════
// MultiSeriesBarChart — grouped bars for comparing categories
// ════════════════════════════════════════════════════════
export function MultiSeriesBarChart({
  data, xKey, series = [], height = 220, dark = true,
}) {
  const axisStyle = dark ? AXIS_STYLE : AXIS_STYLE_LIGHT;
  const gridColor = dark ? "rgba(255,255,255,0.06)" : "#F1F5F9";
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis dataKey={xKey} {...axisStyle} />
        <YAxis {...axisStyle} width={32} />
        <Tooltip {...TOOLTIP_STYLE} cursor={{ fill: dark ? "rgba(255,255,255,0.04)" : "rgba(13,52,119,0.04)" }} />
        <Legend
          wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-sans, sans-serif)" }}
          iconType="circle"
        />
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.name}
            fill={s.color || COLOR_WHEEL[i % COLOR_WHEEL.length]}
            radius={[4, 4, 0, 0]}
            isAnimationActive={true}
            animationDuration={600}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
