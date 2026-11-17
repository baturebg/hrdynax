import { Globe2 } from 'lucide-react';
import { PROVINCES, SITE_PROVINCE } from '../data/finance';
import type { Unit } from '../data/types';
import { avg } from '../lib/format';
import { isField } from '../lib/selectors';

export interface ProvinceStat {
  code: string;
  name: string;
  units: number;
  uptime: number;
}

/** Field units and average uptime per province (and the Ghana cross-border site). */
export function provinceStats(units: Unit[]): ProvinceStat[] {
  const all = [...PROVINCES.map((p) => ({ code: p.code, name: p.name })), { code: 'GH', name: 'Ghana (cross-border)' }];
  return all
    .map((p) => {
      const us = units.filter((u) => isField(u) && SITE_PROVINCE[u.site] === p.code);
      return { ...p, units: us.length, uptime: avg(us.map((u) => u.uptime)) };
    })
    .filter((p) => p.units > 0)
    .sort((a, b) => b.uptime - a.uptime);
}

/** Tile cartogram of South Africa's nine provinces, shaded by how many field units operate there. */
export default function ProvinceMap({ stats }: { stats: ProvinceStat[] }) {
  const max = Math.max(1, ...stats.map((s) => s.units));
  const ghana = stats.find((s) => s.code === 'GH');
  return (
    <div>
      <div className="tilemap" role="img" aria-label="Units by province">
        {PROVINCES.map((p) => {
          const s = stats.find((x) => x.code === p.code);
          const lvl = !s ? 'none' : s.units / max > 0.66 ? 'l3' : s.units / max > 0.33 ? 'l2' : 'l1';
          return (
            <div
              key={p.code}
              className={`tile ${lvl}`}
              style={{ gridColumn: `${p.col} / span ${p.span ?? 1}`, gridRow: p.row, aspectRatio: p.span ? `${1.1 * p.span}` : undefined }}
              title={s ? `${p.name}: ${s.units} units, ${s.uptime.toFixed(1)}% uptime` : `${p.name}: no units`}
            >
              <div style={{ textAlign: 'center' }}>
                {p.code}
                {s && <small>{s.units} units</small>}
              </div>
            </div>
          );
        })}
      </div>
      {ghana && (
        <div className="xb">
          <Globe2 size={14} /> Cross-border: Ghana · {ghana.units} units
        </div>
      )}
    </div>
  );
}
