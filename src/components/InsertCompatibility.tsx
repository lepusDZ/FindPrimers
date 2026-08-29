import { CheckCircle2, Dna } from 'lucide-react';
import type { EnzymePair, Orf } from '../core/types';
import { formatBp } from '../core/sequence';

interface Props {
  length: number;
  orfs: Orf[];
  pair: EnzymePair;
}

export default function InsertCompatibility({ length, orfs, pair }: Props) {
  return (
    <div className="insert-compatibility">
      <div className="insert-compatibility-head">
        <div>
          <span className="eyebrow">Insert compatibility</span>
          <strong>{formatBp(length)}</strong>
        </div>
        <span><Dna size={14} /> {orfs.length} CDS / ORF region{orfs.length === 1 ? '' : 's'}</span>
      </div>
      <div className="compatibility-grid">
        {[pair.first, pair.second].map((site) => (
          <div key={`${site.enzyme}-${site.position}`} className="compatibility-item">
            <CheckCircle2 size={16} />
            <div>
              <strong>{site.enzyme}</strong>
              <span>{site.recognition} · 0 internal cuts</span>
            </div>
          </div>
        ))}
        <div className="compatibility-item summary">
          <CheckCircle2 size={16} />
          <div>
            <strong>Insert stays intact</strong>
            <span>Neither selected enzyme cuts inside the insert sequence.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
