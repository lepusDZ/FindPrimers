import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { useState } from 'react';
import type {
  AnalysisResult,
  ConstructSimulation,
  EnzymePair,
  ParsedSequence,
  PrimerMode,
  PrimerPairDesign,
  RestrictionSite,
} from '../core/types';
import { formatBp } from '../core/sequence';
import { getInterveningSegment } from '../core/restriction';
import DesignChecks from './DesignChecks';
import InsertCompatibility from './InsertCompatibility';
import PairSelector from './PairSelector';
import PrimerPanel from './PrimerPanel';
import Tooltip from './Tooltip';
import VectorMap from './VectorMap';

type DetailTab = 'overview' | 'primers' | 'checks' | 'construct';

interface Props {
  analysis: AnalysisResult;
  vector: ParsedSequence;
  insert: ParsedSequence;
  vectorSites: RestrictionSite[];
  selectedPair: EnzymePair | null;
  onSelectPair: (pair: EnzymePair) => void;
  primerDesign: PrimerPairDesign | null;
  primerMode: PrimerMode;
  onPrimerModeChange: (mode: PrimerMode) => void;
  construct: ConstructSimulation | null;
}

function Overview({
  analysis,
  vector,
  insert,
  vectorSites,
  pair,
  previewPair,
}: Pick<Props, 'analysis' | 'vector' | 'insert' | 'vectorSites'> & { pair: EnzymePair; previewPair?: EnzymePair | null }) {
  const removedSegment = getInterveningSegment(pair, vector.sequence.length);
  const previewSegment = previewPair ? getInterveningSegment(previewPair, vector.sequence.length) : undefined;

  return (
    <div className="overview-grid">
      <div className="overview-map-card">
        <div className="panel-label">
          <span>Vector map</span>
          <span className="subtle">hover a site or pair to preview</span>
        </div>
        <VectorMap
          sequenceLength={vector.sequence.length}
          title={vector.name || 'Vector'}
          orfs={analysis.vectorOrfs}
          sites={vectorSites}
          selected={[pair.first, pair.second]}
          preview={previewPair ? [previewPair.first, previewPair.second] : []}
          removedSegment={removedSegment}
          previewSegment={previewSegment}
        />
        <div className="map-legend">
          <span><i className="legend-cut" /> recognition site</span>
          <span><i className="legend-orf" /> coding region</span>
        </div>
      </div>

      <div className="overview-details">
        <InsertCompatibility length={insert.sequence.length} orfs={analysis.insertOrfs} pair={pair} />

        <div className="design-reasons">
          <div className="panel-label"><span>Why this route</span></div>
          <div className="reason-list">
            {pair.rationale.slice(0, 4).map((reason) => (
              <div key={reason} className="reason good"><CheckCircle2 size={15} />{reason}</div>
            ))}
            {pair.warnings.map((warning) => (
              <div key={warning} className="reason warn"><AlertCircle size={15} />{warning}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ConstructPanel({ vector, insert, construct }: Pick<Props, 'vector' | 'insert'> & { construct: ConstructSimulation }) {
  return (
    <div className="construct-tab">
      <div className="construct-tab-copy">
        <div className="panel-heading-row">
          <div>
            <h3>Predicted construct</h3>
            <p>The shorter vector segment is replaced with the insert while retaining both selected recognition sites.</p>
          </div>
          <Tooltip content={construct.note}>
            <button className="info-button" aria-label="About construct simulation"><Info size={16} /></button>
          </Tooltip>
        </div>
        <div className="construct-math">
          <span>{formatBp(vector.sequence.length)} vector</span><b>−</b>
          <span>{formatBp(construct.removedLength)} removed</span><b>+</b>
          <span>{formatBp(insert.sequence.length)} insert</span><b>=</b>
          <strong>{formatBp(construct.finalLength)}</strong>
        </div>
      </div>
      <div className="construct-map-card embedded">
        <VectorMap
          compact
          sequenceLength={construct.finalLength}
          title="Predicted construct"
          insertion={{ start: construct.insertionStart, end: construct.insertionEnd, label: formatBp(insert.sequence.length) }}
        />
      </div>
    </div>
  );
}

export default function DesignWorkspace({
  analysis,
  vector,
  insert,
  vectorSites,
  selectedPair,
  onSelectPair,
  primerDesign,
  primerMode,
  onPrimerModeChange,
  construct,
}: Props) {
  const [tab, setTab] = useState<DetailTab>('overview');
  const [previewPair, setPreviewPair] = useState<EnzymePair | null>(null);
  const visiblePreviewPair = previewPair?.id === selectedPair?.id ? null : previewPair;

  return (
    <section className="workspace-section design-workspace">
      <aside className="pair-pane">
        <div className="pair-pane-head">
          <div>
            <span className="eyebrow">Ranked pairs</span>
            <strong>{analysis.pairs.length.toLocaleString()} candidates</strong>
          </div>
          <span>score</span>
        </div>
        {analysis.pairs.length ? (
          <PairSelector
            pairs={analysis.pairs}
            selectedId={selectedPair?.id}
            onSelect={onSelectPair}
            onPreview={setPreviewPair}
          />
        ) : (
          <div className="empty-state compact-empty">
            <AlertCircle size={26} />
            <h3>No compatible pair</h3>
            <p>Try a different vector/insert or add suitable restriction sites to the cloning region.</p>
          </div>
        )}
      </aside>

      <div className="detail-pane">
        {selectedPair && primerDesign && construct ? (
          <>
            <div className="design-detail-head">
              <div>
                <div className="eyebrow">Selected route</div>
                <h2><span>{selectedPair.first.enzyme}</span><b>+</b><span>{selectedPair.second.enzyme}</span></h2>
                <p>
                  Recognition positions {selectedPair.first.position + 1} and {selectedPair.second.position + 1}
                  <span> · </span>{selectedPair.removedLength} bp intervening vector segment
                </p>
              </div>
              <div className="score-block">
                <div className="score-value">
                  <strong>{selectedPair.score}</strong><small>/100</small>
                </div>
                <Tooltip content="Heuristic score based on site spacing, coding-region conflicts, and recognition length. Verify enzyme conditions with the supplier.">
                  <button className="score-info" aria-label="About design score"><Info size={14} /></button>
                </Tooltip>
              </div>
            </div>

            <div className="detail-tabs" role="tablist" aria-label="Selected design details">
              {(['overview', 'primers', 'checks', 'construct'] as DetailTab[]).map((item) => (
                <button
                  key={item}
                  role="tab"
                  aria-selected={tab === item}
                  className={tab === item ? 'active' : ''}
                  onClick={() => setTab(item)}
                >
                  {item[0].toUpperCase() + item.slice(1)}
                </button>
              ))}
            </div>

            <div className="detail-body">
              {tab === 'overview' && (
                <Overview
                  analysis={analysis}
                  vector={vector}
                  insert={insert}
                  vectorSites={vectorSites}
                  pair={selectedPair}
                  previewPair={visiblePreviewPair}
                />
              )}
              {tab === 'primers' && (
                <PrimerPanel embedded design={primerDesign} mode={primerMode} onModeChange={onPrimerModeChange} />
              )}
              {tab === 'checks' && (
                <DesignChecks analysis={analysis} pair={selectedPair} primers={primerDesign} />
              )}
              {tab === 'construct' && <ConstructPanel vector={vector} insert={insert} construct={construct} />}
            </div>
          </>
        ) : (
          <div className="empty-state"><h3>Select a route</h3><p>Choose a ranked enzyme pair to inspect its map, primers, and predicted construct.</p></div>
        )}
      </div>
    </section>
  );
}
