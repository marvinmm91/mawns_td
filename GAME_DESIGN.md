# PLANET-WRACK GAME DESIGN

Dieses Dokument ist die zentrale und verbindliche Designbeschreibung von Planet-Wrack. Es beschreibt Spielidee, Spielerlebnis, Regeln, Inhalte, Progression und Balancing. Der aktuelle Implementierungsstand und verbindliche Entwicklungsaufgaben stehen in `DEVELOPMENT.md`; noch nicht beschlossene Ideen stehen in `ROADMAP.md`.

## 1. HIGH CONCEPT

- Genre: Top-Down-Survival, Tower Defense, Crafting und Erkundung.
- Perspektive: 2D-Gitteransicht von oben im Retro-/Pixel-Art-Stil.
- Plattform: Desktop-Browser mit HTML Canvas und JavaScript.
- Setting: Ein Ueberlebender strandet auf einem fremden Planeten. In der Kartenmitte liegt das Wrack seines Raumschiffs.
- Ziel: Ressourcen sammeln, Verteidigung bauen, das Wrack reparieren und die Startsequenz ueberstehen.
- Grundgefuehl: Tagsueber planvoll expandieren; nachts unter Druck zwischen Basisverteidigung, Reparatur und riskanter Expedition entscheiden.

## 2. DESIGN-SAEULEN

1. **Das Wrack ist wichtiger als der Spieler.**
   Der Spieler hat keine eigenen Lebenspunkte. Gegner ignorieren ihn und greifen das Wrack an.

2. **Erkundung bleibt wertvoll.**
   Fog of War verbirgt Ressourcen, Engpaesse, Truhen, Monsterhorden und moegliche Gefahren. Erkundete Gebiete bleiben bekannt.

3. **Tag und Nacht haben klare Rollen.**
   Der Tag dient Planung, Sammlung, Bau und Reparatur. Die Nacht erzeugt Angriffsdruck und bietet Beute.

4. **Boden und Luft verlangen unterschiedliche Antworten.**
   Mauern und Bodenfeuer helfen nicht gegen Luftgegner. Flak und Laser schliessen diese Luecke.

5. **Balancing soll helfen, aber nicht sichtbar schummeln.**
   Nach harten Naechten wird der Druck moderat reduziert, nach wiederholt sehr leichten Naechten moderat erhoeht.

## 3. CORE LOOP

### Tag

- Keine neuen Angriffswellen.
- Der Spieler erkundet und deckt neue Kacheln auf.
- Ressourcen werden mit Axt oder Spitzhacke abgebaut.
- Mauern, Tuerme und Bruecken werden gebaut.
- Das Wrack und beschaedigte Bauwerke werden repariert.
- Truhen und Monsterhorden koennen gezielt aufgesucht werden.
- Hinweise auf seltene Ressourcen und kommende Gefahren helfen bei der Planung.

### Daemmerung

- Kurze Uebergangsphase von 12 Sekunden.
- Die erwartete Welle und Spawnrichtungen werden angezeigt.
- Der Spieler kann letzte Verteidigungen aufbauen und Material verteilen.
- Licht- und Farbstimmung wechseln sichtbar.

### Nacht

- Gegner erscheinen in mehreren Pulsen aus geplanten Richtungen.
- Bodengegner suchen einen Weg zum Wrack oder greifen Blockaden an.
- Luftgegner ignorieren Mauern und fliegen direkt zum Wrack.
- Tuerme verteidigen die Basis automatisch.
- Der Spieler kann weiter sammeln, verliert dadurch aber Zeit fuer Reparatur und Bau.
- Gegner hinterlassen Schrott, Eisen, Bauteile und weitere Beute.

### Morgengrauen

- Neue Spawns stoppen.
- Uebrige Gegner ziehen sich zum Kartenrand zurueck.
- Drops bleiben liegen und koennen tagsueber eingesammelt werden.
- Ein Morgenbericht zeigt Schaden, Kills, verlorene Mauern und Balancing-Diagnosen.

## 4. SIEG UND NIEDERLAGE

### Niederlage

- Das Wrack startet mit 500 Strukturpunkten.
- Bei 0 HP ist die Partie verloren.
- Reparatur ist tagsueber und nachts moeglich, solange Material vorhanden ist.

### Sieg

Die Pflichtmodule des Wracks muessen repariert werden:

1. Rumpfplatten
2. Energiezelle
3. Kommunikationsarray
4. Navigationskern
5. Antrieb

