import { get, getAll, saveExercise, uid } from '../db.js';
import { resizeImage } from '../image.js';
import { recognize } from '../ocr.js';
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
      <label>Erkannter Text (durchsuchbar)
        <textarea name="ocrText" id="ocrText" rows="5" placeholder="Mit „Aa“ am Foto die Schrift erkennen lassen. Der Text lässt sich hier korrigieren.">${esc(ex.ocrText || '')}</textarea>
      </label>
      <p id="ocrStatus" class="hint" role="status"></p>
      <button class="btn primary" type="submit">Speichern</button>
    </form>`;

  const drawAtts = () => {
    const kept = oldAtts.filter((a) => !removed.includes(a.id));
    $('#atts').innerHTML = [...kept, ...added].map((a) => `
      <div class="thumb">${a.type.startsWith('image/') ? `<img src="${objUrl(a.blob)}" alt="">` : `<span>📄<br>${esc(a.name)}</span>`}
      <button type="button" class="x" data-id="${a.id}" aria-label="Entfernen">×</button>
      ${a.type.startsWith('image/') ? `<button type="button" class="ocr" data-id="${a.id}" aria-label="Text erkennen" title="Text erkennen">Aa</button>` : ''}</div>`).join('');
  };
  drawAtts();

  let busy = false;
  $('#atts').addEventListener('click', async (e) => {
    const o = e.target.closest('.ocr');
    if (o) {
      if (busy) return;
      const att = [...oldAtts, ...added].find((a) => a.id === o.dataset.id);
      const status = $('#ocrStatus');
      busy = true;
      try {
        const text = await recognize(att.blob, (msg, p) => {
          status.textContent = p ? `${msg} ${Math.round(p * 100)} %` : msg;
        });
        const area = $('#ocrText');
        area.value = [area.value.trim(), text].filter(Boolean).join('\n\n');
        status.textContent = text ? 'Text erkannt. Bitte kurz prüfen und ggf. korrigieren.' : 'Kein Text erkannt.';
      } catch (err) {
        console.error(err);
        status.textContent = 'Texterkennung fehlgeschlagen. Beim ersten Mal ist eine Internetverbindung nötig.';
      } finally {
        busy = false;
      }
      return;
    }
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
      categoryIds: fd.getAll('cat'),
      ocrText: fd.get('ocrText').trim()
    }, added, removed);
    toast('Gespeichert');
    location.hash = '#/exercise/' + saved.id;
  });
}
