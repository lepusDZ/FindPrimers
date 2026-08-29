import type { Orf, RestrictionSite } from '../core/types';
import { formatBp } from '../core/sequence';

interface Props {
  sequenceLength: number;
  title: string;
  orfs?: Orf[];
  sites?: RestrictionSite[];
  selected?: RestrictionSite[];
  removedSegment?: { start: number; end: number };
  insertion?: { start: number; end: number; label?: string };
  compact?: boolean;
}

interface LabelPosition {
  site: RestrictionSite;
  angle: number;
  tick: { x: number; y: number };
  x: number;
  y: number;
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

function labelPositions(
  selected: RestrictionSite[],
  center: number,
  radius: number,
  angleFor: (position: number) => number,
): LabelPosition[] {
  const labels = selected.slice(0, 2).map((site) => {
    const angle = angleFor(site.position);
    const tick = polar(center, center, radius + 25, angle);
    const label = polar(center, center, radius + 66, angle);
    return { site, angle, tick, x: label.x, y: label.y };
  });

  if (labels.length === 2) {
    const distance = Math.hypot(labels[0].x - labels[1].x, labels[0].y - labels[1].y);
    if (distance < 66) {
      const firstAbove = labels[0].y <= labels[1].y;
      labels[0].y += firstAbove ? -18 : 18;
      labels[1].y += firstAbove ? 18 : -18;

      const onRight = (labels[0].x + labels[1].x) / 2 >= center;
      labels[0].x += onRight ? 12 : -12;
      labels[1].x += onRight ? 12 : -12;
    }
  }

  return labels;
}

export default function VectorMap({
  sequenceLength,
  title,
  orfs = [],
  sites = [],
  selected = [],
  removedSegment,
  insertion,
  compact = false,
}: Props) {
  const size = compact ? 300 : 430;
  const center = size / 2;
  const radius = compact ? 94 : 132;
  const selectedKeys = new Set(selected.map((site) => `${site.enzyme}-${site.position}`));
  const angleFor = (position: number) => (position / Math.max(1, sequenceLength)) * 360;
  const labels = compact ? [] : labelPositions(selected, center, radius, angleFor);

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
          const path = arcPath(center, center, radius + 18 + (index % 3) * 7, angleFor(orf.start), angleFor(orf.end));
          return <path key={orf.id} d={path} className={`orf-arc orf-${index % 3}`} />;
        })}

        {removedSegment && (
          <path
            d={arcPath(center, center, radius, angleFor(removedSegment.start), angleFor(removedSegment.end))}
            className="removed-arc"
          />
        )}

        {insertion && (
          <path
            d={arcPath(center, center, radius - 14, angleFor(insertion.start), angleFor(insertion.end))}
            className="insert-arc"
            filter={`url(#glow-${compact ? 'c' : 'l'})`}
          />
        )}

        {sites.map((site, index) => {
          const angle = angleFor(site.position);
          const inner = polar(center, center, radius - 8, angle);
          const outer = polar(center, center, radius + (compact ? 15 : 24), angle);
          const isSelected = selectedKeys.has(`${site.enzyme}-${site.position}`);
          return (
            <g key={`${site.enzyme}-${site.position}-${index}`} className={isSelected ? 'site selected' : 'site'}>
              <title>{`${site.enzyme} · ${site.recognition} · position ${site.position + 1}`}</title>
              <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} />
            </g>
          );
        })}

        {labels.map(({ site, tick, x, y }) => {
          const width = Math.max(54, 18 + site.enzyme.length * 7);
          return (
            <g key={`label-${site.enzyme}-${site.position}`} className="site-callout">
              <path d={`M ${tick.x} ${tick.y} L ${x} ${y}`} />
              <rect x={x - width / 2} y={y - 12} width={width} height={24} rx={8} />
              <text x={x} y={y + 3.5} textAnchor="middle">{site.enzyme}</text>
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
