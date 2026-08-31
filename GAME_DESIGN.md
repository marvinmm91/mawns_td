# Planet-Wrack Game Design

Dieses Dokument ist die stabile Designvorgabe fuer die spaetere Umsetzung. Es ersetzt noch keinen Code.

## 1. High Concept

- Genre: Top-Down Survival, Tower Defense, Crafting und Erkundung.
- Perspektive: 2D-Gitteransicht von oben, angelehnt an klassische Pokemon-Routen und alte Browsergames.
- Plattform: Desktop-Browser, HTML Canvas und JavaScript.
- Setting: Ein Ueberlebender ist auf einem fremden Planeten abgestuerzt. Das Raumschiffwrack steht in der Kartenmitte und ist Core, Lager, Reparaturpunkt und Siegbedingung zugleich.
- Grundgefuehl: Tagsueber planvoll expandieren, nachts unter Zeitdruck entscheiden, ob man beim Wrack bleibt oder entfernte Ressourcen riskiert.

## 2. Design-Saeulen

1. Das Wrack ist wichtiger als der Spieler.
   Der Spieler hat zunaechst keine eigenen Lebenspunkte. Gegner ignorieren ihn und laufen zum Wrack. Dadurch bleibt die Steuerung einfach, aber Entscheidungen bleiben hart.

2. Erkundung ist dauerhaft wertvoll.
   Fog of War verbirgt Ressourcen, Engpaesse, Spawnrichtungen und seltene Vorkommen. Aufgedeckte Gebiete bleiben sichtbar.

3. Tag und Nacht haben klare Rollen.
   Der Tag ist Planung, Ausbau und Expansion. Die Nacht ist Angriff, Reparaturdruck und Loot-Chance. Nachts darf weiter gesammelt werden, aber die Basis verteidigt sich dann eher allein.

4. Bodengegner und Luftgegner brauchen unterschiedliche Antworten.
   Mauern lohnen sich gegen Bodenwellen, helfen aber nicht gegen Luft. Spieler muessen frueh erkennen, welche Verteidigungen fehlen.

5. Autobalancing hilft, soll aber nicht sichtbar tricksen.
   Das Spiel darf nach harten Naechten etwas nachgeben und nach sehr einfachen Naechten leicht anziehen. Es soll nie so wirken, als wuerde es dem Spieler Siege schenken oder willkuerlich bestrafen.

## 3. Core Loop

Der Tageszyklus laeuft kontinuierlich. Die Phasen sind logisch getrennt, aber der Spieler bleibt immer handlungsfaehig.

### Tagphase

- Keine neuen Gegnerwellen starten.
- Uebrig gebliebene Gegner aus der Nacht fliehen bei Sonnenaufgang zum Kartenrand. Werden sie auf dem Rueckweg zerstoert, koennen sie reduzierte Drops geben.
- Der Spieler erkundet Fog-of-War-Gebiete, baut Ressourcen ab, repariert das Wrack und platziert Verteidigungen.
- Tuerme und Mauern koennen ohne akuten Angriff ruhig geplant werden.
- Ressourcen sind bei Tag besser sichtbar und schneller zu erkennen.
- Neue Spawn-Warnungen fuer die kommende Nacht koennen als vage Hinweise erscheinen, zum Beispiel "Bewegung im Nordosten".

### Daemmerung

- Kurze Uebergangsphase von etwa 10 bis 15 Sekunden.
- UI zeigt die erwartete Angriffsstufe und ungefaehre Richtungen.
- Der Spieler bekommt Zeit, letzte Mauern oder Tuerme zu setzen.
- Musik, Licht und Farbstimmung wechseln sichtbar.

### Nachtphase

- Gegner spawnen ausserhalb einer Sicherheitszone am Kartenrand oder an aktiven Nestern.
- Alle Gegner priorisieren das Wrack.
- Bodengegner nutzen Pfade durch das Gitter. Wenn kein Pfad existiert, greifen sie die naechste Mauer oder Blockade an.
- Luftgegner ignorieren Mauern und bewegen sich direkter zum Wrack.
- Der Spieler kann weiter erkunden und sammeln, aber das ist eine bewusste Risikoentscheidung, weil Reparaturen, Loot-Einsammeln und Neubauten an der Basis fehlen.
- Gegner lassen Schrott, Bauteile und spaeter Spezialkomponenten fallen.
- Nachts ist die Sicht reduziert: Aufgedeckte Karte bleibt bekannt, aber Details ausserhalb des Spielerradius sind dunkler.

