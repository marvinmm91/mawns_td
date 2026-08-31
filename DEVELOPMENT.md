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
- [x] Alle Tuerme sind von Beginn an sichtbar; Ressourcen- und Baukosten bleiben die Zugangshuerde.
- [x] Ressourcenbasierte und nachtbasierte Freischaltungen fuer Module und uebrige Gebaeude.
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
- [x] Raeumlicher Index: Sichtbarkeit, Zellwechsel bewegter Objekte sowie Neuaufbau nach Speichern/Laden.
- [x] Raeumliche Kampfqueries: Turmziele, Stoerfelder, AoE, Projektil-ID-Lookups und Hordenangriffe.
- [x] Deterministischer Performance-Stresstest mit bereinigtem Laufzeit-Zustand und Arbeitszeitgrenze.

## VERBINDLICH FESTGELEGTE OFFENE PUNKTE

Die folgenden Punkte wurden aus `ROADMAP.md` verbindlich fuer die naechste Entwicklungsphase ausgewaehlt. Sie werden einzeln umgesetzt, jeweils mit einem eigenen Commit. Nach jedem abgeschlossenen Punkt wird vor dem naechsten Punkt Ruecksprache gehalten.

### PERFORMANCE

- [x] **Messung und Stresstest** (`S`): Laufzeitmessung fuer Update und Rendern, sichtbares Debug-Overlay und ein Browser-Stresstest mit festem Seed und grosszuegiger Arbeitszeitgrenze. Betroffene Dateien: `js/gameLoop.js`, `js/render/*`, `js/config.js`, `tests/`. Akzeptanz: Messwerte sind nur bei aktiviertem Debug sichtbar; die feste Stressszene prueft viele Gegner/Tuerme ohne Browserfehler oder unvertretbare Laufzeit.
- [x] **Raeumlicher Weltindex** (`M`): Ressourcen, Gebaeude, Drops und Akteure werden fuer sichtbare Bereiche und lokale Abfragen indexiert. Betroffene Dateien: `js/world/*`, `js/render/*`, `js/systems/*`. Abhaengigkeit: Messung und Stresstest. Akzeptanz: Das Verhalten bleibt identisch, Rendering und Abfragen laufen nicht mehr ueber alle Weltobjekte; bewegte Objekte werden nur bei Zellwechsel umindexiert.
- [x] **Raeumliche Kampfqueries** (`M`): Turmzielwahl, Stoerfelder, Hordenangriffe und AoE verwenden lokale Radiusabfragen; Projektile loesen Ziele per ID-Lookup auf. Betroffene Dateien: `js/world/spatialIndex.js`, `js/systems/combat.js`, `js/entities/projectiles.js`, `js/entities/enemies.js`, `tests/`. Abhaengigkeit: Raeumlicher Weltindex. Akzeptanz: Zielauswahl, AoE und Spezialeffekte bleiben korrekt; Lasttest misst keine Verschlechterung.

### GAMEPLAY

