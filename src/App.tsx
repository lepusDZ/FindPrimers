import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import {
  AlertCircle, ArrowDown, CheckCircle2, CornerRightDown, Dna, Download, Info, Layers3,
  RefreshCw, Sparkles, Upload, WandSparkles,
} from 'lucide-react';
import SequenceInputCard from './components/SequenceInputCard';
import Tooltip from './components/Tooltip';
import VectorMap from './components/VectorMap';
import InsertCompatibility from './components/InsertCompatibility';
import PairSelector from './components/PairSelector';
import PrimerPanel from './components/PrimerPanel';
import type { AnalysisResult, EnzymePair, ParsedSequence, PrimerMode, ProjectFile } from './core/types';
import { analyzeDesign } from './core/restriction';
import { designPrimers, simulateConstruct } from './core/primers';
import { downloadProject, makeProjectFile, parseProjectFile } from './core/project';
import { EXAMPLE_INSERT, EXAMPLE_VECTOR } from './core/examples';
import { formatBp, validateSequence } from './core/sequence';

const emptyVector = (): ParsedSequence => ({ name: 'Vector', sequence: '', circular: true, annotations: [], source: 'plain' });
const emptyInsert = (): ParsedSequence => ({ name: 'Insert', sequence: '', circular: false, annotations: [], source: 'plain' });

