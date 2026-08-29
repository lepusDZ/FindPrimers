import type { Orf, RestrictionSite } from '../core/types';
import { formatBp } from '../core/sequence';

interface Props {
  length: number;
  orfs: Orf[];
  sites: RestrictionSite[];
}

export default function InsertTrack({ length, orfs, sites }: Props) {
  return (
    <div className="insert-track-card">
      <div className="track-head">
        <div>
          <span className="eyebrow">Insert map</span>
          <strong>{formatBp(length)}</strong>
        </div>
        <span>{orfs.length} ORF{orfs.length === 1 ? '' : 's'} · {sites.length} internal site{sites.length === 1 ? '' : 's'}</span>
      </div>
      <div className="insert-track">
        <div className="track-line" />
        {orfs.slice(0, 8).map((orf, index) => {
          const start = (orf.start / Math.max(1, length)) * 100;
          const width = (orf.length / Math.max(1, length)) * 100;
          return <div key={orf.id} className={`track-orf orf-${index % 3}`} style={{ left: `${start}%`, width: `${Math.min(100 - start, width)}%` }} title={orf.label} />;
        })}
        {sites.slice(0, 30).map((site) => (
          <div key={`${site.enzyme}-${site.position}`} className="track-site" style={{ left: `${(site.position / Math.max(1, length)) * 100}%` }} title={`${site.enzyme} at ${site.position + 1}`} />
        ))}
        <span className="track-end start">5′</span><span className="track-end end">3′</span>
      </div>
    </div>
  );
}
