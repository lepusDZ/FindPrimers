import type { ConstructSimulation, EnzymePair, PrimerDesign, PrimerMetrics, PrimerMode, PrimerPairDesign } from './types';
import { circularSlice, gcPercent, reverseComplement } from './sequence';

const NN: Record<string, [number, number]> = {
  AA: [-7.9, -22.2], TT: [-7.9, -22.2],
  AT: [-7.2, -20.4], TA: [-7.2, -21.3],
  CA: [-8.5, -22.7], TG: [-8.5, -22.7],
  GT: [-8.4, -22.4], AC: [-8.4, -22.4],
  CT: [-7.8, -21.0], AG: [-7.8, -21.0],
  GA: [-8.2, -22.2], TC: [-8.2, -22.2],
  CG: [-10.6, -27.2], GC: [-9.8, -24.4],
  GG: [-8.0, -19.9], CC: [-8.0, -19.9],
};

const R = 1.987;

export function nearestNeighborTm(sequence: string, sodiumM = 0.05, primerM = 2.5e-7): number {
  const seq = sequence.toUpperCase();
  if (seq.length < 2 || /[^ACGT]/.test(seq)) {
    const at = (seq.match(/[AT]/g) || []).length;
    const gc = (seq.match(/[GC]/g) || []).length;
    return 2 * at + 4 * gc;
  }
  let dh = 0.2;
  let ds = -5.7;
  for (let i = 0; i < seq.length - 1; i += 1) {
    const term = NN[seq.slice(i, i + 2)];
    if (!term) continue;
    dh += term[0];
    ds += term[1];
  }
  const saltCorrection = 16.6 * Math.log10(Math.max(sodiumM, 1e-6));
  return (dh * 1000) / (ds + R * Math.log(primerM / 4)) - 273.15 + saltCorrection;
}

function maxComplementRun(a: string, b: string): number {
  const target = reverseComplement(b);
  let best = 0;
  for (let shift = -target.length; shift <= a.length; shift += 1) {
    let run = 0;
    for (let i = 0; i < a.length; i += 1) {
      const j = i - shift;
      if (j >= 0 && j < target.length && a[i] === target[j]) {
        run += 1;
        best = Math.max(best, run);
      } else {
        run = 0;
      }
    }
  }
  return best;
}

function threePrimeComplementRun(a: string, b: string): number {
  const target = reverseComplement(b);
  let best = 0;
  for (let shift = -target.length; shift <= a.length; shift += 1) {
    let run = 0;
    for (let i = 0; i < a.length; i += 1) {
      const j = i - shift;
      if (j >= 0 && j < target.length && a[i] === target[j]) run += 1;
      else run = 0;
      if (i >= a.length - 5) best = Math.max(best, run);
    }
  }
  return best;
}

function hairpinRisk(sequence: string): number {
  if (sequence.length < 10) return 0;
  let best = 0;
  for (let leftEnd = 4; leftEnd < sequence.length - 4; leftEnd += 1) {
    const left = sequence.slice(0, leftEnd);
    const right = sequence.slice(leftEnd + 3);
    if (right.length < 4) continue;
    best = Math.max(best, maxComplementRun(left, right));
  }
  return best;
}

function metrics(annealing: string, fullSequence: string): PrimerMetrics {
  return {
    annealingLength: annealing.length,
    tm: nearestNeighborTm(annealing),
    gc: gcPercent(annealing),
    hairpinRisk: hairpinRisk(fullSequence),
    homodimerRisk: Math.max(maxComplementRun(fullSequence, fullSequence), threePrimeComplementRun(fullSequence, fullSequence) + 1),
    threePrimeGc: /[GC]$/.test(annealing),
  };
}

interface Candidate {
  annealing: string;
  metrics: PrimerMetrics;
  score: number;
}

function annealingCandidate(sequence: string, direction: 'forward' | 'reverse', length: number, tail: string): Candidate {
  const annealing = direction === 'forward'
    ? sequence.slice(0, length)
    : reverseComplement(sequence.slice(-length));
  const m = metrics(annealing, tail + annealing);
  const score = Math.abs(m.tm - 62) * 1.5
    + Math.abs(m.gc - 50) * 0.08
    + Math.max(0, m.hairpinRisk - 3) * 2.3
    + Math.max(0, m.homodimerRisk - 4) * 1.8
    + (m.threePrimeGc ? 0 : 1.5);
  return { annealing, metrics: m, score };
}

