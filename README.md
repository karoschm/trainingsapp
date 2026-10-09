# Handball Übungsbibliothek (PWA)

Eine installierbare Web-App (Progressive Web App) für Handballtrainer:innen, um eigene Übungen zu sammeln.
Läuft auf Android und iPhone, ohne App Store und ohne Apple-Developer-Account.

## Funktionen
- Übungen mit Titel, Beschreibung, Schlagworten
- Notizen als Foto, Scan oder PDF anhängen (Bilder werden automatisch verkleinert)
- Texterkennung (OCR, Deutsch) für Foto-Notizen: Button „Aa“ am Bild, der erkannte Text ist korrigierbar und durchsuchbar. Läuft komplett auf dem Gerät, nichts wird hochgeladen.
- Standard-Kategorien plus eigene Kategorien, mehrere Kategorien pro Übung
- Suche über Titel, Schlagworte und Text, Filter nach Kategorie (Umlaute und Groß-/Kleinschreibung egal)
- Offline nutzbar, Daten liegen lokal auf dem Gerät (IndexedDB)
- Backup per Export/Import (JSON-Datei)

Geplant: automatische Kategorie-Vorschläge aus erkannten Schlagworten.

**Hinweis OCR:** Gedruckte und digitale Schrift wird gut erkannt, Handschrift nur mäßig. Beim ersten Gebrauch lädt die App ca. 5 MB Erkennungsdaten und speichert sie danach für die Offline-Nutzung. Die Dateien werden beim Build nach `public/ocr` kopiert (`scripts/copy-ocr.mjs`) und nicht eingecheckt.

## Entwicklung
```bash
npm install
npm run dev       # Entwicklungsserver
npm run build     # Produktions-Build nach dist/
npm run preview   # Build lokal ansehen
```
Für lokalen Betrieb unter `/` statt `/trainingsapp/`: `BASE_PATH=/ npm run build`.

## Veröffentlichen (GitHub Pages)
1. Auf GitHub: Settings → Pages → Source: **GitHub Actions**.
2. Auf `main` mergen. Der Workflow `.github/workflows/deploy.yml` baut und veröffentlicht die App unter
   `https://<nutzer>.github.io/trainingsapp/`.

## Installieren
- **iPhone:** Link in Safari öffnen → Teilen → „Zum Home-Bildschirm“.
- **Android:** Link in Chrome öffnen → Menü → „App installieren“.

## Hinweis zu Daten
Alle Daten liegen nur auf dem jeweiligen Gerät. Bitte regelmäßig unter „Backup“ exportieren.
