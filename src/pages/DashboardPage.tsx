import {
  AlertTriangle, ArrowRight, BarChart3, Briefcase, CalendarDays, CheckCircle2, Clock, Coins, FilePlus2, FileText, HardHat,
  Info, Lightbulb, MapPin, MapPinned, PlayCircle, Send, ShieldCheck, Sparkles, TrendingUp, Truck, UserCog, Users, Zap,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeroArt, Robot } from '../components/art';
import { MiniBars, MultiLineChart } from '../components/charts';
import ProvinceMap, { provinceStats } from '../components/ProvinceMap';
import { GoldTitle, Kpi, Panel } from '../components/ui';
import { ACTIVITIES, ANNUAL_BUDGET, COMPANY, CURRENT_USER, LTIFR, PERFORMANCE, PRIOR_YEAR_REVENUE, STAFF_TOTAL, VAT_ACQUISITIONS, VAT_PERIOD, VAT_SUPPLIES } from '../data/finance';
import { DELIVERED, TECHS, TODAY, UNITS } from '../data/sample';
import { fd, num, zar, zarCompact } from '../lib/format';
import { can, isField, isPipe } from '../lib/selectors';
import { availabilitySummary, homeSummary, riskSummary } from '../lib/summaries';
import { vatReturn } from '../lib/tax/za';
import { useApp } from '../state/AppContext';

const PERIODS = { '12': 'Last 12 months', '6': 'Last 6 months', ytd: 'Year to date' } as const;
type Period = keyof typeof PERIODS;

