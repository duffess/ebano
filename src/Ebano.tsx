import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import Lenis from 'lenis';
import './ebano.css';
import { BeforeAfter, Barbers, Booking, Drinks, HeroVideo, SERVICES, SoundToggle, snip } from './Extras';

gsap.registerPlugin(ScrollTrigger, useGSAP);

/*
 * Ébano: site de demonstração para barbearias premium (marca fictícia), feito pela LYSS.
 * Efeitos: luz do espelho que revela o nome (máscara), palavras que acendem com a rolagem,
 * galeria de cortes num anel 3D, lista que abre, cartão com brilho e granulado de filme.
 */

const LYSS_WA = 'https://wa.me/5521992217782?text=' + encodeURIComponent('Olá! Vi o site da Ébano e quero um assim para minha barbearia.');
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = () => matchMedia('(hover: hover) and (pointer: fine)').matches;

// Rosto de frente + cabelo diferente para cada corte
const FACE = 'M50 44c-14 0-22 12-22 28 0 20 10 34 22 34s22-14 22-34c0-16-8-28-22-28Z';
const STYLES = [
  { n: 'Degradê', d: 'Laterais na zero, topo texturizado', hair: 'M28 62c0-20 10-30 22-30s22 10 22 30c-4-10-10-14-22-14s-18 4-22 14Z' },
  { n: 'Social', d: 'Risca lateral e tesoura', hair: 'M27 66c-2-22 10-36 25-36 14 0 22 10 21 30-6-8-14-14-28-12l-6 4c-6 2-10 8-12 14Z' },
  { n: 'Taper', d: 'Pezinho baixo, transição suave', hair: 'M29 60c1-18 10-26 21-26s20 8 21 26c-6-6-12-9-21-9s-15 3-21 9Z' },
  { n: 'Buzz', d: 'Máquina por igual, sem frescura', hair: 'M29 58c2-14 10-20 21-20s19 6 21 20c-6-4-12-6-21-6s-15 2-21 6Z' },
  { n: 'Pompadour', d: 'Volume para cima e para trás', hair: 'M28 62c-2-26 8-40 26-42 12-1 22 8 20 22-2 10-4 16-2 20-6-8-14-12-22-12s-16 4-22 12Z' },
  { n: 'Mullet', d: 'Curto na frente, longo atrás', hair: 'M27 64c0-20 10-32 23-32s23 12 23 32v34c-3-10-3-20-3-30-6-6-12-8-20-8s-14 2-20 8c0 10 0 20-3 30Z' },
];

const MANIFESTO =
  'Aqui ninguém tem pressa. Você senta, a toalha quente chega, o espresso vem na xícara de louça e o corte só termina quando ficar do jeito que você imaginou.';
const GOLD = new Set(['toalha', 'quente,', 'espresso', 'imaginou.']);

function WaIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.6 14.1c-.2.7-1.4 1.3-2 1.4-.5.1-1.2.1-1.9-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5.1-4.5-.1-.2-1.2-1.6-1.2-3.1s.8-2.2 1-2.5c.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.3.5-.4.5c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.5.3.1.1.1.6-.1 1.3Z" />
    </svg>
  );
}

