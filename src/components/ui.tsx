import { ArrowDown, ArrowRight, ArrowUp, Lightbulb, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { MODELS, SITES } from '../data/sample';
import type { Permission, Summary, Tone, Unit } from '../data/types';
import { pct } from '../lib/format';
import { isField, riskLevel, riskTone, rolesWith, stageOf, techById } from '../lib/selectors';
import { moduleOf, type PageDef } from '../routes';
import { useApp } from '../state/AppContext';
import { HeroArt } from './art';
import { Sparkline } from './charts';
import { LockIcon } from './icons';

const toneClass: Record<Tone, string> = { ok: 'p-ok', warn: 'p-warn', bad: 'p-bad', info: 'p-info', mute: 'p-mute' };

export const Pill = ({ tone, children }: { tone: Tone; children: ReactNode }) => <span className={`pill ${toneClass[tone]}`}>{children}</span>;

export const RiskPill = ({ p }: { p: number }) => <Pill tone={riskTone(p)}>{riskLevel(p)}</Pill>;

export function StagePill({ unit }: { unit: Unit }) {
  const s = stageOf(unit.stage);
  if (unit.overdue) return <Pill tone="bad">{s.name} · late</Pill>;
  return <Pill tone={unit.stage === 'maintenance' ? 'warn' : isField(unit) ? 'ok' : 'info'}>{s.name}</Pill>;
}

/* ---------- KPI cards ---------- */

export type KpiVariant = 'navy' | 'gold' | 'green' | 'purple' | 'teal' | 'red' | 'wire';
type KpiTone = 'alert' | 'warn' | 'ok' | 'wire' | undefined;
const toneVariant: Record<Exclude<KpiTone, undefined>, KpiVariant> = { alert: 'red', warn: 'gold', ok: 'green', wire: 'wire' };

export interface KpiProps {
  label: string;
  value: ReactNode;
  unit?: string;
  sub?: ReactNode;
  /** semantic colour; without it, cards cycle through the brand colours */
  tone?: KpiTone;
  variant?: KpiVariant;
  icon?: LucideIcon;
  spark?: number[];
  delta?: { text: string; up: boolean };
}

export function Kpi({ label, value, unit, sub, tone, variant, icon: Icon, spark, delta }: KpiProps) {
  const v = variant ?? (tone ? toneVariant[tone] : undefined);
  return (
    <div className="kpi" data-variant={v}>
      {Icon && (
        <span className="k-ico">
          <Icon size={22} />
        </span>
      )}
      <span className="l">{label}</span>
      <span className="v">
        {value}
        {unit && <small>{unit}</small>}
      </span>
      <span className="s">
        {delta && (
          <span className="delta">
            {delta.up ? <ArrowUp size={13} /> : <ArrowDown size={13} />} {delta.text}
          </span>
        )}
        {sub}
      </span>
      {spark && <Sparkline values={spark} />}
    </div>
  );
}

export const KpiRow = ({ children }: { children: ReactNode }) => <div className="kpis">{children}</div>;

/* ---------- cards ---------- */

export function Panel({
  title, icon: Icon, actions, link, children, className = '',
}: { title?: ReactNode; icon?: LucideIcon; actions?: ReactNode; link?: { to: string; label: string }; children?: ReactNode; className?: string }) {
  const heading = title && (
    <h2>
      {Icon && <Icon size={19} />}
      {title}
    </h2>
  );
  const right = actions ?? (link && <Link className="more" to={link.to}>{link.label} <ArrowRight size={14} /></Link>);
  return (
    <section className={`panel ${className}`}>
      {right ? (
        <div className="panel-head">
          {heading || <span />}
          {right}
        </div>
      ) : (
        heading
      )}
      {children}
    </section>
  );
}

export const UnitLink = ({ serial }: { serial: string }) => (
  <Link className="link" to={`/units/${serial}`} onClick={(e) => e.stopPropagation()}>{serial}</Link>
);

export const TechChip = ({ id }: { id: string }) => (
  <Link className="chip" to={`/technicians/${id}`} onClick={(e) => e.stopPropagation()}>{techById(id).name}</Link>
);

export interface BarRow {
  label: ReactNode;
  value: ReactNode;
  parts: { v: number; className?: string; title?: string }[];
}

export function HBars({ rows, max }: { rows: BarRow[]; max: number }) {
  return (
    <div className="hbars">
      {rows.map((r, i) => (
        <div className="hbar" key={i}>
          <span>{r.label}</span>
          <div className="t">
            {r.parts.map((p, j) => (
              <div key={j} className={`f ${p.className ?? ''}`} style={{ width: `${((p.v / max) * 100).toFixed(1)}%` }} title={p.title} />
            ))}
          </div>
          <span className="n">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

export function ProbBar({ p }: { p: number }) {
  const color = p >= 0.65 ? 'var(--bad)' : p >= 0.35 ? 'var(--gold)' : 'var(--ok)';
  return (
    <span className="prob">
      <span className="t">
        <span className="f" style={{ display: 'block', width: `${p * 100}%`, background: color }} />
      </span>
      {pct(p)}%
    </span>
  );
}

export function AiSummary({ summary }: { summary: Summary }) {
  return (
    <div className="ai">
      <span className="ai-ic">
        <Lightbulb size={16} />
      </span>
      <div>
        <p>{summary.text}</p>
        <div className="small muted">AI insight · written after the 06:00 refresh · from {summary.src}</div>
      </div>
    </div>
  );
}

/* ---------- page header ---------- */

/** Site and model filters, shown in the header of operational pages. */
export function GlobalFilters() {
  const { site, setSite, model, setModel } = useApp();
  return (
    <>
      <div className="field">
        <label htmlFor="f-site">Client site</label>
        <select id="f-site" value={site} onChange={(e) => setSite(e.target.value)}>
          <option value="all">All sites</option>
          {SITES.map((s) => <option key={s.name}>{s.name}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="f-model">Model</label>
        <select id="f-model" value={model} onChange={(e) => setModel(e.target.value)}>
          <option value="all">All models</option>
          {MODELS.map((m) => <option key={m}>{m}</option>)}
        </select>
      </div>
    </>
  );
}

/** Splits a title so its last word is highlighted in gold, as in the design. */
export function GoldTitle({ text }: { text: string }) {
  const i = text.lastIndexOf(' ');
  if (i < 0) return <em>{text}</em>;
  return (
    <>
      {text.slice(0, i)} <em>{text.slice(i + 1)}</em>
    </>
  );
}

/** Dark hero banner that opens every page, followed by the AI insight when "Page summaries" is on. */
export function PageHead({ page, lede, right, summary }: { page: PageDef; lede?: string; right?: ReactNode; summary?: Summary | null }) {
  const { isOn } = useApp();
  const mod = moduleOf(page.module);
  const Icon = mod.icon;
  return (
    <>
      <header className="page-hero">
        <HeroArt detail={false} />
        <div className="ph-body">
          <span className="chip-gold">
            <Icon size={14} /> {mod.name}
            {page.wireframe ? ' · Wireframe' : ''}
          </span>
          <h1><GoldTitle text={page.name} /></h1>
          {lede && <p>{lede}</p>}
        </div>
        {(right || page.filters) && (
          <div className="ph-right">
            {page.filters && <GlobalFilters />}
            {right}
          </div>
        )}
      </header>
      {summary && isOn('summary') && <AiSummary summary={summary} />}
    </>
  );
}

/** Build notes for developers: the HR page this mirrors, its measures and sources. */
export function PageNotes({ page }: { page: PageDef }) {
  return (
    <footer className="notes">
      <div>
        <h5>Mirrors HR page</h5>
        {page.hr}
      </div>
      <div>
        <h5>Key measures</h5>
        <div className="chips">{page.measures.map((m) => <span className="chip" key={m}>{m}</span>)}</div>
      </div>
      <div>
        <h5>Sources</h5>
        <div className="chips">{page.sources.map((s) => <span className="chip" key={s}>{s}</span>)}</div>
      </div>
    </footer>
  );
}

const PERMISSION_TEXT: Record<Permission, string> = {
  people: 'named technicians and their personal records',
  payroll: 'payroll figures',
  finance: 'company finance and tax figures',
};

export function Locked({ what, need = 'people' }: { what: string; need?: Permission }) {
  return (
    <div className="lock">
      <LockIcon />
      <div>
        <b>Restricted: {PERMISSION_TEXT[need]}</b>
        <p>
          {what} Only these roles can see it: {rolesWith(need).join(', ')}. Switch “Viewing as” in the user menu (top right) to preview another role.
        </p>
      </div>
    </div>
  );
}

export function DecisionButtons({ id, yes, no, yesLabel = yes, noLabel = no }: { id: string; yes: string; no?: string; yesLabel?: string; noLabel?: string }) {
  const { decisions, decide } = useApp();
  const d = decisions[id];
  if (d) return <Pill tone={d === no ? 'mute' : 'ok'}>{d}</Pill>;
  return (
    <div className="btns">
      <button className="btn ok" type="button" onClick={() => decide(id, yes)}>{yesLabel}</button>
      {no && <button className="btn" type="button" onClick={() => decide(id, no)}>{noLabel}</button>}
    </div>
  );
}
