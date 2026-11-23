import { useEffect, useState } from 'react';
import './admin.css';
import { BARBERS, HOURS, fmt, nextDays } from './Extras';
import {
  DEFAULT_PHOTOS, SLOT_LABEL, busyKey, cloud, isSignedIn, isoDay, loadConfig, saveConfig, signIn, signOut, uploadPhoto,
  type Config, type Slot,
} from './store';

/* Painel do dono: marcar horários ocupados e trocar as fotos do site. Fica em /admin. */

function Login({ onOk }: { onOk: () => void }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="ad-login"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setErr('');
        try {
          await signIn(email, pass);
          onOk();
        } catch (x) {
          setErr((x as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <h1>Ébano · Painel</h1>
      {cloud && (
        <label>E-mail<input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
      )}
      <label>Senha<input type="password" autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} required /></label>
      {err && <p className="ad-err" role="alert">{err}</p>}
      <button className="ad-btn" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
      {!cloud && <p className="ad-note">Modo demonstração: as mudanças ficam salvas só neste navegador.</p>}
    </form>
  );
}

function Hours({ cfg, setCfg }: { cfg: Config; setCfg: (c: Config) => void }) {
  const days = nextDays(12);
  const [barber, setBarber] = useState(BARBERS[0].id);
  const [day, setDay] = useState(0);
  const key = busyKey(barber, isoDay(days[day]));
  const list = cfg.busy[key] ?? [];
  const toggle = (h: string) => {
    const next = list.includes(h) ? list.filter((x) => x !== h) : [...list, h];
    setCfg({ ...cfg, busy: { ...cfg.busy, [key]: next } });
  };
  const all = (on: boolean) => setCfg({ ...cfg, busy: { ...cfg.busy, [key]: on ? [...HOURS] : [] } });
  return (
    <section className="ad-card">
      <h2>Horários</h2>
      <p className="ad-note">Toque num horário para marcar como ocupado. O cliente vê na hora no site.</p>
      <div className="ad-row">{BARBERS.map((b) => <button key={b.id} className={`ad-chip ${barber === b.id ? 'sel' : ''}`} onClick={() => setBarber(b.id)}>{b.n}</button>)}</div>
      <div className="ad-row">{days.map((d, i) => <button key={i} className={`ad-chip ${day === i ? 'sel' : ''}`} onClick={() => setDay(i)}>{fmt(d)}</button>)}</div>
      <div className="ad-hours">
        {HOURS.map((h) => {
          const taken = list.includes(h);
          return (
            <button key={h} className={`ad-hour ${taken ? 'taken' : ''}`} aria-pressed={taken} onClick={() => toggle(h)}>
              <b>{h}</b><span>{taken ? 'Ocupado' : 'Livre'}</span>
            </button>
          );
        })}
      </div>
      <div className="ad-row"><button className="ad-link" onClick={() => all(true)}>Fechar o dia todo</button><button className="ad-link" onClick={() => all(false)}>Liberar o dia todo</button></div>
    </section>
  );
}

function Photos({ cfg, setCfg }: { cfg: Config; setCfg: (c: Config) => void }) {
  const [loading, setLoading] = useState<Slot | null>(null);
  const [err, setErr] = useState('');
  return (
    <section className="ad-card">
      <h2>Fotos</h2>
      <p className="ad-note">Toque em uma foto para trocar. Ela é reduzida automaticamente.</p>
      {err && <p className="ad-err" role="alert">{err}</p>}
      <div className="ad-photos">
        {(Object.keys(DEFAULT_PHOTOS) as Slot[]).map((s) => (
          <label key={s} className="ad-photo">
            <img src={cfg.photos[s] || DEFAULT_PHOTOS[s]} alt="" />
            <span>{loading === s ? 'Enviando…' : SLOT_LABEL[s]}</span>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setLoading(s);
                setErr('');
                try {
                  const url = await uploadPhoto(s, f);
                  setCfg({ ...cfg, photos: { ...cfg.photos, [s]: url } });
                } catch {
                  setErr('Não deu para enviar essa foto. Tente uma imagem menor (JPG ou PNG).');
                } finally {
                  setLoading(null);
                  e.target.value = '';
                }
              }}
            />
            {cfg.photos[s] && (
              <button type="button" className="ad-reset" onClick={(e) => { e.preventDefault(); const p = { ...cfg.photos }; delete p[s]; setCfg({ ...cfg, photos: p }); }}>Voltar à padrão</button>
            )}
          </label>
        ))}
      </div>
    </section>
  );
}

export default function Admin() {
  const [ok, setOk] = useState<boolean | null>(null);
  const [cfg, setCfgState] = useState<Config | null>(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    document.title = 'Painel | Ébano';
    isSignedIn().then(setOk);
  }, []);
  useEffect(() => {
    if (ok) loadConfig().then(setCfgState);
  }, [ok]);

  const setCfg = async (c: Config) => {
    setCfgState(c);
    setStatus('Salvando…');
    try {
      await saveConfig(c);
      setStatus('Salvo');
    } catch {
      setStatus('Não salvou. Confira a internet e tente de novo.');
    }
  };

  if (ok === null) return null;
  if (!ok) return <div className="ad"><Login onOk={() => setOk(true)} /></div>;
  return (
    <div className="ad">
      <header className="ad-top">
        <b>Ébano · Painel</b>
        <span className="ad-status" aria-live="polite">{status}</span>
        <a href="/" className="ad-link">Ver o site</a>
        <button className="ad-link" onClick={() => signOut().then(() => setOk(false))}>Sair</button>
      </header>
      {!cfg ? <p className="ad-note">Carregando…</p> : (<><Hours cfg={cfg} setCfg={setCfg} /><Photos cfg={cfg} setCfg={setCfg} /></>)}
    </div>
  );
}
