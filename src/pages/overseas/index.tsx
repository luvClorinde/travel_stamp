import { useState } from 'react';
import { WorldMap } from './components/WorldMap';
import { CountryModal } from './components/CountryModal';
import { useWorldTravel } from './hooks/useWorldTravel';
import '../domestic/domestic.css';
import './overseas.css';

export default function OverseasPage() {
  const { addRecord, getRecords, isVisited, visitedCount } = useWorldTravel();
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);

  return (
    <div className="page-layout page-layout--overseas">
      <header className="app-header">
        <h1 className="app-title">海外旅行スタンプ帳</h1>
        <p className="app-subtitle">国をクリックして旅の記録を残そう</p>
        <div className="visited-counter">
          <span className="counter-num">{visitedCount}</span>
          <span className="counter-label"> カ国 訪問済み</span>
        </div>
      </header>

      <main className="app-main">
        <WorldMap isVisited={isVisited} onCountryClick={(id, name) => setSelected({ id, name })} />
      </main>

      {selected && (
        <CountryModal
          countryId={selected.id}
          countryName={selected.name}
          records={getRecords(selected.id)}
          onAdd={addRecord}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
