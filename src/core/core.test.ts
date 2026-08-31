import { describe, expect, it } from 'vitest';
import type { ParsedSequence } from './types';
import { reverseComplement } from './sequence';
import { analyzeDesign, getInterveningSegment, isSingleEnzymeRoute } from './restriction';
import { designPrimers, simulateConstruct } from './primers';
import { parseSequenceText } from './parsers';
import { buildDesignChecks } from './checks';

const parsed = (sequence: string, circular = false): ParsedSequence => ({
  name: circular ? 'Vector' : 'Insert', sequence, circular, annotations: [], source: 'plain',
});

describe('sequence utilities', () => {
  it('reverse-complements IUPAC DNA', () => {
    expect(reverseComplement('ATGCRY')).toBe('RYGCAT');
  });
});


describe('sequence parsing', () => {
  it('parses FASTA input', () => {
    const result = parseSequenceText('>example\nATGC ATGC', 'Sequence', false);
    expect(result.name).toBe('example');
    expect(result.sequence).toBe('ATGCATGC');
    expect(result.source).toBe('fasta');
  });

  it('reads GenBank CDS annotations', () => {
    const genbank = `LOCUS       TEST        30 bp    DNA     circular
FEATURES             Location/Qualifiers
     CDS             1..12
                     /gene="demo"
ORIGIN
        1 atggccgcctaaatggccgcctaaatggcc
//`;
    const result = parseSequenceText(genbank, 'Vector', true);
    expect(result.circular).toBe(true);
    expect(result.annotations[0]?.name).toBe('demo');
    expect(result.annotations[0]?.type).toBe('CDS');
  });
});

describe('restriction analysis', () => {
  it('treats zero insert sites as desirable', () => {
    const result = analyzeDesign(parsed(`AAAAAGAATTCAAAAAAAAAAAAACTCGAGAAAAA`, true), parsed('ATGGCCGCCGCCGCCGCCGCCTAA'));
    const ecoRI = result.enzymes.find((e) => e.enzyme === 'EcoRI');
    expect(ecoRI?.vectorSites).toHaveLength(1);
    expect(ecoRI?.insertSites).toHaveLength(0);
    expect(ecoRI?.usable).toBe(true);
  });

  it('does not lose enzymes with 5+ sites in the insert', () => {
    const result = analyzeDesign(parsed(`AAAAAGAATTCAAAAAAAAAAAAACTCGAGAAAAA`, true), parsed(`ATG${'GAATTC'.repeat(6)}TAA`));
    const ecoRI = result.enzymes.find((e) => e.enzyme === 'EcoRI');
    expect(ecoRI?.insertSites).toHaveLength(6);
    expect(ecoRI?.usable).toBe(false);
  });

  it('finds a recognition site that crosses the circular origin', () => {
    const vector = parsed(`TT${'A'.repeat(30)}GAAT`, true); // GAAT + TC across origin = GAATTC
    vector.sequence = `TC${'A'.repeat(30)}GAAT`;
    const result = analyzeDesign(vector, parsed('ATGGCCGCCGCCGCCGCCGCCTAA'));
    const ecoRI = result.enzymes.find((e) => e.enzyme === 'EcoRI');
    expect(ecoRI?.vectorSites).toHaveLength(1);
    expect(ecoRI?.vectorSites[0].position).toBe(vector.sequence.length - 4);
  });


  it('keeps the displayed intervening segment aligned with the pair length', () => {
    const site = (enzyme: string, position: number) => ({
      enzyme, pattern: 'AAAAAA', recognition: 'AAAAAA', position, length: 6, orfConflict: false,
    });
    const pair = {
      id: 'wrap', first: site('A', 90), second: site('B', 10), removedLength: 14, wraps: true, score: 100, warnings: [], rationale: [],
    };
    const segment = getInterveningSegment(pair, 100);
    expect(segment).toEqual({ start: 96, end: 10 });
    expect(segment).toBeDefined();
    expect((segment!.end - segment!.start + 100) % 100).toBe(pair.removedLength);
  });

  it('does not rank two enzyme names that occupy the same overlapping site as an independent pair', () => {
    const result = analyzeDesign(parsed(`AAAAACTCGAGAAAAAGAATTCAAAAA`, true), parsed('ATGGCCGCCGCCGCCGCCGCCTAA'));
    expect(result.pairs
      .filter((pair) => !isSingleEnzymeRoute(pair))
      .some((pair) => Math.abs(pair.first.position - pair.second.position) < Math.max(pair.first.length, pair.second.length)))
      .toBe(false);
  });


  it('offers a single-enzyme route for a unique insert-safe vector site', () => {
    const result = analyzeDesign(parsed(`AAAAAGAATTCAAAAAAAAAAAAACTCGAGAAAAA`, true), parsed('ATGGCCGCCGCCGCCGCCGCCTAA'));
    const ecoRI = result.pairs.find((pair) => pair.first.enzyme === 'EcoRI' && pair.second.enzyme === 'EcoRI');
    expect(ecoRI).toBeDefined();
    expect(ecoRI?.removedLength).toBe(0);
    expect(ecoRI && isSingleEnzymeRoute(ecoRI)).toBe(true);
    expect(ecoRI && getInterveningSegment(ecoRI, 36)).toBeUndefined();
  });

  it('represents every usable enzyme in at least one ranked route', () => {
    const result = analyzeDesign(parsed(`AAAAAGAATTCAAAAAAAAAAAAACTCGAGAAAAA`, true), parsed('ATGGCCGCCGCCGCCGCCGCCTAA'));
    const represented = new Set(result.pairs.flatMap((pair) => [pair.first.enzyme, pair.second.enzyme]));
    for (const enzyme of result.enzymes.filter((entry) => entry.usable)) {
      expect(represented.has(enzyme.enzyme)).toBe(true);
    }
  });
});

