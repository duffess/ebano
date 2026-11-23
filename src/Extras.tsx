import { useEffect, useRef, useState } from 'react';
import { busyKey, isoDay, photo } from './store';
import { useConfig } from './useConfig';

/*
 * Peças extras da Ébano.  * As fotos vêm do painel (/admin). Sem foto escolhida, usa as do Unsplash em store.ts.
 */

export const WA_NUMBER = '5521992217782'; // troque pelo WhatsApp da barbearia

/* ---------- Imagem que some se o arquivo não existir ---------- */
function Photo({ src, alt, className, fallback }: { src: string; alt: string; className?: string; fallback: React.ReactNode }) {
  const [ok, setOk] = useState(true);
  if (!ok) return <>{fallback}</>;
  return <img src={src} alt={alt} className={className} loading="lazy" decoding="async" onError={() => setOk(false)} />;
}

/* ---------- Galeria do espaço ---------- */
export function Space() {
  const cfg = useConfig();
  const slots = ['espaco1', 'espaco2', 'espaco3', 'espaco4'] as const;
  const alts = ['Salão com as cadeiras e espelhos', 'Luminárias acesas sobre as bancadas', 'Máquinas, tesoura e pente na bancada', 'Cadeira de couro preto'];
  return (
    <section className="space">
      <div className="head"><h2 className="h2 s">O espaço</h2><p>Quatro cadeiras, luz baixa e nenhuma pressa.</p></div>
      <div className="space__grid">
        {slots.map((s, i) => (
          <figure key={s} className={`space__f space__f--${i}`}><img src={photo(cfg, s)} alt={alts[i]} loading="lazy" decoding="async" /></figure>
        ))}
      </div>
    </section>
  );
}