Danach muss mindestens Nacht 10 erreicht sein und das Wrack mindestens 70 Prozent seiner maximalen HP besitzen. Die Startsequenz dauert 120 Sekunden und erzeugt eine finale gemischte Angriffswelle. Ueberlebt das Wrack bis zum Ablauf, hebt das Schiff ab.

## 5. WELT UND FOG OF WAR

- Kartengroesse: 144 x 144 Tiles.
- Tilegroesse: 32 Pixel.
- Das Wrack ist 4 x 4 Tiles gross und liegt in der Kartenmitte.
- Der Startbereich ist frei von Hindernissen und enthaelt Holz und Stein.
- Biome: Wiese, Wald, Feuchtgebiet und Felskanten.
- Die Welt besitzt einen grossen Fluss, 1 bis 2 Baeche und mehrere Furten.
- Tiefes Wasser blockiert Bewegung; Furten und Bruecken machen Wasser passierbar.
- Ressourcen werden abhaengig von Biom und Entfernung verteilt.
- Eisen liegt in mittlerer Entfernung, Gold und Kristall weiter aussen.

Fog-of-War-Stufen:

- unbekannt: sehr dunkel, keine Details
- erkundet: Terrain und bekannte Objekte bleiben sichtbar, aber abgedunkelt
- sichtbar: volle Darstellung im aktuellen Sichtkreis

Gegner duerfen aus unbekannten Bereichen kommen. Fog of War begrenzt Information, verhindert aber keine Angriffe.

## 6. SPIELER UND WERKZEUGE

- Bewegung: WASD oder Pfeiltasten.
- Aktion: Leertaste mit der Kachel vor dem Spieler.
- Der Spieler kollidiert mit Terrain, Ressourcen, Wrack und Bauwerken, aber nicht mit Gegnern.
- Linksklick inspiziert eine Kachel oder baut im Baumodus direkt. Strg + Linksklick bzw. Ziehen setzt Blaupausen; Alt + Linksklick bzw. Ziehen entfernt sie.
- Rechtsklick beendet den Baumodus.

Werkzeuge:

- Axt: Baeume abbauen.
- Spitzhacke: Felsen und Erze abbauen.
- Reparaturset: Wrack und Bauwerke reparieren.
- Bauwerkzeug: Bauwerke platzieren.
- Abrisswerkzeug: Bauwerke entfernen und teilweise Material zurueckerstatten.

## 7. RESSOURCEN

| Ressource | Quelle | Hauptfunktion |
|---|---|---|
| Holz | Baeume | Palisaden, Ballisten, Reparaturen |
| Stein | Felsen | Steinmauern, Katapulte, Wrackrumpf |
| Eisen | Erzadern | Stahlmauern, Flak, Module |
| Gold | seltene Erzadern | Laser, Module |
| Kristall | entfernte Vorkommen | Tesla, Energiezelle, Kommunikationsarray |
| Schrott | Gegnerdrops | Reparaturen, Flak, Tesla |
| Bauteile | seltene Gegnerdrops und Horden | Laser, Module |
| Schluessel | Schluesseltraeger | Schatztruhen |

Es gibt kein Gewichtslimit. Ressourcen werden automatisch ins globale Inventar aufgenommen.

Die Wirtschaft bleibt dauerhaft spielbar: Baeume wachsen langsam auf freien Waldkacheln ausserhalb des Wrack-Sicherheitsbereichs nach. Waldhuepfer und Mooskaefer erscheinen bis zu ihrem Kartenmaximum erneut und liefern weiter Holz beziehungsweise Stein. Seltene Materialien bleiben ueber Truhen, Horden und seltene Drops spaeter Gegner erreichbar.

## 8. BAU UND VERTEIDIGUNG

Alle Bauwerke stehen auf einzelnen Gitterkacheln. Bau ist nicht auf Wrack, Ressourcen, Truhen, Monsterlager oder blockiertem Terrain moeglich. Blaupausen werden mit gedrueckter Strg-Taste gesetzt, erlauben Bauwerke und Bauwerkslinien ohne Materialkosten vorzumerken, blockieren keine Bewegung und koennen spaeter einzeln oder gesammelt errichtet werden. Alt entfernt sie wieder direkt auf der Karte.

Direktes Feedback: Getroffene Gegner zeigen gebuendelte Schadenszahlen an ihrer Position. Beim Einsammeln erscheinen Ressourcenmengen an ihrer Quelle, statt die allgemeine Hinweisanzeige mit Standardgewinnen zu fuellen.

### Mauern und Bruecke

