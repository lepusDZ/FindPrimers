import { AlertTriangle, Check, ChevronRight, Sparkles } from 'lucide-react';
import type { EnzymePair } from '../core/types';

interface Props {
  pairs: EnzymePair[];
  selectedId?: string;
  onSelect: (pair: EnzymePair) => void;
}

export default function PairSelector({ pairs, selectedId, onSelect }: Props) {
  return (
    <div className="pair-list">
      {pairs.slice(0, 25).map((pair, index) => {
        const selected = pair.id === selectedId;
        return (
          <button key={pair.id} className={`pair-card ${selected ? 'selected' : ''}`} onClick={() => onSelect(pair)}>
            <div className="pair-rank">{index === 0 ? <Sparkles size={16} /> : String(index + 1).padStart(2, '0')}</div>
            <div className="pair-main">
              <div className="pair-title-row">
                <strong>{pair.first.enzyme}</strong><span className="pair-plus">+</span><strong>{pair.second.enzyme}</strong>
                {index === 0 && <span className="recommended-badge">Recommended</span>}
              </div>
              <div className="pair-meta">
                <span>{pair.first.recognition}</span><span>·</span><span>{pair.second.recognition}</span><span>·</span><span>{pair.removedLength} bp removed</span>
              </div>
              <div className="pair-signal">
                {pair.warnings.length ? <AlertTriangle size={13} /> : <Check size={13} />}
                <span>{pair.warnings[0] ?? 'Clean two-enzyme candidate'}</span>
              </div>
            </div>
            <div className="pair-score"><span>{pair.score}</span><small>/100</small></div>
            <ChevronRight className="pair-arrow" size={17} />
          </button>
        );
      })}
    </div>
  );
}
