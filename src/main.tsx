import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AppProvider } from './state/AppContext';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* BASE_URL is "/" locally and "/hrdynax/" on GitHub Pages (set by --base in the deploy workflow). */}
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppProvider>
        <App />
      </AppProvider>
    </BrowserRouter>
  </StrictMode>,
);
