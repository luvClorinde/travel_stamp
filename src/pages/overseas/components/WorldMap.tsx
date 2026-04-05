import { useEffect, useState } from 'react';
import { geoEquirectangular, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson';
import { useZoomPan } from '../../../hooks/useZoomPan';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';
const WIDTH = 960;
const HEIGHT = 500;

// 日本（東経138°）を中心に配置
const projection = geoEquirectangular().rotate([-138, 0]).scale(153).translate([WIDTH / 2, HEIGHT / 2]);
const pathGenerator = geoPath(projection);

type CountryFeature = Feature<Polygon | MultiPolygon, { name: string }> & { id?: string | number };
type WorldTopology = Topology<{ countries: GeometryCollection<{ name: string }> }>;

interface Props {
  isVisited: (countryId: string) => boolean;
  onCountryClick: (countryId: string, countryName: string) => void;
}

export function WorldMap({ isVisited, onCountryClick }: Props) {
  const [geographies, setGeographies] = useState<CountryFeature[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const { wrapperRef, transform, zoomed, didDragRef, handleReset } = useZoomPan({
    viewWidth: WIDTH,
    viewHeight: HEIGHT,
  });

  useEffect(() => {
    fetch(GEO_URL)
      .then(res => res.json())
      .then((topology: WorldTopology) => {
        const col = feature(topology, topology.objects.countries) as FeatureCollection<Polygon | MultiPolygon, { name: string }>;
        setGeographies(col.features as CountryFeature[]);
      })
      .catch(err => console.error('Failed to load world map:', err));
  }, []);

  function getFill(id: string): string {
    const visited = isVisited(id);
    const hovered = hoveredId === id;
    if (visited && hovered) return '#e05252';
    if (visited) return '#ff6b6b';
    if (hovered) return '#8da8b8';
    return '#a8bfcc';
  }

  return (
    <div style={{ position: 'relative' }}>
      {zoomed && (
        <button
          onClick={handleReset}
          style={{
            position: 'absolute', top: 8, right: 8, zIndex: 10,
            padding: '4px 10px', fontSize: '12px', cursor: 'pointer',
            background: 'rgba(0,0,0,0.55)', color: '#fff',
            border: '1px solid rgba(255,255,255,0.3)', borderRadius: '4px',
          }}
        >
          リセット
        </button>
      )}
      <div
        ref={wrapperRef}
        className="world-map-wrapper"
        style={{ cursor: 'default', userSelect: 'none' }}
      >
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          aria-label="世界地図"
        >
          {/* 海洋背景（transform の外に置くことでズーム時も全体を覆う） */}
          <rect width={WIDTH} height={HEIGHT} fill="#1a3a52" />

          <g transform={transform || undefined}>
            {geographies.map((geo, i) => {
              const id = String(geo.id ?? '-99');
              const name = geo.properties.name ?? '不明';
              const d = pathGenerator(geo);
              if (!d) return null;

              return (
                <path
                  key={i}
                  d={d}
                  fill={getFill(id)}
                  stroke="#1a2e3d"
                  strokeWidth={0.4}
                  vectorEffect="non-scaling-stroke"
                  style={{ outline: 'none', cursor: id !== '-99' ? 'pointer' : 'default' }}
                  onClick={() => {
                    if (didDragRef.current) return;
                    if (id !== '-99') onCountryClick(id, name);
                  }}
                  onMouseEnter={() => setHoveredId(id)}
                  onMouseLeave={() => setHoveredId(null)}
                />
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}
