# Planet-Wrack Implementation Plan

Dieses Dokument beschreibt eine sinnvolle Reihenfolge fuer spaetere Codex-Aufgaben. Es enthaelt bewusst keinen Code.

## Phase 0: Projektgeruest

Ziel: Leeres, aber lauffaehiges HTML-/Canvas-Projekt mit sauberer Modulstruktur.

- `index.html`, `css/styles.css` und Basisdateien unter `js/` anlegen.
- Canvas skalieren und festen Desktop-Spielbereich definieren.
- Game Loop mit Update und Render vorbereiten.
- Debug-Anzeige fuer FPS, Seed und Maus-/Tileposition optional einbauen.

Akzeptanz:

- Seite oeffnet ohne Fehler.
- Leerer Canvas wird stabil gezeichnet.
- Module laden in nachvollziehbarer Reihenfolge.

## Phase 1: Karte, Kamera und Spieler

Ziel: Der Spieler kann sich auf einer generierten Tilemap bewegen.

- Tilemap mit Startbereich und einfachen Bodentypen.
- Kamera folgt Spieler.
- Spieler bewegt sich mit WASD/Pfeiltasten.
- Kollision mit nicht begehbaren Tiles.
- Sichtbarer Weltbereich wird korrekt gerendert.

Akzeptanz:

- Spieler bleibt in der Welt.
- Kamera zeigt keine Bereiche ausserhalb der Map.
- Bewegung fuehlt sich direkt und lesbar an.

## Phase 2: Ressourcen und Fog of War

Ziel: Erkundung und Sammeln werden spielbar.

- Baeume, Felsen und erste Erzadern generieren.
- Fog of War verdeckt unbekannte Kacheln.
- Aufgedeckte Kacheln bleiben dauerhaft sichtbar.
- Leertaste baut Ressource vor dem Spieler ab.
- Inventar zaehlt Holz, Stein und Eisen.

Akzeptanz:

- Ressourcen verschwinden nach Abbau.
- Inventarwerte stimmen.
- Fog wird dauerhaft aufgedeckt.

## Phase 3: Wrack und Tageszyklus

Ziel: Das zentrale Schutzobjekt und der korrigierte Tag-/Nacht-Loop funktionieren.

- Wrack in der Kartenmitte mit 500 HP.
- UI fuer Wrack-HP, Phase, Timer und Nachtzaehler.
- Phasen: Tag, Daemmerung, Nacht, Morgengrauen.
- Bei Nachtbeginn wird eine Welle vorbereitet.
- Bei Morgen stoppen neue Spawns und Restgegner ziehen sich zurueck.

Akzeptanz:

- Timer wechselt sauber durch alle Phasen.
- Wrack-HP wird sichtbar aktualisiert.
- Tag und Nacht haben keine widerspruechlichen Regeln.

## Phase 4: Erste Gegnerwelle

Ziel: Bodengegner greifen nachts das Wrack an.

- Krabbler als erster Gegnertyp.
- Spawn ausserhalb der Basiszone.
- Einfache Pfadsuche zum Wrack.
- Gegner verursachen Wrackschaden.
- Niederlage bei 0 HP.

Akzeptanz:

- Gegner ignorieren den Spieler.
- Gegner erreichen das Wrack ohne Mauern.
- Wrack verliert nachvollziehbar HP.

## Phase 5: Mauern und Balliste

Ziel: Erste Tower-Defense-Entscheidungen.

- Palisade und Steinmauer platzieren.
- Balliste platzieren.
- Baukosten aus Inventar abziehen.
- Bodengegner umgehen Mauern, wenn ein Pfad existiert.
- Wenn kein Pfad existiert, greifen Gegner Mauern an.
- Balliste greift Bodengegner in Reichweite an.

Akzeptanz:

- Bauplatzvalidierung verhindert Bau auf Wrack, Ressourcen und anderen Gebaeuden.
- Gegner bleiben nicht endlos haengen.
- Turmfeuer ist visuell und mechanisch klar.

## Phase 6: Drops, Reparatur und Tagesauswertung

Ziel: Die Nacht lohnt sich und hat Konsequenzen.

- Gegner droppen Schrott.
- Drops koennen eingesammelt werden.
- Reparaturset repariert Wrack und Gebaeude.
- Morgengrauen zeigt kurze Auswertung.
- Naechste Welle skaliert leicht.

Akzeptanz:

- Reparatur verbraucht Ressourcen.
- Drops gehen ins Inventar.
- Welle 2 ist schwerer als Welle 1.

Hinweis:

- Schon hier sollte eine einfache Nachtbewertung vorbereitet werden: Wrackschaden, zerstoerte Mauern, Kills und eingesammelter Schrott. Das vollstaendige Autobalancing kommt spaeter, aber die Messwerte muessen frueh sauber entstehen.

## Phase 7: Luftgegner und Gegenmittel

Ziel: Boden/Luft-Taktik wird relevant.

- Drohne als erster Luftgegner.
- Luftgegner ignorieren Mauern.
- Flak-Geschuetz als Luftabwehr.
- Laser-Turm als teure Universaloption.

Akzeptanz:

- Balliste schiesst nicht auf Luft.
- Flak schiesst nicht auf Boden.
- Laser kann beide Zieltypen treffen.

## Phase 8: Erweiterte Tuerme und Ressourcen

Ziel: Mehr taktische Optionen.

- Katapult mit Flaechenschaden.
- Tesla-Feld mit Slow.
- Gold und Kristall als seltene Vorkommen.
- Fortschrittliche Kosten und Freischaltungen.

Akzeptanz:

- AoE und Slow sind spuerbar, aber nicht uebermaechtig.
- Seltene Ressourcen motivieren entfernte Erkundung.

## Phase 9: Wrackmodule und Sieg

Ziel: Die Partie bekommt ein klares Ende.

- Reparaturmodule mit Kosten und Fortschritt.
- Modulboni optional.
- Startsequenz nach allen Modulen.
- Finale Nacht mit gemischter Welle.
- Siegscreen nach ueberstandener Startsequenz.

Akzeptanz:

- Sieg ist erreichbar, aber nicht zufaellig.
- Finale Nacht nutzt die bis dahin gelernten Systeme.

## Phase 10: Autobalancing und Feinschliff

Ziel: Schwierigkeit reagiert sauber auf Spielerleistung.

- Nachtauswertung misst Wrackschaden, Killzeit, verlorene Gebaeude und Turmbestand.
- Kleine Anpassungen an Spawnrate, HP, Anzahl und Drops.
- Ober- und Untergrenzen verhindern extreme Ausschlaege.
- Debugpanel fuer Balancingwerte optional.
- Die Detailregeln aus `PROGRESSION_BALANCING.md` werden als Wellen-Direktor umgesetzt.

Akzeptanz:

- Schlechte Nacht macht die naechste Nacht etwas fairer.
- Sehr leichte Nacht erhoeht Druck spuerbar, aber nicht sprunghaft.
- Anpassung ist im Code nachvollziehbar und abschaltbar.
