import { DecisionButtons, Kpi, KpiRow, PageHead, PageNotes, Panel, Pill, UnitLink } from '../components/ui';
import { ALERTS, APPROVALS } from '../data/sample';
import type { Severity, Tone } from '../data/types';
import { whenTxt } from '../lib/format';
import { pageById } from '../routes';
import { useApp } from '../state/AppContext';

const page = pageById('alerts');
const SEV: Record<Severity, { tone: Tone; label: string }> = {
  bad: { tone: 'bad', label: 'Critical' },
  warn: { tone: 'warn', label: 'Warning' },
  info: { tone: 'info', label: 'Info' },
};

export default function AlertsPage() {
  const { site, alertFilter, setAlertFilter, acknowledged, acknowledge, decisions, isOn } = useApp();
  const types = [...new Set(ALERTS.map((a) => a.type))];
  const list = ALERTS.filter((a) => (site === 'all' || !a.site || a.site === site) && (alertFilter === 'all' || a.type === alertFilter) && isOn(a.automation));
  const open = list.filter((a) => !acknowledged.has(a.id));

  return (
    <>
      <PageHead page={page} lede="Everything the automations raised in the last 3 days, and actions waiting for a person to approve." />
      <KpiRow>
        <Kpi label="Open alerts" value={open.length} sub={`${list.length - open.length} acknowledged`} />
        <Kpi label="Critical" value={open.filter((a) => a.sev === 'bad').length} sub="Late builds, expired permits, anomalies" tone="alert" />
        <Kpi label="Waiting for approval" value={APPROVALS.filter((a) => !decisions[a.id]).length} sub="Needs a person to sign off" tone="warn" />
        <Kpi label="Channels" value={new Set(list.map((a) => a.channel.split(' ·')[0])).size} sub="Teams, email, SAP, fix queue" />
      </KpiRow>

      <Panel title="Waiting for approval">
        {APPROVALS.map((a) => (
          <div className="appr" key={a.id}>
            <div>
              <b>{a.what}</b>
              <div className="small muted">{a.value} · {a.why}</div>
            </div>
            <DecisionButtons id={a.id} yes="Approved" no="Rejected" yesLabel="Approve" noLabel="Reject" />
          </div>
        ))}
      </Panel>

      <Panel
        title="Alert inbox"
        actions={
          <div className="btns">
            {['all', ...types].map((t) => (
              <button key={t} type="button" className={`btn ${alertFilter === t ? 'on' : ''}`} onClick={() => setAlertFilter(t)}>
                {t === 'all' ? 'All' : t}
              </button>
            ))}
          </div>
        }
      >
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Severity</th><th>Type</th><th>Unit</th><th>What happened</th><th>Sent to</th><th>When</th><th /></tr></thead>
            <tbody>
              {list.length ? (
                list.map((a) => {
                  const done = acknowledged.has(a.id);
                  return (
                    <tr key={a.id} style={done ? { opacity: 0.5 } : undefined}>
                      <td><Pill tone={SEV[a.sev].tone}>{SEV[a.sev].label}</Pill></td>
                      <td>{a.type}</td>
                      <td>{a.serial ? <UnitLink serial={a.serial} /> : <span className="muted">—</span>}</td>
                      <td>
                        {a.text}
                        {a.site && <div className="small muted">{a.site}</div>}
                      </td>
                      <td className="small">{a.channel}</td>
                      <td className="small mono">{whenTxt(a.hoursAgo)}</td>
                      <td>
                        {done ? (
                          <span className="small muted">Acknowledged</span>
                        ) : (
                          <button type="button" className="btn" onClick={() => acknowledge(a.id)}>Acknowledge</button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={7} className="muted">No alerts for this filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
      <PageNotes page={page} />
    </>
  );
}
