# Planet-Wrack

HTML-/JavaScript-Spiel im Stil einer Top-Down-Retro-Gitteransicht.

Stand: Spielbare Vollversion 1.0.

## Kurzkonzept

Du bist ein Ueberlebender auf einem fremden Planeten. In der Mitte der Karte liegt das Wrack deines Raumschiffs. Tagsueber erkundest du die Karte, sammelst Ressourcen und baust Verteidigungen. Nachts greifen Kreaturen und Maschinen vom Kartenrand aus das Wrack an. Der Spieler selbst wird nicht angegriffen; die Spannung entsteht daraus, dass jede Minute ausserhalb der Basis eine bewusste Entscheidung gegen direkte Reparatur und Verteidigung ist.

## Ziel

Das Wrack muss repariert und bis zum Start verteidigt werden. Verliert es alle Strukturpunkte, ist die Partie verloren.

## Dokumente

- `GAME_DESIGN.md`: Ausdetaillierte Spielregeln, korrigierter Tag-/Nacht-Loop, Ressourcen, Gegner, Tuerme und Balancing.
- `PROGRESSION_BALANCING.md`: Spielspass, Progression, Unlock-Kurve, Ressourcen-Oekonomie und Autobalancing im Detail.
- `CODEMAP.md`: Dateiaufteilung fuer HTML, CSS und JavaScript.
- `DEVELOPMENT_PLAN.md`: Umgesetzte Build-Checkliste.
- `IMPLEMENTATION_PLAN.md`: Historischer Umsetzungsplan.

## Start

`index.html` im Browser oeffnen.

## Bedienung

- WASD oder Pfeiltasten: Bewegung.
- Space: Aktion auf der Kachel vor dem Spieler.
- Linksklick: Im Baumodus direkt auf die Maus-Kachel bauen, sonst Kachel/Bauwerk/Ressource rechts inspizieren.
- Rechtsklick: Baumodus verlassen.
- 1-5: Werkzeug wechseln.
- E: Inventar.
- B: Baumenue.
- R: Wrackmenue.
- H: Hilfe.
- P: Pause.
- F6: Speichern.
- F9: Laden.

## Tests

- `node tests/smoke.js`
- `node tests/endurance.js`