/* ---------- Som de tesoura (desligado por padrão) ---------- */
let ctx: AudioContext | null = null;
let soundOn = false;
export function snip() {
  if (!soundOn) return;
  ctx ??= new AudioContext();
  const t = ctx.currentTime;
  for (const dt of [0, 0.07]) {
    const len = 0.05;
    const buf = ctx.createBuffer(1, ctx.sampleRate * len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 3500;
    const g = ctx.createGain();
    g.gain.value = 0.25;
    src.connect(f).connect(g).connect(ctx.destination);
    src.start(t + dt);
  }
}
export function SoundToggle() {
  const [on, setOn] = useState(false);
  return (
    <button
      type="button"
      className={`sound ${on ? 'on' : ''}`}
      aria-pressed={on}
      onClick={() => {
        soundOn = !on;
        setOn(!on);
        if (!on) setTimeout(snip, 50);
      }}
    >
      <span className="sound__bars" aria-hidden="true"><i /><i /><i /></span>
      Som {on ? 'ligado' : 'desligado'}
    </button>
  );
}

/* ---------- Antes e depois arrastável ---------- */
export function BeforeAfter() {
  const cfg = useConfig();
  const [pos, setPos] = useState(50);
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef(false);
  const move = (x: number) => {
    const r = box.current!.getBoundingClientRect();
    setPos(Math.min(100, Math.max(0, ((x - r.left) / r.width) * 100)));
  };
  const drawn = (after: boolean) => (
    <svg className="ba__draw" viewBox="0 0 300 400" aria-hidden="true">
      <rect width="300" height="400" fill={after ? '#1c1810' : '#15130f'} />
      <path d="M150 120c-48 0-74 40-74 94 0 70 34 118 74 118s74-48 74-118c0-54-26-94-74-94Z" fill="none" stroke="#c9a46a" strokeWidth="2" />
      {after ? (
        <path d="M78 196c0-62 30-92 72-92s72 30 72 92c-14-30-36-42-72-42s-58 12-72 42Z" fill="#c9a46a" fillOpacity=".35" />
      ) : (
        <path d="M66 214c-8-80 30-122 84-122s94 44 86 122c-8-20-14-44-30-52-20 14-40 8-56 0-18 10-40 12-58 0-14 10-20 32-26 52Z" fill="#8f8572" fillOpacity=".35" />
      )}
      {!after && <path d="M104 300c14 30 30 44 46 44s32-14 46-44c-10 8-24 12-46 12s-36-4-46-12Z" fill="#8f8572" fillOpacity=".3" />}
    </svg>
  );
  return (
    <section className="ba">
      <div className="head"><h2 className="h2 s">Antes e depois</h2><p>Arraste a linha. Fotos de exemplo: o dono troca pelas dos clientes no painel.</p></div>
      <div
        className="ba__box"
        ref={box}
        onPointerDown={(e) => { drag.current = true; (e.target as Element).setPointerCapture?.(e.pointerId); move(e.clientX); }}
        onPointerMove={(e) => drag.current && move(e.clientX)}
        onPointerUp={() => (drag.current = false)}
        onPointerCancel={() => (drag.current = false)}
        style={{ '--p': `${pos}%` } as React.CSSProperties}
      >
        <div className="ba__layer"><Photo src={photo(cfg, 'depois')} alt="Depois do corte" className="ba__img" fallback={drawn(true)} /><span className="ba__tag ba__tag--r">Depois</span></div>
        <div className="ba__layer ba__before"><Photo src={photo(cfg, 'antes')} alt="Antes do corte" className="ba__img" fallback={drawn(false)} /><span className="ba__tag">Antes</span></div>
        <div className="ba__handle" aria-hidden="true"><span>‹ ›</span></div>
        <input
          className="ba__range"
          type="range"
          min={0}
          max={100}
          value={Math.round(pos)}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-label="Comparar antes e depois"
        />
      </div>
    </section>
  );
}

/* ---------- Barbeiros ---------- */
export const BARBERS = [
  { id: 'rafa', n: 'Rafa', r: 'Degradê e navalhado', y: '15 anos de cadeira' },
  { id: 'dudu', n: 'Dudu', r: 'Barba e camuflagem', y: '9 anos de cadeira' },
  { id: 'leo', n: 'Léo', r: 'Tesoura e cortes clássicos', y: '12 anos de cadeira' },
];
export function Barbers({ onPick }: { onPick: (id: string) => void }) {
  const cfg = useConfig();
  return (
    <section className="crew" id="barbeiros">
      <div className="head"><h2 className="h2 s">Quem corta</h2><p>Escolha pelo estilo ou pela conversa.</p></div>
      <div className="crew__grid">
        {BARBERS.map((b) => (
          <article className="barber" key={b.id} onPointerEnter={snip}>
            <div className="barber__ph">
              <Photo src={photo(cfg, b.id as 'rafa')} alt={`Retrato de ${b.n}`} className="barber__img" fallback={<span className="barber__mono s">{b.n[0]}</span>} />
            </div>
            <h3 className="s">{b.n}</h3>
            <p>{b.r}</p>
            <small>{b.y}</small>
            <button type="button" className="link" onClick={() => onPick(b.id)}>Agendar com {b.n}</button>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ---------- Agendamento em três passos que vira mensagem no WhatsApp ---------- */
export const SERVICES = [
  { n: 'Corte assinado', p: 'Conversa, lavagem, corte na tesoura ou máquina e finalização com pomada.', v: 'R$ 90', min: 50 },
  { n: 'Barba de navalha', p: 'Toalha quente, óleo pré-barba, navalha e loção calmante.', v: 'R$ 70', min: 40 },
  { n: 'Corte + barba', p: 'O ritual completo, com uma dose de whisky ou um espresso.', v: 'R$ 150', min: 90 },
  { n: 'Camuflagem de grisalhos', p: 'Tom natural, sem efeito tinta, em 20 minutos.', v: 'R$ 80', min: 30 },
  { n: 'Limpeza de pele', p: 'Esfoliação, vapor e máscara de argila.', v: 'R$ 110', min: 45 },
];
export const HOURS = ['10:00', '11:00', '13:00', '14:30', '16:00', '17:30', '19:00', '20:00'];

export function nextDays(n = 6) {
  const out: Date[] = [];
  const d = new Date();
  while (out.length < n) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 1) out.push(new Date(d)); // fecha domingo e segunda
  }
  return out;
}
export const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }).replace('.', '');

export function Booking({ barber, setBarber, onDemo }: { barber: string | null; setBarber: (b: string | null) => void; onDemo: (msg: string) => void }) {
  const [svc, setSvc] = useState<number | null>(null);
  const [day, setDay] = useState<number | null>(null);
  const [hour, setHour] = useState<string | null>(null);
  const days = useRef(nextDays()).current;
  const cfg = useConfig();
  // horários marcados como ocupados no painel
  const busy = (d: number, h: string) => !!barber && (cfg.busy[busyKey(barber, isoDay(days[d]))] ?? []).includes(h);
  useEffect(() => setHour(null), [day, barber]);

  const step = svc === null ? 1 : barber === null ? 2 : day === null || hour === null ? 3 : 4;
  const b = BARBERS.find((x) => x.id === barber);
  const msg =
    svc !== null && b && day !== null && hour
      ? `Olá! Quero agendar ${SERVICES[svc].n} com o ${b.n}, ${fmt(days[day])} às ${hour}.`
      : '';

  return (
    <section className="booking" id="agendar">
      <div className="head"><h2 className="h2 s">Reserve em três toques</h2><p>No fim, o WhatsApp abre com tudo escrito. É só enviar.</p></div>
      <ol className="steps" aria-label="Passos">
        {['Serviço', 'Barbeiro', 'Dia e hora'].map((t, i) => (
          <li key={t} className={step > i + 1 ? 'done' : step === i + 1 ? 'now' : ''}><span>{i + 1}</span>{t}</li>
        ))}
      </ol>
      <div className="bk">
        <fieldset>
          <legend className="s">Serviço</legend>
          <div className="chips">
            {SERVICES.map((s, i) => (
              <button type="button" key={s.n} className={`chip ${svc === i ? 'sel' : ''}`} aria-pressed={svc === i} onClick={() => { setSvc(i); snip(); }}>
                {s.n}<small>{s.v} · {s.min} min</small>
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset disabled={svc === null}>
          <legend className="s">Barbeiro</legend>
          <div className="chips">
            {BARBERS.map((x) => (
              <button type="button" key={x.id} className={`chip ${barber === x.id ? 'sel' : ''}`} aria-pressed={barber === x.id} onClick={() => { setBarber(x.id); snip(); }}>
                {x.n}<small>{x.r}</small>
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset disabled={barber === null || svc === null}>
          <legend className="s">Dia e hora</legend>
          <div className="chips days">
            {days.map((d, i) => (
              <button type="button" key={i} className={`chip ${day === i ? 'sel' : ''}`} aria-pressed={day === i} onClick={() => setDay(i)}>{fmt(d)}</button>
            ))}
          </div>
          {day !== null && (
            <div className="chips hours">
              {HOURS.map((h) => (
                <button type="button" key={h} disabled={busy(day, h)} className={`chip ${hour === h ? 'sel' : ''}`} aria-pressed={hour === h} onClick={() => { setHour(h); snip(); }}>{busy(day, h) ? 'ocupado' : h}</button>
              ))}
            </div>
          )}
        </fieldset>
        <div className={`summary ${msg ? 'ready' : ''}`} aria-live="polite">
          <p>{msg || 'Escolha serviço, barbeiro, dia e hora.'}</p>
          <button type="button" className="btn" disabled={!msg} onClick={() => onDemo(msg)}>Enviar no WhatsApp</button>
        </div>
      </div>
    </section>
  );
}

/* ---------- Bebidas da casa ---------- */
const DRINKS = [
  ['Espresso', 'Grão do Sul de Minas, xícara de louça'],
  ['Whisky 12 anos', 'Uma dose no combo corte + barba'],
  ['Cerveja artesanal', 'IPA ou pilsen de cervejaria carioca'],
  ['Água com gás e limão', 'Sempre gelada'],
];
export function Drinks() {
  return (
    <section className="drinks">
      <h2 className="h2 s">Enquanto espera</h2>
      <ul>
        {DRINKS.map(([n, d]) => (
          <li key={n}><span className="s">{n}</span><i /><small>{d}</small></li>
        ))}
      </ul>
      <p className="drinks__note">Tudo por conta da casa.</p>
    </section>
  );
}
