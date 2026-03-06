import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage.tsx';
import { DisclaimerPage } from './pages/DisclaimerPage.tsx';
import './index.css';

const routePath = window.location.pathname.replace(/\/$/, '') || '/';

const getPage = () => {
  if (routePath === '/politika-privatnosti') {
    return <PrivacyPolicyPage />;
  }

  if (routePath === '/odricanje-odgovornosti') {
    return <DisclaimerPage />;
  }

  return <App />;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {getPage()}
  </StrictMode>,
);