export default function DashboardPage() {
  const { units, ask, setAskOpen, role } = useApp();
  const nav = useNavigate();
  const [period, setPeriod] = useState<Period>('12');
  const [q, setQ] = useState('');

  const field = units.filter(isField);
  const pipe = units.filter(isPipe);
  const anomalies = field.filter((u) => u.anomaly).length;
  const ytd = PERFORMANCE.slice(1);
  const ytdRevenue = ytd.reduce((a, p) => a + p.revenue, 0) * 1e6;
  const ytdCost = ytd.reduce((a, p) => a + p.cost, 0) * 1e6;
  const priorYtd = PRIOR_YEAR_REVENUE.slice(1).reduce((a, v) => a + v, 0) * 1e6;
  const growth = (ytdRevenue / priorYtd - 1) * 100;
  const validPermits = field.filter((u) => u.certDue > 0).length;
  const certs = TECHS.flatMap((t) => t.certs);
  const compliance = ((validPermits + certs.filter((c) => c.expiresInDays > 0).length) / Math.max(1, field.length + certs.length)) * 100;
  const provinces = provinceStats(units);
  const shown = period === '6' ? PERFORMANCE.slice(-6) : period === 'ytd' ? ytd : PERFORMANCE;
  const vat = vatReturn(VAT_SUPPLIES, VAT_ACQUISITIONS);

  const insights = [
    { icon: TrendingUp, color: 'var(--purple)', text: <>Revenue is up <b>{growth.toFixed(1)}%</b> on the same months last year.</> },
    { icon: AlertTriangle, color: 'var(--gold)', text: homeSummary(units)?.text.split('. ')[0] + '.' },
    { icon: CheckCircle2, color: 'var(--green)', text: availabilitySummary(units)?.text.split('. ')[0] + '.' },
    can(role, 'finance')
      ? { icon: Info, color: 'var(--blue)', text: <>VAT201 for {VAT_PERIOD.label}: <b>{zar(vat.netPayable)}</b> payable, due {VAT_PERIOD.due}.</> }
      : { icon: Info, color: 'var(--blue)', text: riskSummary(units)?.text.split('. ')[0] + '.' },
  ];

  const quick = [
    { icon: FilePlus2, label: 'New project', to: '/pipeline' },
    { icon: CheckCircle2, label: 'Approve items', to: '/alerts' },
    { icon: BarChart3, label: 'View reports', to: '/trends' },
    { icon: UserCog, label: 'Manage staff', to: '/crew' },
    { icon: FileText, label: 'Tax returns', to: '/finance/tax' },
    { icon: PlayCircle, label: 'Run workflow', to: '/automations' },
  ];

  const prompts = ['Which units are late?', 'Which units are at Peak risk?', 'What VAT do we owe for October?', 'Do we have enough crew this week?'];
  const send = (text: string) => {
    if (!text.trim()) return;
    ask(text.trim());
    setAskOpen(true);
  };

  return (
    <>
      <section className="hero">
        <HeroArt />
        <div>
          <span className="chip-gold"><BarChart3 size={14} /> Executive Overview</span>
          <h1><GoldTitle text={`${COMPANY.name} Control Tower`} /></h1>
          <p className="sub">Real-time insights. Intelligent automation. Operational excellence.</p>
          <div className="hero-stats">
            <div><MapPinned size={30} /><span><b>{provinces.filter((p) => p.code !== 'GH').length}</b>Provinces</span></div>
            <div><Users size={30} /><span><b>{num(STAFF_TOTAL)}</b>Total staff</span></div>
            <div><Briefcase size={30} /><span><b>{pipe.length}</b>Active projects</span></div>
            <div><Coins size={30} /><span><b>{zarCompact(ytdRevenue)}</b>YTD revenue</span></div>
          </div>
        </div>
        <aside className="status-card" aria-label="Operations status">
          <span className="t"><span className="live-dot" /> Operations Status</span>
          {anomalies ? (
            <span className="warn-pill"><AlertTriangle size={15} /> {anomalies} units need attention</span>
          ) : (
            <span className="ok-pill"><CheckCircle2 size={15} /> All systems operational</span>
          )}
          <hr />
          <span className="upd">
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={15} /> Last updated</span>
            <b style={{ color: '#fff' }}>{fd(TODAY)} · 06:00</b>
          </span>
        </aside>
      </section>

      <div className="dash">
        <Kpi variant="navy" icon={Truck} label="Active Projects" value={pipe.length} sub={`${units.length} units tracked`} spark={DELIVERED.map((d) => d.units)} />
        <Kpi variant="gold" icon={Coins} label="Annual Budget" value={zarCompact(ANNUAL_BUDGET)} sub={`${Math.round((ytdCost / ANNUAL_BUDGET) * 100)}% spent YTD`} spark={PERFORMANCE.map((p) => p.cost)} />
        <Kpi variant="green" icon={Users} label="Total Staff" value={num(STAFF_TOTAL)} sub={`${TECHS.length} field technicians`} spark={[440, 452, 458, 461, 470, 474, 478, 480, 486]} />
        <Kpi variant="purple" icon={ShieldCheck} label="Compliance Rate" value={compliance.toFixed(1)} unit="%" sub="Permits & certificates valid" spark={[91, 92, 92.5, 93, 94, 93.8, 94.6, compliance]} />
        <Kpi
          variant="teal" icon={HardHat} label="Safety Record" value={LTIFR.current.toFixed(2)} unit="LTIFR"
          delta={{ text: `${Math.round((1 - LTIFR.current / LTIFR.prior) * 100)}%`, up: false }} sub="vs last year" spark={[0.31, 0.3, 0.29, 0.27, 0.27, 0.25, 0.24]}
        />

        <section className="ai-card" aria-label="AI assistant">
          <Robot />
          <div>
            <h3>HRDYNAX AI Assistant</h3>
            <span className="online"><span className="live-dot" /> Online</span>
          </div>
          <div className="hello">Hello {CURRENT_USER.greeting},<br />How can I help you today?</div>
          <div className="prompts">
            {prompts.map((p) => (
              <button key={p} type="button" onClick={() => send(p)}><Sparkles size={14} /> {p}</button>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(q); setQ(''); }}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask anything…" aria-label="Ask the AI assistant" />
            <button type="submit" aria-label="Send"><Send size={15} /></button>
          </form>
        </section>

        <Panel
          className="perf" title="Operations Performance" icon={BarChart3}
          actions={
            <select value={period} onChange={(e) => setPeriod(e.target.value as Period)} aria-label="Period">
              {Object.entries(PERIODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          }
        >
          <div className="perf-wrap">
            <div>
              <MultiLineChart
                labels={shown.map((p) => p.label)}
                unit="m"
                height={280}
                series={[
                  { name: 'Revenue (R m)', color: 'var(--blue)', values: shown.map((p) => p.revenue) },
                  { name: 'Operating cost (R m)', color: 'var(--gold)', values: shown.map((p) => p.cost), area: true },
                  { name: 'EBITDA (R m)', color: 'var(--green)', values: shown.map((p) => p.ebitda), area: true },
                ]}
              />
              <div className="legend" style={{ justifyContent: 'center' }}>
                <span><i style={{ background: 'var(--blue)' }} />Revenue</span>
                <span><i style={{ background: 'var(--gold)' }} />Operating cost</span>
                <span><i style={{ background: 'var(--green)' }} />EBITDA</span>
              </div>
            </div>
            <div className="growth">
              <b><TrendingUp size={24} /> {growth.toFixed(1)}%</b>
              <span>Revenue growth (YoY, Jan–Nov)</span>
              <MiniBars values={[0, 1, 2, 3].map((qi) => ytd.slice(qi * 3, qi * 3 + 3).reduce((a, p) => a + p.revenue, 0))} />
            </div>
          </div>
        </Panel>

        <Panel className="prov" title="Operations Across Provinces" icon={MapPin} link={{ to: '/regions', label: 'View details' }}>
          <div className="prov-wrap">
            <ProvinceMap stats={provinces} />
            <div className="prov-bars">
              {provinces.slice(0, 6).map((p) => (
                <div className="row" key={p.code}>
                  <span>{p.name}</span>
                  <b>{p.uptime.toFixed(0)}%</b>
                  <span className="bar"><i style={{ width: `${p.uptime}%`, background: p.uptime >= 95 ? 'var(--green)' : 'var(--gold)' }} /></span>
                </div>
              ))}
              <span className="small muted">Fleet uptime, last 30 days</span>
            </div>
          </div>
        </Panel>
      </div>

      <div className="dash-bottom">
        <Panel title="Key Insights" icon={Lightbulb} link={{ to: '/automations', label: 'View all' }}>
          <ul className="insights">
            {insights.map((x, i) => {
              const Icon = x.icon;
              return (
                <li key={i}>
                  <span className="ic" style={{ background: x.color }}><Icon size={14} /></span>
                  <span>{x.text}</span>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel title="Upcoming Activities" icon={CalendarDays} link={{ to: '/finance/tax', label: 'Filing calendar' }}>
          <ul className="timeline">
            {ACTIVITIES.map((a) => (
              <li key={a.title}>
                <span className="node" />
                <Link to={a.to ?? '/'}>
                  <b>{a.title}</b>
                  <small>{a.when}</small>
                </Link>
                <span className={`tag-pill ${a.tone}`}>{a.tag}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Quick Actions" icon={Zap}>
          <div className="quick">
            {quick.map((x) => {
              const Icon = x.icon;
              return (
                <button key={x.label} type="button" onClick={() => nav(x.to)}>
                  <Icon size={20} color="var(--blue)" />
                  {x.label}
                </button>
              );
            })}
          </div>
        </Panel>

        <section className="promo">
          <HeroArt />
          <h3>Building a Smarter Mining Future with {COMPANY.name}</h3>
          <Link className="btn-gold" to="/automations" style={{ alignSelf: 'flex-start' }}>Learn more <ArrowRight size={14} /></Link>
        </section>
      </div>
      <p className="small muted" style={{ margin: 0 }}>All figures are sample data. {UNITS.length} units, {TECHS.length} technicians.</p>
    </>
  );
}