| Bauwerk | Rolle | Kostenidee |
|---|---|---|
| Palisade | billige, schnelle Bodenblockade | Holz |
| Steinmauer | stabile Bodenblockade | Stein und Holz |
| Stahlmauer | spaeter Endgame-Anker | Eisen und Schrott |
| Bruecke | macht Wasser passierbar | Holz und Stein |

Wenn Bodengegner keinen Weg zum Wrack finden, greifen sie angrenzende Blockaden an. Mauern koennen das Wrack daher nicht dauerhaft folgenlos einschliessen.

### Tuerme

| Turm | Zieltyp | Rolle | Wirtschaftlicher Zweck |
|---|---|---|---|
| Balliste | Boden | guenstiger Einzelschaden | effizient gegen Krabbler und Brecher, verliert gegen Panzerung und Gruppen |
| Katapult | Boden | langsamer Flaechenschaden | bezahlt sich bei dichten Schwaermen aus, bleibt gegen Einzelziele teuer |
| Flak | Luft | schnelle Luftabwehr | beste Kostenleistung gegen Drohnen und Stoersender, kann keine Bodenziele treffen |
| Tesla-Feld | Boden | starkes Verlangsamen | bremst schnelle Bodenziele fuer andere Tuerme, aber loest keine schwere Panzerung allein |
| Laser-Turm | Boden und Luft | teurer Fernkonter | loest Panzer, Nesthueter und Bomber auf Distanz, braucht seltene Materialien |

Alle Tuerme sind von Beginn an sichtbar und auswaehlbar. Ihre Ressourcen- und Baukosten bleiben die entscheidende Zugangshuerde; Nachtfortschritt oder das Entdecken einer Ressource sperren keinen Turm mehr. Tuerme besitzen Reichweite, Feuerrate, HP, Zieltypen und bis zu drei Ausbaustufen. Sichtlinien sind nicht erforderlich. Upgrades verbessern vor allem Schaden, Reichweite, Feuerrate oder Haltbarkeit.

## 9. GEGNER

### Boden

- Krabbler: Standarddruck; Ballisten halten einzelne Ziele am billigsten auf.
- Schwarm: erscheint als groesseres, schwaches Paket; Katapult-AoE und Tesla-Slow sind die passenden Antworten.
- Panzereinheit: langsam, viele HP und resistent gegen Ballisten; Laser sind der klare Fernkonter.
- Brecher: schnell genug, um Mauern zu bedrohen, und verursacht besonders hohen Blockadenschaden; Ballisten mit Brecher-Prioritaet sind effizient.
- Nesthueter: schweres stationaeres Ziel mit wertvoller Beute; Laser und eine vorbereitete Mauerlinie sind entscheidend.

### Luft

- Drohne: sehr schnell und zerbrechlich; Flak entfernt sie deutlich wirtschaftlicher als ein Laser.
- Bomber: langsam, robust und mit hohem Wrackschaden; Laser loesen ihn auf grosse Distanz.
- Stoersender: schnell, aber fragil; reduziert die Feuerrate umliegender Tuerme und wird von Flak priorisiert.

Alle normalen Nachtgegner priorisieren das Wrack. Stationaere Horden bewachen ihre Lager, greifen dort Bauwerke an und koennen einen Schluesseltraeger enthalten.

## 10. WELLENPROGRESSION

| Nacht | Gegnerbild | Designziel |
|---:|---|---|
| 1 | Krabbler aus einer Richtung | Grundprinzip von Mauer und Balliste lernen |
| 2 | Krabbler und Schwaerme | mehrere Bodenachsen absichern |
| 3 | Krabbler und erste Drohnen | Luftgefahr ankundigen |
| 4 | Krabbler, Schwaerme und Panzer | Einzelschaden hinterfragen |
| 5 | Boden plus Drohnen | Luftabwehr erforderlich machen |
| 6 | Schwaerme, Panzer und Drohnen | gemischte Verteidigung pruefen |
| 7 | mehrere Richtungen und Brecher | Verteidigungsring belasten |
| 8 | Stoersender und Brecher | Spezialrollen einfuehren |
| 9 | schwere gemischte Nacht | Vorfinale Belastungsprobe |
| 10+ | gemischte Wellen mit Nesthueter | Startsequenz vorbereiten |

Das Threat-Budget skaliert die Anzahl und Mischung der Gegner. Neue Mechaniken werden an Mindestnaechte gebunden und nicht durch Balancing uebersprungen.

## 11. WRACKMODULE UND PROGRESSION