### Morgengrauen

- Neue Spawns stoppen.
- Restgegner ziehen sich zurueck oder werden nach kurzer Flucht entfernt.
- Drops bleiben liegen, koennen tagsueber eingesammelt werden.
- Eine Tagesauswertung berechnet Schaden, Kills, verlorene Mauern, gesammelte Drops und die Anpassung der naechsten Welle.

## 4. Sieg und Niederlage

### Niederlage

- Das Wrack startet mit 500 Strukturpunkten.
- Fallen die Strukturpunkte auf 0, ist die Partie verloren.
- Das Wrack kann tagsueber und nachts repariert werden, solange passende Ressourcen vorhanden sind.

### Sieg

Die Partie wird nicht nur ueberlebt, sondern abgeschlossen:

1. Das Wrack besitzt mehrere Reparaturmodule.
2. Jedes Modul kostet normale und seltene Ressourcen.
3. Sobald alle Module repariert sind, startet eine finale Startsequenz.
4. In der finalen Nacht greifen mehrere gemischte Wellen an.
5. Uebersteht das Wrack die Startsequenz, hebt das Schiff ab und die Partie ist gewonnen.

Empfohlene Reparaturmodule:

- Energiezelle: benoetigt Eisen, Gold und Bauteile.
- Navigationskern: benoetigt seltene Kristalle und Schrott.
- Rumpfplatten: benoetigen Holz, Stein und Eisen.
- Antrieb: benoetigt Gold, Bauteile und eine Boss-Komponente.
- Kommunikationsarray: benoetigt Kristalle und Elektronikschrott.

Fuer eine erste spielbare Version kann der Sieg zunaechst als "ueberlebe Nacht 10" umgesetzt werden. Die Modulreparatur sollte aber von Anfang an im Design vorbereitet werden.

## 5. Karte und Fog of War

- Die Karte ist groesser als der sichtbare Bildschirm.
- Das Wrack liegt in der Mitte auf einer freien Startflaeche.
- Startgebiet: kleiner sicherer Bereich mit Holz, Stein und wenigen Bauplaetzen.
- Mittlere Entfernung: mehr Stein, Erzadern und erste Engpaesse.
- Weite Entfernung: seltene Ressourcen, Nester, bessere Erzadern und hoeheres Nachtrisiko.
- Fog of War arbeitet in zwei Stufen:
  - unbekannt: schwarze oder sehr dunkle Kacheln, keine Details.
  - erkundet: Kacheltyp und Ressourcen bleiben sichtbar, aber bei Nacht abgedunkelt.
- Der Spieler deckt dauerhaft einen Radius um sich herum auf.
- Gegner duerfen auch aus unbekannten Bereichen kommen. Fog of War verhindert also keine Angriffe, sondern begrenzt Information.

## 6. Spieler und Interaktion

- Bewegung: WASD und Pfeiltasten.
- Interaktion: Leertaste mit der Zielkachel vor dem Spieler oder der naechsten interaktiven Kachel.
- Inventar: Taste E.
- Baumenue: Taste B.
- Werkzeugauswahl: Hotbar mit einem aktiven Werkzeug.
- Der Spieler kollidiert mit Waenden, Ressourcen und Gebaeuden, aber nicht mit Gegnern. So kann er Gegner nicht als kostenlose Blockade missbrauchen.

Werkzeuge:

- Axt: faellt Baeume, liefert Holz.
- Spitzhacke: baut Felsen und Erze ab.
- Reparaturset: repariert das Wrack oder beschaedigte Gebaeude.
- Bauwerkzeug: platziert geplante Mauern, Tuerme und Upgrades.

## 7. Ressourcen

