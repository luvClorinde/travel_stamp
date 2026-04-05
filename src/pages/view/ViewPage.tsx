import { useState, useEffect } from 'react';
import { getPublicView } from '../../lib/viewApi';
import type { ViewData, ViewPost } from '../../lib/viewApi';
import { JapanMap } from '../domestic/components/JapanMap';
import { WorldMap } from '../overseas/components/WorldMap';
import { ViewRecordModal } from './ViewRecordModal';
import '../domestic/domestic.css';
import '../overseas/overseas.css';

interface Props {
  token: string;
}

export function ViewPage({ token }: Props) {
  const [data, setData] = useState<ViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    getPublicView(token)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError('この閲覧URLは無効または期限切れです。'); setLoading(false); });
  }, [token]);

  if (loading) {
    return (
      <div className="view-page-center">
        <p style={{ color: '#94A3B8', fontSize: 14 }}>読み込み中...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="view-page-center">
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 32 }}>🔒</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>ページが見つかりません</p>
          <p style={{ fontSize: 13, color: '#64748B' }}>{error}</p>
        </div>
      </div>
    );
  }

  const isDomestic = data.map.type === 'domestic';

  // location_id ごとに投稿をグループ化
  const postsByLocation: Record<string, ViewPost[]> = {};
  for (const post of data.posts) {
    if (!postsByLocation[post.location_id]) postsByLocation[post.location_id] = [];
    postsByLocation[post.location_id].push(post);
  }

  const isVisited = (id: string) => (postsByLocation[id]?.length ?? 0) > 0;

  const selectedPosts = selected ? (postsByLocation[selected.id] ?? []) : [];

  return (
    <div className="app">
      <div className="page-layout" style={{ position: 'relative' }}>

        {/* 閲覧専用バナー */}
        <div className="view-banner">
          👁 閲覧専用モード — <strong>{data.map.name}</strong>
        </div>

        <header className="app-header">
          <h1 className="app-title">{data.map.name}</h1>
          <p className="app-subtitle">
            {isDomestic ? '都道府県をクリックして記録を見る' : '国をクリックして記録を見る'}
          </p>
          <div className="visited-counter">
            <span className="counter-num">{Object.keys(postsByLocation).length}</span>
            {isDomestic ? (
              <>
                <span className="counter-sep"> / </span>
                <span className="counter-total">47</span>
                <span className="counter-label"> 都道府県 訪問済み</span>
              </>
            ) : (
              <span className="counter-label"> カ国 訪問済み</span>
            )}
          </div>
        </header>

        <main className={`app-main${!isDomestic ? ' page-layout--overseas' : ''}`}>
          {isDomestic ? (
            <JapanMap
              isVisited={isVisited}
              onSelect={id => {
                if (!isVisited(id)) return;
                setSelected({ id, name: id });
              }}
            />
          ) : (
            <WorldMap
              isVisited={isVisited}
              onCountryClick={(id, name) => {
                if (!isVisited(id)) return;
                setSelected({ id, name });
              }}
            />
          )}
        </main>

        {selected && (
          <ViewRecordModal
            locationName={selected.name}
            posts={selectedPosts}
            onClose={() => setSelected(null)}
          />
        )}
      </div>
    </div>
  );
}
