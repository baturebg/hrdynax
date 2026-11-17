import { Calculator, Coins, Landmark, Receipt, Users } from 'lucide-react';
import { useState } from 'react';
import { Kpi, KpiRow, Locked, PageHead, PageNotes, Panel } from '../components/ui';
import { STAFF_TOTAL } from '../data/finance';
import { num, parseAmount, pct, zar, zarCompact } from '../lib/format';
import { bandPayroll, emp201, techPayslips } from '../lib/payroll';
import { can, techById } from '../lib/selectors';
import { ACTIVE_TAX_YEAR } from '../lib/tax/tables';
import { payslip, type AgeBand } from '../lib/tax/za';
import { pageById } from '../routes';
import { useApp } from '../state/AppContext';

const page = pageById('payroll');

function PayeCalculator() {
  const [gross, setGross] = useState('35 000');
  const [age, setAge] = useState<AgeBand>('under65');
  const [retire, setRetire] = useState('2 625');
  const [medical, setMedical] = useState(2);
  const p = payslip({ monthlyGross: parseAmount(gross) ?? 0, age, monthlyRetirement: parseAmount(retire) ?? 0, medicalMembers: medical });
  return (
    <Panel title="PAYE calculator" icon={Calculator}>
      <div className="calc">
        <div className="calc-in">
          <div className="field">
            <label htmlFor="pc-gross">Monthly gross salary (R)</label>
            <input id="pc-gross" className="input" inputMode="decimal" value={gross} onChange={(e) => setGross(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="pc-age">Age on last day of tax year</label>
            <select id="pc-age" value={age} onChange={(e) => setAge(e.target.value as AgeBand)}>
              <option value="under65">Under 65</option>
              <option value="65to74">65 to 74</option>
              <option value="75plus">75 and older</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="pc-ret">Retirement fund contribution per month (R)</label>
            <input id="pc-ret" className="input" inputMode="decimal" value={retire} onChange={(e) => setRetire(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="pc-med">Members on medical scheme</label>
            <select id="pc-med" value={medical} onChange={(e) => setMedical(Number(e.target.value))}>
              {[0, 1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n === 0 ? 'None' : n}</option>)}
            </select>
          </div>
        </div>
        <div className="calc-out">
          <span className="small muted">Monthly PAYE</span>
          <div className="big-figure">{zar(p.paye)}</div>
          <dl className="dl" style={{ marginTop: 10 }}>
            <dt>Annual remuneration</dt><dd className="r">{zar(p.monthlyGross * 12)}</dd>
            <dt>Retirement deduction (s11F)</dt><dd className="r">−{zar(p.monthlyGross * 12 - p.taxableIncome)}</dd>
            <dt>Taxable income</dt><dd className="r">{zar(p.taxableIncome)}</dd>
            <dt>Tax per table</dt><dd className="r">{zar(p.taxBeforeRebates)}</dd>
            <dt>Rebates</dt><dd className="r">−{zar(p.rebates)}</dd>
            <dt>Medical credits (s6A)</dt><dd className="r">−{zar(p.medicalCredits)}</dd>
            <dt className="sum">Annual tax</dt><dd className="r sum">{zar(p.tax)}</dd>
            <dt>UIF employee (1%)</dt><dd className="r">{zar(p.uifEmployee)}</dd>
            <dt>Retirement contribution</dt><dd className="r">{zar(p.retirement)}</dd>
            <dt className="sum">Net pay</dt><dd className="r sum">{zar(p.net)}</dd>
            <dt>Employer UIF + SDL</dt><dd className="r">{zar(p.uifEmployer + p.sdl)}</dd>
            <dt>Cost to company</dt><dd className="r">{zar(p.costToCompany)}</dd>
            <dt>Effective tax rate</dt><dd className="r">{(p.effectiveRate * 100).toFixed(1)}%</dd>
          </dl>
        </div>
      </div>
    </Panel>
  );
}

export default function PayrollPage() {
  const { role } = useApp();
  const lede = `Monthly payroll taxes under the ${ACTIVE_TAX_YEAR.id} SARS tables: PAYE, UIF and the Skills Development Levy, ready for the EMP201.`;
  if (!can(role, 'payroll'))
    return (
      <>
        <PageHead page={page} lede={lede} />
        <Locked what="Payroll totals and PAYE are restricted." need="payroll" />
        <PageNotes page={page} />
      </>
    );

  const emp = emp201();
  const bands = bandPayroll();

  return (
    <>
      <PageHead page={page} lede={lede} />
      <KpiRow>
        <Kpi variant="navy" icon={Users} label="Gross payroll · Nov" value={zarCompact(emp.gross)} sub={`${num(STAFF_TOTAL)} employees`} />
        <Kpi variant="gold" icon={Landmark} label="PAYE" value={zarCompact(emp.paye)} sub={`${pct(emp.paye / emp.gross)}% of gross`} />
        <Kpi variant="green" icon={Coins} label="UIF + SDL" value={zarCompact(emp.uif + emp.sdl)} sub={`UIF ${zarCompact(emp.uif)} · SDL ${zarCompact(emp.sdl)}`} />
        <Kpi variant="purple" icon={Receipt} label="EMP201 total" value={zarCompact(emp.total)} sub="Due Mon 7 Dec 2026" />
      </KpiRow>

      <PayeCalculator />

      <Panel title="Payroll by salary band · November 2026" icon={Users}>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Band</th><th className="r">Employees</th><th className="r">Gross</th><th className="r">PAYE</th><th className="r">UIF (ee + er)</th><th className="r">Net pay</th></tr></thead>
            <tbody>
              {bands.map((b) => (
                <tr key={b.band}>
                  <td>{b.band}</td>
                  <td className="r">{b.count}</td>
                  <td className="r">{zar(b.gross)}</td>
                  <td className="r">{zar(b.paye)}</td>
                  <td className="r">{zar(b.uifEmployee + b.uifEmployer)}</td>
                  <td className="r">{zar(b.net)}</td>
                </tr>
              ))}
              <tr className="total">
                <td>Total</td>
                <td className="r">{STAFF_TOTAL}</td>
                <td className="r">{zar(emp.gross)}</td>
                <td className="r">{zar(emp.paye)}</td>
                <td className="r">{zar(emp.uif)}</td>
                <td className="r">{zar(bands.reduce((a, b) => a + b.net, 0))}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="small muted" style={{ marginBottom: 0 }}>
          Estimated from each band’s average salary, with 7.5% retirement contributions and two medical scheme members. The payroll system’s figures replace these at go-live.
        </p>
      </Panel>

      {can(role, 'people') ? (
        <Panel title="Field technician payslips" icon={Receipt}>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Technician</th><th className="r">Gross</th><th className="r">Retirement</th><th className="r">PAYE</th><th className="r">UIF</th><th className="r">Net pay</th><th className="r">Cost to company</th></tr></thead>
              <tbody>
                {techPayslips().map((t) => (
                  <tr key={t.id}>
                    <td>{techById(t.id).name} <span className="mono small muted">{t.id}</span></td>
                    <td className="r">{zar(t.slip.monthlyGross)}</td>
                    <td className="r">{zar(t.slip.retirement)}</td>
                    <td className="r">{zar(t.slip.paye)}</td>
                    <td className="r">{zar(t.slip.uifEmployee)}</td>
                    <td className="r"><b>{zar(t.slip.net)}</b></td>
                    <td className="r">{zar(t.slip.costToCompany)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : (
        <Locked what="Individual payslips name employees." need="people" />
      )}
      <PageNotes page={page} />
    </>
  );
}