| Material | Quelle | Hauptnutzen |
|---|---|---|
| Holz | Baeume | Palisaden, Ballisten, einfache Reparaturen |
| Stein | Felsen | Steinmauern, Katapulte, Wrackrumpf |
| Eisen | Erzadern | verstaerkte Mauern, Flak, Reparaturmodule |
| Gold | seltene Erzadern | Laser, Modulreparaturen, hochwertige Upgrades |
| Kristall | entfernte seltene Vorkommen | Energie- und Tesla-Technik |
| Schrott | Gegner-Drops | Reparaturen, Flak, Tesla, Elektronik |
| Bauteile | seltene Gegner-Drops | Module, fortgeschrittene Tuerme |

Ressourcen gehen automatisch ins Inventar. Fuer die erste Version reicht ein globales Inventar ohne Gewichtslimit.

## 8. Bau- und Verteidigungssystem

Alle Bauwerke sitzen auf Gitterkacheln.

### Mauern

- Palisade: billig, schnell gebaut, geringe HP.
- Steinmauer: teurer, stabiler, blockiert Bodengegner zuverlaessiger.
- Stahlmauer: spaetes Upgrade, hohe HP, benoetigt Eisen und Schrott.

Regel gegen Exploits:

- Wenn Bodengegner keinen Pfad zum Wrack finden, greifen sie die naechste Blockade an.
- Mauern duerfen das Wrack komplett einschliessen, aber das Spiel beantwortet das durch Wandangriffe, Luftgegner und spaeter Spezialgegner.

### Tuerme

| Turm | Kostenprofil | Zieltyp | Rolle |
|---|---|---|---|
| Holz-Balliste | Holz + wenig Stein | Boden | billiger Einzelschaden |
| Stein-Katapult | Stein + Holz | Boden | langsamer Flaechenschaden |
| Flak-Geschuetz | Eisen + Schrott | Luft | schnelle Luftabwehr |
| Tesla-Feld | Kristall + Schrott | Boden | Verlangsamung in Reichweite |
| Laser-Turm | Gold + Bauteile | Boden und Luft | teurer Praezisionsschaden |

Tuerme benoetigen freie Sicht nicht zwingend. Das haelt die erste Implementierung einfacher. Spaeter kann Sichtlinie optional fuer Ballisten eingefuehrt werden.

## 9. Gegner

### Bodengegner

- Krabbler: schneller Standardgegner, wenig HP.
- Panzereinheit: langsam, viele HP, gut gegen Ballisten.
- Schwarm: viele kleine Gegner, schwach gegen Katapult.
- Brecher: greift Mauern effektiver an, wenn blockiert.

### Luftgegner

- Drohne: schnelle Lufteinheit, wenig HP.
- Bomber: langsam, ignoriert Mauern, hoher Wrackschaden.
- Stoersender: reduziert kurzzeitig Turmfeuerrate in kleiner Aura.

### Spezialgegner

- Nesthueter: erscheint nahe aktiver Nester, droppt seltene Bauteile.
- Finaler Angriffstraeger: kommt in der Startsequenz, zwingt zu gemischter Verteidigung.

## 10. Wellen und Spawns

- Nacht 1 bis 2: nur Bodengegner, damit Mauern und Ballisten gelernt werden.
- Nacht 3: erste Luftdrohnen als Warnung.
- Nacht 4 bis 5: gemischte Wellen und erste Panzereinheiten.
- Nacht 6+: Spezialrollen, groessere Gruppen und mehrere Spawnrichtungen.
- Finale Nacht: abgestimmte Mischung aus Boden, Luft und einem starken Ziel.

Spawnlogik:

- Gegner spawnen ausserhalb eines Radius um das Wrack.
- Je weiter der Spieler erkundet hat, desto mehr moegliche Spawnrichtungen koennen sichtbar vorgewarnt werden.
- Unbekannte Spawnrichtungen bleiben moeglich, werden aber in fruehen Naechten reduziert, damit das Spiel fair wirkt.

## 11. Reparatur und Wrackausbau

Das Wrack ist sowohl HP-Leiste als auch Fortschrittsobjekt.

- Sofortreparatur: verbraucht Holz, Stein oder Schrott und stellt Strukturpunkte wieder her.
- Modulreparatur: dauerhaftes Fortschrittsziel mit groesseren Kosten.
- Wrack-Upgrades:
  - Lagererweiterung: spaeteres optionales Inventarlimit.
  - Scanimpuls: deckt kurz Richtung seltener Ressourcen auf.
  - Notgeschuetz: schwacher Basisturm direkt am Wrack.
  - Startsequenz: freigeschaltet nach allen Reparaturmodulen.

