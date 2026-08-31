import enzymesJson from '../data/enzymes.json';
import type { AnalysisResult, EnzymeAnalysis, EnzymePair, Orf, ParsedSequence, RestrictionSite } from './types';
import { findOrfs } from './orfs';
import { rangeContains } from './sequence';

const ENZYMES = enzymesJson as Record<string, string>;

const CLASS_TO_IUPAC: Record<string, string> = {
  AG: 'R', CT: 'Y', CG: 'S', AT: 'W', GT: 'K', AC: 'M',
  CGT: 'B', AGT: 'D', ACT: 'H', ACG: 'V', ACGT: 'N',
};

export function motifLength(pattern: string): number {
  let length = 0;
  for (let i = 0; i < pattern.length; i += 1) {
    if (pattern[i] === '[') {
      const end = pattern.indexOf(']', i);
      if (end >= 0) i = end;
      length += 1;
    } else {
      length += 1;
    }
  }
  return length;
}

export function patternToDisplay(pattern: string): string {
  return pattern.replace(/\[([ACGT]+)\]/g, (_, raw: string) => {
    const key = raw.split('').sort().join('');
    return CLASS_TO_IUPAC[key] ?? 'N';
  });
}

function overlapsOrf(position: number, length: number, orfs: Orf[], sequenceLength: number): boolean {
  for (let offset = 0; offset < length; offset += 1) {
    const p = (position + offset) % sequenceLength;
    if (orfs.some((orf) => rangeContains(p, orf.start, orf.end, orf.wraps, sequenceLength))) return true;
  }
  return false;
}

function findPatternSites(sequence: string, circular: boolean, enzyme: string, pattern: string, orfs: Orf[]): RestrictionSite[] {
  const length = motifLength(pattern);
  if (!sequence.length || length > sequence.length && !circular) return [];
  const regex = new RegExp(`^(?:${pattern})`);
  const scan = circular ? sequence + sequence.slice(0, Math.max(0, length - 1)) : sequence;
  const limit = circular ? sequence.length : Math.max(0, sequence.length - length + 1);
  const sites: RestrictionSite[] = [];

  for (let position = 0; position < limit; position += 1) {
    const match = scan.slice(position, position + length).match(regex);
    if (!match) continue;
    sites.push({
      enzyme,
      pattern,
      recognition: match[0],
      position,
      length,
      orfConflict: overlapsOrf(position, length, orfs, sequence.length),
    });
  }
  return sites;
}

export function analyzeEnzymes(vector: ParsedSequence, insert: ParsedSequence, vectorOrfs: Orf[], insertOrfs: Orf[]): EnzymeAnalysis[] {
  return Object.entries(ENZYMES).map(([pattern, enzyme]) => {
    const vectorSites = findPatternSites(vector.sequence, true, enzyme, pattern, vectorOrfs);
    const insertSites = findPatternSites(insert.sequence, false, enzyme, pattern, insertOrfs);
    return {
      enzyme,
      pattern,
      recognition: patternToDisplay(pattern),
      recognitionLength: motifLength(pattern),
      vectorSites,
      insertSites,
      usable: vectorSites.length === 1 && insertSites.length === 0,
      orfConflict: vectorSites.length === 1 && vectorSites[0].orfConflict,
    };
  });
}

function deriveArc(a: RestrictionSite, b: RestrictionSite, vectorLength: number) {
  const [low, high] = a.position <= b.position ? [a, b] : [b, a];
  const directGap = Math.max(0, high.position - (low.position + low.length));
  const wrapGap = Math.max(0, vectorLength - (high.position + high.length) + low.position);
  if (directGap <= wrapGap) {
    return { first: low, second: high, removedLength: directGap, wraps: false };
  }
  return { first: high, second: low, removedLength: wrapGap, wraps: true };
}

export function isSingleEnzymeRoute(pair: EnzymePair): boolean {
  return pair.first.enzyme === pair.second.enzyme
    && pair.first.pattern === pair.second.pattern
    && pair.first.position === pair.second.position;
}

