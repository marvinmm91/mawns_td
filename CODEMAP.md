# Planet-Wrack Codemap

Dies ist der Wegweiser durch die aktuelle spielbare Implementierung.

Das Projekt ist eine eigenstaendige HTML-/Canvas-Anwendung ohne Build-System oder Framework. Die Dateien werden in `index.html` per klassischer `<script>`-Reihenfolge geladen und teilen sich den globalen Namespace `PW`.

Die UI-Dateien sind inzwischen konsolidiert: Bau-, Inventar-, Wrack-, Kontext- und Statuspanel liegen gemeinsam in `js/ui/panels.js`.

## Dokumentationsstruktur

- `README.md`: Kurzer Einstieg, Steuerung und Testbefehle.
- `GAME_DESIGN.md`: Verbindliche Spielregeln, Spielerlebnis, Inhalte, Progression und Balancing.
- `DEVELOPMENT.md`: Umsetzungsstatus und verbindlich festgelegte Entwicklungsarbeit.
- `ROADMAP.md`: Unentschiedene Ideen und moegliche spaetere Erweiterungen.
- `CODEMAP.md`: Diese technische Orientierung durch den aktuellen Code.

## Dateien

- `index.html`: Canvas, HUD-Grundstruktur, Panel-Container und Script-Reihenfolge.
- `css/styles.css`: Grundlayout, Canvas-Rahmen, HUD, Panels, Buttons, Hotbar, Tag-/Nacht-Stimmung.
- `js/config.js`: Globale Balancing-Werte, Tilegroessen, Phasenlaengen, Startwerte, Debug-Schalter.
- `js/state.js`: Zentraler Spielzustand, Laufzeitlisten, Inputstatus, Kamera, Timer, Inventar, Wrackdaten.
- `js/bootstrap.js`: Initialisierung, Event Listener, Start des Game Loops.
- `js/gameLoop.js`: Feste Update-Reihenfolge, Delta-Time-Begrenzung, Pause/Resume, zentraler Renderaufruf und schaltbare Laufzeitmessung.
- `js/input.js`: Tastaturstatus, Hotkeys, Mausposition, Mausbau, Kachel-Inspektion, Panel-Toggles.
- `js/camera.js`: Kamera folgt Spieler, Welt-zu-Screen-Umrechnung, sichtbarer Bereich.
- `js/random.js`: Seedbarer Zufall fuer Map und Wellen.
- `js/utils.js`: Kosten, Inventar, Formatierung, Distanzrechnung, Effekte und kleine Helfer.

## Datenmodule

- `js/data/resources.js`: Ressourcentypen, Farben, Abbauzeiten, Tool-Anforderungen.
- `js/data/buildings.js`: Mauern, Tuerme, Kosten, HP, Reichweite, Schaden, Zieltypen.
- `js/data/enemies.js`: Gegnertypen, HP, Tempo, Schaden, Zielverhalten, Drops.
- `js/data/wildlife.js`: Dekorative Voegel und passive Waldbewohner mit HP, Verhalten und Belohnungen.
- `js/data/waves.js`: Wellenstufen, Freischaltungen, Mischungen und Spawngewichte.
- `js/data/shipModules.js`: Reparaturmodule, Kosten, Freischaltungen, Siegfortschritt.

## Welt und Karte

- `js/world/mapGenerator.js`: Tilemap-Erzeugung, groessere Biome, Fluss/Baeche/Furten, Startbereich und biomeabhaengige Ressourcenverteilung.
- `js/world/tiles.js`: Tile-Helfer, Kacheltypen, Begehbarkeit, Bauplatzregeln.
- `js/world/spatialIndex.js`: 8x8-Kachelindex fuer sichtbare Weltobjekte, Radiusabfragen und ID-Lookups. Bewegte Objekte werden beim Spawn registriert und nur beim Zellwechsel umindexiert; Kartengenerierung sowie Laden bauen den Index vollstaendig neu auf. Bei ausgetauschten Laufzeitlisten erkennt der Index auch gleiche Listengroessen.
- `js/world/fog.js`: Fog-of-War-Speicher, Sichtkreis, erkundete Kacheln.
- `js/world/resources.js`: Ressourcenknoten, Abbaufortschritt, Inventarzugang.

