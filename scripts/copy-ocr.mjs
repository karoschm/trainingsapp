// Kopiert die OCR-Dateien (Worker, WASM-Kern, deutsche Sprachdaten) nach public/ocr,
// damit die Texterkennung ohne externe CDN-Abrufe und offline funktioniert.
import { cpSync, mkdirSync, readdirSync } from 'node:fs';

const core = 'node_modules/tesseract.js-core';
mkdirSync('public/ocr/lang', { recursive: true });
cpSync('node_modules/tesseract.js/dist/worker.min.js', 'public/ocr/worker.min.js');
for (const f of readdirSync(core)) {
  // Tesseract.js lädt je nach Browser eine der LSTM-Varianten als <name>.wasm.js (WASM eingebettet)
  if (/^tesseract-core.*-lstm\.wasm\.js$/.test(f)) cpSync(`${core}/${f}`, `public/ocr/${f}`);
}
cpSync('node_modules/@tesseract.js-data/deu/4.0.0_best_int/deu.traineddata.gz', 'public/ocr/lang/deu.traineddata.gz');
