import { BookOpen, Calculator, CalendarDays, Landmark, Receipt, Scale } from 'lucide-react';
import { useState } from 'react';
import { Kpi, KpiRow, Locked, PageHead, PageNotes, Panel, Pill } from '../components/ui';
import { CIT, FILING_CALENDAR, PERFORMANCE, VAT_ACQUISITIONS, VAT_PERIOD, VAT_SUPPLIES } from '../data/finance';
import { parseAmount, zar, zarCompact } from '../lib/format';
import { emp201 } from '../lib/payroll';
import { can } from '../lib/selectors';
import { ACTIVE_TAX_YEAR } from '../lib/tax/tables';
import { corporateTax, vatFromExclusive, vatFromInclusive, vatReturn } from '../lib/tax/za';
import { pageById } from '../routes';
import { useApp } from '../state/AppContext';

const page = pageById('tax');

export const LEGAL_BASIS = [
  'Value-Added Tax Act 89 of 1991 — s7(1) standard rate of 15%; s11(1)(a) zero-rating of exported goods; s17(2)(a) no input tax on entertainment.',
  'Income Tax Act 58 of 1962 — rates for individuals and companies (27%); Fourth Schedule for PAYE; s6A medical credits; s11F retirement deductions.',
  'Unemployment Insurance Contributions Act 4 of 2002 — 1% employee + 1% employer up to the monthly ceiling.',
  'Skills Development Levies Act 9 of 1999 — 1% of payroll for employers with annual payroll over R500 000.',
  'Tax Administration Act 28 of 2011 — filing, payment dates and penalties for late VAT201, EMP201 and IRP6.',
];

function VatCalculator() {
  const [amount, setAmount] = useState('250 000');
  const [mode, setMode] = useState<'excl' | 'incl'>('excl');
  const n = parseAmount(amount) ?? 0;
  const v = mode === 'excl' ? vatFromExclusive(n) : vatFromInclusive(n);
  return (
    <Panel title="VAT calculator" icon={Calculator}>
      <div className="calc">
        <div className="calc-in">
          <div className="field">
            <label htmlFor="vat-amt">Amount (R)</label>
            <input id="vat-amt" className="input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="seg-ctl" role="group" aria-label="Amount type">
            <button type="button" className={mode === 'excl' ? 'on' : ''} onClick={() => setMode('excl')}>Excludes VAT</button>
            <button type="button" className={mode === 'incl' ? 'on' : ''} onClick={() => setMode('incl')}>Includes VAT</button>
          </div>
          <span className="small muted">{mode === 'excl' ? 'Adds 15%.' : 'Extracts the tax fraction 15/115.'}</span>
        </div>
        <div className="calc-out">
          <dl className="dl">
            <dt>Excluding VAT</dt><dd className="r">{zar(v.exclusive)}</dd>
            <dt>VAT @ {ACTIVE_TAX_YEAR.vatRate * 100}%</dt><dd className="r">{zar(v.vat)}</dd>
            <dt className="sum">Including VAT</dt><dd className="r sum">{zar(v.inclusive)}</dd>
          </dl>
        </div>
      </div>
    </Panel>
  );
}

function CompanyTaxCalculator({ estimate }: { estimate: number }) {
  const [income, setIncome] = useState(String(Math.round(estimate)));
  const n = parseAmount(income) ?? 0;
  const tax = corporateTax(n);
  return (
    <Panel title="Company income tax" icon={Landmark}>
      <div className="calc">
        <div className="calc-in">
          <div className="field">
            <label htmlFor="cit-in">Taxable income (R)</label>
            <input id="cit-in" className="input" inputMode="decimal" value={income} onChange={(e) => setIncome(e.target.value)} />
          </div>
          <span className="small muted">Pre-filled with this year’s estimate: EBITDA less capital allowances. Assessed losses and other adjustments are not included.</span>
        </div>
        <div className="calc-out">
          <dl className="dl">
            <dt>Taxable income</dt><dd className="r">{zar(n)}</dd>
            <dt>Rate</dt><dd className="r">{ACTIVE_TAX_YEAR.corporateRate * 100}%</dd>
            <dt className="sum">Income tax</dt><dd className="r sum">{zar(tax)}</dd>
          </dl>
        </div>
      </div>
    </Panel>
  );
}