| Modul | Freischaltung | Effekt |
|---|---:|---|
| Rumpfplatten | sofort | maximale Wrack-HP +100 und sofort +100 HP |
| Energiezelle | Nacht 3 und Eisen bekannt | Tuerme feuern schneller |
| Kommunikationsarray | Nacht 4 | genauere Spawnwarnungen |
| Navigationskern | Nacht 6 und Gold bekannt | Fortschritt zur Startsequenz |
| Antrieb | Nacht 8 und Bauteile bekannt | schaltet die Startsequenz frei |

Module kosten normale und seltene Ressourcen. Sie sind frueh im Wrackmenue sichtbar, werden aber erst nach Mindestnacht und Ressourcenkenntnis reparierbar.

## 12. ZUSATZINHALTE

- Schatztruhen erscheinen ausserhalb des Startbereichs und benoetigen Schluessel.
- Monsterhorden bewachen Lager, greifen Bauwerke in ihrem Gebiet an und koennen Schluessel fallen lassen.
- Drei verlassene Aussenposten liegen weit ausserhalb des Startbereichs: ein Versorgungslager liefert Material, ein Forschungsterminal liefert zusaetzliches seltenes Material und eine Sicherheitsbake startet eine kleine ortsgebundene Wachgruppen-Aufgabe.
- Voegel sind dekorativ und besitzen keine Hitbox.
- Waldhuepfer und Mooskaefer wandern, fliehen vor dem Spieler und geben kleine Belohnungen.
- Das Pixel-Art-System erlaubt eigene Designs, Zuruecksetzen sowie JSON-/JavaScript-Import und -Export.

## 13. UI UND FEEDBACK

Die Oberflaeche zeigt dauerhaft:

- Wrack-HP und HP-Balken
- aktuelle Phase und Timer
- Nachtzaehler
- reparierte Module
- Werkzeugleiste
- Kurzinventar

Panels:

- Status
- Inventar
- Bauen und Upgrades
- Wrack und Module
- Kachel-/Objektkontext
- Pixel-Design

Feedback erfolgt ueber Morgenberichte, Nachrichten, Schadensanzeigen, Reichweitenvorschau, HP-Balken, Warnrichtungen und Pixel-Effekte. Beschaedigte Mauern, Tuerme, Bruecken und das Wrack zeigen zudem sichtbare Risse, Brandspuren und kurze Trefferblitze; nach voller Reparatur verschwinden diese wieder.

## 14. BALANCING-MODELL

### Verteidigungsmodi

Vor einer neuen Partie wird zusaetzlich zur Schwierigkeit ein Verteidigungsmodus gewaehlt. Classic ist der Kompatibilitaetsstandard fuer bestehende Spielstaende. Die Modusauswahl wird gespeichert und im Status angezeigt. Die konkreten Angriffs- und Wellenregeln werden getrennt von den Schwierigkeitsprofilen definiert, damit der Modus Zielverhalten und die Schwierigkeit den Director-Druck steuert.

Im Classic Mode verhindert die Baupruefung schon beim Platzieren, dass eine blockierende Struktur den letzten Bodenweg zum Wrack schliesst. Mauern und Verteidigungstuerme blockieren dabei beide Bodeneinheiten; die Pruefung bewertet auch ihre Blaupausen. Sie prueft die moeglichen Spawnraender, bereits laufende regulaere Bodengegner und vorgemerkte Blaupausen gemeinsam. Labyrinthe, Engstellen und Umwege bleiben moeglich; vollstaendige Einsperrungen nicht. Im seltenen Notfall eines alten Spielstands oder einer unvorhergesehenen Blockade greifen regulaere Bodengegner ausschliesslich das passende Durchbruchziel mit zehnfachem Strukturschaden an, bis wieder ein Weg offen ist. Luftgegner sowie stationaere Horden- und Aussenpostenwachen behalten ihre lokalen Regeln.

Im Aggressive Mode greifen regulaere Bodengegner eine Mauer, Palisade oder einen Turm an, wenn sie auf ihrem berechneten direkten Weg zum Wrack liegen. Seitliche oder von der Route nicht beruehrte Verteidigungen bleiben unberuehrt. Vollstaendige Blockaden bleiben aufbrechbar; der normale Strukturschaden wird nicht auf das Wrack uebertragen.

Classic erhaelt 124 Prozent des vom Director berechneten Wellenbudgets und bietet beim Neubau nur die Palisade an; Stein- und Stahlmauern bleiben fuer alte Spielstaende erhalten, sind dort aber nicht erneut baubar. Aggressive erhaelt 92 Prozent Wellenbudget und alle drei Mauertypen, weil die aktive Verteidigung entlang der Direktroute bereits dauerhaft belastet wird. Der Status und Morgenbericht zeigen den Modusfaktor; die Bedrohungsprognose zeigt stets das daraus resultierende effektive Budget.

