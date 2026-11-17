import { Sparkles } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { SUGGESTED_QUESTIONS } from '../lib/ask';
import { roleName } from '../lib/selectors';
import { useApp } from '../state/AppContext';

export default function AskDrawer() {
  const { chat, ask, role, site, askOpen: open, setAskOpen } = useApp();
  const onClose = useCallback(() => setAskOpen(false), [setAskOpen]);
  const [q, setQ] = useState('');
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [chat.length, open]);

  if (!open) return null;

  const send = (text: string) => {
    const t = text.trim();
    if (t) ask(t);
  };

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" aria-label="Ask the data">
        <header>
          <div>
            <b><Sparkles size={18} /> HRDYNAX AI Assistant</b>
            <div className="small">Answers follow your filters and your role’s access</div>
          </div>
          <button className="btn" type="button" onClick={onClose}>Close</button>
        </header>

        <div className="body" ref={bodyRef}>
          <div className="msg a">
            Ask about units, delivery, availability, crew, VAT or PAYE. Answers use the same filters and access as the dashboards (currently: <b>{roleName(role)}</b>,{' '}
            {site === 'all' ? 'all sites' : site}).
            <div className="src">Demo: answers are computed from the sample data.</div>
          </div>
          <div className="btns">
            {SUGGESTED_QUESTIONS.map((s) => (
              <button key={s} className="chip" type="button" onClick={() => send(s)}>{s}</button>
            ))}
          </div>

          {chat.map((c, i) => (
            <div key={i} style={{ display: 'contents' }}>
              <div className="msg q">{c.q}</div>
              <div className={`msg a ${c.r.blocked ? 'blocked' : ''}`}>
                {c.r.text}
                {c.r.table && (
                  <div className="tbl-wrap">
                    <table>
                      <thead>
                        <tr>{c.r.table.head.map((h) => <th key={h}>{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {c.r.table.rows.map((row, j) => (
                          <tr key={j}>
                            {row.map((v, k) => (
                              <td key={k}>
                                {typeof v === 'string' && v.startsWith('MMU-') ? (
                                  <Link className="link" to={`/units/${v}`} onClick={onClose}>{v}</Link>
                                ) : (
                                  v
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="src">Sources: {c.r.src}</div>
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(q);
            setQ('');
          }}
        >
          <input ref={inputRef} id="ask-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Which units are late?" autoComplete="off" aria-label="Question" />
          <button className="iconbtn primary" type="submit">Ask</button>
        </form>
      </aside>
    </>
  );
}
