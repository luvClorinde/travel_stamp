import { useState, useRef } from 'react';
import type { TravelRecord, RecordType, MapMeta } from '../../../types';
import { PhotoGrid } from '../../../components/PhotoGrid';
import { EditPostModal } from '../../../components/EditPostModal';

interface PhotoEntry {
  file: File;
  preview: string;
}

interface Props {
  countryName: string;
  countryId: string;
  records: TravelRecord[];
  currentMapId: string;
  currentUserId: string;
  availableMaps: MapMeta[];
  onAdd: (countryId: string, type: RecordType, content: string, caption?: string, files?: File[], extraMapIds?: string[]) => Promise<void>;
  onDelete: (recordId: string) => void;
  onPin: (recordId: string) => Promise<void>;
  onUnpin: (recordId: string) => Promise<void>;
  onReload: () => Promise<void>;
  onClose: () => void;
}

type Mode = 'list' | 'add-text' | 'add-image';

export function CountryModal({
  countryName, countryId, records, currentMapId, currentUserId, availableMaps,
  onAdd, onDelete, onPin, onUnpin, onReload, onClose,
}: Props) {
  const [mode, setMode] = useState<Mode>('list');
  const [text, setText] = useState('');
  const [photoEntries, setPhotoEntries] = useState<PhotoEntry[]>([]);
  const [caption, setCaption] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedMapIds, setSelectedMapIds] = useState<string[]>([currentMapId]);
  const [editingRecord, setEditingRecord] = useState<TravelRecord | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function openAddForm(m: Mode) {
    setSelectedMapIds([currentMapId]);
    setMode(m);
  }

  function toggleMap(id: string) {
    if (id === currentMapId) return;
    setSelectedMapIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setPhotoEntries(prev => [...prev, ...files.map(f => ({ file: f, preview: URL.createObjectURL(f) }))]);
    e.target.value = '';
  }

  function removePhoto(index: number) {
    setPhotoEntries(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  function backToList() {
    photoEntries.forEach(e => URL.revokeObjectURL(e.preview));
    setPhotoEntries([]);
    setCaption('');
    setText('');
    setMode('list');
  }

  async function handleAddText() {
    if (!text.trim()) return;
    setSaving(true);
    try {
      const extra = selectedMapIds.filter(id => id !== currentMapId);
      await onAdd(countryId, 'text', text.trim(), undefined, undefined, extra);
      setText('');
      setMode('list');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddImage() {
    if (photoEntries.length === 0) return;
    setSaving(true);
    try {
      const extra = selectedMapIds.filter(id => id !== currentMapId);
      await onAdd(countryId, 'image', caption.trim(), undefined, photoEntries.map(e => e.file), extra);
      photoEntries.forEach(e => URL.revokeObjectURL(e.preview));
      setPhotoEntries([]);
      setCaption('');
      setMode('list');
    } finally {
      setSaving(false);
    }
  }

  function linkedMapNames(record: TravelRecord): string[] {
    return record.mapIds
      .filter(id => id !== currentMapId)
      .map(id => availableMaps.find(m => m.id === id)?.name ?? id);
  }

  const extraMaps = availableMaps.filter(m => m.id !== currentMapId);

  const MapSelector = () => extraMaps.length > 0 ? (
    <div className="map-multi-select">
      <label className="form-label">追加する地図</label>
      <div className="map-checkbox-list">
        <label className="map-checkbox-item map-checkbox-item--current">
          <input type="checkbox" checked disabled />
          <span>{availableMaps.find(m => m.id === currentMapId)?.name ?? '現在の地図'}</span>
          <span className="map-checkbox-badge">現在</span>
        </label>
        {extraMaps.map(m => (
          <label key={m.id} className="map-checkbox-item">
            <input
              type="checkbox"
              checked={selectedMapIds.includes(m.id)}
              onChange={() => toggleMap(m.id)}
            />
            <span>{m.name}</span>
          </label>
        ))}
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>

          <div className="modal-header">
            <h2 className="modal-title">{countryName}</h2>
            <button className="close-btn" onClick={onClose} aria-label="閉じる">✕</button>
          </div>

          {mode === 'list' && (
            <>
              <div className="records-list">
                {records.length === 0 ? (
                  <p className="empty-msg">まだ記録がありません。<br />思い出を追加してみましょう！</p>
                ) : (
                  records.map(r => {
                    const linked = linkedMapNames(r);
                    const isOwner = r.authorId === currentUserId;
                    return (
                      <div key={r.id} className={`record-item${r.pinnedAt ? ' record-item--pinned' : ''}`}>
                        <div className="record-actions">
                          <button
                            className={`btn-pin${r.pinnedAt ? ' btn-pin--on' : ''}`}
                            onClick={() => r.pinnedAt ? onUnpin(r.id) : onPin(r.id)}
                            title={r.pinnedAt ? 'ピン留めを解除' : 'ピン留め'}
                            aria-label={r.pinnedAt ? 'ピン留めを解除' : 'ピン留め'}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill={r.pinnedAt ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <line x1="12" y1="17" x2="12" y2="22"/>
                              <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/>
                            </svg>
                          </button>
                          {isOwner && (
                            <button
                              className="btn-text-edit"
                              onClick={() => setEditingRecord(r)}
                            >
                              編集
                            </button>
                          )}
                          <button
                            className="record-delete"
                            onClick={() => {
                              const msg = linked.length > 0
                                ? `この記録を「${availableMaps.find(m => m.id === currentMapId)?.name ?? '現在の地図'}」から外しますか？\n（他の地図「${linked.join('、')}」には残ります）`
                                : 'この記録を削除しますか？';
                              if (window.confirm(msg)) onDelete(r.id);
                            }}
                            aria-label="記録を削除"
                          >
                            ✕ {linked.length > 0 ? 'この地図から外す' : '削除'}
                          </button>
                        </div>

                        {r.type === 'text' ? (
                          <p className="record-text">{r.content}</p>
                        ) : (
                          <PhotoGrid photos={r.photoDetails ?? []} caption={r.caption} />
                        )}

                        {linked.length > 0 && (
                          <p className="record-linked-maps">他にも紐づく地図: {linked.join('、')}</p>
                        )}

                        <time className="record-date">
                          {new Date(r.createdAt).toLocaleString('ja-JP', {
                            year: 'numeric', month: 'long', day: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </time>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => openAddForm('add-text')}>
                  📝 テキストを追加
                </button>
                <button className="btn btn-primary" onClick={() => openAddForm('add-image')}>
                  📷 写真を追加
                </button>
              </div>
            </>
          )}

          {mode === 'add-text' && (
            <div className="add-form">
              <label className="form-label">思い出を書こう</label>
              <textarea
                className="form-textarea"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="旅の思い出、食べたもの、感想など…"
                rows={5}
                autoFocus
              />
              <MapSelector />
              <div className="form-actions">
                <button className="btn btn-ghost" onClick={backToList} disabled={saving}>戻る</button>
                <button className="btn btn-primary" onClick={handleAddText} disabled={!text.trim() || saving}>
                  {saving ? '保存中...' : '保存する'}
                </button>
              </div>
            </div>
          )}

          {mode === 'add-image' && (
            <div className="add-form">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <button className="btn btn-upload" onClick={() => fileInputRef.current?.click()} disabled={saving}>
                📁 写真を選択（複数可）
              </button>
              {photoEntries.length > 0 && (
                <div className="preview-grid">
                  {photoEntries.map((entry, i) => (
                    <div key={i} className="preview-item">
                      <img src={entry.preview} alt={`プレビュー${i + 1}`} className="preview-thumb" />
                      <button className="preview-remove" onClick={() => removePhoto(i)} disabled={saving}>✕</button>
                    </div>
                  ))}
                </div>
              )}
              <label className="form-label">キャプション（任意）</label>
              <input
                className="form-input"
                type="text"
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="写真の説明を入力…"
              />
              <MapSelector />
              <div className="form-actions">
                <button className="btn btn-ghost" onClick={backToList} disabled={saving}>戻る</button>
                <button className="btn btn-primary" onClick={handleAddImage} disabled={photoEntries.length === 0 || saving}>
                  {saving ? 'アップロード中...' : '保存する'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {editingRecord && (
        <EditPostModal
          record={editingRecord}
          availableMaps={availableMaps}
          currentMapId={currentMapId}
          onSave={onReload}
          onClose={() => setEditingRecord(null)}
        />
      )}
    </>
  );
}
