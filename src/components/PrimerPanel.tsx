import { Check, Copy, Dna, Download, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import type { PrimerDesign, PrimerMode, PrimerPairDesign } from '../core/types';


function downloadPrimerCsv(design: PrimerPairDesign) {
  const rows = [
    ['Name', 'Sequence (5′→3′)', 'Length', 'Annealing Tm (°C)', 'GC (%)'],
    ...[design.forward, design.reverse].map((primer) => [
      `${primer.name} primer`,
      primer.fullSequence,
      String(primer.fullSequence.length),
      primer.metrics.tm.toFixed(1),
      primer.metrics.gc.toFixed(1),
    ]),
  ];
  const csv = rows.map((row) => row.map((value) => `\"${value.replace(/\"/g, '\"\"')}\"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'findprimers-primers.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function RiskPill({ value, label }: { value: number; label: string }) {
  const level = value >= 6 ? 'risk-high' : value >= 4 ? 'risk-mid' : 'risk-low';
  return <span className={`metric-pill ${level}`}>{label} {value}</span>;
}

function PrimerCard({ primer }: { primer: PrimerDesign }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(primer.fullSequence);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };
  return (
    <article className="primer-card">
      <div className="primer-card-head">
        <div className="primer-name"><span className={`primer-direction ${primer.name.toLowerCase()}`}>{primer.name === 'Forward' ? '→' : '←'}</span><strong>{primer.name} primer</strong></div>
        <button className="copy-button" onClick={() => void copy()}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? 'Copied' : 'Copy'}</button>
      </div>
      <div className="primer-sequence" aria-label={`${primer.name} primer sequence`}>
        <span className="seq-clamp">{primer.clamp}</span><span className="seq-site">{primer.restrictionSite}</span><span className="seq-anneal">{primer.annealingSequence}</span>
      </div>
      <div className="sequence-legend">
        <span><i className="legend-clamp" /> clamp</span><span><i className="legend-site" /> restriction site</span><span><i className="legend-anneal" /> annealing</span>
      </div>
      <div className="primer-metrics">
        <span><b>{primer.metrics.tm.toFixed(1)}°C</b><small>annealing Tm</small></span>
        <span><b>{primer.metrics.gc.toFixed(0)}%</b><small>GC</small></span>
        <span><b>{primer.metrics.annealingLength} nt</b><small>annealing</small></span>
        <RiskPill value={primer.metrics.hairpinRisk} label="hairpin" />
        <RiskPill value={primer.metrics.homodimerRisk} label="dimer" />
      </div>
    </article>
  );
}

interface Props {
  design: PrimerPairDesign;
  mode: PrimerMode;
  onModeChange: (mode: PrimerMode) => void;
  embedded?: boolean;
}

export default function PrimerPanel({ design, mode, onModeChange, embedded = false }: Props) {
  return (
    <section className={`primer-section ${embedded ? 'embedded' : ''}`}>
      <div className="section-heading split-heading">
        <div>
          {!embedded && <div className="eyebrow">Primer design</div>}
          <h2>Ready-to-review primers</h2>
          <p>5′ tails are shown separately from the template-annealing region.</p>
        </div>
        <div className="primer-toolbar">
          <button className="primer-export-button" onClick={() => downloadPrimerCsv(design)}><Download size={14} /> Export CSV</button>
          <div className="mode-switch" role="group" aria-label="Primer design mode">
            <button className={mode === 'quick' ? 'active' : ''} onClick={() => onModeChange('quick')}>Quick <small>20 nt</small></button>
            <button className={mode === 'optimized' ? 'active' : ''} onClick={() => onModeChange('optimized')}>Optimized <small>Tm-aware</small></button>
          </div>
        </div>
      </div>

      <div className="mode-explainer">
        {mode === 'quick' ? <Dna size={18} /> : <ShieldCheck size={18} />}
        <div>
          <strong>{mode === 'quick' ? 'Quick mode mirrors the original FindPrimers idea.' : 'Optimized mode searches 18–32 nt annealing lengths.'}</strong>
          <span>{mode === 'quick' ? 'Fixed 20 nt annealing regions with a 6-base clamp and the selected restriction sites.' : 'It balances nearest-neighbor Tm, GC%, 3′ base quality, and simple hairpin/dimer complementarity heuristics entirely in-browser.'}</span>
        </div>
      </div>

      <div className="primer-grid"><PrimerCard primer={design.forward} /><PrimerCard primer={design.reverse} /></div>

      <div className={`qc-strip ${design.warnings.length ? 'warning' : 'ok'}`}>
        {design.warnings.length ? <TriangleAlert size={17} /> : <Check size={17} />}
        <span>{design.warnings.length ? design.warnings.join(' · ') : `Pair looks balanced · ΔTm ${design.tmDifference.toFixed(1)}°C · heterodimer score ${design.heterodimerRisk}`}</span>
      </div>
    </section>
  );
}
