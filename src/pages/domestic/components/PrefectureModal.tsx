import { useState, useRef } from 'react';
import type { TravelRecord, RecordType } from '../../../types';

interface Props {
  prefectureName: string;
  records: TravelRecord[];
  onAdd: (type: RecordType, content: string, caption?: string, photos?: string[]) => void;
  onClose: () => void;
}

type Mode = 'list' | 'add-text' | 'add-image';

// 後方互換：古い単一画像データも表示できるよう正規化
function getPhotos(record: TravelRecord): string[] {
  if (record.photos && record.photos.length > 0) return record.photos;
  if (record.type === 'image' && record.content) return [record.content];
  return [];
}

export function PrefectureModal({ prefectureName, records, onAdd, onClose }: Props) {
  const [mode, setMode] = useState<Mode>('list');
  const [text, setText] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const readers = files.map(file => new Promise<string>(resolve => {
      const reader = new FileReader();
      reader.onload = ev => resolve(ev.target?.result as string);
      reader.readAsDataURL(file);
    }));
    Promise.all(readers).then(results => {
      setPhotos(prev => [...prev, ...results]);
    });
    // 同じファイルを再選択できるようリセット
    e.target.value = '';
  }

  function removePhoto(index: number) {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  }

  function handleAddText() {
    if (!text.trim()) return;
    onAdd('text', text.trim());
    setText('');
    setMode('list');
  }

  function handleAddImage() {
    if (photos.length === 0) return;
    onAdd('image', photos[0], caption.trim() || undefined, photos);
    setPhotos([]);
    setCaption('');
    setMode('list');
  }

  function backToList() {
    setMode('list');
    setPhotos([]);
    setCaption('');
    setText('');
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <h2 className="modal-title">{prefectureName}</h2>
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
                    {r.type === 'text' ? (
                      <p className="record-text">{r.content}</p>
                    ) : (
                      <div className="record-photos">
                        {getPhotos(r).map((src, i) => (
                          <img key={i} src={src} alt={r.caption ?? `写真${i + 1}`} className="record-img" />
                        ))}
                        {r.caption && <p className="record-caption">{r.caption}</p>}
                      </div>
                    )}
                    <time className="record-date">
                      {new Date(r.createdAt).toLocaleDateString('ja-JP', {
                        year: 'numeric', month: 'long', day: 'numeric',
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
              <button className="btn btn-ghost" onClick={backToList}>戻る</button>
              <button className="btn btn-primary" onClick={handleAddText} disabled={!text.trim()}>
                保存する
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
            <button className="btn btn-upload" onClick={() => fileInputRef.current?.click()}>
              📁 写真を選択（複数可）
            </button>

            {photos.length > 0 && (
              <div className="preview-grid">
                {photos.map((src, i) => (
                  <div key={i} className="preview-item">
                    <img src={src} alt={`プレビュー${i + 1}`} className="preview-thumb" />
                    <button className="preview-remove" onClick={() => removePhoto(i)} aria-label="削除">✕</button>
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
              <button className="btn btn-ghost" onClick={backToList}>戻る</button>
              <button className="btn btn-primary" onClick={handleAddImage} disabled={photos.length === 0}>
                保存する
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
