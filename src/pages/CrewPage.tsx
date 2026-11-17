import { DecisionButtons, Kpi, KpiRow, PageHead, PageNotes, Panel } from '../components/ui';
import { LockIcon } from '../components/icons';
import { CREW, DAYS, JOBS, TECHS, TODAY_INDEX, onShift } from '../data/sample';
import type { ShiftCode } from '../data/types';
import { can } from '../lib/selectors';
import { crewSummary } from '../lib/summaries';
import { pageById } from '../routes';
import { useApp } from '../state/AppContext';

const page = pageById('crew');
const SHIFT_LABEL: Record<ShiftCode, string> = { D: 'Day', N: 'Night', L: 'Leave', O: 'Off' };

function SuggestedCover({ hr }: { hr: boolean }) {
  const gaps = DAYS.map((d, i) => ({ d, i, gap: JOBS[i] - onShift(i) })).filter((x) => x.gap > 0);
  if (!gaps.length) return null;
  return (
    <Panel title="AI suggested cover">
      {gaps.map((g) => {
        const free = CREW.filter((c) => c.days[g.i] === 'O')
          .map((c) => TECHS.find((t) => t.id === c.id)!)
          .sort((a, b) => b.ftp - a.ftp)
          .slice(0, Math.min(3, g.gap + 1));
        return (
          <div className="appr" key={g.i}>
            <div>
              <b>{g.d} Nov · short by {g.gap}</b>
              <div className="small muted">
                {hr
                  ? free.map((t) => `${t.name} (${t.role}, ${t.ftp}% pass rate)`).join(' · ') || 'No one is free that day'
                  : `${free.length} certified technicians are off that day and could cover. Names are shown to HR and the planner.`}
              </div>
            </div>
            <DecisionButtons id={`cover-${g.i}`} yes="Sent to planner" yesLabel="Send to planner" />
          </div>
        );
      })}
    </Panel>
  );
}

export default function CrewPage() {
  const { role } = useApp();
  const hr = can(role, 'people');
  const on = DAYS.map((_, i) => onShift(i));
  const leave = DAYS.map((_, i) => CREW.filter((c) => c.days[i] === 'L').length);
  const max = Math.max(...JOBS, ...on);
  const gapDays = DAYS.filter((_, i) => JOBS[i] > on[i]).length;
  const t = TODAY_INDEX;

  return (
    <>
      <PageHead page={page} lede="Planned jobs against the technicians on shift each day this week. A gap means jobs will slip unless cover is found." summary={crewSummary()} />
      <KpiRow>
        <Kpi label="On shift today" value={on[t]} sub={`of ${CREW.length} technicians`} />
        <Kpi label="On leave today" value={leave[t]} sub="Annual, sick and training" />
        <Kpi label="Jobs planned today" value={JOBS[t]} sub="Build, test and callouts" />
        <Kpi label="Days with a cover gap" value={gapDays} sub="This week" tone={gapDays ? 'alert' : 'ok'} />
      </KpiRow>

      <Panel title="Planned jobs vs available crew · week of 16 Nov">
        <div className="hbars">
          {DAYS.map((d, i) => (
            <div className="hbar" key={d}>
              <span>{d}</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div className="t" style={{ height: 10 }}><div className="f" style={{ width: `${(on[i] / max) * 100}%` }} /></div>
                <div className="t" style={{ height: 10 }}><div className={`f ${JOBS[i] > on[i] ? 'over' : 'okf'}`} style={{ width: `${(JOBS[i] / max) * 100}%` }} /></div>
              </div>
              <span className="n">{on[i]} / {JOBS[i]}</span>
            </div>
          ))}
        </div>
        <div className="legend">
          <span><i style={{ background: 'var(--accent)' }} />Technicians on shift</span>
          <span><i style={{ background: 'var(--ok)' }} />Jobs planned, covered</span>
          <span><i style={{ background: 'var(--bad)' }} />Jobs planned, gap</span>
        </div>
      </Panel>

      <SuggestedCover hr={hr} />

      <Panel title="Shift roster">
        {hr ? (
          <>
            <div className="tbl-wrap">
              <div className="crew" style={{ gridTemplateColumns: 'auto repeat(7, minmax(54px, 1fr))' }}>
                <span />
                {DAYS.map((d, i) => (
                  <span key={d} className={`cl ${i === t ? 'today' : ''}`}>{d}{i === t ? ' · today' : ''}</span>
                ))}
                {CREW.map((c) => (
                  <div key={c.id} style={{ display: 'contents' }}>
                    <span className="rl">{c.name}</span>
                    {c.days.map((s, i) => <span key={i} className={`c c-${s}`}>{SHIFT_LABEL[s]}</span>)}
                  </div>
                ))}
              </div>
            </div>
            <div className="legend">
              <span><i className="c-D" />Day shift</span>
              <span><i className="c-N" />Night shift</span>
              <span><i className="c-L" />Leave</span>
              <span><i className="c-O" />Off</span>
            </div>
          </>
        ) : (
          <div className="lock">
            <LockIcon />
            <div>
              <b>Showing crew totals only</b>
              <p>Names and leave types are visible to the HR data owner. Operations roles see how many technicians are available each day.</p>
            </div>
          </div>
        )}
      </Panel>
      <PageNotes page={page} />
    </>
  );
}
