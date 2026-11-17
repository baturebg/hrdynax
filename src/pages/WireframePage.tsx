import { Kpi, KpiRow, Locked, PageHead, PageNotes } from '../components/ui';
import { can } from '../lib/selectors';
import type { PageDef } from '../routes';
import { useApp } from '../state/AppContext';

// Placeholder layout for pages that are specified but not built yet.
export default function WireframePage({ page }: { page: PageDef }) {
  const { role } = useApp();
  const people = page.module === 'hr';
  return (
    <>
      <PageHead page={page} lede={`Layout to be built. Mirrors the HR dashboard’s “${page.hr}” page with MMU measures.`} />
      {page.needs && !can(role, page.needs) && <Locked what="This page’s figures are restricted." need={page.needs} />}
      <KpiRow>
        {page.measures.slice(0, 4).map((m) => (
          <Kpi key={m} label={m} value="—" sub="KPI card" tone="wire" />
        ))}
      </KpiRow>
      <div className="grid2">
        {page.measures.slice(0, 2).map((m, i) => (
          <div className="wf" key={m}>
            <div>
              <b>{m}</b>
              {['Bar or column chart', 'Sankey or ranked bars'][i]}
            </div>
          </div>
        ))}
      </div>
      <div className="wf" style={{ minHeight: 140 }}>
        <div>
          <b>Detail table</b>
          One row per {people ? 'technician' : 'unit'} · click a row to drill through to the {people ? 'Technician' : 'Unit'} Profile
        </div>
      </div>
      <PageNotes page={page} />
    </>
  );
}
