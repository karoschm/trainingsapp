// Einfache Token-Suche, normalisiert für Umlaute und Groß-/Kleinschreibung
export function normalize(s) {
  return (s || '')
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '');
}

const tokens = (s) => normalize(s).split(/[^a-z0-9]+/).filter(Boolean);

export function searchExercises(exercises, query, categoryId) {
  const q = tokens(query);
  return exercises
    .filter((ex) => !categoryId || ex.categoryIds.includes(categoryId))
    .map((ex) => {
      if (!q.length) return { ex, score: 0 };
      const title = normalize(ex.title);
      const tags = normalize(ex.tags.join(' '));
      const rest = normalize(ex.description + ' ' + (ex.ocrText || ''));
      let score = 0;
      for (const t of q) {
        let s = 0;
        if (tags.includes(t)) s += 3;
        if (title.includes(t)) s += 3;
        if (rest.includes(t)) s += 1;
        if (!s) return null; // alle Suchbegriffe müssen vorkommen
        score += s;
      }
      return { ex, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || b.ex.updatedAt - a.ex.updatedAt)
    .map((r) => r.ex);
}
