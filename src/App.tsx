import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import {
  AlertCircle, ArrowDown, ArrowUp, Dna, Download, RefreshCw, Sparkles, Upload, WandSparkles,
} from 'lucide-react';
import SequenceInputCard from './components/SequenceInputCard';
import Tooltip from './components/Tooltip';
import DesignWorkspace from './components/DesignWorkspace';
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
  const vectorMapSites = usableEnzymes.flatMap((e) => e.vectorSites);

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="FindPrimers home">
          <span className="brand-mark"><Dna size={21} /></span>
          <span>FindPrimers</span>
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
              <button className="primary-button" disabled={!canAnalyze} onClick={() => runAnalysis()}>
                <WandSparkles size={18} /> Analyze cloning design <ArrowDown size={17} />
              </button>
              {exampleNudge && <div className="analyze-nudge"><ArrowUp size={16} /><span>Example ready — analyze it</span></div>}
            </div>
          </div>
          {error && !analysis && <div className="inline-error"><AlertCircle size={17} />{error}</div>}
        </section>

        {analysis && (
          <div ref={analysisRef} className="analysis-root">
            <section className="analysis-hero">
              <div className="analysis-title-row">
                <div>
                  <div className="eyebrow">Restriction analysis</div>
                  <h2>{analysis.pairs.length ? 'Choose a cloning route.' : 'No clean pair found yet.'}</h2>
                  <p>{analysis.pairs.length ? 'Select a candidate on the left and compare its route, primers, and predicted construct without leaving the workspace.' : 'FindPrimers could not identify two different enzymes that each cut the vector once and do not cut the insert.'}</p>
                </div>
                <button className="secondary-button" onClick={() => { setAnalysis(null); setSelectedPair(null); window.scrollTo({ top: 520, behavior: 'smooth' }); }}><RefreshCw size={15} /> Edit sequences</button>
              </div>

              <div className="analysis-summary">
                <span><strong>{formatBp(vector.sequence.length)}</strong> vector</span>
                <i>·</i>
                <span><strong>{formatBp(insert.sequence.length)}</strong> insert</span>
                <i>·</i>
                <span><strong>{usableEnzymes.length}</strong> usable enzymes</span>
                <i>·</i>
                <span><strong>{analysis.pairs.length.toLocaleString()}</strong> candidate pairs</span>
              </div>
            </section>

            <DesignWorkspace
              analysis={analysis}
              vector={vector}
              insert={insert}
              vectorSites={vectorMapSites}
              selectedPair={selectedPair}
              onSelectPair={setSelectedPair}
              primerDesign={primerDesign}
              primerMode={primerMode}
              onPrimerModeChange={setPrimerMode}
              construct={construct}
            />
          </div>
        )}
      </main>

      <footer>
        <div><span className="brand footer-brand"><span className="brand-mark"><Dna size={17} /></span>FindPrimers</span></div>
        <p>Validate final primers and enzyme conditions before experimental use.</p>
      </footer>
    </div>
  );
}
