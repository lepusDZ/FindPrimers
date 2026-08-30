import type { AnalysisResult, ConstructSimulation, EnzymePair, PrimerPairDesign } from './types';

export type CheckStatus = 'pass' | 'review';

export interface DesignCheck {
  id: string;
  group: 'Route' | 'Primers' | 'Simulation';
  label: string;
  detail: string;
  status: CheckStatus;
}

function enzymeForSite(analysis: AnalysisResult, site: EnzymePair['first']) {
  return analysis.enzymes.find((enzyme) => enzyme.enzyme === site.enzyme && enzyme.pattern === site.pattern);
}

export function buildDesignChecks(
  analysis: AnalysisResult,
  pair: EnzymePair,
  primers: PrimerPairDesign,
  construct: ConstructSimulation,
): DesignCheck[] {
  const first = enzymeForSite(analysis, pair.first);
  const second = enzymeForSite(analysis, pair.second);
  const vectorCuts = [first?.vectorSites.length ?? 0, second?.vectorSites.length ?? 0];
  const insertCuts = [first?.insertSites.length ?? 0, second?.insertSites.length ?? 0];
  const codingConflicts = Number(pair.first.orfConflict) + Number(pair.second.orfConflict);
  const gcInRange = [primers.forward.metrics.gc, primers.reverse.metrics.gc].every((gc) => gc >= 35 && gc <= 65);
  const maxHairpin = Math.max(primers.forward.metrics.hairpinRisk, primers.reverse.metrics.hairpinRisk);
  const maxHomodimer = Math.max(primers.forward.metrics.homodimerRisk, primers.reverse.metrics.homodimerRisk);
  const structureOk = maxHairpin < 6 && maxHomodimer < 6 && primers.heterodimerRisk < 6;

  return [
    {
      id: 'vector-cuts',
      group: 'Route',
      label: 'Unique vector cuts',
      detail: `${pair.first.enzyme} ${vectorCuts[0]} cut · ${pair.second.enzyme} ${vectorCuts[1]} cut`,
      status: vectorCuts.every((count) => count === 1) ? 'pass' : 'review',
    },
    {
      id: 'insert-cuts',
      group: 'Route',
      label: 'Insert stays intact',
      detail: `${pair.first.enzyme} ${insertCuts[0]} internal cuts · ${pair.second.enzyme} ${insertCuts[1]} internal cuts`,
      status: insertCuts.every((count) => count === 0) ? 'pass' : 'review',
    },
    {
      id: 'coding-regions',
      group: 'Route',
      label: 'Coding-region impact',
      detail: codingConflicts ? `${codingConflicts} selected site${codingConflicts === 1 ? '' : 's'} overlaps a CDS / predicted ORF` : 'Selected sites avoid detected CDS / ORF regions',
      status: codingConflicts ? 'review' : 'pass',
    },
    {
      id: 'primer-tm',
      group: 'Primers',
      label: 'Annealing temperature',
      detail: `${primers.forward.metrics.tm.toFixed(1)}°C / ${primers.reverse.metrics.tm.toFixed(1)}°C · Δ${primers.tmDifference.toFixed(1)}°C`,
      status: primers.tmDifference <= 3 ? 'pass' : 'review',
    },
    {
      id: 'primer-gc',
      group: 'Primers',
      label: 'GC content',
      detail: `${primers.forward.metrics.gc.toFixed(0)}% / ${primers.reverse.metrics.gc.toFixed(0)}%`,
      status: gcInRange ? 'pass' : 'review',
    },
    {
      id: 'primer-structure',
      group: 'Primers',
      label: 'Secondary-structure screen',
      detail: `hairpin ${maxHairpin} · homodimer ${maxHomodimer} · heterodimer ${primers.heterodimerRisk}`,
      status: structureOk ? 'pass' : 'review',
    },
  ];
}
