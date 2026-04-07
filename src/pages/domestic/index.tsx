import { useState } from 'react';
import { JapanMap, japaneseNames } from './components/JapanMap';
import { PrefectureModal } from './components/PrefectureModal';
import { useTravel } from './hooks/useTravel';
import type { MapMeta } from '../../types';
import './domestic.css';

interface Props {
  mapId: string;
  mapName: string;
  currentUserId: string;
  availableMaps: MapMeta[];
  onBack: () => void;
}

export default function DomesticPage({ mapId, mapName, currentUserId, availableMaps, onBack }: Props) {
  const { addRecord, deleteRecord, pinRecord, unpinRecord, getRecords, isVisited, visitedCount, loading, loadError, reloadPosts } = useTravel(mapId);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedName = selectedId ? (japaneseNames[selectedId] ?? selectedId) : null;

  return (
    <div className="page-layout">
      <header className="app-header">
        <button className="back-btn" onClick={onBack}>← 地図一覧</button>
        <h1 className="app-title">{mapName}</h1>
        <p className="app-subtitle">都道府県をクリックして旅の記録を残そう</p>
        <div className="visited-counter">
          <span className="counter-num">{visitedCount}</span>
          <span className="counter-sep"> / </span>
          <span className="counter-total">47</span>
          <span className="counter-label"> 都道府県 訪問済み</span>
        </div>
      </header>

      <main className="app-main">
        {loading ? (
          <div style={{ color: '#94A3B8', fontSize: 14, margin: 'auto' }}>読み込み中...</div>
        ) : loadError ? (
          <div style={{ color: '#EF4444', fontSize: 13, margin: 'auto', padding: 16, textAlign: 'center' }}>
            データの読み込みに失敗しました<br />
            <code style={{ fontSize: 11, color: '#94A3B8' }}>{loadError}</code>
          </div>
        ) : (
          <JapanMap isVisited={isVisited} onSelect={setSelectedId} />
        )}
      </main>

      {selectedId && selectedName && (
        <PrefectureModal
          prefectureName={selectedName}
          records={getRecords(selectedId)}
          currentMapId={mapId}
          currentUserId={currentUserId}
          availableMaps={availableMaps}
          onAdd={(type, content, caption, files, extraMapIds) =>
            addRecord(selectedId, type, content, caption, files, extraMapIds)
          }
          onDelete={(recordId) => deleteRecord(selectedId, recordId)}
          onPin={(recordId) => pinRecord(selectedId, recordId)}
          onUnpin={(recordId) => unpinRecord(selectedId, recordId)}
          onReload={reloadPosts}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
