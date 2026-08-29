import type { Orf, RestrictionSite } from '../core/types';
import { formatBp } from '../core/sequence';

interface Props {
  sequenceLength: number;
  title: string;
  orfs?: Orf[];
  sites?: RestrictionSite[];
  selected?: RestrictionSite[];
  insertion?: { start: number; end: number; label?: string };
  compact?: boolean;
}

function polar(cx: number, cy: number, radius: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) };
}

function arcPath(cx: number, cy: number, radius: number, start: number, end: number) {
  let sweep = end - start;
  if (sweep <= 0) sweep += 360;
  if (sweep >= 359.8) sweep = 359.8;
  const from = polar(cx, cy, radius, end);
  const to = polar(cx, cy, radius, start);
  const large = sweep <= 180 ? 0 : 1;
  return `M ${from.x} ${from.y} A ${radius} ${radius} 0 ${large} 0 ${to.x} ${to.y}`;
}

export default function VectorMap({ sequenceLength, title, orfs = [], sites = [], selected = [], insertion, compact = false }: Props) {
  const size = compact ? 300 : 430;
  const center = size / 2;
  const radius = compact ? 94 : 132;
  const selectedNames = new Set(selected.map((s) => `${s.enzyme}-${s.position}`));
  const visibleSites = [...sites]
    .sort((a, b) => Number(selectedNames.has(`${b.enzyme}-${b.position}`)) - Number(selectedNames.has(`${a.enzyme}-${a.position}`)))
    .slice(0, compact ? 5 : 10);

  const angleFor = (position: number) => (position / Math.max(1, sequenceLength)) * 360;

  return (
    <div className={`vector-map ${compact ? 'compact' : ''}`}>
      <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Circular map of ${title}`}>
        <defs>
          <filter id={`glow-${compact ? 'c' : 'l'}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <circle className="map-track-soft" cx={center} cy={center} r={radius} />
        <circle className="map-track" cx={center} cy={center} r={radius} />

        {orfs.slice(0, compact ? 5 : 12).map((orf, index) => {
          const start = angleFor(orf.start);
          const end = angleFor(orf.end);
          const path = arcPath(center, center, radius + 18 + (index % 3) * 7, start, end);
          return <path key={orf.id} d={path} className={`orf-arc orf-${index % 3}`} />;
        })}

        {insertion && (
          <path
            d={arcPath(center, center, radius - 14, angleFor(insertion.start), angleFor(insertion.end))}
            className="insert-arc"
            filter={`url(#glow-${compact ? 'c' : 'l'})`}
          />
        )}

        {visibleSites.map((site, index) => {
          const angle = angleFor(site.position);
          const inner = polar(center, center, radius - 8, angle);
          const outer = polar(center, center, radius + (compact ? 15 : 24), angle);
          const label = polar(center, center, radius + (compact ? 28 : 46), angle);
          const isSelected = selectedNames.has(`${site.enzyme}-${site.position}`);
          return (
            <g key={`${site.enzyme}-${site.position}-${index}`} className={isSelected ? 'site selected' : 'site'}>
              <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} />
              {!compact && (
                <text x={label.x} y={label.y} textAnchor={label.x < center - 8 ? 'end' : label.x > center + 8 ? 'start' : 'middle'}>
                  {site.enzyme}
                </text>
              )}
            </g>
          );
        })}

        <text x={center} y={center - 10} textAnchor="middle" className="map-title">{title}</text>
        <text x={center} y={center + 17} textAnchor="middle" className="map-length">{formatBp(sequenceLength)}</text>
        {insertion?.label && <text x={center} y={center + 41} textAnchor="middle" className="map-insert-label">+ {insertion.label}</text>}
      </svg>
    </div>
  );
}