## Akteure und Systeme

- `js/entities/player.js`: Spielerposition, Bewegung, Kollision, Blickrichtung.
- `js/entities/enemies.js`: Gegnerlisten, Bewegung, Zielwahl, Schaden am Wrack.
- `js/entities/projectiles.js`: Turmprojektile, Treffer, Lebensdauer.
- `js/systems/dayNight.js`: Tag, Daemmerung, Nacht, Morgengrauen, Timer, Phasenwechsel.
- `js/systems/building.js`: Bauplatzpruefung, Platzieren, Reparieren, Abreissen, Kosten.
- `js/systems/pathfinding.js`: Grid-Pfade fuer Bodengegner und Blockade-Erkennung.
- `js/systems/combat.js`: Turmzielwahl, Schaden, AoE, Slow, Luft-/Bodenfilter.
- `js/systems/spawning.js`: Nachtspawns, Spawnpunkte, Sicherheitsradius, Warnrichtungen.
- `js/systems/drops.js`: Gegnerdrops, Einsammeln, Drop-Verfall optional.
- `js/systems/treasure.js`: Schatztruhen, stationaere Monsterhorden, Schluesseldrops und Truhenbelohnungen.
- `js/systems/wildlife.js`: Kleine Voegel ohne Hitbox, passive Waldbewohner mit Wander-/Fluchtverhalten, Trefferlogik und Beutedrops.
- `js/systems/progression.js`: Wrackmodule, Siegbedingung, finale Startsequenz.
- `js/systems/autobalance.js`: Auswertung vergangener Nacht und Anpassung der naechsten Welle.
- `js/systems/pixelArt.js`: Pixel-Design-Overrides, Asset-Katalog, LocalStorage, Import/Export und Start-Mods.
- `mods/pixel-overrides.js`: Optional geladene Pixel-Mod-Datei fuer Designs, die beim Spielstart aktiv sein sollen; aktuell leerer Mod-Container.

## UI

- `js/ui/hud.js`: Wrack-HP, Timer, Nachtzaehler, Modulfortschritt, Werkzeugleiste und Ressourcen-Kurzliste.
- `js/ui/icons.js`: Canvas-Icons fuer Ressourcen, Werkzeuge, Kostenchips, Bauvorschau und Bauwerksdarstellung.
- `js/ui/panels.js`: Status-, Inventar-, Bau-, Upgrade-, Wrack-, Kontext- und Dialogansichten einschliesslich Morgenbericht und Hilfe.
- `js/ui/designPanel.js`: Vereinfachter Pixel-Editor fuer manuelle Designs, Reset, Import und Export.
- `js/ui/messages.js`: Kurze Hinweise, Nachtwarnung, Fehlertexte.

## Rendering

- `js/render/renderMain.js`: Zentrale Render-Reihenfolge.
- `js/render/renderWorld.js`: Tiles, Ressourcen, Bauwerke, Wrack.
- `js/render/renderEntities.js`: Spieler, Gegner, Wildlife, Projektile, Drops.
- `js/render/renderFog.js`: Fog of War und Nachtabdunklung.
- `js/render/renderEffects.js`: Treffer, Partikel, Warnmarker, Schadensfeedback.

## Laufzeitfluss

`PW.Bootstrap.init()` baut DOM-Referenzen auf, initialisiert Pixel-Art, generiert die Karte, bindet Eingaben und startet `PW.GameLoop`.

Jeder Frame wird in dieser Reihenfolge verarbeitet:

