import { ColumnChart } from '../components/charts';
import { Kpi, KpiRow, PageHead, PageNotes, Panel } from '../components/ui';
import { DELIVERED } from '../data/sample';
import { signed } from '../lib/format';
import { trendsSummary } from '../lib/summaries';
import { pageById } from '../routes';

const page = pageById('trends');

export default function TrendsPage() {
  const last = DELIVERED[DELIVERED.length - 1];
  const prev = DELIVERED[DELIVERED.length - 2];
  const first = DELIVERED[0];
  return (
    <>
      <PageHead page={page} lede="Monthly output and how long a unit takes from purchase order to handover. The current month is highlighted." summary={trendsSummary()} />
      <KpiRow>
        <Kpi label="Delivered · Nov" value={last.units} sub={`${signed(last.units - prev.units)} vs Oct`} />
        <Kpi label="Delivered · 12 mo" value={DELIVERED.reduce((a, d) => a + d.units, 0)} sub="Dec 25 to Nov 26" />
        <Kpi label="Cycle time · Nov" value={last.cycleDays} unit="days" sub="PO to handover" tone="ok" />
        <Kpi label="Cycle time change" value={signed(last.cycleDays - first.cycleDays)} unit="days" sub="vs Dec 25" />
      </KpiRow>
      <div className="grid2">
        <Panel title="Units completed per month">
          <ColumnChart data={DELIVERED.map((d) => ({ label: d.label, value: d.units }))} />
        </Panel>
        <Panel title="Average cycle time per month (days)">
          <ColumnChart data={DELIVERED.map((d) => ({ label: d.label, value: d.cycleDays }))} />
        </Panel>
      </div>
      <PageNotes page={page} />
    </>
  );
}
