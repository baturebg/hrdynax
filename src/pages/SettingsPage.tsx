import { KeyRound, Landmark, Scale } from 'lucide-react';
import { Fragment } from 'react';
import { PageHead, PageNotes, Panel, Pill } from '../components/ui';
import type { Permission, Role } from '../data/types';
import { zar0 } from '../lib/format';
import { can, ROLE_NAMES } from '../lib/selectors';
import { ACTIVE_TAX_YEAR as Y } from '../lib/tax/tables';
import { pageById } from '../routes';
import { useApp } from '../state/AppContext';
import { LEGAL_BASIS } from './TaxCentrePage';

const page = pageById('settings');
const PERMS: { id: Permission; label: string }[] = [
  { id: 'finance', label: 'VAT, company tax, costs' },
  { id: 'payroll', label: 'Payroll totals, EMP201' },
  { id: 'people', label: 'Named technicians, payslips' },
];

export default function SettingsPage() {
  const { role } = useApp();
  const b = Y.brackets;
  return (
    <>
      <PageHead page={page} lede="The South African tax tables every calculation uses, and what each role can see." right={<Pill tone="info">{Y.label}</Pill>} />
      <div className="banner warn">
        <b>Check before go-live</b> {Y.note} Add the new year to src/lib/tax/tables.ts and run the tests.
      </div>

      <div className="grid2">
        <Panel title="Income tax — individuals" icon={Landmark}>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Taxable income (R)</th><th>Rate of tax</th></tr></thead>
              <tbody>
                {b.map((x, i) => (
                  <tr key={x.from}>
                    <td>{i === 0 ? '1' : zar0(x.from + 1).replace('R', '').trim()} – {b[i + 1] ? zar0(b[i + 1].from).replace('R', '').trim() : 'and above'}</td>
                    <td>{x.base ? `${zar0(x.base)} + ` : ''}{x.rate * 100}% {x.base ? `of income above ${zar0(x.from)}` : 'of taxable income'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Rebates, thresholds and other rates" icon={Scale}>
          <dl className="dl">
            <dt>Primary rebate</dt><dd className="r">{zar0(Y.rebates.primary)}</dd>
            <dt>Secondary rebate (65+)</dt><dd className="r">{zar0(Y.rebates.secondary)}</dd>
            <dt>Tertiary rebate (75+)</dt><dd className="r">{zar0(Y.rebates.tertiary)}</dd>
            <dt>Tax threshold: under 65 / 65–74 / 75+</dt><dd className="r">{[Y.thresholds.under65, Y.thresholds.age65to74, Y.thresholds.age75plus].map(zar0).join(' / ')}</dd>
            <dt>Medical credits per month</dt><dd className="r">{zar0(Y.medicalCredits.first2Each)} first two · {zar0(Y.medicalCredits.additionalEach)} each after</dd>
            <dt>Retirement deduction</dt><dd className="r">{Y.retirement.rateOfRemuneration * 100}%, max {zar0(Y.retirement.annualCap)} a year</dd>
            <dt>UIF</dt><dd className="r">{Y.uif.employeeRate * 100}% + {Y.uif.employerRate * 100}% up to {zar0(Y.uif.monthlyCeiling)} a month</dd>
            <dt>SDL</dt><dd className="r">{Y.sdl.rate * 100}% if payroll over {zar0(Y.sdl.annualPayrollExemption)} a year</dd>
            <dt>VAT</dt><dd className="r">{Y.vatRate * 100}% (exports 0%)</dd>
            <dt>Company income tax</dt><dd className="r">{Y.corporateRate * 100}%</dd>
            <dt>Dividends tax</dt><dd className="r">{Y.dividendsRate * 100}%</dd>
          </dl>
        </Panel>
      </div>

      <Panel title="Who can see what" icon={KeyRound}>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Role</th>
                {PERMS.map((p) => <th key={p.id}>{p.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {(Object.keys(ROLE_NAMES) as Role[]).map((r) => (
                <tr key={r} style={r === role ? { background: 'var(--gold-soft)' } : undefined}>
                  <td><b>{ROLE_NAMES[r]}</b>{r === role && <span className="small muted"> · you</span>}</td>
                  {PERMS.map((p) => (
                    <Fragment key={p.id}>
                      <td>{can(r, p.id) ? <Pill tone="ok">Yes</Pill> : <Pill tone="mute">No</Pill>}</td>
                    </Fragment>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small muted" style={{ marginBottom: 0 }}>Operations data (units, pipeline, availability) is open to every role. In production, roles come from Microsoft Entra ID groups and row-level security.</p>
      </Panel>

      <Panel title="Legal basis" icon={Scale}>
        <ul className="law">
          {LEGAL_BASIS.map((l) => <li key={l}><Scale size={15} /><span>{l}</span></li>)}
        </ul>
      </Panel>
      <PageNotes page={page} />
    </>
  );
}
