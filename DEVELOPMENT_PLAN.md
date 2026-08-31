# Planet-Wrack Build Checklist

Diese Liste ist die Arbeitsgrundlage fuer die erste Vollversion.

## Fundament

- [x] HTML-Shell mit Canvas, HUD, Panels und Dialogen.
- [x] CSS fuer Desktop-Layout, Retro-Look, Panels, Buttons und Warnzustaende.
- [x] Zentrale Konfiguration fuer Timing, Welt, Ressourcen, Gegner, Gebaeude und Balancing.
- [x] Zentraler State, seedbarer Zufall, Input, Kamera und Game Loop.

## Welt

- [x] Zufallskarte mit freiem Wrackbereich, Ressourcenringen und Hindernissen.
- [x] Fog of War mit unbekannt, erkundet und sichtbar.
- [x] Kamera folgt dem Spieler und bleibt in der Welt.
- [x] Tile-Kollision fuer Spieler, Ressourcen und Bauwerke.

## Spieler

- [x] WASD/Pfeiltasten fuer Bewegung.
- [x] Leertaste fuer Kontextaktion.
- [x] Hotkeys fuer Werkzeuge, Inventar, Baumenue und Wrackmenue.
- [x] Sammeln, Abbauen, Reparieren, Bauen und Abreissen.

## Verteidigung

- [x] Mauern mit HP, Reparatur und Blockaderegel.
- [x] Tuerme mit Zieltypen, Reichweite, Schussrate und Upgrades.
- [x] Projektile, Treffer, AoE und Slow.
- [x] Boden- und Luftlogik.

## Gegner

- [x] Nachtspawns mit Spawnrichtungen und Pulsen.
- [x] Pfadsuche fuer Bodengegner.
- [x] Luftgegner fliegen direkt.
- [x] Spezialgegner mit Drop- und Druckrollen.
- [x] Morgenrueckzug und Drops.

## Progression

- [x] Wellenprogression Nacht 1 bis Finale.
- [x] Ressourcen-Freischaltungen und Baumenue-Vorschau.
- [x] Wrackmodule mit Effekten und Siegbedingung.
- [x] Startsequenz als aktiver Endgame-Trigger.

## Balancing

- [x] Nachtstatistik erfassen.
- [x] Threat-Budget-Direktor.
- [x] Catch-up bei harten Naechten.
- [x] Druckerhoehung nach sehr leichten Naechten.
- [x] Diagnosehinweise im Morgenbericht.

## Komfort

- [x] Speichern, Laden, Autosave, Reset.
- [x] Pause, Hilfe, Nachrichtenlog.
- [x] Debug/Balance-Overlay optional.
- [x] Spielbare Fehlerzustaende ohne kaputten Loop.

## Testphase

- [x] Erst nach grossem Implementierungsblock Syntax-Checks durchfuehren.
- [x] Browser-Smoke-Test starten.
- [x] Simulierte Eingaben und UI-Panels pruefen.
- [x] Speichern/Laden pruefen.
- [x] Balancing-Schnelllauf mit beschleunigten Naechten pruefen.
- [x] Fehler beheben und Abschlusscheck.
