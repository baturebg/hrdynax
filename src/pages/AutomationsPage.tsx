import { CheckIcon } from '../components/icons';
import { Kpi, KpiRow, PageHead, PageNotes, Panel } from '../components/ui';
import { APPROVALS, AUTOMATIONS, DATA_FIXES, DOCS, GUARDRAILS, NOTES } from '../data/sample';
import type { Automation } from '../data/types';
import { pageById } from '../routes';
import { useApp } from '../state/AppContext';

const page = pageById('automations');

function AutomationTable({ items }: { items: Automation[] }) {
  const { isOn, toggleAutomation } = useApp();
  return (
    <div className="tbl-wrap">
      <table>
        <thead>
          <tr><th>Name</th><th>When it runs</th><th>What it does</th><th>Phase</th><th>Last run</th><th className="r">Runs · 7 d</th><th>On</th></tr>
        </thead>
        <tbody>
          {items.map((a) => (
            <tr key={a.id} style={isOn(a.id) ? undefined : { opacity: 0.55 }}>
              <td>
                <b>{a.name}</b>
                <div className="small muted">{a.tool}</div>
              </td>
              <td className="small">{a.trigger}</td>
              <td className="small">
                {a.action}
                {a.approvalNote && <div style={{ color: 'var(--warn)' }}>{a.approvalNote}</div>}
              </td>
              <td><span className="chip">{a.phase}</span></td>
              <td className="small mono">{a.lastRun}</td>
              <td className="r">{a.runs7d}</td>
              <td>
                <button type="button" className="sw" role="switch" aria-checked={isOn(a.id)} aria-label={a.name} onClick={() => toggleAutomation(a.id)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AutomationsPage() {
  const { isOn, decisions } = useApp();
  const rules = AUTOMATIONS.filter((a) => a.kind === 'rule');
  const ai = AUTOMATIONS.filter((a) => a.kind === 'ai');
  const waiting = APPROVALS.filter((a) => !decisions[a.id]).length + [...NOTES, ...DOCS, ...DATA_FIXES].filter((x) => !decisions[x.id]).length;

  return (
    <>
      <PageHead page={page} lede="Rules and AI jobs that run on the platform. Turning one off stops its alerts and actions; the dashboards keep working." />
      <KpiRow>
        <Kpi label="Rules on" value={rules.filter((a) => isOn(a.id)).length} unit={`/ ${rules.length}`} sub="Year 1–2 automations" />
        <Kpi label="AI jobs on" value={ai.filter((a) => isOn(a.id)).length} unit={`/ ${ai.length}`} sub="Year 1–4, phased" />
        <Kpi label="Actions · 7 d" value={AUTOMATIONS.filter((a) => isOn(a.id)).reduce((x, a) => x + a.runs7d, 0)} sub="Alerts, tasks, work orders, reads" />
        <Kpi label="Waiting for a person" value={waiting} sub="Approvals and intake review" tone="warn" />
      </KpiRow>
      <Panel title="Automations (rules)">
        <AutomationTable items={rules} />
      </Panel>
      <Panel title="AI jobs">
        <AutomationTable items={ai} />
      </Panel>
      <Panel title="Guardrails">
        <ul className="guard">
          {GUARDRAILS.map((g) => (
            <li key={g}>
              <CheckIcon />
              <span>{g}</span>
            </li>
          ))}
        </ul>
      </Panel>
      <PageNotes page={page} />
    </>
  );
}
