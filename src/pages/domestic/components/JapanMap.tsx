import { useState } from 'react';
import japanMap from '@svg-maps/japan';
import { useZoomPan } from '../../../hooks/useZoomPan';

export const japaneseNames: Record<string, string> = {
  hokkaido: '北海道',
  aomori: '青森',
  iwate: '岩手',
  miyagi: '宮城',
  akita: '秋田',
  yamagata: '山形',
  fukushima: '福島',
  ibaraki: '茨城',
  tochigi: '栃木',
  gunma: '群馬',
  saitama: '埼玉',
  chiba: '千葉',
  tokyo: '東京',
  kanagawa: '神奈川',
  niigata: '新潟',
  toyama: '富山',
  ishikawa: '石川',
  fukui: '福井',
  yamanashi: '山梨',
  nagano: '長野',
  gifu: '岐阜',
  shizuoka: '静岡',
  aichi: '愛知',
  mie: '三重',
  shiga: '滋賀',
  kyoto: '京都',
  osaka: '大阪',
  hyogo: '兵庫',
  nara: '奈良',
  wakayama: '和歌山',
  tottori: '鳥取',
  shimane: '島根',
  okayama: '岡山',
  hiroshima: '広島',
  yamaguchi: '山口',
  tokushima: '徳島',
  kagawa: '香川',
  ehime: '愛媛',
  kochi: '高知',
  fukuoka: '福岡',
  saga: '佐賀',
  nagasaki: '長崎',
  oita: '大分',
  kumamoto: '熊本',
  miyazaki: '宮崎',
  kagoshima: '鹿児島',
  okinawa: '沖縄',
};

// @svg-maps/japan の viewBox は "0 0 438 516"
const VIEW_WIDTH = 438;
const VIEW_HEIGHT = 516;

interface Props {
  isVisited: (id: string) => boolean;
  onSelect: (id: string) => void;
}

export function JapanMap({ isVisited, onSelect }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const { wrapperRef, transform, zoomed, didDragRef, handleReset } = useZoomPan({
    viewWidth: VIEW_WIDTH,
    viewHeight: VIEW_HEIGHT,
  });

  function getFill(id: string) {
    if (hoveredId === id) return isVisited(id) ? '#e05252' : '#c5d8e2';
    return isVisited(id) ? '#ff6b6b' : '#dceaf0';
  }

  return (
    <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
      {zoomed && (
        <button
          onClick={handleReset}
          style={{
            position: 'absolute', top: 8, right: 8, zIndex: 10,
            padding: '4px 10px', fontSize: '12px', cursor: 'pointer',
            background: 'rgba(0,0,0,0.45)', color: '#fff',
            border: '1px solid rgba(0,0,0,0.15)', borderRadius: '4px',
          }}
        >
          リセット
        </button>
      )}
      <div
        ref={wrapperRef}
        className="map-wrapper"
        style={{ userSelect: 'none', cursor: 'default' }}
      >
        <svg
          viewBox={japanMap.viewBox}
          className="japan-map"
          aria-label="日本地図 — 都道府県をクリックして記録を追加"
        >
          <g transform={transform || undefined}>
            {japanMap.locations.map((loc: { id: string; name: string; path: string }) => {
              const name = japaneseNames[loc.id] ?? loc.name;
              return (
                <g
                  key={loc.id}
                  onClick={() => {
                    if (didDragRef.current) return;
                    onSelect(loc.id);
                  }}
                  onMouseEnter={() => setHoveredId(loc.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{ cursor: 'pointer' }}
                  role="button"
                  aria-label={name}
                >
                  <title>{name}{isVisited(loc.id) ? ' ✓ 訪問済み' : ''}</title>
                  <path
                    id={`p-${loc.id}`}
                    d={loc.path}
                    fill={getFill(loc.id)}
                    stroke="#6aafd0"
                    strokeWidth="0.8"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}
