export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const $ = (sel, root = document) => root.querySelector(sel);
export const parseTags = (s) => [...new Set(s.split(/[,;\n]/).map((t) => t.trim()).filter(Boolean))];
export function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.append(el);
  setTimeout(() => el.remove(), 2500);
}
// Object-URLs verwalten, damit sie beim Seitenwechsel freigegeben werden
let urls = [];
export const objUrl = (blob) => { const u = URL.createObjectURL(blob); urls.push(u); return u; };
export const revokeUrls = () => { urls.forEach(URL.revokeObjectURL); urls = []; };
