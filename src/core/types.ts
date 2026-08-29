export type Strand = 1 | -1;
export type PrimerMode = 'quick' | 'optimized';

export interface Annotation {
  id: string;
  name: string;
  type: string;
  start: number;
  end: number;
  strand: Strand;
  wraps?: boolean;
}

export interface ParsedSequence {
  name: string;
  sequence: string;
  circular: boolean;
  annotations: Annotation[];
  source: 'plain' | 'fasta' | 'genbank';
}

export interface RestrictionSite {
  enzyme: string;
  pattern: string;
  recognition: string;
  position: number;
  length: number;
  orfConflict: boolean;
}

export interface EnzymeAnalysis {
  enzyme: string;
  pattern: string;
  recognition: string;
  recognitionLength: number;
  vectorSites: RestrictionSite[];
  insertSites: RestrictionSite[];
  usable: boolean;
  orfConflict: boolean;
}

export interface Orf {
  id: string;
  start: number;
  end: number;
  strand: Strand;
  length: number;
  wraps: boolean;
  source: 'predicted' | 'annotation';
  label: string;
}

export interface EnzymePair {
  id: string;
  first: RestrictionSite;
  second: RestrictionSite;
  removedLength: number;
  wraps: boolean;
  score: number;
  warnings: string[];
  rationale: string[];
}

export interface PrimerMetrics {
  annealingLength: number;
  tm: number;
  gc: number;
  hairpinRisk: number;
  homodimerRisk: number;
  threePrimeGc: boolean;
}

export interface PrimerDesign {
  name: 'Forward' | 'Reverse';
  fullSequence: string;
  clamp: string;
  restrictionSite: string;
  annealingSequence: string;
  metrics: PrimerMetrics;
}

export interface PrimerPairDesign {
  mode: PrimerMode;
  forward: PrimerDesign;
  reverse: PrimerDesign;
  tmDifference: number;
  heterodimerRisk: number;
  warnings: string[];
}

export interface ConstructSimulation {
  sequence: string;
  removedLength: number;
  finalLength: number;
  insertionStart: number;
  insertionEnd: number;
  note: string;
}

export interface AnalysisResult {
  vectorOrfs: Orf[];
  insertOrfs: Orf[];
  enzymes: EnzymeAnalysis[];
  pairs: EnzymePair[];
}

export interface ProjectFile {
  schemaVersion: 2;
  app: 'FindPrimers';
  createdAt: string;
  vector: ParsedSequence;
  insert: ParsedSequence;
  selectedPairId?: string;
  primerMode: PrimerMode;
}