export default function Ebano() {
  const root = useRef<HTMLDivElement>(null);
  const [modal, setModal] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const [barber, setBarber] = useState<string | null>(null);
  const [demoMsg, setDemoMsg] = useState('');

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setModal(false);
    addEventListener('keydown', k);
    return () => removeEventListener('keydown', k);
  }, []);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const intro = q('.intro')[0] as HTMLElement;
      const hero = q('.hero')[0] as HTMLElement;

      let lenis: Lenis | null = null;
      const tickLenis = (t: number) => lenis?.raf(t * 1000);
      if (!reduced() && fine()) {
        lenis = new Lenis({ lerp: 0.08 });
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(tickLenis);
        gsap.ticker.lagSmoothing(0);
      }

      // Menu fica sólido depois do topo
      ScrollTrigger.create({ start: 120, onToggle: (s) => q('.top')[0].classList.toggle('is-solid', s.isActive) });

      // Palavras do manifesto acendem com a rolagem
      const words = q('.manifesto span');
      ScrollTrigger.create({
        trigger: q('.manifesto')[0], start: 'top 75%', end: 'bottom 45%', scrub: true,
        onUpdate: (s) => words.forEach((w, i) => w.classList.toggle('on', i / words.length < s.progress)),
      });

      // Anel 3D dos cortes, girando com a rolagem
      const cards = q('.style') as HTMLElement[];
      const R = () => Math.max(260, Math.min(innerWidth * 0.36, 520));
      const place = (rot: number) => {
        const r = R();
        cards.forEach((c, i) => {
          const a = (i / cards.length) * 360 + rot;
          c.style.transform = `rotateY(${a}deg) translateZ(${r}px)`;
          const front = Math.cos((a * Math.PI) / 180);
          c.style.opacity = String(0.25 + Math.max(front, 0) * 0.75);
        });
      };
      place(0);
      const spin = { r: 0 };
      gsap.to(spin, {
        r: -360 + 360 / cards.length, ease: 'none',
        scrollTrigger: { trigger: q('.styles')[0], start: 'top top', end: 'bottom bottom', scrub: 0.8 },
        onUpdate: () => place(spin.r),
      });

      // Títulos sobem
      q('.h2').forEach((h) => gsap.from(h, { yPercent: 50, autoAlpha: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 88%', once: true } }));
      gsap.from(q('.item'), { y: 30, autoAlpha: 0, stagger: 0.08, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: q('.list')[0], start: 'top 80%', once: true } });

      // Luz do espelho: segue o mouse; no celular passeia sozinha
      const tgt = { x: 50, y: 45 }, cur = { x: 50, y: 45 };
      if (fine()) {
        hero.addEventListener('pointermove', (e) => {
          const r = hero.getBoundingClientRect();
          tgt.x = ((e.clientX - r.left) / r.width) * 100;
          tgt.y = ((e.clientY - r.top) / r.height) * 100;
        });
      }
      const light = (t: number) => {
        if (!fine() && !reduced()) { tgt.x = 50 + Math.sin(t / 1.4) * 30; tgt.y = 42 + Math.sin(t / 0.7) * 10; }
        cur.x += (tgt.x - cur.x) * 0.08; cur.y += (tgt.y - cur.y) * 0.08;
        hero.style.setProperty('--mx', cur.x.toFixed(2) + '%');
        hero.style.setProperty('--my', cur.y.toFixed(2) + '%');
      };
      gsap.ticker.add(light);

      // Cursor
      if (fine()) {
        const c = q('.cur')[0] as HTMLElement;
        const cx = gsap.quickTo(c, 'x', { duration: 0.25 }), cy = gsap.quickTo(c, 'y', { duration: 0.25 });
        addEventListener('pointermove', (e) => { cx(e.clientX); cy(e.clientY); c.classList.toggle('hot', !!(e.target as Element).closest?.('a,button')); });
      }

      // Abertura: a luz passa e acende o nome em dourado
      if (reduced()) intro.remove();
      else {
        document.documentElement.style.overflow = 'hidden';
        lenis?.stop();
        gsap.timeline({ onComplete: () => { intro.remove(); document.documentElement.style.overflow = ''; lenis?.start(); } })
          .to(q('.intro__sweep'), { left: '110vw', duration: 1.6, ease: 'power2.inOut' }, 0.2)
          .to(q('.intro__word i'), { clipPath: 'inset(0 0% 0 0)', duration: 1.3, ease: 'power2.inOut' }, 0.4)
          .to(intro, { autoAlpha: 0, duration: 0.8, ease: 'power2.out' }, 2.1)
          .from(q('.hero__copy > *'), { y: 24, autoAlpha: 0, stagger: 0.1, duration: 1, ease: 'expo.out' }, 2.2);
      }

      document.fonts?.ready.then(() => ScrollTrigger.refresh());
      return () => {
        gsap.ticker.remove(tickLenis);
        lenis?.destroy();
        gsap.ticker.remove(light);
        document.documentElement.style.overflow = '';
      };
    },
    { scope: root },
  );

  const openWa = (e: React.MouseEvent) => { e.preventDefault(); setDemoMsg(''); setModal(true); };
  const goBook = (e?: React.MouseEvent) => { e?.preventDefault(); document.getElementById('agendar')?.scrollIntoView({ behavior: 'smooth' }); };
  const pickBarber = (id: string) => { setBarber(id); goBook(); };

  return (
    <div ref={root}>
      <div className="intro" aria-hidden="true">
        <div className="intro__word s">Ébano<i>Ébano</i></div>
        <div className="intro__sweep" />
        <p className="intro__line">BARBEARIA · DESDE 2009</p>
      </div>
      <div className="grain" aria-hidden="true" />

      <header className="top">
        <b>ÉBANO</b>
        <nav><a href="#estilos">Estilos</a><a href="#servicos">Serviços</a><a href="#barbeiros">Barbeiros</a><SoundToggle /><a href="#agendar" className="pill" onClick={goBook}>Agendar</a></nav>
      </header>

      <main>
        <section className="hero" aria-label="Ébano Barbearia">
          <HeroVideo />
          <div className="hero__glow" aria-hidden="true" />
          <div className="hero__dim" aria-hidden="true"><span className="hero__word s">Ébano</span></div>
          <div className="hero__lit" aria-hidden="true"><span className="hero__word s">Ébano</span></div>
          <h1 className="hero__copy">
            <span className="hero__meta">BARBEARIA · BARRA DA TIJUCA · DESDE 2009</span>
            <span className="hero__sub">O corte é só o começo do ritual.</span>
            <a href="#agendar" className="btn" onClick={goBook}><WaIcon />Reservar horário</a>
          </h1>
          <span className="scroll" aria-hidden="true" />
        </section>

        <section className="manifesto" aria-label="Sobre a casa">
          <p>{MANIFESTO.split(' ').map((w, i) => <span key={i} className={GOLD.has(w) ? 'g' : ''}>{w} </span>)}</p>
        </section>

        <section className="styles" id="estilos">
          <div className="styles__pin">
            <div className="head"><h2 className="h2 s">Estilos</h2><p>Os cortes que mais saem da cadeira. Não achou o seu? Traz a foto.</p></div>
            <div className="ring"><div className="ring__in">
              {STYLES.map((s, i) => (
                <article className="style" key={s.n} onPointerEnter={snip}>
                  <span className="style__n">0{i + 1}</span>
                  <svg viewBox="0 0 100 110" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d={FACE} /><path d={s.hair} fill="currentColor" fillOpacity=".18" /></svg>
                  <div><h3 className="s">{s.n}</h3><small>{s.d}</small></div>
                </article>
              ))}
            </div></div>
            <p className="styles__hint">ROLE PARA GIRAR</p>
          </div>
        </section>

        <BeforeAfter />

        <section className="services" id="servicos">
          <div className="head" style={{ padding: 0 }}><h2 className="h2 s">Serviços</h2><p>Preço fechado. Bebida da casa em todos.</p></div>
          <ul className="list">
            {SERVICES.map((s, i) => (
              <li key={s.n} className={`item ${open === i ? 'open' : ''}`} onClick={() => setOpen(open === i ? null : i)}>
                <span className="item__n">0{i + 1}</span><h3 className="s">{s.n}</h3><b>{s.v}</b><p>{s.p} {s.min} min.</p>
              </li>
            ))}
          </ul>
        </section>

        <Barbers onPick={pickBarber} />
        <Drinks />

        <section className="club" id="clube">
          <div>
            <h2 className="h2 s">Clube <span className="gold">Ébano</span></h2>
            <ul><li>Cortes ilimitados no mês</li><li>Uma barba por semana</li><li>Horário reservado às sextas</li><li>10% nos produtos da casa</li></ul>
          </div>
          <div className="price"><b>R$ 189</b><span>por mês, cancela quando quiser</span><br /><a href="#agendar" className="btn" onClick={openWa}>Quero entrar</a></div>
        </section>

        <Booking barber={barber} setBarber={setBarber} onDemo={(m) => { setDemoMsg(m); setModal(true); }} />

        <section className="book">
          <h2 className="h2 s">Sua cadeira <br />está pronta.</h2>
          <p>Reserve pelo WhatsApp. Chegou antes? O espresso é por nossa conta.</p>
          <a href="#agendar" className="btn" onClick={goBook}><WaIcon />Reservar agora</a>
          <div className="info">
            <div><h4>Endereço</h4><p>Alameda das Acácias, 450<br />Barra da Tijuca</p></div>
            <div><h4>Horário</h4><p>Ter a sex, 10h às 21h<br />Sáb, 9h às 18h</p></div>
          </div>
          <p className="big s" aria-hidden="true">Ébano</p>
        </section>
      </main>
      <footer className="foot">
        <span>Site de demonstração. A Ébano é uma barbearia fictícia.</span>
        <span>Quer um site assim? <a href={LYSS_WA} target="_blank" rel="noopener noreferrer">Feito pela LYSS</a></span>
      </footer>

      <div className="cur" aria-hidden="true" />
      <div className={`modal ${modal ? 'open' : ''}`} role="dialog" aria-modal="true" aria-labelledby="mt" onClick={(e) => e.target === e.currentTarget && setModal(false)}>
        <div className="modal__box">
          <h3 className="s" id="mt">Aqui abriria o WhatsApp da barbearia</h3>
          {demoMsg && <blockquote className="demo-msg">{demoMsg}</blockquote>}
          <p>Este é um site de demonstração da LYSS. No site da sua barbearia, esse botão leva o cliente direto para o seu WhatsApp, com a mensagem pronta.</p>
          <a className="btn" href={LYSS_WA} target="_blank" rel="noopener noreferrer">Quero um site assim</a>
          <button className="x" type="button" onClick={() => setModal(false)}>Continuar vendo</button>
        </div>
      </div>
    </div>
  );
}
