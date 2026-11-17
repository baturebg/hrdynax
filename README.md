# HRDYNAX Control Tower — front end

React front end for the HRDYNAX mining operations platform (South Africa): the MMU Delivery Control Tower, the Field
Workforce module, South African tax, and the automation and AI layer.

**All figures are sample data**, generated from fixed seeds in `src/data/sample.ts` and `src/data/finance.ts`.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173 (use --port 5180 if 5173 is taken)
npm test           # tax engine tests
npm run build      # type-check + production build into dist/
```

Requires Node 18 or later.

## Stack

- React 18 + TypeScript, built with Vite; React Router 6
- lucide-react icons; charts are small SVG components (`src/components/charts.tsx`)
- Vitest for the tax engine
- One stylesheet with the HRDYNAX design tokens: `src/styles/global.css`

## Design system

Every page follows the same pattern as the executive dashboard:

1. **Navy sidebar of modules.** The active module is a gold pill and expands to its pages.
2. **Top bar.** Search (Ctrl + K) across pages, units and technicians; an alerts bell; a user menu with the role switcher.
3. **Dark hero banner** with the module chip and a title whose last word is gold (`PageHead`).
4. **Coloured KPI cards** (navy, gold, green, purple, teal; red for alerts) with icons and sparklines (`Kpi`).
5. **White cards** with an icon title and a "View all →" link (`Panel`), and an AI insight line under the hero.

Tokens are at the top of `global.css`; components are in `src/components/ui.tsx`.

## Modules and pages

| Module | Pages |
|---|---|
| Dashboard | Executive dashboard |
| Operations Center | MMU Life Cycle wheel, Fleet Availability, Commissioning Quality, Fault Profile*, Breakdown Analysis* |
| Project Management | Pipeline at a Glance, Build Starts* |
| Human Resources | Crew Availability, **Payroll & PAYE**, Technician Profile, Technician Quality*, Key-skill Retention |
| Finance & Budget | **Tax Centre**, **Cost per Unit** |
| Provincial & Regional | Provinces & Client Sites* |
| Equipment & Assets | Fleet Profile*, Unit Profile, Failure Risk |
| Safety & Compliance | **Permits & Compliance** |
| Reports & Analytics | Delivery Trends |
| AI Intelligence | AI Intake Review (plus the AI Assistant panel on every page) |
| Automation Workflows | Automations, Alerts & Approvals |
| Settings | **Tax Tables & Access** |

\* wireframe — add a component in `src/pages/`, register it in `BUILT` in `App.tsx`, and remove `wireframe: true` in `routes.ts`.

## South African tax

All tax logic is in `src/lib/tax/`:

| File | What it holds |
|---|---|
| `tables.ts` | Rates per year of assessment: income tax brackets, rebates, thresholds, medical credits, retirement cap, UIF, SDL, VAT, company and dividends tax |
| `za.ts` | Pure functions: `annualIncomeTax`, `payslip` (monthly PAYE, UIF, SDL, net pay), `vatFromExclusive`, `vatFromInclusive`, `vatReturn`, `corporateTax`, `dividendsTax` |
| `za.test.ts` | Tests against worked examples, e.g. R30 000/month → R4 783,08 PAYE |

What the app calculates:

- **VAT (VAT Act 89 of 1991):** 15% standard rate; exports to the Ghana site zero-rated under s11(1)(a); input tax on
  entertainment denied under s17(2)(a); import VAT paid at customs claimed as input tax. Produces the VAT201 working.
- **PAYE (Income Tax Act 58 of 1962, Fourth Schedule):** annualised monthly method, rebates by age, s6A medical scheme
  credits, s11F retirement deduction (27.5%, max R350 000).
- **UIF:** 1% employee + 1% employer, capped at the R17 712 monthly ceiling.
- **SDL:** 1% of payroll for employers with annual payroll over R500 000.
- **Company tax:** 27%, with a provisional tax (IRP6) estimate. Dividends tax at 20%.
- **SARS filing calendar:** VAT201, EMP201, IRP6 and EMP501 dates.

**The tables are the 2025/26 year of assessment.** Before go-live, confirm the current year on sars.gov.za, add it as a
new entry in `tables.ts`, point `ACTIVE_TAX_YEAR` at it, and run `npm test`. The calculations are not a substitute for
a registered tax practitioner's review of the actual returns.

## Roles

The role switcher in the user menu previews row-level security:

| Role | Finance (VAT, company tax, costs) | Payroll totals, EMP201 | Named technicians, payslips |
|---|---|---|---|
| Administrator | ✓ | ✓ | ✓ |
| Executive | ✓ | ✓ | |
| Finance manager | ✓ | ✓ | |
| HR data owner | | ✓ | ✓ |
| Operations manager | | | |

The matrix is in `src/lib/selectors.ts` (`PERMISSIONS`). In production, roles come from Microsoft Entra ID groups and
server-side row-level security, not a client-side switch.

## Connecting real data

1. Keep the types in `src/data/types.ts` as the API contract.
2. Replace the exports in `sample.ts` and `finance.ts` with API calls (e.g. TanStack Query) exposed through hooks.
3. Move acknowledgements, approvals, intake decisions and automation switches from in-memory state to the API.
4. Replace `askData` in `src/lib/ask.ts` with Power BI Copilot or an LLM querying the semantic model under the user's permissions.
5. Replace the templated text in `src/lib/summaries.ts` with summaries written after each refresh.
6. Feed the tax pages from SAP (VAT201 lines) and the payroll system (EMP201) instead of the sample bands.
