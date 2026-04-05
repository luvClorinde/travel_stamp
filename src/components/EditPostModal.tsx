import { useState, useRef } from 'react';
import type { TravelRecord, MapMeta, PhotoDetail } from '../types';
import { PhotoImage } from './PhotoImage';
import {
  updatePostBody,
  deletePhoto,
  addPhotosToPost,
  updatePostMaps,
} from '../lib/postApi';

interface NewPhotoEntry {
  file: File;
  preview: string;
}

interface Props {
  record: TravelRecord;
  availableMaps: MapMeta[];
  currentMapId: string;
  onSave: () => Promise<void>;
  onClose: () => void;
}

export function EditPostModal({ record, availableMaps, currentMapId, onSave, onClose }: Props) {
  const isImage = record.type === 'image';

  const [body, setBody] = useState(isImage ? (record.caption ?? '') : record.content);
  const [photos, setPhotos] = useState<PhotoDetail[]>(record.photoDetails ?? []);
  const [newPhotos, setNewPhotos] = useState<NewPhotoEntry[]>([]);
  const [selectedMapIds, setSelectedMapIds] = useState<string[]>(record.mapIds);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleDeletePhoto(photoId: string) {
    if (!window.confirm('この写真を削除しますか？')) return;
    try {
      await deletePhoto(photoId);
      setPhotos(prev => prev.filter(p => p.id !== photoId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setNewPhotos(prev => [...prev, ...files.map(f => ({ file: f, preview: URL.createObjectURL(f) }))]);
    e.target.value = '';
  }

  function removeNewPhoto(i: number) {
    setNewPhotos(prev => {
      URL.revokeObjectURL(prev[i].preview);
      return prev.filter((_, idx) => idx !== i);
    });
  }

  function toggleMap(mapId: string) {
    setSelectedMapIds(prev =>
      prev.includes(mapId) ? prev.filter(id => id !== mapId) : [...prev, mapId],
    );
  }

  async function handleSave() {
    if (selectedMapIds.length === 0) {
      setError('最低1つのマップを選択してください');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updatePostBody(record.id, body.trim());

      if (newPhotos.length > 0) {
        await addPhotosToPost(record.id, newPhotos.map(p => p.file));
        newPhotos.forEach(p => URL.revokeObjectURL(p.preview));
      }

      const sortedOld = [...record.mapIds].sort().join(',');
      const sortedNew = [...selectedMapIds].sort().join(',');
      if (sortedOld !== sortedNew) {
        await updatePostMaps(record.id, selectedMapIds);
      }

      await onSave();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay edit-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <h2 className="modal-title">投稿を編集</h2>
          <button className="close-btn" onClick={onClose} aria-label="閉じる">✕</button>
        </div>

        <div className="edit-scroll">

          {/* 本文（テキスト投稿・画像投稿 共通） */}
          <div className="edit-section">
            <label className="form-label">本文{isImage ? '（任意）' : ''}</label>
            <textarea
              className="form-textarea"
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder={isImage ? '写真に添える文章を書こう…' : '旅の思い出、食べたもの、感想など…'}
              rows={isImage ? 4 : 6}
            />
          </div>

          {/* 写真（画像投稿のみ） */}
          {isImage && (
            <div className="edit-section">
              <label className="form-label">写真</label>

              {photos.length > 0 ? (
                <div className="edit-photo-list">
                  {photos.map(ph => (
                    <div key={ph.id} className="edit-photo-row">
                      <PhotoImage storagePath={ph.storagePath} alt="写真" className="edit-photo-thumb" />
                      <button
                        className="btn-text-danger"
                        onClick={() => handleDeletePhoto(ph.id)}
                        disabled={saving}
                      >
                        削除
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-msg" style={{ padding: '12px 0' }}>写真がありません</p>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <button
                className="btn btn-upload"
                onClick={() => fileInputRef.current?.click()}
                disabled={saving}
              >
                📁 写真を追加
              </button>

              {newPhotos.length > 0 && (
                <div className="preview-grid" style={{ marginTop: 8 }}>
                  {newPhotos.map((entry, i) => (
                    <div key={i} className="preview-item">
                      <img src={entry.preview} alt={`追加${i + 1}`} className="preview-thumb" />
                      <button className="preview-remove" onClick={() => removeNewPhoto(i)} disabled={saving}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 共有マップ */}
          <div className="edit-section">
            <label className="form-label">共有マップ</label>
            <div className="map-checkbox-list">
              {availableMaps.map(m => {
                const isOnly = selectedMapIds.length === 1 && selectedMapIds[0] === m.id;
                return (
                  <label
                    key={m.id}
                    className={`map-checkbox-item${m.id === currentMapId ? ' map-checkbox-item--current' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedMapIds.includes(m.id)}
                      onChange={() => toggleMap(m.id)}
                      disabled={isOnly}
                    />
                    <span>{m.name}</span>
                    {m.id === currentMapId && <span className="map-checkbox-badge">現在</span>}
                  </label>
                );
              })}
            </div>
            {selectedMapIds.length === 0 && (
              <p style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>最低1つ選択してください</p>
            )}
          </div>

        </div>

        {error && (
          <p style={{ color: '#EF4444', fontSize: 13, padding: '0 24px 8px', flexShrink: 0 }}>{error}</p>
        )}

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose} disabled={saving}>キャンセル</button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || selectedMapIds.length === 0}
          >
            {saving ? '保存中...' : '保存する'}
          </button>
        </div>

      </div>
    </div>
  );
}
