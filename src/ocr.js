// Texterkennung (OCR) im Browser mit Tesseract.js, komplett lokal (kein Upload).
// Der Code und die Sprachdaten (~10 MB) werden erst beim ersten Gebrauch geladen
// und danach vom Service Worker zwischengespeichert.
const base = `${import.meta.env.BASE_URL}ocr/`;

let workerPromise;
let onProgress = () => {};

async function getWorker() {
  if (!workerPromise) {
    workerPromise = import('tesseract.js').then(({ createWorker }) =>
      createWorker('deu', 1, {
        workerPath: `${base}worker.min.js`,
        corePath: base,
        langPath: `${base}lang`,
        gzip: true,
        logger: (m) => onProgress(m)
      })
    ).catch((e) => { workerPromise = null; throw e; });
  }
  return workerPromise;
}

// progress: (text, fraction 0..1) => void
export async function recognize(blob, progress = () => {}) {
  onProgress = (m) => {
    if (m.status === 'recognizing text') progress('Text wird erkannt…', m.progress);
    else progress('Texterkennung wird vorbereitet…', 0);
  };
  const worker = await getWorker();
  const { data } = await worker.recognize(blob);
  return cleanText(data.text);
}

export const cleanText = (t) => (t || '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
