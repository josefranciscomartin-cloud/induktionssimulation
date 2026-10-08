# Induktionssimulation von J.M. und M.K.

Browser-Simulation elektromagnetischer Induktion mit SVG-Versuchsaufbau,
Sinus-, Dreieck- und Rechteckstrom sowie einem Chart.js-Diagramm.

## Projektstruktur

| Datei / Verzeichnis | Zweck |
| --- | --- |
| `index.html` | Einstiegspunkt für Vite und die HTML-Seite |
| `src/main.js` | Oberfläche, SVG, Berechnungen und Diagramm |
| `src/learning.js` | Lernreiter, Quiz, Messwerttabelle und Selbsttest |
| `src/measurement-data.js` | Übungsdaten, Messstreuung, Einheitenprüfung und CSV-Export |
| `src/transformer.js` | Transformator-Reiter, SVG-Animation, Einstellungen und Diagramm |
| `src/transformer-model.js` | Spannungsübersetzung, magnetischer Fluss und Ströme im Transformator |
| `test/transformer-model.test.js` | Physikalische Prüfungen des Transformator-Modells |
| `src/transmission.js` | Fernleitungs-Reiter, Magnetfelder, Elektronenbewegung, Wärmewolken und Leistungsbilanz |
| `src/transmission-model.js` | Strom, Spannungsabfall, Leitungsverluste und ankommende Leistung |
| `test/transmission-model.test.js` | Prüfungen der Fernleitungs-Leistungsbilanz und Wechselstromdarstellung |
| `src/lc-circuit.js` | Schwingkreis-Reiter, Schalter, elektrische und magnetische Felder, Energieanzeige und Diagramme |
| `src/lc-model.js` | Ungedämpfte LC-Schwingung, Eigenfrequenz, Spannungen, Ladung, Strom und Energie |
| `test/lc-model.test.js` | Prüfungen der LC-Energieerhaltung, Vorzeichen und Viertelperioden |
| `src/style.css` | Gestaltung der Simulation |
| `public/favicon.svg` | Seitensymbol |
| `public/rechtliches.html` | Impressum und Datenschutzerklärung |
| `public/rechtliches.css` | Gestaltung der Rechteseite |
| `package.json`, `package-lock.json` | Vite, Chart.js und reproduzierbare Installation |
| `vite.config.js` | Relative Basis-Pfade für LMS und GitHub Pages |
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

Die Betreiberangaben stehen in `public/rechtliches.html`. Die Links zu Impressum
und Datenschutz sind im Fußbereich der Simulation auf allen drei Lernreitern erreichbar.

## Lokal starten und bauen

Node.js **22.23.2** und npm verwenden. Mit installiertem nvm:

```bash
nvm install
nvm use
npm ci
npm run dev
```

Die vom Terminal angezeigte Adresse öffnen
(normalerweise `http://localhost:5173/`).
Node.js 18 ist mit der vorhandenen Vite-Version nicht kompatibel.

Produktions-Build prüfen:

```bash
npm run build
npm run preview
```

Die Vorschau liegt normalerweise unter
`http://localhost:4173/`. Falls der Port belegt ist, die
im Terminal angezeigte Adresse verwenden. Start/Stopp, alle drei Stromformen,
Diagramm, Ausblenden der Quellspannung und Öffnen/Schließen des sekundären
Stromkreises prüfen.

`dist/index.html` ist der Einstiegspunkt der fertigen Website. HTML, JavaScript,
CSS und Favicon werden mit relativen Pfaden erzeugt. Dadurch kann der Inhalt von
`dist/` in einen beliebigen Unterordner eines LMS kopiert und weiterhin unter
`/induktionssimulation/` auf GitHub Pages bereitgestellt werden.
Die Seite über HTTP aufrufen, nicht per Doppelklick über `file://`.

## Transformator-Simulation

Im Hauptreiter „Transformator“ lassen sich die Windungszahlen N₁ und N₂,
die sinusförmige Primärspannung (Effektivwert), Frequenz und Lastwiderstand
einstellen. Beim Wechsel der Hauptreiter wird die jeweils laufende Simulation
angehalten. Start/Anhalten/Fortsetzen und Zurücksetzen wirken nur auf den
Transformator; Änderungen seiner Parameter setzen dessen Zeit auf null zurück.

Die SVG zeigt den Eisenkern und beide Spulen in einer flachen 2D-Vorderansicht
mit fünf geschlossenen Flusslinien im Eisenkern. Deckkraft, Breite und
Pfeilrichtung folgen dem magnetischen Fluss. Gelbe Markierungen schwingen gemäß
der physikalischen Stromrichtung (Elektronenbewegung), entgegen der technischen
Stromrichtung. Eine gezeichnete Windung entspricht etwa 20
realen Windungen; bei beiden Spulen wird dieselbe Skala verwendet.

Das Modell beschreibt einen idealen Transformator mit ohmscher Last im
stationären Sinusbetrieb. Es gilt U₂/U₁ = N₂/N₁ und bei angeschlossener Last
I₂/I₁ = N₁/N₂. Magnetisierungsstrom, Verluste, Sättigung, Streufluss und
Einschaltvorgänge werden nicht modelliert. Bei offener Sekundärseite sind beide
Ströme null; Spannung und magnetischer Fluss bleiben bestehen. Die fünf
Diagrammkurven zeigen Primär- und Sekundärspannung, die beiden Ströme und den
magnetischen Fluss; ein Zeitzeiger kennzeichnet den aktuellen Animationszustand.

Modellprüfungen mit der vorgesehenen Node-Version ausführen:

