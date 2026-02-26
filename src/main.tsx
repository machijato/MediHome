import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { NewsListPage } from './NewsListPage';
import { ArticlePage } from './ArticlePage';
import './index.css';

const path = window.location.pathname;

const renderPage = () => {
  if (path === '/novosti') {
    return <NewsListPage />;
  }

  const articleMatch = path.match(/^\/novosti\/([^/]+)$/);
  if (articleMatch) {
    return <ArticlePage slug={decodeURIComponent(articleMatch[1])} />;
  }

  return <App />;
};

createRoot(document.getElementById('root')!).render(<StrictMode>{renderPage()}</StrictMode>);
