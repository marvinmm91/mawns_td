# PLANET-WRACK DEVELOPMENT

Dieses Dokument ist die zentrale Entwicklungsdatei. Es dokumentiert den tatsaechlichen Umsetzungsstand und verbindlich festgelegte, noch offene Arbeit.

Noch nicht beschlossene Vorschlaege gehoeren ausschliesslich in `ROADMAP.md`. Sobald eine Idee verbindlich umgesetzt werden soll, wird sie mit Umfang, Akzeptanzkriterien und betroffenen Dateien hier aufgenommen.

## STATUSLEGENDE

- `[x]` umgesetzt und geprueft
- `[ ]` verbindlich festgelegt, aber noch nicht umgesetzt
- Ideen ohne Entscheidung stehen nicht hier, sondern in `ROADMAP.md`

## AKTUELLER STAND: VERSION 1.0

### FUNDAMENT

- [x] HTML-Shell mit Canvas, HUD, Panels und Dialogen.
- [x] CSS fuer Desktop-Layout, Retro-Look, Panels, Buttons und Warnzustaende.
- [x] Zentrale Konfiguration fuer Timing, Welt, Ressourcen, Gegner, Gebaeude und Balancing.
- [x] Zentraler State, seedbarer Zufall, Input, Kamera und Game Loop.

### WELT

- [x] Zufallskarte mit freiem Wrackbereich, Ressourcenringen und Hindernissen.
- [x] Biome fuer Wiese, Wald, Feuchtgebiet und Felskanten.
- [x] Fluss, Baeche, Furten und baubare Bruecken.
- [x] Fog of War mit unbekannt, erkundet und sichtbar.
- [x] Kamera folgt dem Spieler und bleibt innerhalb der Welt.
- [x] Tile-Kollision fuer Spieler, Ressourcen, Truhen, Monsterlager und Bauwerke.

### SPIELER UND INTERAKTION

- [x] WASD- und Pfeiltasten fuer Bewegung.
- [x] Leertaste fuer die Kontextaktion vor dem Spieler.
- [x] Hotkeys fuer Werkzeuge, Inventar, Baumenue, Wrackmenue, Hilfe und Pause.
- [x] Mausinspektion und direkter Mausbau.
- [x] Sammeln, Abbauen, Reparieren, Bauen und Abreissen.

### VERTEIDIGUNG

- [x] Palisaden, Steinmauern und Stahlmauern.
- [x] Bruecken auf Wasser.
- [x] Balliste, Katapult, Flak, Tesla-Feld und Laser-Turm.
- [x] HP, Reparatur und bis zu drei Ausbaustufen.
- [x] Zieltypen fuer Boden und Luft.
- [x] Projektile, Treffer, AoE, Slow und visuelles Schadensfeedback.
- [x] Pathfinding-Neuberechnung nur nach relevanten Bauveraenderungen.

### GEGNER UND NACHT

- [x] Nachtspawns mit Spawnrichtungen, Sicherheitsradius und Pulsen.
- [x] Krabbler, Schwaerme, Panzereinheiten, Brecher, Drohnen, Bomber, Stoersender und Nesthueter.
- [x] Pfadsuche fuer Bodengegner.
- [x] Direkte Bewegung fuer Luftgegner.
- [x] Blockadenangriffe ohne erreichbaren Weg.
- [x] Morgenrueckzug und Drops.

### PROGRESSION

- [x] Wellenprogression von Nacht 1 bis zur finalen Nacht.
- [x] Ressourcenbasierte und nachtbasierte Freischaltungen.
- [x] Wrackmodule mit Kosten, Effekten und Siegfortschritt.
- [x] Startsequenz mit 120-Sekunden-Countdown.
- [x] Sieg- und Niederlagendialog.

### ZUSATZSYSTEME

- [x] Schatztruhen mit Schluesseln und Belohnungen.
- [x] Stationaere Monsterhorden mit Schluesseltraegern.
- [x] Dekorative Voegel.
- [x] Passive Waldtiere mit Fluchtverhalten und Beute.
- [x] Drop-Pickup und Drop-Magnetismus.
- [x] Pixel-Art-Editor mit Vorlagen, Reset, Import und Export.

### BALANCING UND KOMFORT

- [x] Nachtstatistik mit Wrack-, Luft-, Mauer- und Killwerten.
- [x] Threat-Budget-Direktor.
- [x] Catch-up nach harten Naechten.
- [x] Druckerhoehung nach wiederholt sehr leichten Naechten.
- [x] Diagnosehinweise im Morgenbericht.
- [x] Manuelles Speichern, Laden, Autosave und Reload-Sicherung.
- [x] Pause, Hilfe, Nachrichtenlog und robuste Fehlerzustaende.

## VERIFIKATION

- [x] JavaScript-Syntaxpruefung aller Quelldateien.
- [x] Browser-Smoke-Test.
- [x] Langlauf bis zur Startsequenz und zum Sieg.
- [x] Terrain-, Biom-, Fluss-, Furt- und Brueckentest.
- [x] Ressourcen-HP- und Legacy-Migrationstest.
- [x] Waffen-, AoE-, Slow- und Upgrade-Balance-Test.
- [x] Schatztruhen-, Monsterhorden- und Schluesseldrop-Test.
- [x] Wildlife- und Beutetest.
- [x] Drop-Magnet-Test.
- [x] Pixel-Art-Editor-Test.
- [x] Panel-Refresh-Test.
- [x] Responsive-Layout-Test.

## VERBINDLICH FESTGELEGTE OFFENE PUNKTE

Aktuell gibt es keine verbindlich festgelegten offenen Entwicklungspunkte.

Neue Punkte werden erst hier aufgenommen, wenn sie aus `ROADMAP.md` ausgewaehlt und konkretisiert wurden. Jeder aufgenommene Punkt soll mindestens enthalten:

- Ziel und Problem
- Umfang und betroffene Dateien
- Aufwand und Abhaengigkeiten
- Akzeptanzkriterien
- notwendige Tests oder Messwerte

## ENTSCHEIDUNGSREGELN

1. `GAME_DESIGN.md` definiert Spielerlebnis und Spielregeln.
2. `DEVELOPMENT.md` definiert den verbindlichen Umsetzungsumfang.
3. `ROADMAP.md` sammelt unentschiedene Ideen.
4. `CODEMAP.md` beschreibt nur den aktuell existierenden Code.
5. `README.md` bleibt der kurze Einstiegspunkt.

## TESTBEFEHLE

```text
node tests/smoke.js
node tests/endurance.js
```

Die weiteren Browsertests unter `tests/` koennen einzeln mit `node tests/<datei>.js` ausgefuehrt werden.
