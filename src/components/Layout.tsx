import { ArrowRight, Bell, ChevronDown, FileText, Menu, Search, Truck, User } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { CURRENT_USER } from '../data/finance';
import { ALERTS, TECHS, UNITS } from '../data/sample';
import type { Role } from '../data/types';
import { can, ROLE_NAMES, roleName, stageOf } from '../lib/selectors';
import { MODULES, moduleOf, pageForPath, pagesIn, type ModuleId } from '../routes';
import { useApp } from '../state/AppContext';
import AskDrawer from './AskDrawer';
import { Logo } from './art';

/* ---------- sidebar ---------- */

function Sidebar({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const current = pageForPath(pathname).module;
  const [expanded, setExpanded] = useState<ModuleId | null>(current);
  const { setAskOpen } = useApp();

  useEffect(() => setExpanded(current), [current]);

  return (
    <aside className={`side ${open ? 'open' : ''}`} aria-label="Modules">
      <div className="brand">
        <Logo />
        <b>HRDYNAX</b>
        <small>Mining Smarter. Growing Greater.</small>
      </div>
      <nav className="nav">
        {MODULES.map((m) => {
          const pages = pagesIn(m.id);
          const Icon = m.icon;
          const active = current === m.id;
          const isOpen = expanded === m.id && pages.length > 1;
          return (
            <div key={m.id}>
              <button
                type="button"
                className={`nav-item ${active ? 'active' : ''} ${isOpen ? 'open' : ''}`}
                aria-expanded={pages.length > 1 ? isOpen : undefined}
                onClick={() => {
                  if (pages.length > 1 && active) {
                    setExpanded(isOpen ? null : m.id);
                    return;
                  }
                  setExpanded(m.id);
                  nav(pages[0].path);
                  onNavigate();
                }}
              >
                <Icon size={19} />
                <span className="lbl">{m.name}</span>
                {m.badge && <span className="badge-new">{m.badge}</span>}
              </button>
              {isOpen && (
                <div className="subnav">
                  {pages.map((p) => (
                    <NavLink key={p.id} to={p.path} end={p.path === '/'} onClick={onNavigate}>
                      <span>{p.name}</span>
                      {p.wireframe && <span className="tag">wire</span>}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      <div className="side-ai">
        <span className="ai-chip">Ai</span>
        <div>
          <b>Powered by AI</b>
          <p>Smarter decisions. Greater productivity.</p>
        </div>
        <button type="button" className="btn-gold" onClick={() => setAskOpen(true)}>
          Explore AI Tools <ArrowRight size={14} />
        </button>
      </div>
      <div className="side-foot">© 2026 HRDYNAX · sample data</div>
    </aside>
  );
}

/* ---------- search ---------- */

interface Result {
  kind: string;
  label: string;
  sub: string;
  to: string;
  icon: typeof FileText;
}

function SearchBox() {
  const { role } = useApp();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        input.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const results = useMemo<Result[]>(() => {
    const t = q.trim().toLowerCase();
    const pages: Result[] = MODULES.flatMap((m) =>
      pagesIn(m.id).map((p) => ({ kind: 'Page', label: p.name, sub: m.name, to: p.path, icon: FileText })),
    ).filter((r) => !t || r.label.toLowerCase().includes(t) || r.sub.toLowerCase().includes(t));
    if (!t) return pages.slice(0, 7);
    const units: Result[] = UNITS.filter((u) => [u.serial, u.site, u.model].some((s) => s.toLowerCase().includes(t)))
      .slice(0, 6)
      .map((u) => ({ kind: 'Unit', label: u.serial, sub: `${u.site} · ${stageOf(u.stage).name}`, to: `/units/${u.serial}`, icon: Truck }));
    const techs: Result[] = can(role, 'people')
      ? TECHS.filter((x) => x.name.toLowerCase().includes(t) || x.id.toLowerCase().includes(t))
          .slice(0, 5)
          .map((x) => ({ kind: 'Technician', label: x.name, sub: `${x.id} · ${x.role}`, to: `/technicians/${x.id}`, icon: User }))
      : [];
    return [...pages.slice(0, 6), ...units, ...techs];
  }, [q, role]);

  const go = (r: Result | undefined) => {
    if (!r) return;
    nav(r.to);
    setOpen(false);
    setQ('');
    input.current?.blur();
  };

  return (
    <div className="search">
      <div className="box">
        <Search size={18} color="var(--ink-2)" />
        <input
          ref={input}
          value={q}
          placeholder="Search anything… (projects, staff, equipment, reports)"
          aria-label="Search"
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onChange={(e) => {
            setQ(e.target.value);
            setSel(0);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, results.length - 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
            if (e.key === 'Enter') go(results[sel]);
            if (e.key === 'Escape') input.current?.blur();
          }}
        />
        <kbd>Ctrl + K</kbd>
      </div>
      {open && (
        <div className="search-results" role="listbox">
          {results.length ? (
            results.map((r, i) => {
              const Icon = r.icon;
              return (
                <button key={r.kind + r.to} type="button" className={i === sel ? 'sel' : ''} onMouseDown={(e) => e.preventDefault()} onClick={() => go(r)}>
                  <span className="ico"><Icon size={15} /></span>
                  <span>
                    <b style={{ display: 'block', fontSize: 13.5 }}>{r.label}</b>
                    <span className="small muted">{r.sub}</span>
                  </span>
                  <span className="k">{r.kind}</span>
                </button>
              );
            })
          ) : (
            <div className="empty">No pages, units{can(role, 'people') ? ' or technicians' : ''} match “{q}”.</div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- user menu ---------- */

function UserMenu() {
  const { role, setRole } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div className="user" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="avatar">{CURRENT_USER.initials}</span>
        <span className="who">
          <b>{CURRENT_USER.name}</b>
          <small>{roleName(role)}</small>
        </span>
        <ChevronDown size={18} />
      </button>
      {open && (
        <div className="user-menu">
          <label htmlFor="f-role">Viewing as</label>
          <select id="f-role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            {(Object.keys(ROLE_NAMES) as Role[]).map((r) => (
              <option key={r} value={r}>{ROLE_NAMES[r]}</option>
            ))}
          </select>
          <p>Previews what each role can see. In production the role comes from your Microsoft Entra ID sign-in.</p>
          <Link className="more" to="/settings" onClick={() => setOpen(false)}>
            Roles and tax tables <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}

function TopBar({ onMenu }: { onMenu: () => void }) {
  const { acknowledged, isOn } = useApp();
  const open = ALERTS.filter((a) => !acknowledged.has(a.id) && isOn(a.automation)).length;
  return (
    <div className="top">
      <button type="button" className="menu-btn" aria-label="Open menu" onClick={onMenu}>
        <Menu size={20} />
      </button>
      <SearchBox />
      <div className="spacer" />
      <Link className="bell" to="/alerts" aria-label={`${open} open alerts`}>
        <Bell size={22} />
        {open > 0 && <span className="dot">{open}</span>}
      </Link>
      <UserMenu />
    </div>
  );
}

export default function Layout() {
  const { pathname } = useLocation();
  const [menu, setMenu] = useState(false);
  const page = pageForPath(pathname);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `${page.id === 'dashboard' ? 'Control Tower' : page.name} · HRDYNAX`;
  }, [pathname, page]);

  return (
    <>
      <div className="app">
        <Sidebar open={menu} onNavigate={() => setMenu(false)} />
        {menu && <div className="side-scrim" onClick={() => setMenu(false)} />}
        <div className="main">
          <TopBar onMenu={() => setMenu(true)} />
          <main className="content" aria-label={moduleOf(page.module).name}>
            <Outlet />
          </main>
        </div>
      </div>
      <AskDrawer />
    </>
  );
}
