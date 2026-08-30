import { AlertTriangle, Check, FlaskConical } from 'lucide-react';
import type { AnalysisResult, ConstructSimulation, EnzymePair, PrimerPairDesign } from '../core/types';
import { buildDesignChecks, type DesignCheck } from '../core/checks';

interface Props {
  analysis: AnalysisResult;
  pair: EnzymePair;
  primers: PrimerPairDesign;
  construct: ConstructSimulation;
}

function CheckRow({ check }: { check: DesignCheck }) {
  const passed = check.status === 'pass';
  return (
    <div className={`design-check ${check.status}`}>
      <span className="design-check-icon">{passed ? <Check size={15} /> : <AlertTriangle size={15} />}</span>
      <div>
        <strong>{check.label}</strong>
        <span>{check.detail}</span>
      </div>
    </div>
  );
}

export default function DesignChecks({ analysis, pair, primers, construct }: Props) {
  const checks = buildDesignChecks(analysis, pair, primers, construct);
  const passed = checks.filter((check) => check.status === 'pass').length;
  const groups = ['Route', 'Primers'] as const;

  return (
    <section className="checks-panel">
      <div className="checks-heading">
        <div>
          <span className="eyebrow">Preflight</span>
          <h3>Design checks</h3>
          <p>A quick review of the selected route before you order primers or plan the digest.</p>
        </div>
        <div className="checks-summary">
          <Check size={15} />
          <strong>{passed}</strong>
          <span>passed</span>
          <i>·</i>
          <strong>{checks.length - passed}</strong>
          <span>review</span>
        </div>
      </div>

      <div className="check-groups">
        {groups.map((group) => (
          <div className="check-group" key={group}>
            <div className="check-group-title">
              <span>{group}</span>
            </div>
            {checks.filter((check) => check.group === group).map((check) => <CheckRow key={check.id} check={check} />)}
          </div>
        ))}
      </div>
    </section>
  );
}