function chooseOptimizedPair(insert: string, forwardTail: string, reverseTail: string): [Candidate, Candidate] {
  const maxLength = Math.min(32, insert.length);
  const minLength = Math.min(18, maxLength);
  const forwards: Candidate[] = [];
  const reverses: Candidate[] = [];
  for (let length = minLength; length <= maxLength; length += 1) {
    forwards.push(annealingCandidate(insert, 'forward', length, forwardTail));
    reverses.push(annealingCandidate(insert, 'reverse', length, reverseTail));
  }
  let best: [Candidate, Candidate] = [forwards[0], reverses[0]];
  let bestScore = Number.POSITIVE_INFINITY;
  for (const f of forwards) {
    for (const r of reverses) {
      const combined = f.score + r.score + Math.abs(f.metrics.tm - r.metrics.tm) * 2.2;
      if (combined < bestScore) {
        bestScore = combined;
        best = [f, r];
      }
    }
  }
  return best;
}

function makePrimer(name: 'Forward' | 'Reverse', clamp: string, restrictionSite: string, annealing: string): PrimerDesign {
  const fullSequence = clamp + restrictionSite + annealing;
  return { name, fullSequence, clamp, restrictionSite, annealingSequence: annealing, metrics: metrics(annealing, fullSequence) };
}

export function designPrimers(vector: string, insert: string, pair: EnzymePair, mode: PrimerMode): PrimerPairDesign {
  const forwardClamp = circularSlice(vector, pair.first.position - 6, 6);
  const reverseClamp = reverseComplement(circularSlice(vector, pair.second.position + pair.second.length, 6));
  const forwardSite = pair.first.recognition;
  const reverseSite = reverseComplement(pair.second.recognition);
  const forwardTail = forwardClamp + forwardSite;
  const reverseTail = reverseClamp + reverseSite;
  let forwardAnneal: string;
  let reverseAnneal: string;

  if (mode === 'quick') {
    const length = Math.min(20, insert.length);
    forwardAnneal = insert.slice(0, length);
    reverseAnneal = reverseComplement(insert.slice(-length));
  } else {
    [forwardAnneal, reverseAnneal] = chooseOptimizedPair(insert, forwardTail, reverseTail).map((c) => c.annealing) as [string, string];
  }

  const forward = makePrimer('Forward', forwardClamp, forwardSite, forwardAnneal);
  const reverse = makePrimer('Reverse', reverseClamp, reverseSite, reverseAnneal);
  const heterodimerRisk = Math.max(
    maxComplementRun(forward.fullSequence, reverse.fullSequence),
    threePrimeComplementRun(forward.fullSequence, reverse.fullSequence) + 1,
  );
  const warnings: string[] = [];
  if (Math.abs(forward.metrics.tm - reverse.metrics.tm) > 3) warnings.push('Annealing Tm differs by more than 3°C');
  if (forward.metrics.gc < 35 || forward.metrics.gc > 65 || reverse.metrics.gc < 35 || reverse.metrics.gc > 65) warnings.push('At least one annealing region has unusual GC content');
  if (Math.max(forward.metrics.hairpinRisk, reverse.metrics.hairpinRisk) >= 6) warnings.push('Potential hairpin complementarity detected');
  if (heterodimerRisk >= 6) warnings.push('Potential forward/reverse dimer complementarity detected');
  if (insert.length < 18) warnings.push('Insert is shorter than the normal optimized annealing window');

  return {
    mode,
    forward,
    reverse,
    tmDifference: Math.abs(forward.metrics.tm - reverse.metrics.tm),
    heterodimerRisk,
    warnings,
  };
}

export function simulateConstruct(vector: string, insert: string, pair: EnzymePair): ConstructSimulation {
  const a = pair.first;
  const b = pair.second;
  let sequence: string;
  let insertionStart: number;

  if (!pair.wraps) {
    const left = vector.slice(0, a.position + a.length);
    const right = vector.slice(b.position);
    sequence = left + insert + right;
    insertionStart = left.length;
  } else {
    const left = vector.slice(a.position, a.position + a.length);
    const retained = vector.slice(b.position + b.length, a.position);
    const rightSite = vector.slice(b.position, b.position + b.length);
    sequence = left + insert + rightSite + retained;
    insertionStart = left.length;
  }

  return {
    sequence,
    removedLength: pair.removedLength,
    finalLength: sequence.length,
    insertionStart,
    insertionEnd: insertionStart + insert.length,
    note: 'Sequence preview only. Cleavage offsets and sticky-end compatibility are not modeled yet; confirm the selected enzymes with the supplier before cloning.',
  };
}
