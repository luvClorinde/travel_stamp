import { useState } from 'react';
import { WorldMap } from './components/WorldMap';
import { CountryModal } from './components/CountryModal';
import { useWorldTravel } from './hooks/useWorldTravel';
import '../domestic/domestic.css';
import './overseas.css';

interface Props {
  mapId: string;
  mapName: string;
  onBack: () => void;
}

export default function OverseasPage({ mapId, mapName, onBack }: Props) {
  const { addRecord, deleteRecord, getRecords, isVisited, visitedCount, loading } = useWorldTravel(mapId);
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);

  return (
    <div className="page-layout page-layout--overseas">
      <header className="app-header">
        <button className="back-btn" onClick={onBack}>← 地図一覧</button>
        <h1 className="app-title">{mapName}</h1>
        <p className="app-subtitle">国をクリックして旅の記録を残そう</p>
        <div className="visited-counter">
          <span className="counter-num">{visitedCount}</span>
          <span className="counter-label"> カ国 訪問済み</span>
        </div>
      </header>

      <main className="app-main">
        {loading ? (
          <div style={{ color: '#94A3B8', fontSize: 14, margin: 'auto' }}>読み込み中...</div>
        ) : (
          <WorldMap isVisited={isVisited} onCountryClick={(id, name) => setSelected({ id, name })} />
        )}
      </main>

      {selected && (
        <CountryModal
          countryId={selected.id}
          countryName={selected.name}
          records={getRecords(selected.id)}
          onAdd={addRecord}
          onDelete={(recordId) => deleteRecord(selected.id, recordId)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