Das Ende einer Nacht stoppt nur neue Spawnpulse. Bereits gespawnte Gegner bleiben in beiden Modi aktiv und greifen bis zu ihrem Tod weiter an.

Eine regulaere Nacht beginnt mit einem sofortigen Spawnimpuls und endet erst, wenn ihr gesamtes Budget ausgespielt und alle zugehoerigen Wellengegner besiegt sind. Der Nachtzähler ist deshalb kein Ablauf-Timer; nur die finale Startsequenz bleibt zeitbasiert.

Jede Nacht besitzt ein Threat-Budget:

```text
Basisbudget + Nachtwachstum + leichte spaete Skalierung
multipliziert mit Schwierigkeitsprofil, begrenztem Balance-Drift und Moduswellenfaktor
```

Bewertet werden aktuell vor allem:

- Wrackschaden und verbleibende HP
- Luftschaden
- zerstoerte Mauern beziehungsweise Bauwerke
- Kills und durchschnittliche Killentfernung

Nach einer harten Nacht:

- Threat-Budget moderat reduzieren
- Schrottdrop-Chance erhoehen
- bei starkem Luftschaden Eisenhinweis geben

Nach wiederholt sehr leichten Naechten:

- Threat-Budget moderat erhoehen
- gegebenenfalls eine weitere Richtung oder gemischtere Gruppen verwenden

Grenzen:

- maximal 18 Prozent Entschaerfung pro Nacht
- maximal 12 Prozent Verstaerkung pro Nacht
- Balance-Drift zwischen -30 und +30 Prozent
- finale Startsequenz bleibt an Mindestbedingungen gebunden

Vor einer neuen Partie wird eine von fuenf Stufen gewaehlt. Stufe 3 (Standard) nutzt unveraendert die oben genannten Werte. Die Stufen 1 bis 2 senken den Grunddruck und verstarken Entlastung sowie Catch-up-Drops; die Stufen 4 bis 5 erhoehen den Grunddruck und begrenzen diese Hilfe. Gegnerwerte, Turmwerte, Kosten und Gegnerrollen bleiben dabei gleich.

Der Status und der Morgenbericht zeigen die gewaehlte Stufe sowie eine Bedrohungsprognose fuer die naechste Nacht. Diese Prognose basiert auf Schwierigkeitsprofil und aktuellem Balance-Drift und zeigt das konkrete Wellenbudget, damit die Anpassung nachvollziehbar bleibt.

Zielbild fuer eine gute Nacht auf Standard: ungefaehr 8 bis 22 Prozent Wrackschaden, sichtbare Belastung der Verteidigung und genug Beute fuer eine relevante Folgeentscheidung.

Turmwerte werden mit `node tests/tower-role-economy.js` reproduzierbar ausgewertet. Der Bericht gewichtet seltene Ressourcen hoeher als Holz und Stein und stellt Grund- sowie Upgrade-Effizienz, Reichweite, Zieltypen, Spezialeffekte und die vorgesehenen Gegnerkonter gegenueber. Die Tabelle ist ein Balancing-Guardrail, kein Ersatz fuer Spieltests auf echten Karten.

## 15. EMPFOHLENE STARTWERTE

| Wert | Empfehlung |
|---|---:|
| Wrack-HP | 500 |
| Tag 1 | 120 Sekunden |
| Daemmerung | 12 Sekunden |
| Nacht 1 | 70 Sekunden |
| Morgengrauen | 8 Sekunden |
| Spielergeschwindigkeit | 132 Pixel/Sekunde |
| Sichtkreis Tag | 7 Tiles |
| Sichtkreis Nacht | 5 Tiles |
| Basis-Sicherheitsradius | 14 Tiles |

Konkrete Kosten und Werte der aktuellen Implementierung stehen in `js/config.js`, `js/data/buildings.js`, `js/data/enemies.js` und `js/data/shipModules.js`.

## 16. SPIELSPASS-ZIEL

Jede Nacht soll eine nachvollziehbare kleine Geschichte erzeugen:

- Die Mauer hat knapp gehalten.
- Die Luftabwehr war der Schwachpunkt.
- Eine Expedition hat Reparaturzeit gekostet.
- Ein neuer Turm hat eine Richtung stabilisiert.
- Eine seltene Ressource bringt das naechste Modul naeher.

Mehr Inhalte sollen diese Entscheidungen verstaerken, nicht die Kernschleife durch unnoetige Komplexitaet ueberladen.
