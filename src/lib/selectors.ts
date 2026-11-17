import { PIPE, STAGES, TECHS, UNITS } from '../data/sample';
import type { Permission, Role, StageId, Tone, Unit } from '../data/types';

export const isField = (u: Unit) => u.stage === 'fieldops' || u.stage === 'maintenance';
export const isPipe = (u: Unit) => PIPE.includes(u.stage);
export const stageOf = (id: StageId) => STAGES.find((s) => s.id === id)!;

export const riskLevel = (p: number) => (p >= 0.65 ? 'Peak' : p >= 0.35 ? 'Medium' : 'Low');
export const riskTone = (p: number): Tone => (p >= 0.65 ? 'bad' : p >= 0.35 ? 'warn' : 'ok');

export const techById = (id: string) => TECHS.find((t) => t.id === id)!;
export const unitBySerial = (serial: string) => UNITS.find((u) => u.serial === serial);

export const ROLE_NAMES: Record<Role, string> = {
  admin: 'Administrator',
  exec: 'Executive',
  ops: 'Operations manager',
  finance: 'Finance manager',
  hr: 'HR data owner',
};
export const roleName = (r: Role) => ROLE_NAMES[r];

/** Who may see what. In production this comes from Entra ID groups and row-level security. */
export const PERMISSIONS: Record<Role, Permission[]> = {
  admin: ['people', 'payroll', 'finance'],
  hr: ['people', 'payroll'],
  finance: ['payroll', 'finance'],
  exec: ['payroll', 'finance'],
  ops: [],
};
export const can = (role: Role, p: Permission) => PERMISSIONS[role].includes(p);
export const rolesWith = (p: Permission) => (Object.keys(PERMISSIONS) as Role[]).filter((r) => can(r, p)).map(roleName);

export function stageCounts(units: Unit[]): Record<StageId, number> {
  const c = {} as Record<StageId, number>;
  STAGES.forEach((s) => (c[s.id] = units.filter((u) => u.stage === s.id).length));
  c.compliance = units.filter((u) => isField(u) && u.certDue <= 30).length;
  return c;
}
