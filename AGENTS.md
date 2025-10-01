# Repository Guidelines

- 回答は日本語で。

## Project Structure & Module Organization

- Source: `src/` (entry: `src/main.ts`, styles: `src/style.css`). Keep logic in small, focused modules; prefer named exports.
- Static assets: `public/` (served at `/`). Place non-imported files (icons, large images) here.
- HTML shell: `index.html` boots the Vite app.
- TypeScript config: `tsconfig.json` (strict mode on). Suggested folders as the app grows: `src/sim/` (simulation core), `src/renderer/` (Three.js/WebGL), `src/ui/` (controls with `lil-gui`), `src/shaders/` (GLSL). Example: `src/sim/fluid-solver.ts`.

## Build, Test, and Development Commands

- `npm run dev`: Start Vite dev server with HMR.
- `npm run build`: Type-check (`tsc`) then build production bundle to `dist/`.
- `npm run preview`: Serve the built bundle locally for sanity checks.

## Coding Style & Naming Conventions

- Language: TypeScript (ES modules). Strict typing required; avoid `any`.
- Indentation: 2 spaces; keep line length reasonable (~100–120).
- Filenames: camerCase (`fluidSolver.ts`). Classes: PascalCase. Vars/funcs: camelCase.
- Exports: prefer named exports; one module = one responsibility.
- Formatting/Linting: ESLint + Prettier configured. Run `npm run lint` and `npm run format` before PRs.
-

## Commit & Pull Request Guidelines

- Commit style: history is minimal; adopt Conventional Commits (e.g., `feat(sim): add advection step`, `fix(renderer): correct FBO size`). Keep messages imperative and scoped.
- Pull requests: include a clear description, linked issues, reproduction steps, and screenshots/GIFs for visual changes. Ensure `npm run build` succeeds and PR stays small and focused.

## Security & Configuration Tips

- Secrets: never commit; use `import.meta.env` with `VITE_`-prefixed vars in `.env.local`.
- Shaders: if adding GLSL, create `vite.config.ts` with `vite-plugin-glsl` and store shaders under `src/shaders/`.
- Assets: keep large files in `public/`; fingerprinted assets should be imported from `src/`.
