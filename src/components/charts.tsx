// Small SVG chart kit. Every mark is placed with one scale; colours come from theme tokens.

/** A "nice" tick step for roughly n intervals up to max. */
export function niceStep(max: number, n = 4) {
  const raw = max / n || 1;
  const p = 10 ** Math.floor(Math.log10(raw));
  const m = raw / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
}

function ticks(from: number, to: number, step: number) {
  const out: number[] = [];
  for (let v = Math.ceil(from / step) * step; v <= to + 1e-9; v += step) out.push(+v.toFixed(6));
  return out;
}

const axisText = { fontSize: 10.5, fill: 'var(--ink-3)' } as const;

export function ColumnChart({ data, height = 210 }: { data: { label: string; value: number }[]; height?: number }) {
  const W = 600, H = height, pl = 34, pr = 6, pt = 14, pb = 24;
  const mx = Math.max(1, ...data.map((d) => d.value));
  const step = niceStep(mx);
  const top = Math.ceil(mx / step) * step;
  const y = (v: number) => pt + (H - pt - pb) * (1 - v / top);
  const bw = (W - pl - pr) / data.length;
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img">
      {ticks(0, top, step).map((v) => (
        <g key={v}>
          <line x1={pl} x2={W - pr} y1={y(v)} y2={y(v)} stroke="var(--line)" />
          <text x={pl - 6} y={y(v) + 3.5} textAnchor="end" {...axisText}>{v}</text>
        </g>
      ))}
      {data.map((d, i) => {
        const x = pl + i * bw + bw * 0.2, w = bw * 0.6, last = i === data.length - 1;
        return (
          <g key={d.label}>
            <rect x={x} y={y(d.value)} width={w} height={y(0) - y(d.value)} rx={2} fill={last ? 'var(--hivis)' : 'var(--accent)'}>
              <title>{`${d.label}: ${d.value}`}</title>
            </rect>
            <text x={x + w / 2} y={y(d.value) - 5} textAnchor="middle" fontSize={10.5} fill="var(--ink-2)">{d.value}</text>
            <text x={x + w / 2} y={H - 7} textAnchor="middle" {...axisText}>{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

/** 24-hour telemetry line (48 half-hour points) with a trip threshold and optional anomaly marks. */
export function TelemetryChart({ values, threshold, unit, lo, hi, marks = [] }: { values: number[]; threshold: number; unit: string; lo: number; hi: number; marks?: number[] }) {
  const W = 600, H = 160, pl = 34, pr = 8, pt = 10, pb = 22;
  const x = (i: number) => pl + ((W - pl - pr) * i) / (values.length - 1);
  const y = (v: number) => pt + (H - pt - pb) * (1 - (v - lo) / (hi - lo));
  const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const last = values[values.length - 1];
  const step = niceStep(hi - lo);
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img">
      {ticks(lo, hi, step).map((v) => (
        <g key={v}>
          <line x1={pl} x2={W - pr} y1={y(v)} y2={y(v)} stroke="var(--line)" />
          <text x={pl - 6} y={y(v) + 3.5} textAnchor="end" {...axisText}>{v}</text>
        </g>
      ))}
      <line x1={pl} x2={W - pr} y1={y(threshold)} y2={y(threshold)} stroke="var(--bad)" strokeDasharray="4 4" />
      <text x={W - pr} y={y(threshold) - 5} textAnchor="end" fontSize={10.5} fill="var(--bad)">Trip {threshold} {unit}</text>
      <polygon points={`${pl},${y(lo)} ${pts} ${W - pr},${y(lo)}`} fill="var(--accent)" opacity={0.12} />
      <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" />
      <circle cx={x(values.length - 1)} cy={y(last)} r={4} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} />
      {marks.map((i) => (
        <circle key={i} cx={x(i)} cy={y(values[i])} r={6} fill="none" stroke="var(--bad)" strokeWidth={2}>
          <title>Anomaly flagged</title>
        </circle>
      ))}
      {[0, 12, 24, 36, 47].map((i) => (
        <text key={i} x={x(i)} y={H - 6} textAnchor="middle" {...axisText}>{i === 47 ? 'now' : `-${(48 - i) / 2}h`}</text>
      ))}
    </svg>
  );
}

export interface Series {
  name: string;
  color: string;
  values: number[];
  area?: boolean;
}

/** Several series on one value axis, with dots and optional area fill (dashboard performance chart). */
export function MultiLineChart({ labels, series, height = 230, unit = '' }: { labels: string[]; series: Series[]; height?: number; unit?: string }) {
  const W = 640, H = height, pl = 44, pr = 10, pt = 12, pb = 26;
  const mx = Math.max(1, ...series.flatMap((s) => s.values));
  const step = niceStep(mx);
  const top = Math.ceil(mx / step) * step;
  const x = (i: number) => pl + ((W - pl - pr) * i) / Math.max(1, labels.length - 1);
  const y = (v: number) => pt + (H - pt - pb) * (1 - v / top);
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img">
      {ticks(0, top, step).map((v) => (
        <g key={v}>
          <line x1={pl} x2={W - pr} y1={y(v)} y2={y(v)} stroke="var(--line)" />
          <text x={pl - 8} y={y(v) + 3.5} textAnchor="end" {...axisText}>{v}{unit}</text>
        </g>
      ))}
      {series.map((s) => {
        const pts = s.values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
        return (
          <g key={s.name}>
            {s.area && <polygon points={`${x(0)},${y(0)} ${pts} ${x(s.values.length - 1)},${y(0)}`} fill={s.color} opacity={0.1} />}
            <polyline points={pts} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinejoin="round" />
            {s.values.map((v, i) => (
              <circle key={i} cx={x(i)} cy={y(v)} r={3.6} fill="var(--surface)" stroke={s.color} strokeWidth={2}>
                <title>{`${s.name} · ${labels[i]}: ${v}${unit}`}</title>
              </circle>
            ))}
          </g>
        );
      })}
      {labels.map((l, i) => (
        <text key={l + i} x={x(i)} y={H - 7} textAnchor="middle" {...axisText}>{l}</text>
      ))}
    </svg>
  );
}

/** Tiny trend line for KPI cards (white on the coloured card). */
export function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const W = 92, H = 38;
  const lo = Math.min(...values), hi = Math.max(...values);
  const x = (i: number) => (W * i) / (values.length - 1);
  const y = (v: number) => H - 4 - ((H - 8) * (v - lo)) / (hi - lo || 1);
  const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return (
    <svg className="spark" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <polygon points={`0,${H} ${pts} ${W},${H}`} fill="#fff" opacity={0.14} />
      <polyline points={pts} fill="none" stroke="#fff" strokeWidth={2} strokeLinejoin="round" />
    </svg>
  );
}

/** Small rising bars (growth illustration next to the performance chart). */
export function MiniBars({ values, color = 'var(--green)' }: { values: number[]; color?: string }) {
  const W = 90, H = 56, mx = Math.max(...values, 1), bw = W / values.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={90} height={56} aria-hidden="true">
      {values.map((v, i) => (
        <rect key={i} x={i * bw + 2} y={H - (v / mx) * H} width={bw - 4} height={(v / mx) * H} rx={2} fill={color} opacity={0.45 + (0.55 * (i + 1)) / values.length} />
      ))}
    </svg>
  );
}

/** Distribution of risk probabilities in 10% bins, coloured by risk level. */
export function RiskHistogram({ probs }: { probs: number[] }) {
  const bins = Array.from({ length: 10 }, (_, i) => probs.filter((p) => Math.min(9, Math.floor(p * 10)) === i).length);
  const W = 600, H = 170, pl = 30, pr = 6, pt = 12, pb = 24;
  const mx = Math.max(1, ...bins);
  const step = Math.max(1, niceStep(mx));
  const top = Math.ceil(mx / step) * step;
  const bw = (W - pl - pr) / 10;
  const y = (v: number) => pt + (H - pt - pb) * (1 - v / top);
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img">
      {ticks(0, top, step).map((v) => (
        <g key={v}>
          <line x1={pl} x2={W - pr} y1={y(v)} y2={y(v)} stroke="var(--line)" />
          <text x={pl - 6} y={y(v) + 3.5} textAnchor="end" {...axisText}>{v}</text>
        </g>
      ))}
      {bins.map((n, i) => (
        <g key={i}>
          <rect x={pl + i * bw + 2} y={y(n)} width={bw - 4} height={y(0) - y(n)} rx={2} fill={i >= 7 ? 'var(--bad)' : i >= 4 ? 'var(--warn)' : 'var(--ok)'}>
            <title>{`${i * 10}–${i * 10 + 9}%: ${n} units`}</title>
          </rect>
          <text x={pl + i * bw + bw / 2} y={H - 7} textAnchor="middle" {...axisText}>{i * 10}%</text>
        </g>
      ))}
    </svg>
  );
}
