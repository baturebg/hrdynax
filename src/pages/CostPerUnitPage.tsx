import { Coins, Layers, Receipt, Scale, Truck } from 'lucide-react';
import { useState } from 'react';
import { HBars, Kpi, KpiRow, Locked, PageHead, PageNotes, Panel, Pill } from '../components/ui';
import { COST_PARTS, MODEL_COSTS } from '../data/finance';
import { UNITS } from '../data/sample';
import { avg, signed, zar, zarCompact } from '../lib/format';
import { can } from '../lib/selectors';
import { vatFromExclusive } from '../lib/tax/za';
import { pageById } from '../routes';
import { useApp } from '../state/AppContext';

const page = pageById('cost');

export default function CostPerUnitPage() {
  const { role } = useApp();
  const [model, setModel] = useState(MODEL_COSTS[0].model);
  const lede = 'Build cost of each MMU model from SAP, with the 15% input VAT the company claims back on the VAT201.';
  if (!can(role, 'finance'))
    return (
      <>
        <PageHead page={page} lede={lede} />
        <Locked what="Build costs and budgets are restricted." need="finance" />
        <PageNotes page={page} />
      </>
    );

  const rows = MODEL_COSTS.map((m) => {
    const cost = m.parts.reduce((a, b) => a + b, 0);
    return { ...m, cost, vat: vatFromExclusive(cost), units: UNITS.filter((u) => u.model === m.model).length, variance: cost - m.budget };
  });
  const sel = rows.find((r) => r.model === model) ?? rows[0];
  const fleetCost = rows.reduce((a, r) => a + r.cost * r.units, 0);
  const over = rows.filter((r) => r.variance > 0).length;

  return (
    <>
      <PageHead page={page} lede={lede} />
      <KpiRow>
        <Kpi variant="navy" icon={Truck} label="Average build cost" value={zarCompact(avg(rows.map((r) => r.cost)))} sub="Excl. VAT, across models" />
        <Kpi variant="gold" icon={Receipt} label="Input VAT per unit" value={zarCompact(avg(rows.map((r) => r.vat.vat)))} sub="Claimable on the VAT201" />
        <Kpi variant="green" icon={Coins} label="Fleet build value" value={zarCompact(fleetCost)} sub={`${UNITS.length} units, excl. VAT`} />
        <Kpi tone={over ? 'alert' : 'ok'} icon={Scale} label="Models over budget" value={over} unit={`/ ${rows.length}`} sub="Build cost vs budget" />
      </KpiRow>

      <Panel title="Cost per unit by model" icon={Coins}>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Model</th><th className="r">Units</th><th className="r">Cost excl. VAT</th><th className="r">VAT 15%</th><th className="r">Cost incl. VAT</th><th className="r">Budget</th><th className="r">Variance</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.model} className="click" onClick={() => setModel(r.model)} style={r.model === model ? { background: 'var(--surface-2)' } : undefined}>
                  <td><b>{r.model}</b></td>
                  <td className="r">{r.units}</td>
                  <td className="r">{zar(r.cost)}</td>
                  <td className="r">{zar(r.vat.vat)}</td>
                  <td className="r">{zar(r.vat.inclusive)}</td>
                  <td className="r">{zar(r.budget)}</td>
                  <td className="r">
                    <Pill tone={r.variance > 0 ? 'bad' : 'ok'}>{signed(Math.round((r.variance / r.budget) * 1000) / 10)}%</Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small muted" style={{ marginBottom: 0 }}>Click a model to see its cost breakdown.</p>
      </Panel>

      <Panel
        title={`Cost breakdown · ${sel.model}`}
        icon={Layers}
        actions={
          <select value={model} onChange={(e) => setModel(e.target.value)} aria-label="Model">
            {rows.map((r) => <option key={r.model}>{r.model}</option>)}
          </select>
        }
      >
        <HBars max={Math.max(...sel.parts)} rows={COST_PARTS.map((p, i) => ({ label: p, value: zarCompact(sel.parts[i]), parts: [{ v: sel.parts[i] }] }))} />
      </Panel>
      <PageNotes page={page} />
    </>
  );
}
