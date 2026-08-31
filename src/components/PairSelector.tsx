import { useMemo, useState } from 'react';
import { AlertTriangle, Check, Search, Sparkles, X } from 'lucide-react';
import { isSingleEnzymeRoute } from '../core/restriction';
import type { EnzymePair } from '../core/types';
import './PairSelector.css';

interface Props {
  pairs: EnzymePair[];
  selectedId?: string;
  onSelect: (pair: EnzymePair) => void;
  onPreview?: (pair: EnzymePair | null) => void;
}

export default function PairSelector({ pairs, selectedId, onSelect, onPreview }: Props) {
  const PAGE_SIZE = 80;
  type PairFilter = 'all' | 'directional' | 'single';

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<PairFilter>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filteredPairs = useMemo(() => {
    const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);

    return pairs
      .map((pair, originalIndex) => ({ pair, originalIndex }))
      .filter(({ pair }) => {
        const singleEnzyme = isSingleEnzymeRoute(pair);
        if (filter === 'directional' && singleEnzyme) return false;
        if (filter === 'single' && !singleEnzyme) return false;
        if (!tokens.length) return true;

        const searchable = [
          pair.first.enzyme,
          pair.second.enzyme,
          pair.first.recognition,
          pair.second.recognition,
        ].join(' ').toLowerCase();

        return tokens.every((token) => searchable.includes(token));
      });
  }, [pairs, query, filter]);

  const shownPairs = filteredPairs.slice(0, visibleCount);
  const remaining = filteredPairs.length - shownPairs.length;

  function updateQuery(value: string) {
    setQuery(value);
    setVisibleCount(PAGE_SIZE);
    onPreview?.(null);
  }

  function updateFilter(value: PairFilter) {
    setFilter(value);
    setVisibleCount(PAGE_SIZE);
    onPreview?.(null);
  }

  return (
    <>
      <div className="pair-tools">
        <label className="pair-search">
          <Search size={14} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            placeholder="Search enzyme or motif"
            aria-label="Search ranked enzyme pairs"
          />
          {query && (
            <button type="button" onClick={() => updateQuery('')} aria-label="Clear pair search">
              <X size={13} />
            </button>
          )}
        </label>

        <div className="pair-filters" aria-label="Filter ranked pairs">
          {([
            ['all', 'All'],
            ['directional', 'Directional'],
            ['single', 'Same enzyme'],
          ] as const).map(([value, label]) => (
            <button
              type="button"
              key={value}
              className={filter === value ? 'active' : ''}
              aria-pressed={filter === value}
              onClick={() => updateFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="pair-results-count">
          {filteredPairs.length.toLocaleString()} {filteredPairs.length === 1 ? 'route' : 'routes'}
          {(query || filter !== 'all') && <span> of {pairs.length.toLocaleString()}</span>}
        </div>
      </div>

      <div className="pair-list pair-list-searchable">
        {shownPairs.map(({ pair, originalIndex }) => {
          const selected = pair.id === selectedId;
          const singleEnzyme = isSingleEnzymeRoute(pair);

          return (
            <button
              key={pair.id}
              className={`pair-card ${selected ? 'selected' : ''}`}
              onClick={() => onSelect(pair)}
              onMouseEnter={() => onPreview?.(pair)}
              onMouseLeave={() => onPreview?.(null)}
              onFocus={() => onPreview?.(pair)}
              onBlur={() => onPreview?.(null)}
            >
              <div className="pair-rank">
                {originalIndex === 0 ? <Sparkles size={16} /> : String(originalIndex + 1).padStart(2, '0')}
              </div>
              <div className="pair-main">
                <div className="pair-title-row">
                  <strong>{pair.first.enzyme}</strong><span className="pair-plus">+</span><strong>{pair.second.enzyme}</strong>
                  {originalIndex === 0 && <span className="recommended-badge">Recommended</span>}
                </div>
                <div className="pair-meta">
                  {singleEnzyme ? (
                    <><span>{pair.first.recognition}</span><span>·</span><span>single unique site</span><span>·</span><span>0 bp removed</span></>
                  ) : (
                    <><span>{pair.first.recognition}</span><span>·</span><span>{pair.second.recognition}</span><span>·</span><span>{pair.removedLength} bp removed</span></>
                  )}
                </div>
                <div className="pair-signal">
                  {pair.warnings.length ? <AlertTriangle size={13} /> : <Check size={13} />}
                  <span>{pair.warnings[0] ?? (singleEnzyme ? 'Valid non-directional candidate' : 'Clean directional candidate')}</span>
                </div>
              </div>
              <div className="pair-score"><span>{pair.score}</span><small>/100</small></div>
            </button>
          );
        })}

        {!filteredPairs.length && (
          <div className="pair-search-empty">
            <strong>No matching routes</strong>
            <span>Try another enzyme name, motif, or filter.</span>
          </div>
        )}

        {remaining > 0 && (
          <div className="pair-load-more">
            <span>Showing {shownPairs.length.toLocaleString()} of {filteredPairs.length.toLocaleString()}</span>
            <button type="button" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
              Show {Math.min(PAGE_SIZE, remaining)} more
            </button>
          </div>
        )}
      </div>
    </>
  );
}
