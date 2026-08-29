const COMPLEMENTS: Record<string, string> = {
  A: 'T', T: 'A', G: 'C', C: 'G', U: 'A',
  R: 'Y', Y: 'R', S: 'S', W: 'W', K: 'M', M: 'K',
  B: 'V', V: 'B', D: 'H', H: 'D', N: 'N',
};

const VALID_DNA = /^[ACGTRYSWKMBDHVN]*$/;

export function normalizeSequence(input: string): string {
  return input
    .toUpperCase()
    .replace(/U/g, 'T')
    .replace(/[^A-Z]/g, '');
}

export function validateSequence(sequence: string): { valid: boolean; invalid: string[] } {
  const normalized = normalizeSequence(sequence);
  const invalid = Array.from(new Set(normalized.split('').filter((base) => !VALID_DNA.test(base))));
  return { valid: invalid.length === 0 && normalized.length > 0, invalid };
}

export function complement(sequence: string): string {
  return sequence.toUpperCase().split('').map((base) => COMPLEMENTS[base] ?? 'N').join('');
}

export function reverseComplement(sequence: string): string {
  return complement(sequence).split('').reverse().join('');
}

export function gcPercent(sequence: string): number {
  const bases = sequence.toUpperCase().split('').filter((b) => 'ACGT'.includes(b));
  if (!bases.length) return 0;
  const gc = bases.filter((b) => b === 'G' || b === 'C').length;
  return (gc / bases.length) * 100;
}

export function formatBp(length: number): string {
  if (length >= 1000) return `${(length / 1000).toFixed(length >= 10000 ? 1 : 2)} kb`;
  return `${length} bp`;
}

export function circularSlice(sequence: string, start: number, length: number): string {
  if (!sequence.length || length <= 0) return '';
  const n = sequence.length;
  const normalizedStart = ((start % n) + n) % n;
  const repeats = Math.ceil((normalizedStart + length) / n) + 1;
  return sequence.repeat(repeats).slice(normalizedStart, normalizedStart + length);
}

export function rangeContains(position: number, start: number, end: number, wraps: boolean, length: number): boolean {
  if (!wraps) return position >= start && position < end;
  const p = ((position % length) + length) % length;
  return p >= start || p < end;
}
