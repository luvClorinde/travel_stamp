import { useState } from 'react';
import DomesticPage from './pages/domestic';
import OverseasPage from './pages/overseas';
import './App.css';

type Mode = 'domestic' | 'overseas';

export default function App() {
  const [mode, setMode] = useState<Mode>('domestic');

  return (
    <div className="app">
      <nav className="app-nav">
        <button
          className={`nav-tab ${mode === 'domestic' ? 'active' : ''}`}
          onClick={() => setMode('domestic')}
        >
          🗾 国内旅行
        </button>
        <button
          className={`nav-tab ${mode === 'overseas' ? 'active' : ''}`}
          onClick={() => setMode('overseas')}
        >
          🌍 海外旅行
        </button>
      </nav>

      {mode === 'domestic' ? <DomesticPage /> : <OverseasPage />}
    </div>
  );
}
