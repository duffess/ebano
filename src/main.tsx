import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Ebano from './Ebano';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Ebano />
  </StrictMode>,
);
