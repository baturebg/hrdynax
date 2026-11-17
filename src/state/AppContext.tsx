import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { UNITS } from '../data/sample';
import type { ChatItem, Role, Unit } from '../data/types';
import { askData } from '../lib/ask';

// App-wide state: filters, the viewer's role, and what people have done on the
// automation pages. Kept in memory for the prototype; move to an API when the
// alerts, approvals and automation switches need to be shared and audited.

interface AppState {
  site: string;
  setSite: (s: string) => void;
  model: string;
  setModel: (m: string) => void;
  role: Role;
  setRole: (r: Role) => void;
  /** units after the site and model filters */
  units: Unit[];
  acknowledged: Set<string>;
  acknowledge: (alertId: string) => void;
  decisions: Record<string, string>;
  decide: (id: string, outcome: string) => void;
  isOn: (automationId: string) => boolean;
  toggleAutomation: (automationId: string) => void;
  alertFilter: string;
  setAlertFilter: (t: string) => void;
  chat: ChatItem[];
  ask: (q: string) => void;
  askOpen: boolean;
  setAskOpen: (open: boolean) => void;
}

const Ctx = createContext<AppState | null>(null);

function readRole(): Role {
  try {
    const r = localStorage.getItem('ct-role');
    if (r === 'admin' || r === 'exec' || r === 'ops' || r === 'finance' || r === 'hr') return r;
  } catch {
    /* storage unavailable */
  }
  return 'admin';
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [site, setSite] = useState('all');
  const [model, setModel] = useState('all');
  const [role, setRoleState] = useState<Role>(readRole);
  const [acknowledged, setAck] = useState<Set<string>>(() => new Set());
  const [decisions, setDecisions] = useState<Record<string, string>>({});
  const [switches, setSwitches] = useState<Record<string, boolean>>({});
  const [alertFilter, setAlertFilter] = useState('all');
  const [chat, setChat] = useState<ChatItem[]>([]);
  const [askOpen, setAskOpen] = useState(false);

  const units = useMemo(
    () => UNITS.filter((u) => (site === 'all' || u.site === site) && (model === 'all' || u.model === model)),
    [site, model],
  );

  const setRole = useCallback((r: Role) => {
    setRoleState(r);
    try {
      localStorage.setItem('ct-role', r);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const isOn = useCallback((id: string) => switches[id] !== false, [switches]);

  const value: AppState = {
    site, setSite, model, setModel, role, setRole, units,
    acknowledged,
    acknowledge: (id) => setAck((s) => new Set(s).add(id)),
    decisions,
    decide: (id, outcome) => setDecisions((d) => ({ ...d, [id]: outcome })),
    isOn,
    toggleAutomation: (id) => setSwitches((s) => ({ ...s, [id]: s[id] === false })),
    alertFilter, setAlertFilter,
    chat,
    ask: (q) => setChat((c) => [...c, { q, r: askData(q, { units, role }) }]),
    askOpen,
    setAskOpen,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside <AppProvider>');
  return v;
}