describe('primer design and simulation', () => {
  const vector = parsed(`AAAAAGAATTCAAAAAAAAAAAAAAAAAAAAAAACTCGAGAAAAA`, true);
  const insert = parsed('ATGGCTGACGTTGAACTGCTGCTGAAGGCCGATGATGACGAGCTGATCGTCAACGACGCCATCGTGGACGAGATCGCCGCCATCAAGGAGTTCGAGGACCTGATCAAGGCCTAA');
  const pair = analyzeDesign(vector, insert).pairs.find((p) => new Set([p.first.enzyme, p.second.enzyme]).has('EcoRI') && new Set([p.first.enzyme, p.second.enzyme]).has('XhoI'))!;

  it('keeps the legacy-style 20 nt annealing region in quick mode', () => {
    const design = designPrimers(vector.sequence, insert.sequence, pair, 'quick');
    expect(design.forward.metrics.annealingLength).toBe(20);
    expect(design.reverse.metrics.annealingLength).toBe(20);
  });

  it('optimizes annealing length in optimized mode', () => {
    const design = designPrimers(vector.sequence, insert.sequence, pair, 'optimized');
    expect(design.forward.metrics.annealingLength).toBeGreaterThanOrEqual(18);
    expect(design.forward.metrics.annealingLength).toBeLessThanOrEqual(32);
    expect(design.tmDifference).toBeLessThan(6);
  });

  it('returns a construct whose reported and actual lengths agree', () => {
    const simulation = simulateConstruct(vector.sequence, insert.sequence, pair);
    expect(simulation.sequence.length).toBe(simulation.finalLength);
    expect(simulation.finalLength).toBe(vector.sequence.length - pair.removedLength + insert.sequence.length);
  });


  it('inserts without deleting vector sequence for a single-enzyme route', () => {
    const singlePair = analyzeDesign(vector, insert).pairs.find((candidate) => candidate.first.enzyme === 'EcoRI' && candidate.second.enzyme === 'EcoRI')!;
    const simulation = simulateConstruct(vector.sequence, insert.sequence, singlePair);
    expect(simulation.removedLength).toBe(0);
    expect(simulation.sequence.length).toBe(vector.sequence.length + insert.sequence.length);
    expect(simulation.finalLength).toBe(vector.sequence.length + insert.sequence.length);
  });


  it('flags a single-enzyme route as non-directional in preflight checks', () => {
    const analysis = analyzeDesign(vector, insert);
    const singlePair = analysis.pairs.find((candidate) => candidate.first.enzyme === 'EcoRI' && candidate.second.enzyme === 'EcoRI')!;
    const design = designPrimers(vector.sequence, insert.sequence, singlePair, 'optimized');
    const checks = buildDesignChecks(analysis, singlePair, design);
    expect(checks.find((check) => check.id === 'directionality')?.status).toBe('review');
  });

  it('builds preflight checks from the same analysis and primer results', () => {
    const analysis = analyzeDesign(vector, insert);
    const design = designPrimers(vector.sequence, insert.sequence, pair, 'optimized');
    const checks = buildDesignChecks(analysis, pair, design);

    expect(checks.find((check) => check.id === 'vector-cuts')?.status).toBe('pass');
    expect(checks.find((check) => check.id === 'insert-cuts')?.status).toBe('pass');
    expect(checks.find((check) => check.id === 'primer-tm')?.status).toBe('pass');
  });
});
