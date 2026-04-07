import type { ViewPost } from '../../lib/viewApi';
import { PhotoGrid } from '../../components/PhotoGrid';

interface Props {
  locationName: string;
  posts: ViewPost[];
  onClose: () => void;
}

export function ViewRecordModal({ locationName, posts, onClose }: Props) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <h2 className="modal-title">{locationName}</h2>
          <button className="close-btn" onClick={onClose} aria-label="閉じる">✕</button>
        </div>

        <div className="records-list">
          {posts.length === 0 ? (
            <p className="empty-msg">記録がありません</p>
          ) : (
            posts.map(post => {
              const hasPhotos = post.photos.length > 0;
              return (
                <div key={post.id} className={`record-item${post.pinned_at ? ' record-item--pinned' : ''}`}>
                  {post.pinned_at && (
                    <div style={{ marginBottom: 6 }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#D97706' }} aria-hidden="true">
                        <line x1="12" y1="17" x2="12" y2="22"/>
                        <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/>
                      </svg>
                    </div>
                  )}
                  {hasPhotos ? (
                    <PhotoGrid
                      photos={post.photos.map(ph => ({ id: ph.id, storagePath: ph.storage_path }))}
                      caption={post.body || undefined}
                    />
                  ) : (
                    <p className="record-text">{post.body}</p>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <span style={{ fontSize: 12, color: '#64748B' }}>
                      {post.username ?? '匿名'}
                    </span>
                    <time className="record-date" style={{ marginTop: 0 }}>
                      {new Date(post.created_at).toLocaleString('ja-JP', {
                        year: 'numeric', month: 'long', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </time>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
