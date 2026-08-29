# FindPrimers

FindPrimers is a restriction-cloning primer design tool. Give it a vector and insert, compare compatible restriction-enzyme pairs, review the primers, and preview the resulting construct.

**Live site:** https://lepusdz.github.io/FindPrimers/

## Features

- Plain DNA, FASTA, and GenBank input
- Circular-aware restriction-site scanning
- Ranked enzyme pairs that cut the vector once and the insert zero times
- GenBank CDS annotations with ORF prediction as a fallback
- Quick and Tm-aware primer design modes
- Predicted construct preview
- Project JSON import/export

## Development

Use Node 24 LTS.

```bash
npm ci
npm run dev
```

Other useful commands:

```bash
npm test
npm run typecheck
npm run build
npm run check
```

The Vite base path is `/FindPrimers/` because the app is deployed from the project GitHub Pages URL.

## Project structure

```text
src/
├── components/        React UI and sequence visualizations
├── core/              sequence, ORF, restriction, primer, and project logic
├── data/enzymes.json  restriction-enzyme recognition motifs
├── App.tsx
├── main.tsx
└── styles.css
```

The code in `src/core/` is independent of React so the biological calculations can be tested without the UI.

## Primer modes

**Quick** uses a 6-base vector flank, the selected restriction site, and a fixed 20 nt insert-annealing region.

**Optimized** checks 18–32 nt annealing regions and scores them using nearest-neighbor Tm, Tm balance, GC content, 3′ GC, and simple hairpin/dimer complementarity checks. It is a lightweight implementation for this workflow, not Primer3.

## Limitations

The bundled enzyme data contains recognition motifs but not full supplier metadata. Pair ranking does not currently account for cleavage offsets, buffer compatibility, methylation sensitivity, star activity, heat inactivation, or enzyme-specific terminal-base requirements.

Check the selected enzymes and final primer sequences against supplier documentation before experimental use.

## License

MIT
