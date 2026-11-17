import type { ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import AlertsPage from './pages/AlertsPage';
import AutomationsPage from './pages/AutomationsPage';
import AvailabilityPage from './pages/AvailabilityPage';
import CompliancePage from './pages/CompliancePage';
import CostPerUnitPage from './pages/CostPerUnitPage';
import CrewPage from './pages/CrewPage';
import DashboardPage from './pages/DashboardPage';
import IntakePage from './pages/IntakePage';
import LifeCyclePage from './pages/LifeCyclePage';
import PayrollPage from './pages/PayrollPage';
import PipelinePage from './pages/PipelinePage';
import QualityPage from './pages/QualityPage';
import RetentionPage from './pages/RetentionPage';
import RiskPage from './pages/RiskPage';
import SettingsPage from './pages/SettingsPage';
import TaxCentrePage from './pages/TaxCentrePage';
import TechnicianProfilePage from './pages/TechnicianProfilePage';
import TrendsPage from './pages/TrendsPage';
import UnitProfilePage from './pages/UnitProfilePage';
import WireframePage from './pages/WireframePage';
import { PAGES } from './routes';

// Built pages. Any page in routes.ts without an entry here (or marked wireframe) renders a wireframe.
const BUILT: Record<string, ReactElement> = {
  lifecycle: <LifeCyclePage />,
  pipeline: <PipelinePage />,
  trends: <TrendsPage />,
  quality: <QualityPage />,
  availability: <AvailabilityPage />,
  risk: <RiskPage />,
  crew: <CrewPage />,
  payroll: <PayrollPage />,
  retention: <RetentionPage />,
  tax: <TaxCentrePage />,
  cost: <CostPerUnitPage />,
  compliance: <CompliancePage />,
  alerts: <AlertsPage />,
  automations: <AutomationsPage />,
  intake: <IntakePage />,
  settings: <SettingsPage />,
};

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="units/:serial?" element={<UnitProfilePage />} />
        <Route path="technicians/:id?" element={<TechnicianProfilePage />} />
        {PAGES.filter((p) => !['dashboard', 'unit', 'tech'].includes(p.id)).map((p) => (
          <Route key={p.id} path={p.path.slice(1)} element={!p.wireframe && BUILT[p.id] ? BUILT[p.id] : <WireframePage page={p} />} />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
