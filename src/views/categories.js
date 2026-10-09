import { getAll, put, deleteCategory, uid } from '../db.js';
import { esc, $, toast } from '../util.js';

export async function renderCategories(app) {
  const cats = (await getAll('categories')).sort((a, b) => a.name.localeCompare(b.name, 'de'));
  app.innerHTML = `
    <section class="form">
      <a href="#/" class="back">← Zurück</a>
      <h1>Kategorien</h1>
      <form id="add" class="row"><input name="name" placeholder="Neue Kategorie" required maxlength="40"><button class="btn primary">Hinzufügen</button></form>
      <ul class="list">
        ${cats.map((c) => `<li data-id="${c.id}"><span>${esc(c.name)}${c.builtin ? ' <small>(Standard)</small>' : ''}</span>
          <span><button class="btn small" data-act="rename">Umbenennen</button>
          <button class="btn small danger" data-act="delete">Löschen</button></span></li>`).join('')}
      </ul>
    </section>`;

  $('#add').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = new FormData(e.target).get('name').trim();
    if (!name) return;
    if (cats.some((c) => c.name.toLowerCase() === name.toLowerCase())) return toast('Gibt es schon');
    await put('categories', { id: uid(), name, builtin: false });
    renderCategories(app);
  });

  $('.list').addEventListener('click', async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const cat = cats.find((c) => c.id === b.closest('li').dataset.id);
    if (b.dataset.act === 'rename') {
      const name = prompt('Neuer Name', cat.name)?.trim();
      if (name) { await put('categories', { ...cat, name }); renderCategories(app); }
    } else if (confirm(`Kategorie „${cat.name}“ löschen? Die Übungen bleiben erhalten.`)) {
      await deleteCategory(cat.id);
      renderCategories(app);
    }
  });
}