```bash
node --test test/transformer-model.test.js
```

## Fernleitungs-Simulation

Der Reiter „Fernleitung“ zeigt Kraftwerk, Hochtransformator, Hin- und Rückleitung,
Heruntertransformator und Haushalt. Veränderbar sind Kraftwerksleistung,
Leitungsspannung, gesamter Leitungswiderstand und Beobachtungsfrequenz.
Die Vergleichsknöpfe halbieren oder verdoppeln die Leitungsspannung bei gleicher
Kraftwerksleistung. „Auf Startwerte zurücksetzen“ hält die Simulation an, setzt
die Zeit auf 0 und stellt 10 kW, 2 kV, 20 Ω und 0,4 Hz wieder her.
Die Abspielgeschwindigkeit ist unabhängig von der Frequenz einstellbar
(1×, ½×, ¼×, ⅒×). Standard und Startwert ist ¼×: Animation und Momentanwerte
werden gemeinsam verlangsamt, während Modellwerte und Simulationszeit konsistent bleiben.
Gelbe Punkte stellen Elektronenbewegung dar; grüne Flusslinien
pulsieren und wechseln ihre Richtung. Orange Wärmewolken verbildlichen die
mittleren Leitungsverluste, ohne echten Dampf zu behaupten. Tabelle und
Leistungsbalken zeigen Effektivwerte und mittlere Leistungen.

Das einphasige Modell hat ideale Transformatoren und eine für konstante
Kraftwerksleistung angepasste ohmsche Haushaltslast: I = P/U, P_verlust = I²R
und P_Haushalt = P_Kraftwerk − P_verlust. Hin- und Rückleitung werden gemeinsam
gerechnet. Der Spannungsabfall senkt auch die Haushaltsspannung, da die zweite
Übersetzung keine Spannungsregelung enthält. Ungültige Betriebspunkte mit
vollständigem oder größerem Leistungsverlust werden abgefangen.

Alle Modellprüfungen: `node --test test/*.test.js`.

## LC-Schwingkreis

Der Reiter „Schwingkreis“ beginnt mit einem ungeladenen Kondensator. „Kondensator
laden“ bereitet idealisiert die volle Anfangsladung bei Stromstärke null vor;
der zeitliche Ladevorgang wird nicht simuliert. Nach dem Umschalten sind Quelle
und Ladewiderstand vom freien LC-Kreis getrennt. Einstellbar sind L in mH,
C in µF, Ladespannung und eine physikalisch unabhängige Zeitlupe (200- bis 1600-fach).
Startwerte: 100 mH, 100 µF, 6 V, 400-fache Zeitlupe. Änderungen von L, C oder U₀
setzen den Kreis in den ungeladenen Zustand zurück.

Orange Pfeile zeigen das elektrische Feld und Plattenzeichen die wechselnde
Polarität. Grüne geschlossene Linien zeigen das Magnetfeld der Spule. Blaue
Punkte bewegen sich entgegen der technischen Stromrichtung und überqueren
den Kondensatorspalt nicht. Die Feldstärken werden relativ zum Maximum der
aktuellen Einstellungen dargestellt. Zwei Energiebalken zeigen den Austausch
zwischen ½CuC² und ½Li² bei konstanter Gesamtenergie. Zwei Diagramme zeigen
Spannungen und Strom auf gemeinsamer physikalischer Zeitachse in Millisekunden.
Zahlen werden alle 0,5 echten Sekunden aktualisiert; Anhalten und Viertelperioden-
Schritte zeigen exakte Zustände. Beim Wechseln des Reiters wird die Schwingung angehalten.

Das Modell verwendet T = 2π√(LC), uC = U₀ cos(ωt), i = U₀√(C/L) sin(ωt),
uL = −uC mit den in der Zeichnung markierten Bezugsrichtungen. Ohne Widerstand,
Strahlung oder Messgerätebelastung ist die Schwingung ungedämpft.

Ein violetter Pfeil an der Spule zeigt zusätzlich die Wirkung der
Selbstinduktionsspannung Uind = −L di/dt auf positive Ladungen. Polarität,
Pfeilstärke und Erklärung folgen der Stromänderung. Die Anzeige unterscheidet
das Hemmen eines Stromanstiegs vom Aufrechterhalten eines abnehmenden Stroms.
Bei Stromextrema verschwindet der Pfeil, bei Stromnulldurchgängen ist er maximal.
In der Ladestellung und vor dem Laden ist keine Selbstinduktionsspannung dargestellt.

Das Stromdiagramm vergleicht zusätzlich den gezeichneten Kreis (L) mit einem
Referenzkreis (L/4) bei gleichem C und U₀. Beide verwenden dieselben Achsen und
einen gemeinsamen Strommaßstab, der beim Ausblenden einer Kurve erhalten bleibt.
Kurze punktierte Anfangstangenten und Zahlenwerte zeigen di/dt = U₀/L:
Der Referenzkreis hat die vierfache Anfangssteigung und die halbe Periodendauer.
Die Referenz beeinflusst weder die Zeichnung noch die Energieanzeige.

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
git add index.html package.json package-lock.json src/main.js src/style.css src/learning.js src/measurement-data.js public/favicon.svg
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

- **Leere Seite / fehlende Assets:** Den vollständigen Inhalt von `dist/`
  einschließlich des Verzeichnisses `assets/` hochladen und die Verzeichnisstruktur
  beibehalten. Die erzeugten Verweise beginnen mit `./` und funktionieren dadurch
  unabhängig vom Namen des Zielordners.
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