export default function App() {
  const [vector, setVector] = useState<ParsedSequence>(emptyVector);
  const [insert, setInsert] = useState<ParsedSequence>(emptyInsert);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [selectedPair, setSelectedPair] = useState<EnzymePair | null>(null);
  const [primerMode, setPrimerMode] = useState<PrimerMode>('optimized');
  const [error, setError] = useState('');
  const [exampleNudge, setExampleNudge] = useState(false);
  const projectInputRef = useRef<HTMLInputElement>(null);
  const analysisRef = useRef<HTMLDivElement>(null);

  const vectorValid = validateSequence(vector.sequence).valid;
  const insertValid = validateSequence(insert.sequence).valid;
  const canAnalyze = vectorValid && insertValid && vector.sequence.length >= 20 && insert.sequence.length >= 8;

  const markDirtyVector = (next: ParsedSequence) => { setVector(next); setAnalysis(null); setSelectedPair(null); setError(''); setExampleNudge(false); };
  const markDirtyInsert = (next: ParsedSequence) => { setInsert(next); setAnalysis(null); setSelectedPair(null); setError(''); setExampleNudge(false); };

  const runAnalysis = (nextVector = vector, nextInsert = insert, preferredPairId?: string) => {
    setExampleNudge(false);
    const v = validateSequence(nextVector.sequence);
    const i = validateSequence(nextInsert.sequence);
    if (!v.valid || !i.valid) {
      setError('Add valid vector and insert DNA before analyzing the design.');
      return;
    }
    try {
      const result = analyzeDesign(nextVector, nextInsert);
      setAnalysis(result);
      const preferred = preferredPairId ? result.pairs.find((p) => p.id === preferredPairId) : undefined;
      setSelectedPair(preferred ?? result.pairs[0] ?? null);
      setError(result.pairs.length ? '' : 'No two-enzyme cloning pair passed the current filters. Check the diagnostics below.');
      window.setTimeout(() => analysisRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed.');
    }
  };

  const loadExample = () => {
    const v: ParsedSequence = { name: 'Example vector', sequence: EXAMPLE_VECTOR, circular: true, annotations: [], source: 'plain' };
    const i: ParsedSequence = { name: 'Example insert', sequence: EXAMPLE_INSERT, circular: false, annotations: [], source: 'plain' };
    setVector(v); setInsert(i); setAnalysis(null); setSelectedPair(null); setError(''); setExampleNudge(true);
  };

  const reset = () => {
    setVector(emptyVector()); setInsert(emptyInsert()); setAnalysis(null); setSelectedPair(null); setPrimerMode('optimized'); setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const exportProject = () => {
    const project = makeProjectFile({ vector, insert, selectedPairId: selectedPair?.id, primerMode });
    downloadProject(project);
  };

  const importProject = async (file?: File) => {
    if (!file) return;
    try {
      const project: ProjectFile = parseProjectFile(await file.text());
      setVector(project.vector);
      setInsert(project.insert);
      setPrimerMode(project.primerMode);
      setError('');
      setExampleNudge(false);
      runAnalysis(project.vector, project.insert, project.selectedPairId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open this project file.');
    }
  };

  const primerDesign = useMemo(
    () => selectedPair ? designPrimers(vector.sequence, insert.sequence, selectedPair, primerMode) : null,
    [vector.sequence, insert.sequence, selectedPair, primerMode],
  );
  const construct = useMemo(
    () => selectedPair ? simulateConstruct(vector.sequence, insert.sequence, selectedPair) : null,
    [vector.sequence, insert.sequence, selectedPair],
  );

  const usableEnzymes = analysis?.enzymes.filter((e) => e.usable) ?? [];
  const internalInsertSites = analysis?.enzymes.flatMap((e) => e.insertSites) ?? [];
  const vectorMapSites = usableEnzymes.flatMap((e) => e.vectorSites);

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="FindPrimers home">
          <span className="brand-mark"><Dna size={21} /></span>
          <span>FindPrimers</span><sup>v2</sup>
        </a>
        <nav className="header-actions">
          <input ref={projectInputRef} className="hidden-input" type="file" accept=".json,application/json" onChange={(e: ChangeEvent<HTMLInputElement>) => void importProject(e.target.files?.[0])} />
          <Tooltip content="Open a saved FindPrimers project (.json)">
            <button className="header-button" onClick={() => projectInputRef.current?.click()}><Upload size={15} /> Open project</button>
          </Tooltip>
          {analysis && <button className="header-button" onClick={exportProject}><Download size={15} /> Export</button>}
          <a className="github-link" href="https://github.com/lepusDZ/FindPrimers" target="_blank" rel="noreferrer">GitHub</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-glow hero-glow-a" /><div className="hero-glow hero-glow-b" />
          <h1>Restriction cloning,<br /><em>without the spreadsheet.</em></h1>
          <p className="hero-copy">Add a vector and insert, compare compatible restriction pairs, and generate primers in one focused workflow.</p>
        </section>

        <section className="workspace-section setup-section">
          <div className="section-heading">
            <div className="eyebrow">Start a design</div>
            <h2>Give FindPrimers two sequences.</h2>
            <p>Plain DNA, FASTA, and GenBank are accepted. GenBank CDS annotations are used when available.</p>
          </div>

          <div className="sequence-grid">
            <SequenceInputCard kind="vector" value={vector} onChange={markDirtyVector} />
            <SequenceInputCard kind="insert" value={insert} onChange={markDirtyInsert} />
          </div>

          <div className="analyze-row">
            <button className="example-button" onClick={loadExample}><Sparkles size={16} /> Try an example</button>
            <div className="analyze-action">
              {exampleNudge && <div className="analyze-nudge">Example ready <CornerRightDown size={18} /></div>}
              <button className="primary-button" disabled={!canAnalyze} onClick={() => runAnalysis()}>
                <WandSparkles size={18} /> Analyze cloning design <ArrowDown size={17} />
              </button>
            </div>
          </div>
          {error && !analysis && <div className="inline-error"><AlertCircle size={17} />{error}</div>}
        </section>

        {analysis && (
          <div ref={analysisRef} className="analysis-root">
            <section className="analysis-hero">
              <div className="analysis-title-row">
                <div>
                  <div className="eyebrow">03 · Restriction analysis</div>
                  <h2>{analysis.pairs.length ? 'A clean route is available.' : 'No clean pair found yet.'}</h2>
                  <p>{analysis.pairs.length ? `${analysis.pairs.length.toLocaleString()} candidate enzyme pairs ranked from the current sequence data.` : 'FindPrimers could not identify two different enzymes that each cut the vector once and do not cut the insert.'}</p>
                </div>
                <button className="secondary-button" onClick={() => { setAnalysis(null); setSelectedPair(null); window.scrollTo({ top: 520, behavior: 'smooth' }); }}><RefreshCw size={15} /> Edit sequences</button>
              </div>

              <div className="stat-grid">
                <div className="stat-card"><small>Vector</small><strong>{formatBp(vector.sequence.length)}</strong><span>{analysis.vectorOrfs.length} coding / ORF region{analysis.vectorOrfs.length === 1 ? '' : 's'}</span></div>
                <div className="stat-card"><small>Insert</small><strong>{formatBp(insert.sequence.length)}</strong><span>{internalInsertSites.length} restriction hit{internalInsertSites.length === 1 ? '' : 's'} across database</span></div>
                <div className="stat-card accent"><small>Usable enzymes</small><strong>{usableEnzymes.length}</strong><span>cut vector once · insert zero times</span></div>
                <div className="stat-card"><small>Candidate pairs</small><strong>{analysis.pairs.length.toLocaleString()}</strong><span>two different enzymes</span></div>
              </div>
            </section>

            <section className="workspace-section map-section">
              <div className="map-layout">
                <div className="map-panel">
                  <div className="panel-label"><span>Vector map</span><span className="subtle">top usable sites + coding regions</span></div>
                  <VectorMap
                    sequenceLength={vector.sequence.length}
                    title={vector.name || 'Vector'}
                    orfs={analysis.vectorOrfs}
                    sites={vectorMapSites}
                    selected={selectedPair ? [selectedPair.first, selectedPair.second] : []}
                  />
                  <div className="map-legend"><span><i className="legend-cut" /> restriction site</span><span><i className="legend-orf" /> CDS / ORF</span><span><i className="legend-selected" /> selected</span></div>
                </div>
                <div className="candidate-panel">
                  <div className="panel-label"><span>Ranked pairs</span><span className="subtle">heuristic score</span></div>
                  {analysis.pairs.length ? (
                    <PairSelector pairs={analysis.pairs} selectedId={selectedPair?.id} onSelect={setSelectedPair} />
                  ) : (
                    <div className="empty-state"><AlertCircle size={26} /><h3>No compatible pair</h3><p>Try a different vector/insert or add suitable restriction sites to the cloning region.</p></div>
                  )}
                </div>
              </div>

              {selectedPair && <InsertCompatibility length={insert.sequence.length} orfs={analysis.insertOrfs} pair={selectedPair} />}
            </section>

            {selectedPair && primerDesign && construct && (
              <>
                <section className="workspace-section selected-design-section">
                  <div className="selected-design-head">
                    <div>
                      <div className="eyebrow">Selected route</div>
                      <h2><span>{selectedPair.first.enzyme}</span><b>+</b><span>{selectedPair.second.enzyme}</span></h2>
                      <p>Recognition positions {selectedPair.first.position + 1} and {selectedPair.second.position + 1} · {selectedPair.removedLength} bp intervening vector segment.</p>
                    </div>
                    <div className="score-orb"><strong>{selectedPair.score}</strong><small>design score</small></div>
                  </div>
                  <div className="reason-grid">
                    {selectedPair.rationale.slice(0, 4).map((reason) => <div key={reason} className="reason good"><CheckCircle2 size={15} />{reason}</div>)}
                    {selectedPair.warnings.map((warning) => <div key={warning} className="reason warn"><AlertCircle size={15} />{warning}</div>)}
                  </div>
                  <div className="scoring-note"><Info size={15} /> Ranking is a design heuristic, not an enzyme-condition database. Buffer compatibility, methylation sensitivity, star activity, and cleavage-end compatibility should be checked against the enzyme supplier before ordering.</div>
                </section>

                <section className="workspace-section">
                  <PrimerPanel design={primerDesign} mode={primerMode} onModeChange={setPrimerMode} />
                </section>

                <section className="construct-section">
                  <div className="construct-copy">
                    <div className="eyebrow">05 · In-silico preview</div>
                    <h2>See the construct before you order.</h2>
                    <p>The preview replaces the shorter vector arc between the two selected recognition sites with the insert, preserving both recognition sequences.</p>
                    <div className="construct-math">
                      <span>{formatBp(vector.sequence.length)} vector</span><b>−</b><span>{formatBp(construct.removedLength)} removed</span><b>+</b><span>{formatBp(insert.sequence.length)} insert</span><b>=</b><strong>{formatBp(construct.finalLength)}</strong>
                    </div>
                    <div className="simulation-note"><Info size={15} />{construct.note}</div>
                  </div>
                  <div className="construct-map-card">
                    <VectorMap
                      compact
                      sequenceLength={construct.finalLength}
                      title="Predicted construct"
                      insertion={{ start: construct.insertionStart, end: construct.insertionEnd, label: formatBp(insert.sequence.length) }}
                    />
                  </div>
                </section>

                <section className="export-section">
                  <div className="export-icon"><Layers3 size={25} /></div>
                  <div><h3>Keep the design, not your browser state.</h3><p>FindPrimers stores nothing automatically. Export a portable project JSON when you want to resume later.</p></div>
                  <button className="primary-button" onClick={exportProject}><Download size={17} /> Export project</button>
                </section>
              </>
            )}
          </div>
        )}
      </main>

      <footer>
        <div><span className="brand footer-brand"><span className="brand-mark"><Dna size={17} /></span>FindPrimers</span><span>Open-source cloning design aid.</span></div>
        <p>Validate final primers and enzyme conditions before experimental use.</p>
      </footer>
    </div>
  );
}