- [x] **Spielmodus-Fundament** (`M`, Issue #52): Classic und Aggressive Mode sind vor einer neuen Partie waehlar, werden im State und Savegame gefuehrt und im Status angezeigt. Alte Spielstaende migrieren auf Classic; die konkreten Gegnerregeln folgen in den abhaengigen Issues. Betroffene Dateien: `js/config.js`, `js/systems/gameModes.js`, `js/state.js`, `js/systems/save.js`, `js/bootstrap.js`, `js/ui/panels.js`, `tests/`. Akzeptanz: Auswahl, Save/Load und Migration sind reproduzierbar; keine Angriffsregel aendert sich vor den Folgetasks.
- [x] **Routen- und Strukturzielabfrage** (`M`, Issue #53): Das Pathfinding liefert pro Bodengegner einen normalen Wegstatus, einen Durchbruchschritt, ein Blockadeziel und ein Direktziel. Ein zweites, nur nach Weltveraenderungen berechnetes Feld bewertet aufbrechbare Strukturen mit Kosten; die eigentliche Moduslogik nutzt die Abfragen erst in den Folgeissues. Betroffene Dateien: `js/systems/pathfinding.js`, `js/config.js`, `tests/`. Akzeptanz: Freie Wege, Blockaden und direkte Wegstrukturen sind deterministisch unterscheidbar, ohne Suchlauf pro Gegner und Frame.
- [x] **Classic Mode** (`M`, Issue #54): Regulaere Bodengegner ignorieren Mauer, Palisade und Turm bei freiem oder alternativem Weg. Ohne Pfad steuern sie nur das naechste Durchbruchziel an und verursachen dort erhoehten Strukturschaden; Wrack, Luftgegner und stationaere Wachen sind ausgeschlossen. Betroffene Dateien: `js/entities/enemies.js`, `js/config.js`, `GAME_DESIGN.md`, `tests/`. Akzeptanz: Freie Wege bleiben frei von Strukturangriffen; eine vollstaendige Blockade wird gezielt und ohne erhoehten Wrackschaden aufgebrochen.
- [x] **Aggressive Mode** (`M`, Issue #55): Regulaere Bodengegner greifen ausschliesslich Verteidigungen auf ihrem strukturbewerteten Direktweg an, auch bei vorhandenem Umweg. Seitliche Strukturen bleiben sicher; volle Blockaden werden weiterhin gezielt aufgebrochen. Betroffene Dateien: `js/entities/enemies.js`, `js/systems/pathfinding.js`, `GAME_DESIGN.md`, `tests/`. Akzeptanz: Direkte Mauer-, Palisaden- und Turmziele werden angegriffen; der Wrackfokus, Luftgegner und stationaere Wachen bleiben korrekt.
- [x] **Modusbalance und Feedback** (`M`, Issue #56): Classic nutzt 124 Prozent Wellenbudget und 165 Prozent Blockadeschaden; Aggressive nutzt 92 Prozent Wellenbudget bei normalem Strukturschaden. Der Director berechnet Schwierigkeit und Drift weiterhin getrennt, der Spawner wendet danach den Modusfaktor an. Status und Morgenbericht zeigen den Faktor und das effektive Budget. Betroffene Dateien: `js/config.js`, `js/systems/autobalance.js`, `js/systems/spawning.js`, `js/ui/panels.js`, `GAME_DESIGN.md`, `tests/`. Akzeptanz: Beide Modi haben einen klaren wirtschaftlichen Nachteil fuer ihre Verteidigungsregel; Schwierigkeit Stufe 3 bleibt die Mitte je Modus.
- [x] **Modus-Regression** (`M`, Issue #57): Ein gemeinsamer Testlauf verbindet Auswahl und Legacy-Migration mit freiem Weg, Direktziel, vollstaendiger Blockade, Classic-/Aggressive-Strukturschaden, Modusbudget und Prognose. Betroffene Dateien: `tests/defense-modes-regression.js`, `tests/game-mode-*.js`, `tests/*-mode.js`. Akzeptanz: Die Szenarien sind reproduzierbar und laufen gemeinsam mit der bestehenden Gesamt-Testsuite fehlerfrei.
- [x] **Turm-Zielprioritaeten** (`M`): Pro Turm waehlt der Spieler Wracknah, Naechster, Staerkster oder Brecher zuerst; der Laser bietet zusaetzlich Luft zuerst. Betroffene Dateien: `js/systems/building.js`, `js/systems/combat.js`, `js/ui/panels.js`, `js/systems/save.js`, `tests/`. Akzeptanz: Prioritaeten sind im Baukontext lesbar, speicherbar und durch Tests abgedeckt.
- [x] **Blaupausen fuer geplante Gebaeudelinien** (`M`): Kostenfreie, nicht blockierende Blaupausen lassen sich auch per Ziehen setzen, einzeln oder gesammelt errichten, entfernen und speichern. Betroffene Dateien: `js/world/*`, `js/systems/building.js`, `js/systems/save.js`, `js/input.js`, `js/render/*`, `js/ui/*`, `tests/`. Akzeptanz: Bauvorhaben sind auf der Karte klar erkennbar, kollisionsfrei und nach Laden wieder verfuegbar.
- [x] **Kartennadeln** (`S`): Spieler kann wichtige Ressourcen, Truhen, Horden und Brueckenplaetze markieren. Betroffene Dateien: `js/systems/mapPins.js`, `js/render/*`, `js/ui/panels.js`, `js/systems/save.js`, `tests/`. Akzeptanz: Markierungen sind auf der erkundeten Karte sichtbar und bleiben nach Speichern/Laden erhalten.

### DESIGN UND UX

- [x] **Lesbare Spielzustände** (`M`): Einheitliche Schatten, Umrisse und Farbcodes machen Gegner, Beute, interaktive Objekte und Verbundene klar unterscheidbar. Betroffene Dateien: `js/render/*`, `tests/`. Akzeptanz: Keine neue Hitbox oder Regel; relevante Zustände sind auch bei Nacht und in dichter Szene unterscheidbar.
- [x] **Schadenszustände fuer Weltobjekte** (`S`): Mauern, Tuerme, Bruecken und Wrack erhalten klarere visuelle Beschaedigung. Betroffene Dateien: `js/systems/damageVisuals.js`, `js/entities/enemies.js`, `js/render/renderWorld.js`, `js/render/renderEffects.js`, `tests/`. Akzeptanz: Der Schaden ist ohne Panel erkennbar und verschwindet nach der Reparatur.

### NEUE SPIELINHALTE

- [x] **Verlassene Aussenposten** (`M`): Seltene Weltziele liefern eine einmalige Belohnung wie Ressourcen, Bauplan oder kurze Verteidigungsaufgabe. Betroffene Dateien: `js/world/mapGenerator.js`, `js/systems/outposts.js`, `js/entities/*`, `js/render/*`, `js/ui/*`, `js/systems/save.js`, `tests/`. Akzeptanz: Mehrere Outpost-Varianten sind erreichbar, lesbar und konfliktfrei mit Wasser, Ressourcen und Lagern platziert.
- [ ] **Hordenanfuehrer** (`M`): Staerkste Horden enthalten einen klar erkennbaren Anfuehrer mit garantiertem Schluessel- oder Bauteildrop. Betroffene Dateien: `js/data/enemies.js`, `js/systems/treasure.js`, `js/entities/*`, `js/render/*`. Akzeptanz: Der Drop faellt genau einmal und die Horde bleibt weiterhin eine optionale Herausforderung.

### BALANCING

- [x] **Schwierigkeitsprofile und Bedrohungsprognose** (`M`, Issue #43): Fuenf vor dem Start waehlbare Stufen beeinflussen ausschliesslich Grundbudget und Grenzen des vorhandenen Bedrohungsdirektors; Stufe 3 entspricht den bisherigen Standardwerten. Status und Morgenbericht zeigen Stufe, Prognose und konkretes Budget der naechsten Nacht. Profil bleibt im Spielstand erhalten; alte Spielstaende migrieren auf Standard. Betroffene Dateien: `js/config.js`, `js/state.js`, `js/systems/autobalance.js`, `js/systems/save.js`, `js/bootstrap.js`, `js/ui/panels.js`, `tests/`. Akzeptanz: Alle Profile liefern reproduzierbar abgestufte Budgets; Standard bleibt unveraendert; Auswahl und Save/Load funktionieren.
- [ ] **Seed-basierter Balance- und Lasttest** (`M`): Viele feste Karten-Seeds bis zur spaeten Nacht simulieren und Kennzahlen zu Ressourcen, Verlusten, Wellen und Last erfassen. Betroffene Dateien: `tests/`, gegebenenfalls `js/config.js`. Akzeptanz: Der Lauf ist reproduzierbar und zeigt Ausreisser direkt an.
- [ ] **Skalierende Horden- und Truhenbelohnungen** (`M`): Beute richtet sich nachvollziehbar nach Entfernung, Nacht und Hordenstaerke. Betroffene Dateien: `js/systems/treasure.js`, `js/data/*`, `GAME_DESIGN.md`. Abhaengigkeit: Balance- und Lasttest. Akzeptanz: Fruehe Truhen brechen die Oekonomie nicht, spaete Ziele bleiben attraktiv.
- [x] **Gegnerrollen und vergleichbare Turmoekonomie** (`M`, Issues #41/#42): Rollen besitzen nachvollziehbare Schadens- und Slow-Profile; Schwaerme erscheinen als dichte Pakete. Eine automatisierte Tabelle prueft Kostenwert, Schaden, Reichweite, Zieltypen, Spezialeffekte und Upgrade-Wert aller Tuerme gegen die relevanten Gegnerrollen. Betroffene Dateien: `js/data/enemies.js`, `js/data/buildings.js`, `js/entities/*`, `js/systems/spawning.js`, `tests/`. Akzeptanz: Katapult und Tesla besitzen je einen klaren Gegenwert gegen Schwaerme beziehungsweise schnelle Bodenziele; keine Turmart deckt alle Rollen wirtschaftlich ab.

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
node tests/tower-role-economy.js
```

Die weiteren Browsertests unter `tests/` koennen einzeln mit `node tests/<datei>.js` ausgefuehrt werden.
