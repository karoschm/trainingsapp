import { get, getAll, deleteExercise } from '../db.js';
import { esc, $, objUrl, toast } from '../util.js';

export async function renderDetail(app, id) {
  const ex = await get('exercises', id);
  if (!ex) { app.innerHTML = '<p class="empty">Übung nicht gefunden.</p>'; return; }
  const cats = await getAll('categories');
  const names = ex.categoryIds.map((c) => cats.find((x) => x.id === c)?.name).filter(Boolean);
  const atts = (await Promise.all(ex.attachmentIds.map((a) => get('attachments', a)))).filter(Boolean);

  app.innerHTML = `
    <article class="detail">
      <a href="#/" class="back">← Zurück</a>
      <h1>${esc(ex.title)}</h1>
      <div class="meta">${names.map((n) => `<span class="badge">${esc(n)}</span>`).join('')}</div>
      ${ex.tags.length ? `<div class="tags">${ex.tags.map((t) => `#${esc(t)}`).join(' ')}</div>` : ''}
      ${ex.description ? `<p class="desc">${esc(ex.description)}</p>` : ''}
      ${ex.ocrText ? `<details class="ocr-text"><summary>Erkannter Text</summary><p class="desc">${esc(ex.ocrText)}</p></details>` : ''}
      <div class="gallery">
        ${atts.map((a) => a.type.startsWith('image/')
          ? `<a href="${objUrl(a.blob)}" target="_blank" rel="noopener"><img src="${objUrl(a.blob)}" alt="${esc(a.name)}"></a>`
          : `<a class="file" href="${objUrl(a.blob)}" target="_blank" rel="noopener">📄 ${esc(a.name)}</a>`).join('')}
      </div>
      <div class="actions">
        <a class="btn" href="#/edit/${ex.id}">Bearbeiten</a>
        <button class="btn danger" id="del">Löschen</button>
      </div>
    </article>`;

  $('#del').addEventListener('click', async () => {
    if (!confirm('Übung wirklich löschen?')) return;
    await deleteExercise(ex.id);
    toast('Gelöscht');
    location.hash = '#/';
  });
}
