import { get, getAll, saveExercise, uid } from '../db.js';
import { resizeImage } from '../image.js';
import { esc, $, parseTags, toast, objUrl } from '../util.js';

export async function renderEdit(app, id) {
  const existing = id ? await get('exercises', id) : null;
  const ex = existing || { title: '', description: '', tags: [], categoryIds: [], attachmentIds: [] };
  const cats = (await getAll('categories')).sort((a, b) => a.name.localeCompare(b.name, 'de'));
  const oldAtts = (await Promise.all(ex.attachmentIds.map((a) => get('attachments', a)))).filter(Boolean);
  const removed = [];
  let added = []; // {id, name, type, blob}

  app.innerHTML = `
    <form id="f" class="form">
      <a href="${existing ? '#/exercise/' + ex.id : '#/'}" class="back">← Abbrechen</a>
      <h1>${existing ? 'Übung bearbeiten' : 'Neue Übung'}</h1>
      <label>Titel<input name="title" required maxlength="120" value="${esc(ex.title)}"></label>
      <label>Beschreibung / Text-Notizen<textarea name="description" rows="6">${esc(ex.description)}</textarea></label>
      <label>Schlagworte (mit Komma trennen)<input name="tags" value="${esc(ex.tags.join(', '))}" placeholder="z. B. 2-gegen-1, Kreis, Tempo"></label>
      <fieldset><legend>Kategorien</legend>
        <div class="chips wrap">${cats.map((c) => `
          <label class="chip check"><input type="checkbox" name="cat" value="${c.id}" ${ex.categoryIds.includes(c.id) ? 'checked' : ''}><span>${esc(c.name)}</span></label>`).join('')}
        </div>
      </fieldset>
      <fieldset><legend>Notizen (Foto, Scan, PDF)</legend>
        <div id="atts" class="thumbs"></div>
        <label class="btn">📷 Foto / Datei hinzufügen
          <input id="file" type="file" accept="image/*,application/pdf" multiple hidden>
        </label>
      </fieldset>
      <button class="btn primary" type="submit">Speichern</button>
    </form>`;

  const drawAtts = () => {
    const kept = oldAtts.filter((a) => !removed.includes(a.id));
    $('#atts').innerHTML = [...kept, ...added].map((a) => `
      <div class="thumb">${a.type.startsWith('image/') ? `<img src="${objUrl(a.blob)}" alt="">` : `<span>📄<br>${esc(a.name)}</span>`}
      <button type="button" class="x" data-id="${a.id}" aria-label="Entfernen">×</button></div>`).join('');
  };
  drawAtts();

  $('#atts').addEventListener('click', (e) => {
    const b = e.target.closest('.x');
    if (!b) return;
    if (oldAtts.some((a) => a.id === b.dataset.id)) removed.push(b.dataset.id);
    else added = added.filter((a) => a.id !== b.dataset.id);
    drawAtts();
  });

  $('#file').addEventListener('change', async (e) => {
    for (const f of e.target.files) {
      const isImg = f.type.startsWith('image/');
      const blob = isImg ? await resizeImage(f) : f;
      added.push({ id: uid(), name: f.name, type: blob.type || f.type, blob });
    }
    e.target.value = '';
    drawAtts();
  });

  $('#f').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const saved = await saveExercise({
      ...ex,
      title: fd.get('title').trim(),
      description: fd.get('description').trim(),
      tags: parseTags(fd.get('tags')),
      categoryIds: fd.getAll('cat')
    }, added, removed);
    toast('Gespeichert');
    location.hash = '#/exercise/' + saved.id;
  });
}
