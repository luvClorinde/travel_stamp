import { useState } from 'react';
import { JapanMap, japaneseNames } from './components/JapanMap';
import { PrefectureModal } from './components/PrefectureModal';
import { useTravel } from './hooks/useTravel';
import './domestic.css';

export default function DomesticPage() {
  const { addRecord, getRecords, isVisited, visitedCount } = useTravel();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedName = selectedId ? (japaneseNames[selectedId] ?? selectedId) : null;

  return (
    <div className="page-layout">
      <header className="app-header">
        <h1 className="app-title">旅行スタンプ帳</h1>
        <p className="app-subtitle">都道府県をクリックして旅の記録を残そう</p>
        <div className="visited-counter">
          <span className="counter-num">{visitedCount}</span>
          <span className="counter-sep"> / </span>
          <span className="counter-total">47</span>
          <span className="counter-label"> 都道府県 訪問済み</span>
        </div>
      </header>

      <main className="app-main">
        <JapanMap isVisited={isVisited} onSelect={setSelectedId} />
      </main>

      {selectedId && selectedName && (
        <PrefectureModal
          prefectureName={selectedName}
          records={getRecords(selectedId)}
          onAdd={(type, content, caption, photos) =>
            addRecord(selectedId, type, content, caption, photos)
          }
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
