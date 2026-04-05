import { useState, useRef } from 'react';
import type { TravelRecord, RecordType } from '../../../types';
import { PhotoImage } from '../../../components/PhotoImage';

interface PhotoEntry {
  file: File;
  preview: string;
}

interface Props {
  countryName: string;
  countryId: string;
  records: TravelRecord[];
  onAdd: (countryId: string, type: RecordType, content: string, caption?: string, files?: File[]) => Promise<void>;
  onDelete: (recordId: string) => void;
  onClose: () => void;
}

type Mode = 'list' | 'add-text' | 'add-image';

/** photos フィールドから storage_path 一覧を取得 */
function getStoragePaths(record: TravelRecord): string[] {
  if (record.photos && record.photos.length > 0) return record.photos;
  return [];
}

export function CountryModal({ countryName, countryId, records, onAdd, onDelete, onClose }: Props) {
  const [mode, setMode] = useState<Mode>('list');
  const [text, setText] = useState('');
  const [photoEntries, setPhotoEntries] = useState<PhotoEntry[]>([]);
  const [caption, setCaption] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const entries = files.map(f => ({ file: f, preview: URL.createObjectURL(f) }));
    setPhotoEntries(prev => [...prev, ...entries]);
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
      await onAdd(countryId, 'text', text.trim());
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
      await onAdd(countryId, 'image', caption.trim(), undefined, photoEntries.map(e => e.file));
      photoEntries.forEach(e => URL.revokeObjectURL(e.preview));
      setPhotoEntries([]);
      setCaption('');
      setMode('list');
    } finally {
      setSaving(false);
    }
  }

  return (
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
                records.map(r => (
                  <div key={r.id} className="record-item">
                    <button
                      className="record-delete"
                      onClick={() => { if (window.confirm('この記録を削除しますか？')) onDelete(r.id); }}
                      aria-label="記録を削除"
                    >✕ 削除</button>
                    {r.type === 'text' ? (
                      <p className="record-text">{r.content}</p>
                    ) : (
                      <div className="record-photos">
                        {getStoragePaths(r).map((path, i) => (
                          <PhotoImage
                            key={i}
                            storagePath={path}
                            alt={r.caption ?? `写真${i + 1}`}
                            className="record-img"
                          />
                        ))}
                        {r.caption && <p className="record-caption">{r.caption}</p>}
                      </div>
                    )}
                    <time className="record-date">
                      {new Date(r.createdAt).toLocaleString('ja-JP', {
                        year: 'numeric', month: 'long', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </time>
                  </div>
                ))
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setMode('add-text')}>
                📝 テキストを追加
              </button>
              <button className="btn btn-primary" onClick={() => setMode('add-image')}>
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
              rows={6}
              autoFocus
            />
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
                    <button className="preview-remove" onClick={() => removePhoto(i)} aria-label="削除" disabled={saving}>✕</button>
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
  );
}
