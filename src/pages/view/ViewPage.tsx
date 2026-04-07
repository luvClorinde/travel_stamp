import { useState, useEffect } from 'react';
import { getPublicView } from '../../lib/viewApi';
import type { ViewData, ViewPost } from '../../lib/viewApi';
import { JapanMap, japaneseNames } from '../domestic/components/JapanMap';
import { WorldMap } from '../overseas/components/WorldMap';
import { ViewRecordModal } from './ViewRecordModal';
import '../domestic/domestic.css';
import '../overseas/overseas.css';

const PREF_IDS = new Set(Object.keys(japaneseNames));

type Tab = 'domestic' | 'international';

interface Props {
  token: string;
}

export function ViewPage({ token }: Props) {
  const [data, setData] = useState<ViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('domestic');
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

  // location_id ごとに投稿をグループ化
  const postsByLocation: Record<string, ViewPost[]> = {};
  for (const post of data.posts) {
    if (!postsByLocation[post.location_id]) postsByLocation[post.location_id] = [];
    postsByLocation[post.location_id].push(post);
  }

  const domesticVisited = Object.keys(postsByLocation).filter(id => PREF_IDS.has(id)).length;
  const overseasVisited = Object.keys(postsByLocation).filter(id => !PREF_IDS.has(id)).length;

  const domesticIsVisited = (id: string) => PREF_IDS.has(id) && (postsByLocation[id]?.length ?? 0) > 0;
  const overseasIsVisited = (id: string) => !PREF_IDS.has(id) && (postsByLocation[id]?.length ?? 0) > 0;

  const selectedPosts = selected ? (postsByLocation[selected.id] ?? []) : [];

  return (
    <div className="app">
      <div className={`page-layout${tab === 'international' ? ' page-layout--overseas' : ''}`} style={{ position: 'relative' }}>

        {/* 閲覧専用バナー */}
        <div className="view-banner">
          👁 閲覧専用モード — <strong>{data.map.name}</strong>
        </div>

        <header className="app-header">
          <h1 className="app-title">{data.map.name}</h1>

          <nav className="app-nav">
            <button
              className={`nav-tab${tab === 'domestic' ? ' active' : ''}`}
              onClick={() => { setTab('domestic'); setSelected(null); }}
            >
              🗾 国内
            </button>
            <button
              className={`nav-tab${tab === 'international' ? ' active' : ''}`}
              onClick={() => { setTab('international'); setSelected(null); }}
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
          {tab === 'domestic' ? (
            <JapanMap
              isVisited={domesticIsVisited}
              onSelect={id => {
                if (!domesticIsVisited(id)) return;
                setSelected({ id, name: japaneseNames[id] ?? id });
              }}
            />
          ) : (
            <WorldMap
              isVisited={overseasIsVisited}
              onCountryClick={(id, name) => {
                if (!overseasIsVisited(id)) return;
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
