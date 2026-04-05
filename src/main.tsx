import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ViewPage } from './pages/view/ViewPage.tsx'

const hash = window.location.hash;
const viewMatch = hash.match(/^#\/view\/([0-9a-f-]+)$/i);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {viewMatch ? <ViewPage token={viewMatch[1]} /> : <App />}
  </StrictMode>,
)
