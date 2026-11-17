import { HBars, Kpi, KpiRow, PageHead, PageNotes, Panel } from '../components/ui';
import { TESTS } from '../data/sample';
import { pct } from '../lib/format';
import { qualitySummary } from '../lib/summaries';
import { pageById } from '../routes';
import { useApp } from '../state/AppContext';

const page = pageById('quality');

export default function QualityPage() {
  const { units } = useApp();
  const all = units.flatMap((u) => u.tests);
  const ftp = all.length ? pct(all.filter((x) => x.result === 'Pass').length / all.length) : 0;
  const byTest = TESTS.map((t) => {
    const r = all.filter((x) => x.test === t);
    const pass = r.filter((x) => x.result === 'Pass').length;
    return { t, rate: r.length ? pass / r.length : 0 };
  });

  return (
    <>
      <PageHead page={page} lede="How often units pass each Inspection and Test Plan (ITP) step first time. Retests add days to commissioning." summary={qualitySummary(units)} />
      <KpiRow>
        <Kpi label="First-time pass rate" value={ftp} unit="%" sub="Target 90%" tone={ftp >= 90 ? 'ok' : 'warn'} />
        <Kpi label="Tests run" value={all.length} sub="All ITP steps" />
        <Kpi label="Retests & fails" value={all.filter((x) => x.result !== 'Pass').length} sub="Each adds about a day" tone="warn" />
        <Kpi label="Awaiting ITP sign-off" value={units.filter((u) => u.stage === 'commissioning').length} sub="Units in commissioning" />
      </KpiRow>
      <Panel title="First-time pass rate by ITP test">
        <HBars max={100} rows={byTest.map((b) => ({ label: b.t, value: `${pct(b.rate)}%`, parts: [{ v: b.rate * 100, className: b.rate >= 0.9 ? 'okf' : 'warnf' }] }))} />
        <div className="legend">
          <span><i style={{ background: 'var(--ok)' }} />At or above 90%</span>
          <span><i style={{ background: 'var(--warn)' }} />Below 90%</span>
        </div>
      </Panel>
      <PageNotes page={page} />
    </>
  );
}
