import { useEffect, useState } from 'react';
import { loadConfig, type Config } from './store';

let cache: Config | null = null;
let pending: Promise<Config> | null = null;

export function useConfig() {
  const [cfg, setCfg] = useState<Config>(cache ?? { photos: {}, busy: {} });
  useEffect(() => {
    if (cache) return;
    pending ??= loadConfig();
    pending.then((c) => {
      cache = c;
      setCfg(c);
    });
  }, []);
  return cfg;
}
