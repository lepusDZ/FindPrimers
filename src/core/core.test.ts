import { describe, expect, it } from 'vitest';
import type { ParsedSequence } from './types';
import { reverseComplement } from './sequence';
import { analyzeDesign, getInterveningSegment } from './restriction';
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
    expect((segment.end - segment.start + 100) % 100).toBe(pair.removedLength);
  });

  it('does not rank two enzyme names that occupy the same overlapping site as an independent pair', () => {
    const result = analyzeDesign(parsed(`AAAAACTCGAGAAAAAGAATTCAAAAA`, true), parsed('ATGGCCGCCGCCGCCGCCGCCTAA'));
    expect(result.pairs.some((pair) => Math.abs(pair.first.position - pair.second.position) < Math.max(pair.first.length, pair.second.length))).toBe(false);
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

  it('builds preflight checks from the same analysis and primer results', () => {
    const analysis = analyzeDesign(vector, insert);
    const design = designPrimers(vector.sequence, insert.sequence, pair, 'optimized');
    const simulation = simulateConstruct(vector.sequence, insert.sequence, pair);
    const checks = buildDesignChecks(analysis, pair, design, simulation);

    expect(checks.find((check) => check.id === 'vector-cuts')?.status).toBe('pass');
    expect(checks.find((check) => check.id === 'insert-cuts')?.status).toBe('pass');
    expect(checks.find((check) => check.id === 'enzyme-chemistry')?.status).toBe('review');
  });
});
