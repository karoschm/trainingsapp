import { getAll } from '../db.js';
import { searchExercises } from '../search.js';
import { esc, $ } from '../util.js';

let state = { q: '', cat: '' };

export async function renderList(app) {
  const [exercises, categories] = await Promise.all([getAll('exercises'), getAll('categories')]);
  categories.sort((a, b) => a.name.localeCompare(b.name, 'de'));
  const catName = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  app.innerHTML = `
    <div class="searchbar">
      <input id="q" type="search" placeholder="Suchen (Titel, Schlagwort, Text)…" value="${esc(state.q)}" autocomplete="off">
    </div>
    <div class="chips" id="chips">
      <button class="chip ${state.cat ? '' : 'active'}" data-cat="">Alle</button>
      ${categories.map((c) => `<button class="chip ${state.cat === c.id ? 'active' : ''}" data-cat="${c.id}">${esc(c.name)}</button>`).join('')}
    </div>
    <ul class="cards" id="results"></ul>
    <a class="fab" href="#/edit" aria-label="Neue Übung">＋</a>`;

  const results = $('#results');
  const draw = () => {
    const list = searchExercises(exercises, state.q, state.cat);
    results.innerHTML = list.length
      ? list.map((ex) => `
        <li><a class="card" href="#/exercise/${ex.id}">
          <strong>${esc(ex.title)}</strong>
          <div class="meta">${ex.categoryIds.map((c) => `<span class="badge">${esc(catName[c] || '?')}</span>`).join('')}
          ${ex.attachmentIds.length ? `<span class="att">📎 ${ex.attachmentIds.length}</span>` : ''}</div>
          ${ex.tags.length ? `<div class="tags">${ex.tags.map((t) => `#${esc(t)}`).join(' ')}</div>` : ''}
        </a></li>`).join('')
      : `<li class="empty">${exercises.length ? 'Keine Treffer.' : 'Noch keine Übungen. Mit ＋ die erste anlegen.'}</li>`;
  };
  draw();

  $('#q').addEventListener('input', (e) => { state.q = e.target.value; draw(); });
  $('#chips').addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    state.cat = b.dataset.cat;
    document.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', c === b));
    draw();
  });
}
