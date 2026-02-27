import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('SUPABASE URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('SUPABASE KEY (first 10):', (import.meta.env.VITE_SUPABASE_ANON_KEY || '').slice(0, 10))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
