import { useState } from 'react';
import DomesticPage from './pages/domestic';
import OverseasPage from './pages/overseas';
import { MapList } from './pages/MapList';
import { LoginPage } from './pages/LoginPage';
import { AccountSettings } from './pages/AccountSettings';
import { ViewSettingsPanel } from './pages/ViewSettingsPanel';
import { useAuth } from './hooks/useAuth';
import { useProfile } from './hooks/useProfile';
import { useMaps } from './hooks/useMaps';
import { useViewSettings } from './hooks/useViewSettings';
import type { MapMeta } from './types';
import './App.css';

export default function App() {
  const { user, loading: authLoading, signIn, signUp, signOut, deleteAccount } = useAuth();
  const { username, updateUsername, updateEmail, updatePassword, refetchProfile } = useProfile(user?.id);
  const { maps, createMap, joinMap, deleteMap, updateMapView } = useMaps(user?.id ?? '');
  const { enableView, disableView, regenerateToken } = useViewSettings(updateMapView);
  const [selectedMap, setSelectedMap] = useState<MapMeta | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [viewSettingsMap, setViewSettingsMap] = useState<MapMeta | null>(null);

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
    const displayName = username ?? user.email ?? '';
    return (
      <div className="app">
        <MapList
          maps={maps}
          displayName={displayName}
          onCreate={createMap}
          onJoin={(shareId) => joinMap(shareId)}
          onDelete={deleteMap}
          onSelect={setSelectedMap}
          onLogout={async () => { setSelectedMap(null); await signOut(); }}
          onOpenSettings={() => setShowSettings(true)}
          onOpenViewSettings={setViewSettingsMap}
        />
        {showSettings && (
          <AccountSettings
            currentEmail={user.email ?? ''}
            currentUsername={username ?? ''}
            onUpdateUsername={async (name) => {
              await updateUsername(name);
            }}
            onUpdateEmail={updateEmail}
            onUpdatePassword={updatePassword}
            onDeleteAccount={deleteAccount}
            onClose={() => { setShowSettings(false); refetchProfile(); }}
          />
        )}
        {viewSettingsMap && (
          <ViewSettingsPanel
            map={viewSettingsMap}
            onEnable={async () => { await enableView(viewSettingsMap.id); setViewSettingsMap(m => m ? { ...m, viewEnabled: true } : m); }}
            onDisable={async () => { await disableView(viewSettingsMap.id); setViewSettingsMap(m => m ? { ...m, viewEnabled: false, viewToken: null } : m); }}
            onRegenerate={async () => { await regenerateToken(viewSettingsMap.id); }}
            onClose={() => setViewSettingsMap(null)}
          />
        )}
      </div>
    );
  }

  const sameTypeMaps = maps.filter(m => m.type === selectedMap.type);

  return (
    <div className="app">
      {selectedMap.type === 'domestic' ? (
        <DomesticPage
          mapId={selectedMap.id}
          mapName={selectedMap.name}
          currentUserId={user.id}
          availableMaps={sameTypeMaps}
          onBack={() => setSelectedMap(null)}
        />
      ) : (
        <OverseasPage
          mapId={selectedMap.id}
          mapName={selectedMap.name}
          currentUserId={user.id}
          availableMaps={sameTypeMaps}
          onBack={() => setSelectedMap(null)}
        />
      )}
    </div>
  );
}
