import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { CheckCircle2, CircleDot, FileText, Upload, X } from 'lucide-react';
import type { ParsedSequence } from '../core/types';
import { formatBp, validateSequence } from '../core/sequence';
import { parseSequenceFile, parseSequenceText } from '../core/parsers';

interface Props {
  kind: 'vector' | 'insert';
  value: ParsedSequence;
  onChange: (value: ParsedSequence) => void;
}

export default function SequenceInputCard({ kind, value, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const validation = validateSequence(value.sequence);
  const isVector = kind === 'vector';

  const updateText = (text: string) => {
    const parsed = parseSequenceText(text, isVector ? 'Vector' : 'Insert', isVector);
    onChange({ ...parsed, circular: isVector });
  };

  const loadFile = async (file?: File) => {
    if (!file) return;
    const parsed = await parseSequenceFile(file, isVector ? 'Vector' : 'Insert', isVector);
    onChange({ ...parsed, circular: isVector });
  };

  return (
    <section
      className={`sequence-card ${dragging ? 'is-dragging' : ''}`}
      onDragOver={(event: DragEvent<HTMLElement>) => { event.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event: DragEvent<HTMLElement>) => {
        event.preventDefault();
        setDragging(false);
        void loadFile(event.dataTransfer.files?.[0]);
      }}
    >
      <div className="sequence-card-head">
        <div>
          <div className="eyebrow">{isVector ? '01 · Backbone' : '02 · Cargo'}</div>
          <h2>{isVector ? 'Vector' : 'Insert'}</h2>
        </div>
        <span className="shape-pill">
          {isVector ? <CircleDot size={14} /> : <span className="linear-glyph">↔</span>}
          {isVector ? 'Circular' : 'Linear'}
        </span>
      </div>

      <p className="sequence-help">
        {isVector
          ? 'Paste your plasmid or drop a FASTA / GenBank file.'
          : 'Paste the sequence you want to clone or drop a FASTA / GenBank file.'}
      </p>

      <div className="textarea-shell">
        <textarea
          value={value.sequence}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) => updateText(event.target.value)}
          placeholder={isVector ? 'Paste vector DNA…' : 'Paste insert DNA…'}
          spellCheck={false}
        />
        {value.sequence && (
          <button className="icon-button clear-button" onClick={() => onChange({ ...value, sequence: '', annotations: [] })} aria-label="Clear sequence">
            <X size={16} />
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        className="hidden-input"
        type="file"
        accept=".fa,.fasta,.fna,.gb,.gbk,.txt,text/plain"
        onChange={(event: ChangeEvent<HTMLInputElement>) => void loadFile(event.target.files?.[0])}
      />

      <div className="sequence-card-actions">
        <button className="secondary-button" onClick={() => fileRef.current?.click()}>
          <Upload size={16} /> Upload file
        </button>
        <div className="sequence-status">
          {validation.valid ? (
            <>
              <CheckCircle2 size={16} />
              <span>{formatBp(value.sequence.length)}</span>
              {value.annotations.length > 0 && <span>· {value.annotations.length} annotations</span>}
            </>
          ) : value.sequence.length > 0 ? (
            <>
              <FileText size={16} />
              <span>Unsupported symbols: {validation.invalid.join(', ') || 'unknown'}</span>
            </>
          ) : (
            <span>ACGT + IUPAC bases accepted</span>
          )}
        </div>
      </div>

      {value.source !== 'plain' && value.sequence && (
        <div className="file-meta">
          <FileText size={14} />
          <span>{value.name}</span>
          <span className="dot">•</span>
          <span>{value.source.toUpperCase()}</span>
        </div>
      )}
    </section>
  );
}
