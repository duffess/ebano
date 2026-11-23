import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import Ebano from './Ebano';

const Admin = lazy(() => import('./Admin'));
const isAdmin = location.pathname.replace(/\/+$/, '') === '/admin';
if (isAdmin) import('./ebano.css');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isAdmin ? (
      <Suspense fallback={null}>
        <Admin />
      </Suspense>
    ) : (
      <Ebano />
    )}
  </StrictMode>,
);
