import { useState } from 'react';
import type { MapMeta } from '../types';

interface Props {
  maps: MapMeta[];
  userEmail: string;
  onCreate: (name: string, type: 'domestic' | 'international') => Promise<void>;
  onJoin: (shareId: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSelect: (map: MapMeta) => void;
  onLogout: () => Promise<void>;
  onDeleteAccount: () => Promise<void>;
}

type FormMode = 'none' | 'create' | 'join';

export function MapList({ maps, userEmail, onCreate, onJoin, onDelete, onSelect, onLogout, onDeleteAccount }: Props) {
  const [formMode, setFormMode] = useState<FormMode>('none');
  const [formLoading, setFormLoading] = useState(false);

  // 新規作成フォーム
  const [createName, setCreateName] = useState('');
  const [createType, setCreateType] = useState<'domestic' | 'international'>('domestic');
  const [createError, setCreateError] = useState('');

  // 参加フォーム（share_id のみ）
  const [joinShareId, setJoinShareId] = useState('');
  const [joinError, setJoinError] = useState('');

  async function handleCreate() {
    if (!createName.trim()) return;
    setFormLoading(true);
    try {
      await onCreate(createName.trim(), createType);
      setCreateName('');
      setCreateType('domestic');
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

  function copyShareId(shareId: string) {
    navigator.clipboard.writeText(shareId).catch(() => {});
  }

  async function handleDeleteAccount() {
    const step1 = window.confirm(
      'アカウントを削除しますか？\nすべての地図・記録データが失われます。この操作は取り消せません。'
    );
    if (!step1) return;

    const step2 = window.confirm(
      '最終確認です。本当にアカウントを削除してよいですか？'
    );
    if (!step2) return;

    try {
      await onDeleteAccount();
    } catch {
      alert('アカウントの削除に失敗しました。しばらく経ってから再度お試しください。');
    }
  }

  return (
    <div className="map-list-page">
      <header className="map-list-header">
        <h1 className="app-title">旅行スタンプ帳</h1>
        <p className="app-subtitle">地図を選んで旅の記録を残そう</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <span style={{ fontSize: 13, color: '#64748B' }}>{userEmail}</span>
          <button className="logout-btn" onClick={onLogout}>ログアウト</button>
          <button className="logout-btn" style={{ color: '#ef4444' }} onClick={handleDeleteAccount}>
            アカウント削除
          </button>
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
                <span className="map-list-icon">{m.type === 'domestic' ? '🗾' : '🌍'}</span>
                <div className="map-list-info">
                  <span className="map-list-name">{m.name}</span>
                  <span className="map-list-shareid">
                    ID: {m.shareId}
                    <button
                      className="copy-btn"
                      onClick={e => { e.stopPropagation(); copyShareId(m.shareId); }}
                      title="コピー"
                    >📋</button>
                  </span>
                </div>
                <span className="map-list-type">{m.type === 'domestic' ? '国内' : '海外'}</span>
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
            {createError && (
              <p style={{ fontSize: 12, color: '#ef4444', margin: 0 }}>{createError}</p>
            )}
            <div className="map-type-select">
              <label className="map-type-option">
                <input
                  type="radio"
                  value="domestic"
                  checked={createType === 'domestic'}
                  onChange={() => setCreateType('domestic')}
                />
                🗾 国内
              </label>
              <label className="map-type-option">
                <input
                  type="radio"
                  value="international"
                  checked={createType === 'international'}
                  onChange={() => setCreateType('international')}
                />
                🌍 海外
              </label>
            </div>
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
