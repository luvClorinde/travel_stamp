import { useState, useEffect } from 'react';
import { getSignedUrl } from '../lib/postApi';

interface Props {
  storagePath: string;
  alt: string;
  className?: string;
}

/**
 * private bucket の画像を表示するコンポーネント。
 * マウント時に storage_path から signed URL を生成し、img として表示する。
 * signed URL はコンポーネント内にのみ保持し、DB / localStorage には保存しない。
 */
export function PhotoImage({ storagePath, alt, className }: Props) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSignedUrl(storagePath)
      .then(signedUrl => {
        if (!cancelled) setUrl(signedUrl);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      });
    return () => { cancelled = true; };
  }, [storagePath]);

  if (!url) {
    return (
      <div
        className={className}
        style={{ background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 80 }}
        aria-label="画像を読み込み中"
      />
    );
  }

  return <img src={url} alt={alt} className={className} />;
}
