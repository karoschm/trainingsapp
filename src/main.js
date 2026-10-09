import './styles.css';
import { registerSW } from 'virtual:pwa-register';
import { initDb } from './db.js';
import { revokeUrls } from './util.js';
import { renderList } from './views/list.js';
import { renderDetail } from './views/detail.js';
import { renderEdit } from './views/edit.js';
import { renderCategories } from './views/categories.js';
import { renderSettings } from './views/settings.js';

registerSW({ immediate: true });

const app = document.getElementById('app');

async function route() {
  revokeUrls();
  const [, page, id] = location.hash.replace(/^#/, '').split('/');
  window.scrollTo(0, 0);
  try {
    if (page === 'exercise' && id) await renderDetail(app, id);
    else if (page === 'edit') await renderEdit(app, id);
    else if (page === 'categories') await renderCategories(app);
    else if (page === 'settings') await renderSettings(app);
    else await renderList(app);
  } catch (e) {
    console.error(e);
    app.innerHTML = '<p class="empty">Fehler beim Laden. Bitte Seite neu laden.</p>';
  }
}

window.addEventListener('hashchange', route);
initDb().then(route);
