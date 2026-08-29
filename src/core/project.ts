import type { PrimerMode, ProjectFile } from './types';

export function makeProjectFile(project: Omit<ProjectFile, 'schemaVersion' | 'app' | 'createdAt'>): ProjectFile {
  return {
    schemaVersion: 2,
    app: 'FindPrimers',
    createdAt: new Date().toISOString(),
    ...project,
  };
}

export function downloadProject(project: ProjectFile): void {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `findprimers-${project.vector.name || 'project'}.json`.replace(/[^a-zA-Z0-9._-]+/g, '-');
  anchor.click();
  URL.revokeObjectURL(url);
}

export function parseProjectFile(text: string): ProjectFile {
  const value = JSON.parse(text) as Partial<ProjectFile>;
  if (value.app !== 'FindPrimers' || value.schemaVersion !== 2 || !value.vector?.sequence || !value.insert?.sequence) {
    throw new Error('This is not a supported FindPrimers project file.');
  }
  const primerMode: PrimerMode = value.primerMode === 'quick' ? 'quick' : 'optimized';
  return { ...value, primerMode } as ProjectFile;
}
