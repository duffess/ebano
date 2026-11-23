import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/*
 * Dados que o dono muda pelo painel: fotos e horários ocupados.
 *
 * Dois modos:
 * - Com Supabase (produção): crie as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.
 *   Tudo fica salvo na nuvem e vale para todos os visitantes. Veja SUPABASE.md.
 * - Sem Supabase (demonstração): fica salvo só neste navegador (localStorage).
 */

export type Slot = 'hero' | 'antes' | 'depois' | 'rafa' | 'dudu' | 'leo' | 'espaco1' | 'espaco2' | 'espaco3' | 'espaco4';

// Fotos padrão: Unsplash (licença gratuita para uso comercial). Troque pelo painel.
const U = (id: string, w = 1600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`;
export const DEFAULT_PHOTOS: Record<Slot, string> = {
  hero: U('1773904215697-e6c21fc27ac2', 2000),
  antes: U('1517832606299-7ae9b720a186', 1200),
  depois: U('1503951914875-452162b0f3f1', 1200),
  rafa: U('1599351431202-1e0f0137899a', 900),
  dudu: U('1605497788044-5a32c7078486', 900),
  leo: U('1593702275687-f8b402bf1fb5', 900),
  espaco1: U('1781455793310-8427c96454c7'),
  espaco2: U('1536520002442-39764a41e987'),
  espaco3: U('1621605815971-fbc98d665033'),
  espaco4: U('1585747860715-2ba37e788b70'),
};

export const SLOT_LABEL: Record<Slot, string> = {
  hero: 'Fundo do topo', antes: 'Antes', depois: 'Depois', rafa: 'Rafa', dudu: 'Dudu', leo: 'Léo',
  espaco1: 'O espaço 1', espaco2: 'O espaço 2', espaco3: 'O espaço 3', espaco4: 'O espaço 4',
};

export type Config = { photos: Partial<Record<Slot, string>>; busy: Record<string, string[]> };
const EMPTY: Config = { photos: {}, busy: {} };
const KEY = 'ebano-config';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const sb: SupabaseClient | null = url && anon ? createClient(url, anon) : null;
export const cloud = !!sb;

export const busyKey = (barber: string, isoDay: string) => `${barber}|${isoDay}`;
export const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export async function loadConfig(): Promise<Config> {
  if (sb) {
    const { data } = await sb.from('ebano_config').select('data').eq('id', 1).maybeSingle();
    return { ...EMPTY, ...(data?.data ?? {}) };
  }
  try {
    return { ...EMPTY, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return EMPTY;
  }
}

export async function saveConfig(cfg: Config) {
  if (sb) {
    const { error } = await sb.from('ebano_config').upsert({ id: 1, data: cfg });
    if (error) throw error;
    return;
  }
  localStorage.setItem(KEY, JSON.stringify(cfg));
}

/** Reduz a foto no navegador (máx. 1800 px, JPEG) antes de guardar. */
async function shrink(file: File, max = 1800): Promise<Blob> {
  const img = await createImageBitmap(file);
  const k = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * k);
  c.height = Math.round(img.height * k);
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
  return new Promise((r) => c.toBlob((b) => r(b!), 'image/jpeg', 0.82));
}

export async function uploadPhoto(slot: Slot, file: File): Promise<string> {
  const blob = await shrink(file, sbOrLocalMax());
  if (sb) {
    const path = `${slot}-${Date.now()}.jpg`;
    const { error } = await sb.storage.from('ebano').upload(path, blob, { contentType: 'image/jpeg', upsert: true });
    if (error) throw error;
    return sb.storage.from('ebano').getPublicUrl(path).data.publicUrl;
  }
  return new Promise((r) => {
    const fr = new FileReader();
    fr.onload = () => r(fr.result as string);
    fr.readAsDataURL(blob);
  });
}
const sbOrLocalMax = () => (sb ? 1800 : 1000); // no modo local o navegador guarda pouco

export const photo = (cfg: Config, s: Slot) => cfg.photos[s] || DEFAULT_PHOTOS[s];

// Login do painel
const DEMO_PASS = (import.meta.env.VITE_ADMIN_DEMO_PASSWORD as string | undefined) || 'ebano2026';
export async function signIn(email: string, pass: string) {
  if (sb) {
    const { error } = await sb.auth.signInWithPassword({ email, password: pass });
    if (error) throw new Error('E-mail ou senha incorretos.');
    return;
  }
  if (pass !== DEMO_PASS) throw new Error('Senha incorreta.');
  sessionStorage.setItem('ebano-admin', '1');
}
export async function isSignedIn() {
  if (sb) return !!(await sb.auth.getSession()).data.session;
  return sessionStorage.getItem('ebano-admin') === '1';
}
export async function signOut() {
  if (sb) await sb.auth.signOut();
  sessionStorage.removeItem('ebano-admin');
}
