import { DecisionButtons, Kpi, KpiRow, PageHead, PageNotes, Panel, Pill, UnitLink } from '../components/ui';
import { DATA_FIXES, DOCS, NOTES } from '../data/sample';
import { techById } from '../lib/selectors';
import { pageById } from '../routes';
import { useApp } from '../state/AppContext';

const page = pageById('intake');

const Confidence = ({ c }: { c: number }) => <Pill tone={c >= 85 ? 'ok' : c >= 70 ? 'warn' : 'bad'}>{c}% sure</Pill>;
const Review = ({ id }: { id: string }) => <DecisionButtons id={id} yes="Accepted" no="Rejected" yesLabel="Accept" noLabel="Reject" />;

export default function IntakePage() {
  const { decisions } = useApp();
  const pending = [...NOTES, ...DOCS, ...DATA_FIXES].filter((x) => !decisions[x.id]).length;

  return (
    <>
      <PageHead
        page={page}
        lede="AI reads technicians’ job notes and uploaded documents and turns them into clean records. Results under 85% confidence, and all suggested fixes, wait here for a person."
      />
      <KpiRow>
        <Kpi label="Waiting for review" value={pending} sub="Notes, documents and data fixes" tone={pending ? 'warn' : 'ok'} />
        <Kpi label="Auto-filed · 7 d" value={142} sub="Read with 85%+ confidence" />
        <Kpi label="Records fixed · 7 d" value={37} sub="Missing IDs and bad serials" />
        <Kpi label="Technician ID coverage" value={96} unit="%" sub="Up from 71% at go-live" tone="ok" />
      </KpiRow>

      <Panel title="Job notes read by AI">
        {NOTES.map((n) => (
          <div className="intake" key={n.id}>
            <div>
              <div className="small muted"><UnitLink serial={n.serial} /> · {techById(n.by).name}</div>
              <div className="quote">“{n.text}”</div>
            </div>
            <dl className="dl small">
              <dt>Fault code</dt><dd className="mono">{n.out.code}</dd>
              <dt>Component</dt><dd>{n.out.comp}</dd>
              <dt>Cause</dt><dd>{n.out.cause}</dd>
              <dt>Fix</dt><dd>{n.out.fix}</dd>
            </dl>
            <div className="side-act">
              <Confidence c={n.conf} />
              <Review id={n.id} />
            </div>
          </div>
        ))}
      </Panel>

      <Panel title="Uploaded documents">
        {DOCS.map((d) => (
          <div className="intake" key={d.id}>
            <div>
              <div className="small muted">{d.kind}</div>
              <div className="quote">{d.file}</div>
              <div className="small" style={{ marginTop: 6 }}>Filed against <UnitLink serial={d.serial} /></div>
            </div>
            <dl className="dl small">
              {d.fields.map(([k, v]) => (
                <div key={k} style={{ display: 'contents' }}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            <div className="side-act">
              <Confidence c={d.conf} />
              <Review id={d.id} />
            </div>
          </div>
        ))}
      </Panel>

      <Panel title="Data quality fixes">
        {DATA_FIXES.map((q) => (
          <div className="intake" key={q.id}>
            <div>
              <div className="small muted"><UnitLink serial={q.serial} /></div>
              <b>{q.issue}</b>
            </div>
            <div className="small">
              <span className="muted">Suggested fix</span>
              <br />
              {q.fix}
            </div>
            <div className="side-act">
              <Review id={q.id} />
            </div>
          </div>
        ))}
      </Panel>
      <PageNotes page={page} />
    </>
  );
}