export function getInterveningSegment(pair: EnzymePair, vectorLength: number): { start: number; end: number } | undefined {
  if (vectorLength <= 0 || isSingleEnzymeRoute(pair)) return undefined;
  return {
    start: (pair.first.position + pair.first.length) % vectorLength,
    end: pair.second.position % vectorLength,
  };
}

function buildPair(a: RestrictionSite, b: RestrictionSite, vectorLength: number, singleEnzyme = false): EnzymePair | null {
  if (!singleEnzyme) {
    const delta = Math.abs(a.position - b.position);
    const circularDelta = Math.min(delta, vectorLength - delta);
    if (circularDelta < Math.max(a.length, b.length)) return null;
  }

  const arc = singleEnzyme
    ? { first: a, second: a, removedLength: 0, wraps: false }
    : deriveArc(a, b, vectorLength);
  const warnings: string[] = [];
  const rationale: string[] = singleEnzyme
    ? ['Enzyme cuts the vector once', 'Enzyme does not cut the insert', 'Single-site route removes no vector sequence']
    : ['Both enzymes cut the vector once', 'Neither enzyme cuts the insert'];
  let score = singleEnzyme ? 82 : 100;

  if (singleEnzyme) {
    warnings.push('Same enzyme on both ends gives a non-directional insert');
  } else {
    const removedFraction = vectorLength ? arc.removedLength / vectorLength : 1;
    score -= Math.min(42, removedFraction * 70);
    if (arc.removedLength <= 80) rationale.push('Sites are close together, preserving the backbone');
    else if (arc.removedLength <= 400) rationale.push('Moderate backbone deletion between sites');
    else warnings.push(`${arc.removedLength} bp of vector lies between the selected sites`);
  }

  const conflicts = singleEnzyme ? Number(a.orfConflict) : Number(a.orfConflict) + Number(b.orfConflict);
  if (conflicts) {
    score -= conflicts * 28;
    warnings.push(conflicts > 1 ? 'Both cut sites overlap coding/ORF regions' : 'A selected cut site overlaps a coding/ORF region');
  } else {
    rationale.push(singleEnzyme ? 'Selected vector site avoids detected coding/ORF regions' : 'Selected vector sites avoid detected coding/ORF regions');
  }

  const minRecognition = Math.min(a.length, b.length);
  if (minRecognition >= 6) {
    score += 7;
    rationale.push(singleEnzyme ? 'Recognition site is at least 6 bp long' : 'Both recognition sites are at least 6 bp long');
  } else if (minRecognition <= 4) {
    score -= 12;
    warnings.push(singleEnzyme ? 'Enzyme has a short recognition motif' : 'At least one enzyme has a short recognition motif');
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  return {
    id: `${arc.first.enzyme}::${arc.second.enzyme}::${arc.first.position}::${arc.second.position}`,
    first: arc.first,
    second: arc.second,
    removedLength: arc.removedLength,
    wraps: arc.wraps,
    score,
    warnings,
    rationale,
  };
}

export function rankEnzymePairs(enzymes: EnzymeAnalysis[], vectorLength: number): EnzymePair[] {
  const usable = enzymes.filter((e) => e.usable);
  const pairs: EnzymePair[] = [];

  for (const enzyme of usable) {
    const pair = buildPair(enzyme.vectorSites[0], enzyme.vectorSites[0], vectorLength, true);
    if (pair) pairs.push(pair);
  }

  for (let i = 0; i < usable.length; i += 1) {
    for (let j = i + 1; j < usable.length; j += 1) {
      const pair = buildPair(usable[i].vectorSites[0], usable[j].vectorSites[0], vectorLength);
      if (pair) pairs.push(pair);
    }
  }

  return pairs.sort((a, b) => b.score - a.score || a.removedLength - b.removedLength);
}

export function analyzeDesign(vector: ParsedSequence, insert: ParsedSequence): AnalysisResult {
  const vectorOrfs = findOrfs(vector.sequence, true, vector.annotations);
  const insertOrfs = findOrfs(insert.sequence, false, insert.annotations);
  const enzymes = analyzeEnzymes(vector, insert, vectorOrfs, insertOrfs);
  const pairs = rankEnzymePairs(enzymes, vector.sequence.length);
  return { vectorOrfs, insertOrfs, enzymes, pairs };
}
