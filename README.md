# FindPrimers

FindPrimers is a browser-only tool for designing restriction-cloning PCR primers.

Paste or upload a vector and insert, compare compatible restriction-enzyme pairs, inspect coding-region conflicts, design primers, and preview the resulting construct. Sequence data stays in the browser.

**Live site:** https://lepusdz.github.io/FindPrimers/

## Features

- Plain DNA, FASTA, and GenBank input
- Circular-aware restriction-site scanning
- Automatic filtering for enzymes that cut the vector once and the insert zero times
- Ranked two-enzyme cloning pairs with coding-region warnings
- GenBank CDS annotations when available, with ORF prediction as a fallback
- Quick primer mode with a fixed 20 nt annealing region
- Optimized primer mode with Tm, GC, 3′ base, hairpin, and dimer checks
- Predicted final construct preview
- Explicit project JSON import/export
- No backend, account, uploads, localStorage, or analytics

## Run locally

Use Node 24 LTS. Check your version, install dependencies, and start Vite:

```bash
node -v
npm install
npm run dev
```

Vite will print the local URL. Because the repository is configured for GitHub Pages, the app is served under `/FindPrimers/`. The included `.nvmrc` is only a convenience for people who already use `nvm`; it is not required.

Useful commands:

```bash
npm test        # unit tests
npm run build   # production build
npm run check   # typecheck + tests + build
```

## Deploy

The repository includes a GitHub Pages workflow at `.github/workflows/deploy-pages.yml`.

1. Push to `main`.
2. In **Settings → Pages**, set the source to **GitHub Actions**.
3. The workflow tests the app, builds `dist/`, and deploys it.

The Vite base path is `/FindPrimers/`, matching this repository name.

## Project structure

```text
src/
├── App.tsx
├── components/        UI components and sequence visualizations
├── core/              sequence, ORF, restriction, primer, and project logic
├── data/enzymes.json  restriction-enzyme recognition motifs
├── main.tsx
└── styles.css
```

The code in `src/core/` does not depend on React. This keeps the biological calculations testable and separate from the UI.

## Primer modes

**Quick** uses a 6-base vector flank, the selected restriction site, and a fixed 20 nt insert-annealing region.

**Optimized** tests 18–32 nt annealing regions and scores candidate pairs using nearest-neighbor Tm, Tm balance, GC content, 3′ GC, and simple complementarity checks for hairpins and dimers.

Optimized mode is not Primer3. It is a lightweight browser implementation intended for this workflow.

## Limitations

FindPrimers is a design aid. The bundled enzyme data contains recognition motifs but not full supplier metadata, so pair ranking does not currently account for exact cleavage offsets, buffer compatibility, methylation sensitivity, star activity, heat inactivation, or enzyme-specific terminal-base requirements.

Check the selected enzymes and final primer sequences against the supplier documentation before experimental use.

## License

MIT