export default function TaxCentrePage() {
  const { role } = useApp();
  const lede = `South African VAT, payroll taxes and company tax for HRDYNAX, using the SARS ${ACTIVE_TAX_YEAR.id} tables.`;
  if (!can(role, 'finance'))
    return (
      <>
        <PageHead page={page} lede={lede} />
        <Locked what="The Tax Centre shows the company’s VAT, payroll tax and income tax positions." need="finance" />
        <PageNotes page={page} />
      </>
    );

  const vr = vatReturn(VAT_SUPPLIES, VAT_ACQUISITIONS);
  const emp = emp201();
  const ebitda = PERFORMANCE.reduce((a, p) => a + p.ebitda, 0) * 1e6;
  const taxable = ebitda - CIT.capitalAllowances;
  const cit = corporateTax(taxable);
  const secondIrp6 = cit - CIT.firstProvisionalPaid;

  return (
    <>
      <PageHead page={page} lede={lede} right={<Pill tone="info">{ACTIVE_TAX_YEAR.label}</Pill>} />
      <div className="banner warn">
        <b>Tax tables</b> {ACTIVE_TAX_YEAR.note} Rates live in one file (src/lib/tax/tables.ts) and are covered by automated tests.
      </div>

      <KpiRow>
        <Kpi variant="gold" icon={Receipt} label={`VAT payable · ${VAT_PERIOD.label}`} value={zarCompact(vr.netPayable)} sub={`VAT201 due ${VAT_PERIOD.due}`} />
        <Kpi variant="navy" icon={Receipt} label="EMP201 · November 2026" value={zarCompact(emp.total)} sub="PAYE, UIF and SDL · due 7 Dec" />
        <Kpi variant="purple" icon={Landmark} label="Provisional tax · 2nd IRP6" value={zarCompact(secondIrp6)} sub={`Due 26 Feb 2027 · total ${zarCompact(cit)}`} />
        <Kpi variant="teal" icon={Scale} label="Company tax rate" value={ACTIVE_TAX_YEAR.corporateRate * 100} unit="%" sub="Income Tax Act, companies" />
      </KpiRow>

      <div className="grid-2-1">
        <Panel title={`VAT201 working · ${VAT_PERIOD.label}`} icon={Receipt}>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Line</th><th>Treatment</th><th className="r">Value excl. VAT</th><th className="r">VAT</th></tr></thead>
              <tbody>
                <tr><td colSpan={4}><b>Output tax — supplies</b></td></tr>
                {vr.outputLines.map((l) => (
                  <tr key={l.label}>
                    <td>{l.label}</td>
                    <td>{l.treatment === 'zero' ? <Pill tone="info">Zero-rated 0%</Pill> : <Pill tone="mute">Standard 15%</Pill>}</td>
                    <td className="r">{zar(l.amount)}</td>
                    <td className="r">{zar(l.vat)}</td>
                  </tr>
                ))}
                <tr className="total"><td colSpan={3}>Total output tax</td><td className="r">{zar(vr.outputTax)}</td></tr>
                <tr><td colSpan={4}><b>Input tax — acquisitions</b></td></tr>
                {vr.inputLines.map((l) => (
                  <tr key={l.label}>
                    <td>{l.label}</td>
                    <td>{l.denied ? <Pill tone="bad">Denied</Pill> : l.vatPaid != null ? <Pill tone="info">Customs</Pill> : <Pill tone="mute">Standard 15%</Pill>}</td>
                    <td className="r">{zar(l.amount)}</td>
                    <td className="r" style={l.denied ? { textDecoration: 'line-through', color: 'var(--ink-3)' } : undefined}>{zar(l.vat)}</td>
                  </tr>
                ))}
                <tr className="total"><td colSpan={3}>Total input tax claimable</td><td className="r">{zar(vr.inputTax)}</td></tr>
                <tr className="total"><td colSpan={3}>Net VAT payable to SARS</td><td className="r" style={{ color: 'var(--red)' }}>{zar(vr.netPayable)}</td></tr>
              </tbody>
            </table>
          </div>
          <p className="small muted" style={{ marginBottom: 0 }}>{VAT_PERIOD.dueNote}. Vendor category: Category C (monthly), turnover above R30m.</p>
        </Panel>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Panel title="EMP201 · November 2026" icon={Receipt} link={{ to: '/hr/payroll', label: 'Payroll' }}>
            <dl className="dl">
              <dt>Gross payroll</dt><dd className="r">{zar(emp.gross)}</dd>
              <dt>PAYE</dt><dd className="r">{zar(emp.paye)}</dd>
              <dt>UIF (employee + employer)</dt><dd className="r">{zar(emp.uif)}</dd>
              <dt>SDL (1%)</dt><dd className="r">{zar(emp.sdl)}</dd>
              <dt className="sum">Total due 7 Dec</dt><dd className="r sum">{zar(emp.total)}</dd>
            </dl>
          </Panel>
          <Panel title="Provisional tax (IRP6)" icon={Landmark}>
            <dl className="dl">
              <dt>EBITDA, 12 months</dt><dd className="r">{zar(ebitda)}</dd>
              <dt>Less capital allowances</dt><dd className="r">−{zar(CIT.capitalAllowances)}</dd>
              <dt>Estimated taxable income</dt><dd className="r">{zar(taxable)}</dd>
              <dt>Tax @ 27%</dt><dd className="r">{zar(cit)}</dd>
              <dt>1st period paid (Aug)</dt><dd className="r">−{zar(CIT.firstProvisionalPaid)}</dd>
              <dt className="sum">2nd period due 26 Feb</dt><dd className="r sum">{zar(secondIrp6)}</dd>
            </dl>
          </Panel>
        </div>
      </div>

      <div className="grid2">
        <VatCalculator />
        <CompanyTaxCalculator estimate={taxable} />
      </div>

      <Panel title="SARS filing calendar" icon={CalendarDays}>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Return</th><th>What</th><th>Due</th><th>Status</th></tr></thead>
            <tbody>
              {FILING_CALENDAR.map((f) => (
                <tr key={f.return + f.due}>
                  <td><b>{f.return}</b></td>
                  <td>{f.what}</td>
                  <td className="mono small">{f.due}</td>
                  <td><Pill tone={f.status === 'Done' ? 'ok' : f.status === 'Due' ? 'warn' : 'mute'}>{f.status}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Legal basis" icon={BookOpen}>
        <ul className="law">
          {LEGAL_BASIS.map((l) => (
            <li key={l}><Scale size={15} /><span>{l}</span></li>
          ))}
        </ul>
      </Panel>
      <PageNotes page={page} />
    </>
  );
}
