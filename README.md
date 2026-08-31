# FindPrimers

FindPrimers is a restriction-cloning primer design tool. Add a vector and insert, compare compatible enzyme pairs, generate primers, and preview the resulting construct without jumping between several separate tools.

[Try FindPrimers →](https://lepusdz.github.io/FindPrimers/)

It brings the parts of an ORF finder, restriction-site analyzer, plasmid viewer, and primer designer that are useful for routine restriction cloning into one workflow.

## Features

- Paste DNA or open FASTA and GenBank sequences
- Find restriction enzymes that cut the vector once and the insert zero times
- Rank directional two-enzyme and single-enzyme cloning routes
- Show GenBank CDS annotations or predict ORFs when annotations are unavailable
- Inspect restriction sites directly on a circular vector map
- Generate quick or Tm-aware cloning primers
- Run a preflight check for cut sites, insert orientation, coding-region conflicts, and primer quality
- Preview the predicted construct
- Export primers as CSV and save/reopen FindPrimers project files

## How it works

1. Add a circular vector and an insert.
2. Click **Analyze cloning design**.
3. Compare the ranked enzyme pairs and inspect them on the vector map.
4. Review the primers, preflight checks, and predicted construct for the selected route.
5. Export the primer table or save the project for later.

Use **Try an example** if you just want to explore the workflow.

## Primer modes

**Quick** keeps the original FindPrimers approach: a 6-base vector flank, the selected restriction site, and a fixed 20 nt insert-annealing region.

**Optimized** searches 18–32 nt annealing regions and scores them using nearest-neighbor Tm, Tm balance, GC content, 3′ base quality, and simple hairpin/dimer complementarity checks.

The optimized mode is intentionally lightweight and is not a replacement for Primer3.

## Run locally

Use Node 24 LTS.

```bash
npm ci
npm run dev
```

Useful checks:

```bash
npm test
npm run typecheck
npm run build
```

## Notes

FindPrimers currently models sequence-level restriction cloning. The bundled enzyme data includes recognition motifs, but not complete supplier metadata such as cleavage offsets, overhang compatibility, methylation sensitivity, star activity, buffer compatibility, or heat inactivation.

Single-enzyme routes are non-directional, so clone orientation needs to be screened experimentally. Before ordering primers or running a digest, verify the selected enzymes and final primer sequences against the supplier documentation.

## Tech

- React
- TypeScript
- Vite
- Vitest
- GitHub Pages

The biological calculations live in `src/core/` and are kept separate from the React UI so they can be tested independently.

## License

MIT
