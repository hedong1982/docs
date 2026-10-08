// Purpose: Build a standalone browser worker for foreign-format conversion.
// Structure: Bundle the WASM JS loader; the host build copies its binary sibling.
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { 'format-converter.worker': 'src/lib/format-converter.worker.ts' },
  outDir: 'dist/embed/converter',
  format: ['esm'],
  platform: 'browser',
  target: 'es2020',
  splitting: false,
  dts: false,
  clean: false,
  minify: true,
  noExternal: [/.*/],
});
