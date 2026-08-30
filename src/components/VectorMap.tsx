import { useState } from 'react';
import type { Orf, RestrictionSite } from '../core/types';
import { formatBp } from '../core/sequence';

interface Props {
  sequenceLength: number;
  title: string;
  orfs?: Orf[];
  sites?: RestrictionSite[];
  selected?: RestrictionSite[];
  preview?: RestrictionSite[];
  removedSegment?: { start: number; end: number };
  previewSegment?: { start: number; end: number };
  insertion?: { start: number; end: number; label?: string };
  compact?: boolean;
}

interface LabelPosition {
  site: RestrictionSite;
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

function siteKey(site: RestrictionSite) {
  return `${site.enzyme}-${site.position}`;
}

function siteCenter(site: RestrictionSite, sequenceLength: number) {
  return (site.position + site.length / 2) % Math.max(1, sequenceLength);
}

function siteEnd(site: RestrictionSite, sequenceLength: number) {
  return (site.position + site.length) % Math.max(1, sequenceLength);
}

function recognitionRange(site: RestrictionSite, sequenceLength: number) {
  const start = site.position + 1;
  const end = ((site.position + site.length - 1) % sequenceLength) + 1;
  return end >= start ? `bp ${start}–${end}` : `bp ${start}–${end} · wraps origin`;
}

function labelPositions(
  selected: RestrictionSite[],
  center: number,
  radius: number,
  angleFor: (position: number) => number,
  sequenceLength: number,
): LabelPosition[] {
  const labels = selected.slice(0, 2).map((site) => {
    const angle = angleFor(siteCenter(site, sequenceLength));
    const tick = polar(center, center, radius + 29, angle);
    const label = polar(center, center, radius + 74, angle);
    return { site, tick, x: label.x, y: label.y };
  });

  if (labels.length === 2) {
    const distance = Math.hypot(labels[0].x - labels[1].x, labels[0].y - labels[1].y);
    if (distance < 76) {
      const firstAbove = labels[0].y <= labels[1].y;
      labels[0].y += firstAbove ? -22 : 22;
      labels[1].y += firstAbove ? 22 : -22;

      const onRight = (labels[0].x + labels[1].x) / 2 >= center;
      labels[0].x += onRight ? 14 : -14;
      labels[1].x += onRight ? 14 : -14;
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
  preview = [],
  removedSegment,
  previewSegment,
  insertion,
  compact = false,
}: Props) {
  const size = compact ? 340 : 430;
  const center = size / 2;
  const radius = compact ? 112 : 132;
  const [hoveredSite, setHoveredSite] = useState<RestrictionSite | null>(null);
  const [pinnedSite, setPinnedSite] = useState<RestrictionSite | null>(null);
  const selectedKeys = new Set(selected.map(siteKey));
  const previewKeys = new Set(preview.map(siteKey));
  const angleFor = (position: number) => (position / Math.max(1, sequenceLength)) * 360;
  const labels = compact ? [] : labelPositions(selected, center, radius, angleFor, sequenceLength);
  const inspectedSite = hoveredSite ?? pinnedSite;
  const inspectedKey = inspectedSite ? siteKey(inspectedSite) : '';
  const inspectedSelected = inspectedSite ? selectedKeys.has(inspectedKey) : false;

  const togglePinnedSite = (site: RestrictionSite) => {
    if (pinnedSite && siteKey(pinnedSite) === siteKey(site)) {
      setPinnedSite(null);
      setHoveredSite(null);
      return;
    }
    setPinnedSite(site);
  };

  return (
    <div className={`vector-map ${compact ? 'compact' : ''}`}>
      <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Circular map of ${title}`}>
        <defs>
          <filter id={`glow-${compact ? 'c' : 'l'}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id={`selected-glow-${compact ? 'c' : 'l'}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <circle className="map-track-soft" cx={center} cy={center} r={radius} />
        <circle className="map-track" cx={center} cy={center} r={radius} />

        {!compact && orfs.slice(0, 12).map((orf, index) => {
          const featureRadius = radius - 24 - (index % 3) * 7;
          const path = arcPath(center, center, featureRadius, angleFor(orf.start), angleFor(orf.end));
          return <path key={orf.id} d={path} className={`orf-arc ${orf.source === 'annotation' ? 'annotated' : 'predicted'}`} />;
        })}

        {removedSegment && (
          <path
            d={arcPath(center, center, radius, angleFor(removedSegment.start), angleFor(removedSegment.end))}
            className="removed-arc"
          />
        )}

        {selected.map((site) => (
          <path
            key={`selected-motif-${siteKey(site)}`}
            d={arcPath(center, center, radius, angleFor(site.position), angleFor(siteEnd(site, sequenceLength)))}
            className="selected-motif-arc"
            filter={`url(#selected-glow-${compact ? 'c' : 'l'})`}
          />
        ))}

        {previewSegment && (
          <path
            d={arcPath(center, center, radius + 8, angleFor(previewSegment.start), angleFor(previewSegment.end))}
            className="preview-arc"
          />
        )}

        {preview.filter((site) => !selectedKeys.has(siteKey(site))).map((site) => (
          <path
            key={`preview-motif-${siteKey(site)}`}
            d={arcPath(center, center, radius + 8, angleFor(site.position), angleFor(siteEnd(site, sequenceLength)))}
            className="preview-motif-arc"
          />
        ))}

        {insertion && (
          <path
            d={arcPath(center, center, radius - 14, angleFor(insertion.start), angleFor(insertion.end))}
            className="insert-arc"
            filter={`url(#glow-${compact ? 'c' : 'l'})`}
          />
        )}

        {sites.map((site, index) => {
          const key = siteKey(site);
          const angle = angleFor(siteCenter(site, sequenceLength));
          const inner = polar(center, center, radius - 13, angle);
          const outer = polar(center, center, radius + (compact ? 16 : 25), angle);
          const hitInner = polar(center, center, radius - 24, angle);
          const hitOuter = polar(center, center, radius + (compact ? 27 : 38), angle);
          const dot = polar(center, center, radius + (compact ? 18 : 27), angle);
          const isSelected = selectedKeys.has(key);
          const isPreview = previewKeys.has(key);
          const isActive = inspectedKey === key;
          const classes = ['site', isSelected && 'selected', isPreview && 'preview', isActive && 'active'].filter(Boolean).join(' ');

          return (
            <g
              key={`${key}-${index}`}
              className={classes}
              role="button"
              tabIndex={0}
              aria-label={`${site.enzyme}, ${site.recognition}, ${recognitionRange(site, sequenceLength)}`}
              aria-pressed={pinnedSite ? siteKey(pinnedSite) === key : false}
              onMouseEnter={() => setHoveredSite(site)}
              onMouseLeave={() => setHoveredSite(null)}
              onFocus={() => setHoveredSite(site)}
              onBlur={() => setHoveredSite(null)}
              onClick={() => togglePinnedSite(site)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  togglePinnedSite(site);
                }
              }}
            >
              <title>{`${site.enzyme} · ${site.recognition} · ${recognitionRange(site, sequenceLength)}`}</title>
              <line className="site-hit-area" x1={hitInner.x} y1={hitInner.y} x2={hitOuter.x} y2={hitOuter.y} />
              <line className="site-mark" x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} />
              <circle className="site-dot" cx={dot.x} cy={dot.y} r={isSelected || isActive ? 3.4 : 2.2} />
            </g>
          );
        })}

        {inspectedSite && selectedKeys.has(inspectedKey) && !compact && (
          <path
            d={arcPath(center, center, radius + 5, angleFor(inspectedSite.position), angleFor(siteEnd(inspectedSite, sequenceLength)))}
            className="inspected-selected-arc"
          />
        )}

        {inspectedSite && !selectedKeys.has(inspectedKey) && !compact && (
          <path
            d={arcPath(center, center, radius, angleFor(inspectedSite.position), angleFor(siteEnd(inspectedSite, sequenceLength)))}
            className="inspected-motif-arc"
          />
        )}

        {labels.map(({ site, tick, x, y }) => {
          const width = Math.max(60, 22 + site.enzyme.length * 7.2);
          return (
            <g key={`label-${siteKey(site)}`} className="site-callout">
              <path d={`M ${tick.x} ${tick.y} L ${x} ${y}`} />
              <circle cx={tick.x} cy={tick.y} r="2.6" />
              <rect x={x - width / 2} y={y - 13} width={width} height={26} rx={9} />
              <text x={x} y={y + 3.5} textAnchor="middle">{site.enzyme}</text>
            </g>
          );
        })}

        {inspectedSite && !compact ? (
          <g className="map-inspector" pointerEvents="none">
            <text x={center} y={center - 42} textAnchor="middle" className="map-inspector-kicker">Restriction site</text>
            <text x={center} y={center - 14} textAnchor="middle" className="map-title">{inspectedSite.enzyme}</text>
            <text x={center} y={center + 10} textAnchor="middle" className="map-site-sequence">{inspectedSite.recognition}</text>
            <text x={center} y={center + 32} textAnchor="middle" className="map-length">{recognitionRange(inspectedSite, sequenceLength)}</text>
            <text x={center} y={center + 53} textAnchor="middle" className={inspectedSelected ? 'map-site-status selected' : 'map-site-status'}>
              {inspectedSelected ? 'Selected recognition site' : 'Unique vector site · insert-safe'}
            </text>
          </g>
        ) : compact ? (
          <>
            <text x={center} y={center - 14} textAnchor="middle" className="map-title">{title}</text>
            <text x={center} y={center + 16} textAnchor="middle" className="map-length">{formatBp(sequenceLength)}</text>
            {insertion?.label && <text x={center} y={center + 43} textAnchor="middle" className="map-insert-label">+ {insertion.label}</text>}
          </>
        ) : null}
      </svg>
    </div>
  );
}
