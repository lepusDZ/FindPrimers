import type { Annotation, Orf, Strand } from './types';
import { reverseComplement } from './sequence';

const STOPS = new Set(['TAA', 'TAG', 'TGA']);

function scanStrand(sequence: string, circular: boolean, strand: Strand, minLength: number, maxLength: number): Orf[] {
  const n = sequence.length;
  if (n < 6) return [];
  const source = circular ? sequence + sequence : sequence;
  const out: Orf[] = [];
  const seen = new Set<string>();

  for (let start = 0; start < n; start += 1) {
    if (source.slice(start, start + 3) !== 'ATG') continue;
    const limit = Math.min(source.length - 2, start + Math.min(maxLength, circular ? n : source.length));
    for (let stop = start + 3; stop <= limit; stop += 3) {
      const codon = source.slice(stop, stop + 3);
      if (!STOPS.has(codon)) continue;
      const endExclusive = stop + 3;
      const length = endExclusive - start;
      if (length >= minLength && length <= maxLength) {
        let mappedStart = start;
        let mappedEnd = endExclusive % n;
        let wraps = circular && endExclusive > n;
        if (strand === -1) {
          const originalStart = (n - (endExclusive % n)) % n;
          const originalEnd = (n - (start % n)) % n;
          mappedStart = originalStart;
          mappedEnd = originalEnd;
          wraps = originalStart >= originalEnd && length < n;
        }
        const key = `${mappedStart}:${mappedEnd}:${strand}:${length}`;
        if (!seen.has(key)) {
          seen.add(key);
          out.push({
            id: `orf-${strand}-${mappedStart}-${mappedEnd}`,
            start: mappedStart,
            end: mappedEnd,
            strand,
            length,
            wraps,
            source: 'predicted',
            label: `ORF ${strand === 1 ? '+' : '−'} · ${length} bp`,
          });
        }
      }
      break;
    }
  }
  return out;
}

function annotationToOrf(annotation: Annotation, sequenceLength: number): Orf | null {
  const type = annotation.type.toLowerCase();
  if (!['cds', 'gene', 'orf'].includes(type)) return null;
  const wraps = Boolean(annotation.wraps || annotation.start > annotation.end);
  const length = wraps
    ? sequenceLength - annotation.start + annotation.end
    : Math.max(0, annotation.end - annotation.start);
  if (!length) return null;
  return {
    id: `annotation-${annotation.id}`,
    start: annotation.start,
    end: annotation.end,
    strand: annotation.strand,
    length,
    wraps,
    source: 'annotation',
    label: annotation.name,
  };
}

export function findOrfs(sequence: string, circular: boolean, annotations: Annotation[] = [], minLength = 90, maxLength = 6000): Orf[] {
  const annotated = annotations
    .map((a) => annotationToOrf(a, sequence.length))
    .filter((o): o is Orf => Boolean(o));
  if (annotated.length) return annotated;

  const forward = scanStrand(sequence, circular, 1, minLength, maxLength);
  const reverse = scanStrand(reverseComplement(sequence), circular, -1, minLength, maxLength);
  return [...forward, ...reverse].sort((a, b) => b.length - a.length);
}
