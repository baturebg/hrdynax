import { STAGES } from '../data/sample';
import type { Stage, StageId } from '../data/types';

interface Props {
  counts: Record<StageId, number>;
  /** number of items needing attention per stage; shows a red dot when > 0 */
  flags: Partial<Record<StageId, number>>;
  onSelect: (stage: Stage) => void;
}

// The home-page navigation wheel, modelled on the HR dashboard's Employee Life Cycle wheel.
export default function LifeCycleWheel({ counts, flags, onSelect }: Props) {
  const cx = 210, cy = 210, ro = 196, rin = 118, n = STAGES.length, gap = 1.2;
  const P = (r: number, a: number) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)] as const;
  const total = STAGES.filter((s) => s.id !== 'compliance').reduce((a, s) => a + counts[s.id], 0);

  return (
    <svg className="wheel" viewBox="0 0 420 420" role="group" aria-label="MMU life cycle">
      {STAGES.map((s, i) => {
        const a0 = -90 - 180 / n + (i * 360) / n + gap / 2;
        const a1 = a0 + 360 / n - gap;
        const [x0, y0] = P(ro, a0), [x1, y1] = P(ro, a1), [x2, y2] = P(rin, a1), [x3, y3] = P(rin, a0);
        const [mx, my] = P((ro + rin) / 2, (a0 + a1) / 2);
        const [fx, fy] = P(ro - 14, (a0 + a1) / 2);
        const flag = flags[s.id] ?? 0;
        return (
          <g
            key={s.id}
            className="seg"
            tabIndex={0}
            role="link"
            aria-label={`${s.name}: ${counts[s.id]} units`}
            onClick={() => onSelect(s)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(s);
              }
            }}
          >
            <path d={`M${x0},${y0} A${ro},${ro} 0 0 1 ${x1},${y1} L${x2},${y2} A${rin},${rin} 0 0 0 ${x3},${y3}Z`} />
            <text className="cnt" x={mx} y={my + 2} textAnchor="middle">{counts[s.id]}</text>
            <text className="nm" x={mx} y={my + 18} textAnchor="middle">{s.name}</text>
            {flag > 0 && (
              <circle className="flag" cx={fx} cy={fy} r={4.5}>
                <title>{`${flag} need attention`}</title>
              </circle>
            )}
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={rin - 14} fill="none" stroke="var(--hivis)" strokeWidth={3} strokeDasharray="2 6" />
      <text x={cx} y={cy - 4} textAnchor="middle" style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 52 }} fill="var(--ink)">
        {total}
      </text>
      <text x={cx} y={cy + 20} textAnchor="middle" fontSize={12} fill="var(--ink-3)" letterSpacing={1.5}>UNITS TRACKED</text>
    </svg>
  );
}
