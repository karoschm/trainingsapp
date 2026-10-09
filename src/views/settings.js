import { exportAll, importAll } from '../db.js';
import { $, toast } from '../util.js';

export async function renderSettings(app) {
  app.innerHTML = `
    <section class="form">
      <a href="#/" class="back">← Zurück</a>
      <h1>Backup</h1>
      <p>Die Daten liegen nur auf diesem Gerät. Exportiere sie regelmäßig als Datei und sichere sie z. B. in der Cloud.</p>
      <button class="btn primary" id="exp">Backup exportieren</button>
      <label class="btn">Backup importieren<input id="imp" type="file" accept="application/json,.json" hidden></label>
    </section>`;

  $('#exp').addEventListener('click', async () => {
    const data = await exportAll();
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `uebungen-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  });

  $('#imp').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      await importAll(JSON.parse(await f.text()));
      toast('Backup importiert');
    } catch (err) {
      toast(err.message || 'Import fehlgeschlagen');
    }
    e.target.value = '';
  });
}
