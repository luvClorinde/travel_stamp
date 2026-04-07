import { useState } from 'react';
import type { MapMeta } from '../types';
import { CopyButton } from '../components/CopyButton';

interface Props {
  maps: MapMeta[];
  displayName: string;
  onCreate: (name: string) => Promise<void>;
  onJoin: (shareId: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSelect: (map: MapMeta) => void;
  onLogout: () => Promise<void>;
  onOpenSettings: () => void;
  onOpenViewSettings: (map: MapMeta) => void;
}

type FormMode = 'none' | 'create' | 'join';

export function MapList({ maps, displayName, onCreate, onJoin, onDelete, onSelect, onLogout, onOpenSettings, onOpenViewSettings }: Props) {
  const [formMode, setFormMode] = useState<FormMode>('none');
  const [formLoading, setFormLoading] = useState(false);

  // 新規作成フォーム
  const [createName, setCreateName] = useState('');
  const [createError, setCreateError] = useState('');

  // 参加フォーム（share_id のみ）
  const [joinShareId, setJoinShareId] = useState('');
  const [joinError, setJoinError] = useState('');

  async function handleCreate() {
    if (!createName.trim()) return;
    if (createName.trim().length > 15) {
      setCreateError('地図の名前は15文字以内で入力してください。');
      return;
    }
    setFormLoading(true);
    try {
      await onCreate(createName.trim());
      setCreateName('');
      setFormMode('none');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '不明なエラーが発生しました';
      setCreateError(msg);
    } finally {
      setFormLoading(false);
    }
  }

  async function handleJoin() {
    const trimmedId = joinShareId.trim().toUpperCase();
    if (!trimmedId) return;

    const alreadyJoined = maps.some(m => m.shareId === trimmedId);
    if (alreadyJoined) {
      setJoinError('この共有IDの地図はすでに追加されています。');
      return;
    }

    setFormLoading(true);
    setJoinError('');
    try {
      await onJoin(trimmedId);
      setJoinShareId('');
      setFormMode('none');
    } catch (e: unknown) {
      setJoinError(e instanceof Error ? e.message : '参加に失敗しました。共有IDを確認してください。');
    } finally {
      setFormLoading(false);
    }
  }

  function closeForm() {
    setFormMode('none');
    setCreateName('');
    setCreateError('');
    setJoinShareId('');
    setJoinError('');
  }

return (
    <div className="map-list-page">
      <header className="map-list-header">
        <h1 className="app-title">旅行スタンプ帳</h1>
        <p className="app-subtitle">地図を選んで旅の記録を残そう</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
          <span style={{ fontSize: 13, color: '#64748B' }}>{displayName}</span>
          <button className="logout-btn" onClick={onOpenSettings} title="アカウント設定">⚙️</button>
          <button className="logout-btn" onClick={() => { if (window.confirm('ログアウトしますか？')) onLogout(); }}>ログアウト</button>
        </div>
      </header>

      <div className="map-list-body">
        {maps.length === 0 && formMode === 'none' && (
          <p className="map-list-empty">地図がまだありません。<br />新しく作成するか、共有IDで参加しましょう！</p>
        )}

        <ul className="map-list">
          {maps.map(m => (
            <li key={m.id} className="map-list-item">
              <button className="map-list-select" onClick={() => onSelect(m)}>
                <div className="map-list-info">
                  <span className="map-list-name">{m.name}</span>
                  <div className="map-list-share-group">
                    <span className="map-list-shareid">
                      共有ID:&nbsp;{m.shareId}
                    </span>
                    <span onClick={e => e.stopPropagation()}>
                      <CopyButton text={m.shareId} title="共有IDをコピー" />
                    </span>
                  </div>
                  <div className="map-list-badge-group">
                    <span onClick={e => e.stopPropagation()}>
                      <button
                        className={`map-view-btn${m.viewEnabled ? ' map-view-btn--on' : ''}`}
                        onClick={() => onOpenViewSettings(m)}
                        title={m.viewEnabled ? '閲覧共有 ON' : '閲覧共有 OFF'}
                        aria-label="閲覧専用共有"
                      >
                        {m.viewEnabled ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                          </svg>
                        )}
                      </button>
                    </span>
                  </div>
                </div>
              </button>
              <button
                className="map-list-delete"
                onClick={() => {
                  if (window.confirm(`「${m.name}」を一覧から削除しますか？`)) onDelete(m.id);
                }}
                aria-label="削除"
              >✕</button>
            </li>
          ))}
        </ul>

        {formMode === 'create' && (
          <div className="map-create-form">
            <input
              className="form-input"
              type="text"
              placeholder="地図の名前（例：2024年欧州旅行）"
              value={createName}
              onChange={e => { setCreateName(e.target.value); setCreateError(''); }}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
            <p style={{ fontSize: 11, color: createName.length > 15 ? '#ef4444' : '#94A3B8', margin: 0, textAlign: 'right' }}>
              {createName.length}/15文字
            </p>
            {createError && (
              <p style={{ fontSize: 12, color: '#ef4444', margin: 0 }}>{createError}</p>
            )}
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={closeForm} disabled={formLoading}>キャンセル</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={!createName.trim() || formLoading}>
                {formLoading ? '作成中...' : '作成'}
              </button>
            </div>
          </div>
        )}

        {formMode === 'join' && (
          <div className="map-create-form">
            <label className="form-label">共有ID</label>
            <input
              className="form-input"
              type="text"
              placeholder="例：AB12CD34"
              value={joinShareId}
              onChange={e => { setJoinShareId(e.target.value); setJoinError(''); }}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
            />
            {joinError && <p style={{ fontSize: 12, color: '#ef4444', margin: 0 }}>{joinError}</p>}
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={closeForm} disabled={formLoading}>キャンセル</button>
              <button className="btn btn-primary" onClick={handleJoin} disabled={!joinShareId.trim() || formLoading}>
                {formLoading ? '参加中...' : '参加'}
              </button>
            </div>
          </div>
        )}

        {formMode === 'none' && (
          <div className="map-action-btns">
            <button className="btn btn-primary map-create-btn" onClick={() => setFormMode('create')}>
              ＋ 新しい地図を作成
            </button>
            <button className="btn btn-secondary map-create-btn" onClick={() => setFormMode('join')}>
              🔗 共有IDで参加
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
