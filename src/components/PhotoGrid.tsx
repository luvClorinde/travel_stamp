import { useState, useEffect } from 'react';
import type { PhotoDetail } from '../types';
import { PhotoImage } from './PhotoImage';

// CSS の @media (min-width: 1280px) と同じ閾値
const XL_BREAKPOINT = 1280;

function useColumns(): number {
  const [cols, setCols] = useState(() =>
    window.matchMedia(`(min-width: ${XL_BREAKPOINT}px)`).matches ? 3 : 2
  );
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${XL_BREAKPOINT}px)`);
    const handler = (e: MediaQueryListEvent) => setCols(e.matches ? 3 : 2);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return cols;
}

interface GalleryModalProps {
  photos: PhotoDetail[];
  onClose: () => void;
}

function PhotoGalleryModal({ photos, onClose }: GalleryModalProps) {
  return (
    <div className="modal-overlay photo-gallery-overlay" onClick={onClose}>
      <div className="modal-content photo-gallery-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">すべての写真（{photos.length}枚）</h2>
          <button className="close-btn" onClick={onClose} aria-label="閉じる">✕</button>
        </div>
        <div className="photo-gallery-grid">
          {photos.map((ph, i) => (
            <PhotoImage
              key={ph.id}
              storagePath={ph.storagePath}
              alt={`写真${i + 1}`}
              className="record-img"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface Props {
  photos: PhotoDetail[];
  caption?: string;
}

export function PhotoGrid({ photos, caption }: Props) {
  const cols = useColumns();
  const maxVisible = cols * 2; // 2行分
  const [galleryOpen, setGalleryOpen] = useState(false);
  const hasMore = photos.length > maxVisible;
  const visible = hasMore ? photos.slice(0, maxVisible) : photos;

  return (
    <>
      <div className="record-photos">
        {visible.map((ph, i) => (
          <PhotoImage
            key={ph.id}
            storagePath={ph.storagePath}
            alt={`写真${i + 1}`}
            className="record-img"
          />
        ))}
      </div>
      {hasMore && (
        <button className="btn-show-all" onClick={() => setGalleryOpen(true)}>
          すべて見る（{photos.length}枚）
        </button>
      )}
      {caption && <p className="record-caption">{caption}</p>}
      {galleryOpen && (
        <PhotoGalleryModal photos={photos} onClose={() => setGalleryOpen(false)} />
      )}
    </>
  );
}
