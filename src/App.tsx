import { useState } from 'react';
import DomesticPage from './pages/domestic';
import OverseasPage from './pages/overseas';
import { MapList } from './pages/MapList';
import { LoginPage } from './pages/LoginPage';
import { useAuth } from './hooks/useAuth';
import { useMaps } from './hooks/useMaps';
import type { MapMeta } from './types';
import './App.css';

export default function App() {
  const { user, loading: authLoading, signIn, signUp, signOut, deleteAccount } = useAuth();
  const { maps, createMap, joinMap, deleteMap } = useMaps(user?.id ?? '');
  const [selectedMap, setSelectedMap] = useState<MapMeta | null>(null);

  if (authLoading) {
    return (
      <div className="app" style={{ alignItems: 'center', justifyContent: 'center', display: 'flex' }}>
        <p style={{ color: '#94A3B8', fontSize: 14 }}>読み込み中...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app">
        <LoginPage onSignIn={signIn} onSignUp={signUp} />
      </div>
    );
  }

  if (!selectedMap) {
    return (
      <div className="app">
        <MapList
          maps={maps}
          userEmail={user.email ?? ''}
          onCreate={createMap}
          onJoin={(shareId) => joinMap(shareId)}
          onDelete={deleteMap}
          onSelect={setSelectedMap}
          onLogout={async () => { setSelectedMap(null); await signOut(); }}
          onDeleteAccount={deleteAccount}
        />
      </div>
    );
  }

  return (
    <div className="app">
      {selectedMap.type === 'domestic' ? (
        <DomesticPage
          mapId={selectedMap.id}
          mapName={selectedMap.name}
          onBack={() => setSelectedMap(null)}
        />
      ) : (
        <OverseasPage
          mapId={selectedMap.id}
          mapName={selectedMap.name}
          onBack={() => setSelectedMap(null)}
        />
      )}
    </div>
  );
}
