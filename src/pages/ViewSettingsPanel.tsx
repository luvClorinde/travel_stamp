import { useState } from 'react';
import type { MapMeta } from '../types';

interface Props {
  map: MapMeta;
  onEnable: () => Promise<void>;
  onDisable: () => Promise<void>;
  onRegenerate: () => Promise<void>;
  onClose: () => void;
}

function buildViewUrl(token: string): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}#/view/${token}`;
}

export function ViewSettingsPanel({ map, onEnable, onDisable, onRegenerate, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function run(fn: () => Promise<void>) {
    setLoading(true);
    setError(null);
    try { await fn(); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : '操作に失敗しました'); }
    finally { setLoading(false); }
  }

  function copyUrl() {
    if (!map.viewToken) return;
    navigator.clipboard.writeText(buildViewUrl(map.viewToken)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <h2 className="modal-title">閲覧専用共有</h2>
          <button className="close-btn" onClick={onClose} aria-label="閉じる">✕</button>
        </div>

        <div className="settings-scroll">
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
              閲覧専用URLを発行すると、ログインなしで地図の記録を閲覧できます。
              投稿・編集・削除などの操作はできません。
            </p>

            {/* ON/OFF トグル */}
            <div className="view-toggle-row">
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', margin: 0 }}>閲覧専用モード</p>
                <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0' }}>
                  {map.viewEnabled ? 'ONです。URLを共有することで誰でも閲覧できます。' : 'OFFです。閲覧URLは無効です。'}
                </p>
              </div>
              <button
                className={`view-toggle-btn${map.viewEnabled ? ' view-toggle-btn--on' : ''}`}
                onClick={() => run(map.viewEnabled ? onDisable : onEnable)}
                disabled={loading}
              >
                {map.viewEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* URL表示（ON時のみ） */}
            {map.viewEnabled && map.viewToken && (
              <div className="view-url-box">
                <p style={{ fontSize: 11, fontWeight: 600, color: '#64748B', margin: '0 0 6px' }}>閲覧URL</p>
                <div className="view-url-row">
                  <span className="view-url-text">{buildViewUrl(map.viewToken)}</span>
                  <button
                    className={`copy-btn${copied ? ' copy-btn--copied' : ''}`}
                    onClick={copyUrl}
                  >
                    {copied ? 'コピーしました' : 'コピー'}
                  </button>
                </div>
                <button
                  className="btn-text-danger"
                  style={{ marginTop: 10, fontSize: 12 }}
                  onClick={() => {
                    if (window.confirm('URLを再発行しますか？\n現在のURLは無効になります。')) {
                      run(onRegenerate);
                    }
                  }}
                  disabled={loading}
                >
                  URLを再発行する
                </button>
              </div>
            )}

            {error && <p style={{ fontSize: 12, color: '#EF4444', margin: 0 }}>{error}</p>}

          </div>
        </div>

      </div>
    </div>
  );
}
