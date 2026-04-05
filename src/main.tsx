import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ViewPage } from './pages/view/ViewPage.tsx'

const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const path = window.location.pathname;
const normalizedPath = path.startsWith(base) ? path.slice(base.length) : path;
const viewMatch = normalizedPath.match(/^\/view\/([0-9a-f-]+)$/i);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {viewMatch ? <ViewPage token={viewMatch[1]} /> : <App />}
  </StrictMode>,
)
