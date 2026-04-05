import { useState } from 'react';
import { JapanMap, japaneseNames } from './components/JapanMap';
import { PrefectureModal } from './components/PrefectureModal';
import { useTravel } from './hooks/useTravel';
import './domestic.css';

interface Props {
  mapId: string;
  mapName: string;
  onBack: () => void;
}

export default function DomesticPage({ mapId, mapName, onBack }: Props) {
  const { addRecord, deleteRecord, getRecords, isVisited, visitedCount, loading } = useTravel(mapId);
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
        ) : (
          <JapanMap isVisited={isVisited} onSelect={setSelectedId} />
        )}
      </main>

      {selectedId && selectedName && (
        <PrefectureModal
          prefectureName={selectedName}
          records={getRecords(selectedId)}
          onAdd={(type, content, caption, files) =>
            addRecord(selectedId, type, content, caption, files)
          }
          onDelete={(recordId) => deleteRecord(selectedId, recordId)}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
