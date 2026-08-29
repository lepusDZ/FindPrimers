import type { Annotation, ParsedSequence } from './types';
import { normalizeSequence } from './sequence';

function parseFasta(text: string): ParsedSequence {
  const lines = text.trim().split(/\r?\n/);
  const header = lines[0].replace(/^>/, '').trim();
  const sequenceLines: string[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].startsWith('>')) break;
    sequenceLines.push(lines[i]);
  }
  return {
    name: header || 'FASTA sequence',
    sequence: normalizeSequence(sequenceLines.join('')),
    circular: false,
    annotations: [],
    source: 'fasta',
  };
}

function parseLocation(raw: string, sequenceLength: number): { start: number; end: number; strand: 1 | -1; wraps: boolean } | null {
  const strand: 1 | -1 = raw.includes('complement') ? -1 : 1;
  const numbers = Array.from(raw.matchAll(/\d+/g)).map((m) => Number(m[0]));
  if (!numbers.length) return null;
  const first = Math.max(0, numbers[0] - 1);
  const last = Math.min(sequenceLength, numbers[numbers.length - 1]);
  return { start: first, end: last, strand, wraps: first > last };
}

function parseGenbank(text: string): ParsedSequence {
  const locusLine = text.split(/\r?\n/).find((line) => line.startsWith('LOCUS')) ?? '';
  const locusParts = locusLine.trim().split(/\s+/);
  const name = locusParts[1] || 'GenBank sequence';
  const circular = /\bcircular\b/i.test(locusLine);
  const originIndex = text.search(/^ORIGIN\s*$/m);
  const sequenceBlock = originIndex >= 0 ? text.slice(originIndex + 'ORIGIN'.length).split('//')[0] : '';
  const sequence = normalizeSequence(sequenceBlock.replace(/\d+/g, ''));

  const annotations: Annotation[] = [];
  const featuresStart = text.search(/^FEATURES\s+/m);
  if (featuresStart >= 0 && originIndex > featuresStart) {
    const featureText = text.slice(featuresStart, originIndex);
    const lines = featureText.split(/\r?\n/);
    let current: { type: string; location: string; label?: string } | null = null;
    const flush = () => {
      if (!current) return;
      const loc = parseLocation(current.location, sequence.length);
      if (loc) {
        annotations.push({
          id: `gb-${annotations.length}-${loc.start}`,
          name: current.label || current.type,
          type: current.type,
          start: loc.start,
          end: loc.end,
          strand: loc.strand,
          wraps: loc.wraps,
        });
      }
      current = null;
    };

    for (const line of lines) {
      const featureMatch = line.match(/^\s{5}(\S+)\s+(.+)$/);
      if (featureMatch && !featureMatch[1].startsWith('/')) {
        flush();
        current = { type: featureMatch[1], location: featureMatch[2].trim() };
        continue;
      }
      if (current) {
        const labelMatch = line.match(/\/(?:label|gene|product)="?([^"\n]+)"?/);
        if (labelMatch && !current.label) current.label = labelMatch[1].trim();
        const locationContinuation = line.match(/^\s{21}([^/].*)$/);
        if (locationContinuation) current.location += locationContinuation[1].trim();
      }
    }
    flush();
  }

  return { name, sequence, circular, annotations, source: 'genbank' };
}

export function parseSequenceText(text: string, fallbackName: string, circularDefault: boolean): ParsedSequence {
  const trimmed = text.trim();
  if (trimmed.startsWith('>')) {
    const parsed = parseFasta(trimmed);
    return { ...parsed, circular: circularDefault };
  }
  if (/^LOCUS\s+/m.test(trimmed) && /^ORIGIN\s*$/m.test(trimmed)) {
    const parsed = parseGenbank(trimmed);
    return { ...parsed, circular: parsed.circular || circularDefault };
  }
  return {
    name: fallbackName,
    sequence: normalizeSequence(trimmed),
    circular: circularDefault,
    annotations: [],
    source: 'plain',
  };
}

export async function parseSequenceFile(file: File, fallbackName: string, circularDefault: boolean): Promise<ParsedSequence> {
  const text = await file.text();
  const parsed = parseSequenceText(text, fallbackName, circularDefault);
  if (parsed.name === fallbackName && file.name) parsed.name = file.name.replace(/\.[^.]+$/, '');
  return parsed;
}
