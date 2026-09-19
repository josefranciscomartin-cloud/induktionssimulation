# Induktionssimulation

Browser-Simulation elektromagnetischer Induktion mit SVG-Versuchsaufbau,
Sinus-, Dreieck- und Rechteckstrom sowie einem Chart.js-Diagramm.

## Projektstruktur

| Datei / Verzeichnis | Zweck |
| --- | --- |
| `index.html` | Einstiegspunkt für Vite und die HTML-Seite |
| `src/main.js` | Oberfläche, SVG, Berechnungen und Diagramm |
| `src/style.css` | Gestaltung der Simulation |
| `public/favicon.svg` | Seitensymbol |
| `package.json`, `package-lock.json` | Vite, Chart.js und reproduzierbare Installation |
| `vite.config.js` | Basis-Pfad `/induktionssimulation/` |
| `.nvmrc` | Node.js-Version für lokale Arbeit und GitHub Actions |
| `.github/workflows/deploy-pages.yml` | Manuell gestarteter Build und Pages-Deployment |
| `dist/` | Generierte, veröffentlichbare Website; nicht in Git speichern |

Die Simulation benötigt einen Build: Der Browser kann den npm-Import von
Chart.js und den CSS-Import in `src/main.js` nicht unverarbeitet ausführen.
Vite bleibt deshalb erhalten. Nach dem Build werden keine Node.js-Laufzeit,
kein Backend und kein CDN benötigt. Chart.js ist im JavaScript-Bundle enthalten.

`src/counter.js`, `src/assets/` und `public/icons.svg` sind aktuell ungenutzte
Vorlagendateien. `einstellungen.odt` und die zugehörige Office-Sperrdatei gehören
nicht zur Browser-Simulation. Sie werden nicht benötigt und wurden nicht gelöscht.
Vite kopiert den gesamten Inhalt von `public/`, also auch `icons.svg`, nach `dist/`.
Veröffentlicht wird ausschließlich `dist/`, nicht der Projektordner.

## Lokal starten und bauen

Node.js **22.23.2** und npm verwenden. Mit installiertem nvm:

```bash
nvm install
nvm use
npm ci
npm run dev
```

Die vom Terminal angezeigte Adresse mit `/induktionssimulation/` öffnen
(normalerweise `http://localhost:5173/induktionssimulation/`).
Node.js 18 ist mit der vorhandenen Vite-Version nicht kompatibel.

Produktions-Build prüfen:

```bash
npm run build
npm run preview
```

Die Vorschau liegt normalerweise unter
`http://localhost:4173/induktionssimulation/`. Falls der Port belegt ist, die
im Terminal angezeigte Adresse verwenden. Start/Stopp, alle drei Stromformen,
Diagramm, Ausblenden der Quellspannung und Öffnen/Schließen des sekundären
Stromkreises prüfen.

`dist/index.html` ist der Einstiegspunkt der fertigen Website. HTML, JavaScript,
CSS und Favicon werden mit dem Unterpfad `/induktionssimulation/` erzeugt.
Die absoluten Quellpfade in der ursprünglichen `index.html` werden von Vite
beim Build entsprechend umgeschrieben; sie müssen nicht manuell geändert werden.
Die Seite über HTTP aufrufen, nicht per Doppelklick über `file://`.

## Auf GitHub Pages veröffentlichen

**Der Workflow veröffentlicht nur nach einem manuellen Start. Ein Push löst
keine Veröffentlichung aus.**

1. Auf GitHub ein Repository mit dem Namen **`induktionssimulation`** erstellen.
   Ein öffentliches Repository ist der unkomplizierte Weg für GitHub Pages.
   Bei einem privaten Repository hängt die Pages-Verfügbarkeit vom GitHub-Tarif ab.
   Das neue Repository zunächst ohne automatisch erzeugte README, Lizenz oder
   `.gitignore` anlegen, da bereits ein lokales Git-Repository existiert.
2. Den Projektstand einschließlich der oben aufgeführten Quell- und
   Konfigurationsdateien in den Standardbranch des Repositorys übertragen
   (üblicherweise `main`). Bei einem vorhandenen lokalen Git-Repository dessen
   Historie weiterverwenden. Weder `node_modules/` noch `dist/` hochladen.
   Die Workflow-Datei muss im Standardbranch liegen, damit GitHub den manuellen
   Start anbietet. Auch die aktuellen Änderungen in `src/main.js` und
   `src/style.css` müssen Bestandteil des übertragenen Stands sein.
3. Im Repository **Settings → Pages → Build and deployment → Source →
   GitHub Actions** auswählen. Keinen zweiten vorgeschlagenen Workflow anlegen.
