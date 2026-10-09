// IndexedDB-Wrapper: Stores exercises, categories, attachments
const DB_NAME = 'handball-uebungen';
const DB_VERSION = 1;

export const DEFAULT_CATEGORIES = [
  'Aufwärmen', 'Passspiel', 'Wurf', 'Torwart', 'Abwehr', 'Angriff',
  'Tempospiel', 'Ausdauer', 'Koordination', 'Spielform', 'Cool-down'
];

let dbPromise;

function open() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        db.createObjectStore('exercises', { keyPath: 'id' });
        db.createObjectStore('categories', { keyPath: 'id' });
        db.createObjectStore('attachments', { keyPath: 'id' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

async function tx(stores, mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(stores, mode);
    let result;
    Promise.resolve(fn(t)).then((r) => { result = r; }, reject);
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

const wrap = (req) => new Promise((res, rej) => {
  req.onsuccess = () => res(req.result);
  req.onerror = () => rej(req.error);
});

export const uid = () =>
  (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));

export async function initDb() {
  const cats = await getAll('categories');
  if (cats.length === 0) {
    await tx(['categories'], 'readwrite', (t) => {
      const s = t.objectStore('categories');
      DEFAULT_CATEGORIES.forEach((name) => s.put({ id: uid(), name, builtin: true }));
    });
  }
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().catch(() => {});
  }
}

export const getAll = (store) => tx([store], 'readonly', (t) => wrap(t.objectStore(store).getAll()));
export const get = (store, id) => tx([store], 'readonly', (t) => wrap(t.objectStore(store).get(id)));
export const put = (store, obj) => tx([store], 'readwrite', (t) => { t.objectStore(store).put(obj); });
export const del = (store, id) => tx([store], 'readwrite', (t) => { t.objectStore(store).delete(id); });

export async function saveExercise(ex, newAttachments = [], removedAttachmentIds = []) {
  const now = Date.now();
  const exercise = {
    id: ex.id || uid(),
    title: ex.title,
    description: ex.description || '',
    tags: ex.tags || [],
    categoryIds: ex.categoryIds || [],
    attachmentIds: (ex.attachmentIds || []).filter((id) => !removedAttachmentIds.includes(id)),
    ocrText: ex.ocrText || '',
    createdAt: ex.createdAt || now,
    updatedAt: now
  };
  await tx(['exercises', 'attachments'], 'readwrite', (t) => {
    const as = t.objectStore('attachments');
    removedAttachmentIds.forEach((id) => as.delete(id));
    for (const a of newAttachments) {
      as.put(a);
      exercise.attachmentIds.push(a.id);
    }
    t.objectStore('exercises').put(exercise);
  });
  return exercise;
}

export async function deleteExercise(id) {
  const ex = await get('exercises', id);
  await tx(['exercises', 'attachments'], 'readwrite', (t) => {
    (ex?.attachmentIds || []).forEach((a) => t.objectStore('attachments').delete(a));
    t.objectStore('exercises').delete(id);
  });
}

export async function deleteCategory(id) {
  const exercises = await getAll('exercises');
  await tx(['exercises', 'categories'], 'readwrite', (t) => {
    t.objectStore('categories').delete(id);
    for (const ex of exercises) {
      if (ex.categoryIds.includes(id)) {
        t.objectStore('exercises').put({ ...ex, categoryIds: ex.categoryIds.filter((c) => c !== id) });
      }
    }
  });
}

// ---- Backup ----
const blobToDataUrl = (blob) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(r.result);
  r.onerror = () => rej(r.error);
  r.readAsDataURL(blob);
});

export async function exportAll() {
  const [exercises, categories, attachments] = await Promise.all([
    getAll('exercises'), getAll('categories'), getAll('attachments')
  ]);
  const att = [];
  for (const a of attachments) {
    att.push({ id: a.id, name: a.name, type: a.type, data: await blobToDataUrl(a.blob) });
  }
  return { app: 'handball-uebungen', version: 1, exportedAt: new Date().toISOString(), exercises, categories, attachments: att };
}

export async function importAll(data) {
  if (!data || data.app !== 'handball-uebungen') throw new Error('Keine gültige Backup-Datei.');
  const attachments = [];
  for (const a of data.attachments || []) {
    const blob = await (await fetch(a.data)).blob();
    attachments.push({ id: a.id, name: a.name, type: a.type, blob });
  }
  await tx(['exercises', 'categories', 'attachments'], 'readwrite', (t) => {
    data.categories.forEach((c) => t.objectStore('categories').put(c));
    data.exercises.forEach((e) => t.objectStore('exercises').put(e));
    attachments.forEach((a) => t.objectStore('attachments').put(a));
  });
}
