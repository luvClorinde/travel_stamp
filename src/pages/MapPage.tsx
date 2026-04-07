import { useState } from 'react';
import { JapanMap, japaneseNames } from './domestic/components/JapanMap';
import { WorldMap } from './overseas/components/WorldMap';
import { PrefectureModal } from './domestic/components/PrefectureModal';
import { CountryModal } from './overseas/components/CountryModal';
import { useTravel } from './domestic/hooks/useTravel';
import { useWorldTravel } from './overseas/hooks/useWorldTravel';
import type { MapMeta } from '../types';
import './domestic/domestic.css';
import './overseas/overseas.css';

type Tab = 'domestic' | 'international';

interface Props {
  mapId: string;
  mapName: string;
  currentUserId: string;
  availableMaps: MapMeta[];
  onBack: () => void;
}

// 都道府県IDセット（国内投稿の location_id はここに含まれる）
const PREF_IDS = new Set(Object.keys(japaneseNames));

export default function MapPage({ mapId, mapName, currentUserId, availableMaps, onBack }: Props) {
  const [tab, setTab] = useState<Tab>('domestic');
  const domestic = useTravel(mapId);
  const overseas = useWorldTravel(mapId);

  const [selectedPref, setSelectedPref] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<{ id: string; name: string } | null>(null);

  function switchTab(next: Tab) {
    setTab(next);
    setSelectedPref(null);
    setSelectedCountry(null);
  }

  // 国内 = PREF_IDS に含まれる location_id のみ、海外 = それ以外
  const domesticVisited = Object.keys(domestic.data).filter(id => PREF_IDS.has(id)).length;
  const overseasVisited = Object.keys(overseas.data).filter(id => !PREF_IDS.has(id)).length;

  const domesticIsVisited = (id: string) => PREF_IDS.has(id) && domestic.isVisited(id);
  const overseasIsVisited = (id: string) => !PREF_IDS.has(id) && overseas.isVisited(id);

  const loading = domestic.loading || overseas.loading;
  const loadError = domestic.loadError ?? overseas.loadError;

  return (
    <div className={`page-layout${tab === 'international' ? ' page-layout--overseas' : ''}`}>
      <header className="app-header">
        <button className="back-btn" onClick={onBack}>← 地図一覧</button>
        <h1 className="app-title">{mapName}</h1>

        <nav className="app-nav">
          <button
            className={`nav-tab${tab === 'domestic' ? ' active' : ''}`}
            onClick={() => switchTab('domestic')}
          >
            🗾 国内
          </button>
          <button
            className={`nav-tab${tab === 'international' ? ' active' : ''}`}
            onClick={() => switchTab('international')}
          >
            🌍 海外
          </button>
        </nav>

        {tab === 'domestic' ? (
          <div className="visited-counter">
            <span className="counter-num">{domesticVisited}</span>
            <span className="counter-sep"> / </span>
            <span className="counter-total">47</span>
            <span className="counter-label"> 都道府県 訪問済み</span>
          </div>
        ) : (
          <div className="visited-counter">
            <span className="counter-num">{overseasVisited}</span>
            <span className="counter-label"> カ国 訪問済み</span>
          </div>
        )}
      </header>

      <main className="app-main">
        {loading ? (
          <div style={{ color: '#94A3B8', fontSize: 14, margin: 'auto' }}>読み込み中...</div>
        ) : loadError ? (
          <div style={{ color: '#EF4444', fontSize: 13, margin: 'auto', padding: 16, textAlign: 'center' }}>
            データの読み込みに失敗しました<br />
            <code style={{ fontSize: 11, color: '#94A3B8' }}>{loadError}</code>
          </div>
        ) : tab === 'domestic' ? (
          <JapanMap isVisited={domesticIsVisited} onSelect={setSelectedPref} />
        ) : (
          <WorldMap isVisited={overseasIsVisited} onCountryClick={(id, name) => setSelectedCountry({ id, name })} />
        )}
      </main>

      {selectedPref && (
        <PrefectureModal
          prefectureName={japaneseNames[selectedPref] ?? selectedPref}
          records={domestic.getRecords(selectedPref)}
          currentMapId={mapId}
          currentUserId={currentUserId}
          availableMaps={availableMaps}
          onAdd={(type, content, caption, files, extraMapIds) =>
            domestic.addRecord(selectedPref, type, content, caption, files, extraMapIds)
          }
          onDelete={(recordId) => domestic.deleteRecord(selectedPref, recordId)}
          onPin={(recordId) => domestic.pinRecord(selectedPref, recordId)}
          onUnpin={(recordId) => domestic.unpinRecord(selectedPref, recordId)}
          onReload={domestic.reloadPosts}
          onClose={() => setSelectedPref(null)}
        />
      )}

      {selectedCountry && (
        <CountryModal
          countryId={selectedCountry.id}
          countryName={selectedCountry.name}
          records={overseas.getRecords(selectedCountry.id)}
          currentMapId={mapId}
          currentUserId={currentUserId}
          availableMaps={availableMaps}
          onAdd={(countryId, type, content, caption, files, extraMapIds) =>
            overseas.addRecord(countryId, type, content, caption, files, extraMapIds)
          }
          onDelete={(recordId) => overseas.deleteRecord(selectedCountry.id, recordId)}
          onPin={(recordId) => overseas.pinRecord(selectedCountry.id, recordId)}
          onUnpin={(recordId) => overseas.unpinRecord(selectedCountry.id, recordId)}
          onReload={overseas.reloadPosts}
          onClose={() => setSelectedCountry(null)}
        />
      )}
    </div>
  );
}