## 12. UI

Obere Leiste:

- Wrack-HP: 500/500 mit klarer Farbstufe.
- Tageszeit: Tag, Daemmerung, Nacht, Morgengrauen.
- Timer bis Phasenwechsel.
- Welle/Nacht-Nummer.
- Reparaturfortschritt der Module.

Untere Leiste:

- Aktives Werkzeug.
- Kurzinventar fuer Holz, Stein, Eisen, Gold, Schrott und Bauteile.
- Kontextaktion fuer die aktuelle Zielkachel.

Seitliche Panels:

- Inventar mit Ressourcen und Drops.
- Baumenue mit Mauern, Tuermen, Kosten und Sperrgruenden.
- Wrackmenue mit Reparaturen, Modulen und Startsequenz.

## 13. Balancing

### Natuerliche Skalierung

- Jede Nacht erhoeht leicht Gegneranzahl, HP, Tempo oder Mischung.
- Neue Gegnertypen werden stufenweise eingefuehrt, nie alle auf einmal.
- Seltene Ressourcen liegen weiter weg, damit Expansion relevant bleibt.

### Gummiband-Regeln

Die Anpassung wird nach jeder Nacht berechnet.

- Wenn das Wrack mehr als 30 Prozent seiner aktuellen HP verloren hat, wird die naechste Welle etwas langsamer oder kleiner.
- Wenn das Wrack keinen oder fast keinen Schaden genommen hat und viele Gegner sehr frueh sterben, bekommt die naechste Welle einen kleinen Bonus.
- Wenn der Spieler sehr wenige Tuerme besitzt, steigen Schrott-Drops leicht.
- Wenn Luftgegner viel Schaden verursachen, wird vor der naechsten Nacht sichtbarer auf Luftabwehr hingewiesen und Flak-Kosten koennen minimal sinken.

Grenzen:

- Anpassungen bleiben klein, zum Beispiel 5 bis 15 Prozent.
- Neue Gegnertypen werden nicht uebersprungen.
- Die finale Nacht ignoriert starke Abschwaechung teilweise, damit der Sieg Gewicht hat.

Details zu Progression, Belohnungskurve, Wellen-Direktor und Anti-Frust-Regeln stehen in `PROGRESSION_BALANCING.md`. Diese Detailregeln gelten als massgeblich, wenn spaeter konkrete Werte umgesetzt werden.

## 14. Erste spielbare Zielversion

Die erste Version soll bewusst kleiner sein:

- Eine zufallsgenerierte Tilemap.
- Spielerbewegung mit Kollision.
- Fog of War.
- Sammeln von Holz, Stein und Eisen.
- Wrack mit 500 HP.
- Tag-/Nacht-Timer.
- Bodengegner, die nachts zum Wrack laufen.
- Palisade, Steinmauer, Balliste.
- Einfache Drops: Schrott.
- Reparatur des Wracks.
- Niederlage bei 0 Wrack-HP.

Danach folgen Luftgegner, weitere Tuerme, Modulreparatur, seltene Ressourcen und Autobalancing.

## 15. Spielspass-Ziel

Planet-Wrack soll nicht nur daraus bestehen, Ressourcen in Verteidigung umzuwandeln. Jede Nacht soll eine erkennbare Geschichte erzeugen:

- "Meine Mauer hat knapp gehalten."
- "Die Luftdrohnen waren mein Schwachpunkt."
- "Ich bin nachts zu weit rausgegangen und musste teuer reparieren."
- "Der neue Turm hat eine komplette Richtung stabilisiert."
- "Noch ein seltenes Erzfeld, dann kann ich das naechste Modul reparieren."

Die beste Spielrunde ist eine Abfolge kleiner Entscheidungen mit sichtbaren Folgen. Der Spieler soll selten komplett ueberrascht verlieren. Er soll meistens verstehen, welche Entscheidung zur Gefahr gefuehrt hat und was er in der naechsten Runde verbessern kann.
