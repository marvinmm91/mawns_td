# Planet-Wrack

HTML-/JavaScript-Spiel im Stil einer Top-Down-Retro-Gitteransicht.

Stand: Spielbare Vollversion 1.0.

## Kurzkonzept

Du bist ein Ueberlebender auf einem fremden Planeten. In der Mitte der Karte liegt das Wrack deines Raumschiffs. Tagsueber erkundest du die Karte, sammelst Ressourcen und baust Verteidigungen. Nachts greifen Kreaturen und Maschinen vom Kartenrand aus das Wrack an. Der Spieler selbst wird nicht angegriffen; die Spannung entsteht daraus, dass jede Minute ausserhalb der Basis eine bewusste Entscheidung gegen direkte Reparatur und Verteidigung ist.

## Ziel

Das Wrack muss repariert und bis zum Start verteidigt werden. Verliert es alle Strukturpunkte, ist die Partie verloren.

## Dokumente

- `GAME_DESIGN.md`: Zentrale Spielregeln, Spielerlebnis, Inhalte, Progression und Balancing.
- `DEVELOPMENT.md`: Umgesetzte Version 1 und verbindlich festgelegte kommende Arbeit.
- `ROADMAP.md`: Unentschiedene Ideensammlung fuer moegliche spaetere Erweiterungen.
- `CODEMAP.md`: Aktuelle Dateiaufteilung, Laufzeitfluss und Datenfluss fuer HTML, CSS und JavaScript.

## Start

`index.html` im Browser oeffnen.

## Bedienung

- WASD oder Pfeiltasten: Bewegung.
- Space: Aktion auf der Kachel vor dem Spieler.
- Linksklick: Im Baumodus direkt auf die Maus-Kachel bauen, sonst Kachel/Bauwerk/Ressource rechts inspizieren.
- Strg + Linksklick/Ziehen im Baumodus: Blaupausen setzen.
- Alt + Linksklick/Ziehen im Baumodus: Blaupausen entfernen.
- Rechtsklick: Baumodus verlassen.
- 1-5: Werkzeug wechseln.
- E: Inventar.
- R: Wrackmenue.
- H: Hilfe.
- P: Pause.
- F6: Speichern.
- F9: Laden.

## Tests

- `node tests/smoke.js`
- `node tests/endurance.js`
- `node tests/floating-feedback.js`
- `node tests/tower-role-economy.js`
- `node tests/defense-modes-regression.js`
- `node tests/classic-route-guard.js`
- `node tests/enemy-persistence.js`