4. **Erst wenn die Veröffentlichung gewünscht ist:** Unter **Actions →
   GitHub Pages veröffentlichen → Run workflow** den Standardbranch
   auswählen und den Lauf ausdrücklich starten. Dieser Schritt veröffentlicht
   die Website.
5. Nach erfolgreichem Build und Deployment den Link des `deploy`-Jobs öffnen:
   `https://DEIN-GITHUB-NAME.github.io/induktionssimulation/`.

Für spätere Änderungen: Dateien committen und pushen, anschließend denselben
Workflow erneut manuell starten. Ohne diesen Schritt bleibt die zuvor
veröffentlichte Version bestehen. Ein persönlicher Zugriffstoken ist für den
Workflow nicht nötig; er verwendet GitHubs bereitgestellten `GITHUB_TOKEN`.

### Projekt erstmals übertragen

Aktuell heißt der lokale Branch `master`; ein Remote ist noch nicht eingerichtet.
Nach Erstellung des leeren GitHub-Repositorys können die folgenden Befehle
verwendet werden. `DEIN-GITHUB-NAME` ersetzen. Diese Befehle wurden bei der
Vorbereitung nicht ausgeführt.

```bash
git add .gitignore .nvmrc README.md vite.config.js .github/workflows/deploy-pages.yml
git add index.html package.json package-lock.json src/main.js src/style.css public/favicon.svg
git commit -m "Induktionssimulation für GitHub Pages vorbereiten"
git remote add origin https://github.com/DEIN-GITHUB-NAME/induktionssimulation.git
git push -u origin HEAD:main
```

`HEAD:main` überträgt den aktuellen lokalen Branch auf den GitHub-Branch `main`,
ohne den lokalen Branch umzubenennen. Für weitere Übertragungen kann ebenfalls
`git push origin HEAD:main` verwendet werden. Falls inzwischen bereits ein
Remote existiert, dessen Adresse zuerst mit `git remote -v` prüfen und den
Befehl `git remote add` nicht erneut ausführen. Ein Push veröffentlicht hier
nur den Repository-Inhalt; das Pages-Deployment bleibt ein separater manueller Schritt.

## Hinweise und Fehlerbehebung

- **Leere Seite / fehlende Assets:** `base` in `vite.config.js` muss dem
  Repository-Namen entsprechen. Bei einer Umbenennung ändern und neu bauen.
  Für dieses Projekt lautet der Pfad `/induktionssimulation/`.
- **Pages liefert 404:** Pages-Quelle und erfolgreichen `deploy`-Job prüfen.
  Den Unterpfad und den abschließenden Schrägstrich in der URL verwenden.
- **Kein „Run workflow“:** Workflow im Standardbranch und aktivierte GitHub
  Actions unter den Repository-Einstellungen prüfen.
- **Build scheitert lokal:** Mit `node --version` die Node-Version prüfen,
  `nvm use` und anschließend `npm ci` ausführen.
- `.gitignore` schließt Build-Ausgaben, Abhängigkeiten, lokale Umgebungsdateien
  und Office-Sperrdateien aus. Bereits von Git erfasste Dateien bleiben erfasst.
  Die schon erfasste `.~lock.einstellungen.odt#` kann bei Bedarf mit
  `git rm --cached -- '.~lock.einstellungen.odt#'` aus der Versionskontrolle
  entfernt werden; die lokale Datei bleibt dabei erhalten.

Die Vorbereitung des Deployments verändert weder die physikalischen
Berechnungen noch die Oberfläche. Die vorhandenen Simulationsdateien bleiben
unverändert.

## Durchgeführte Prüfung der Pages-Vorbereitung

- Produktions-Build mit Node.js 22.23.2 erfolgreich.
- Fertiges `dist/` in einem isolierten Chrome-Browser über einen einfachen
  statischen HTTP-Server unter `/induktionssimulation/` geprüft, ohne Vite-Server
  und ohne automatische Umleitung fehlender Dateien auf `index.html`.
- HTML, JavaScript, CSS und Favicon liefern HTTP 200; keine JavaScript-Laufzeitfehler.
- SVG, mathematische Formeln, Chart.js, Start/Stopp, alle drei Stromformen,
  Quellspannungs-Schalter und sekundärer Stromkreis funktionieren im Browser.
- Prüfsummen von `src/main.js`, `src/style.css` und `index.html` sind gegenüber
  dem Stand vor der Pages-Vorbereitung identisch.
- Der GitHub-Workflow wurde lokal als YAML geprüft, aber nicht auf GitHub
  ausgeführt. Es wurde nichts veröffentlicht.

## Offizielle Dokumentation

- [Vite: GitHub Pages und statischer Build](https://vite.dev/guide/static-deploy#github-pages)
- [GitHub: Pages mit eigenen Workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