1. Input lesen.
2. Tagesphase aktualisieren.
3. Spieler bewegen.
4. Kamera und Fog of War aktualisieren.
5. Schatztruhen und Monsterlager aktualisieren.
6. Wildlife aktualisieren.
7. Nachtspawns aktualisieren.
8. Pfade bei Bedarf neu berechnen.
9. Gegner bewegen und angreifen.
10. Tuerme feuern lassen.
11. Projektile und Effekte aktualisieren.
12. Drops einsammeln.
13. Nachrichten, Autosave und HUD aktualisieren.
14. Welt, Entities, Effekte, Fog und Overlay rendern.

## Spielzustand und Persistenz

- `PW.state` ist die zentrale Runtime-Struktur aus `js/state.js`.
- Die Welt enthaelt Tiles, Fog, Ressourcen, Bauwerke, Wasserwege, Wildlife, Truhen und Monsterlager.
- Der Spieler, das Wrack, Gegner, Projektile, Drops und Effekte liegen als Laufzeitlisten bzw. Objekte im State.
- `js/systems/save.js` speichert den spielrelevanten State in `localStorage` unter `PW.CONFIG.saveKey`.
- Autosave laeuft alle 15 Sekunden; `F6` speichert manuell, `F9` laedt.
- Vor einem Reload wird der laufende Spielstand zusaetzlich gesichert und beim naechsten Start ueber ein Fortsetzen-Dialog angeboten.
- Pixel-Art-Designs werden separat von der Partie unter `planet-wrack-pixel-art-v1` gespeichert.

## Datenfluss der wichtigsten Systeme

- `config.js` liefert globale Werte fuer Karte, Phasen, Sicht, Ressourcen, Bauen und Balancing.
- `data/*.js` enthaelt die unveraenderlichen Definitionen fuer Ressourcen, Bauwerke, Gegner, Wildlife, Wellen und Wrackmodule.
- `mapGenerator.js` erzeugt aus `state.seed` die Tilemap und legt darauf Ressourcen, Horden, Truhen und Wildlife an.
- `building.js` veraendert Inventar, Bauwerkslisten und den Pathfinding-Cache.
- `spawning.js` kauft Gegner aus dem Threat-Budget; `enemies.js` bewegt und attackiert sie.
- `combat.js` waehlt Ziele ueber Radiusabfragen; `projectiles.js` loest Treffer, AoE, Slow und Schaden per ID-Lookup beziehungsweise Radiusabfrage aus.
- Dynamische Listen melden Spawn, Bewegung und Entfernung an `spatialIndex.js`; die Render-Schleife liest den fertigen Index nur noch aus.
- `drops.js` erzeugt Beute und sammelt sie ueber Pickup-/Magnetradius ein.
- `dayNight.js`, `progression.js` und `autobalance.js` verbinden Phasen, Nachtberichte, Module und Sieg/Niederlage.

## Hinweise fuer spaetere Codex-Aufgaben

- Bei Balancing-Werten zuerst `js/config.js` und die passenden `js/data/*` Dateien anfassen.
- Bei Tag-/Nacht-Verhalten zuerst `js/systems/dayNight.js`, danach `js/systems/spawning.js`.
- Bei Gegnerpfaden zuerst `js/systems/pathfinding.js` und `js/entities/enemies.js`.
- Bei Bauproblemen zuerst `js/systems/building.js` und `js/world/tiles.js`.
- Bei reiner Darstellung zuerst `js/render/*` oder `css/styles.css`.
- Bei UI-Texten zuerst `js/ui/*`.
- Bei Save-/Reload-Problemen zuerst `js/systems/save.js` und danach `js/state.js` pruefen.
- Bei Pixel-Art-Overrides zuerst `js/systems/pixelArt.js`, danach `js/ui/designPanel.js` und `mods/pixel-overrides.js` pruefen.
- Bei verbindlich beschlossenen neuen Vorhaben zuerst `DEVELOPMENT.md` und bei neuen Spielregeln `GAME_DESIGN.md` aktualisieren; unentschiedene Vorschlaege gehoeren in `ROADMAP.md`.
