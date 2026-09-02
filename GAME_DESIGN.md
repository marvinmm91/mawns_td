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
- Der Ertrag eines Ressourcenknotens wird ohne Mengenbonus auf seine Abbautreffer verteilt; der Rest kommt beim letzten Treffer.
- Mauern, Tuerme und Bruecken werden gebaut. Blaupausen können einzeln zum Normalpreis oder gesammelt mit 20 Prozent Mehrkosten errichtet werden.
- Das Wrack und beschaedigte Bauwerke werden repariert.
- Truhen und Monsterhorden koennen gezielt aufgesucht werden.
- Hinweise auf seltene Ressourcen und kommende Gefahren helfen bei der Planung.
- M oeffnet eine Live-Karte mit erkundetem Terrain, Wrack, Spieler, gesetzten Nadeln und roten Punkten fuer aktive Gegner.

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
- Linksklick auf freies Gelände wirkt wie die Aktion auf der Kachel vor dem Spieler; Bauwerke und andere Weltobjekte bleiben direkt inspizierbar.
- Taste 4 aktiviert das Bauwerkzeug und wechselt bei erneutem Drücken den Bauplan. Strg schaltet dauerhaft zwischen Bauen und Blaupausen; ein Tipp auf Alt entfernt nur im Blaupausenmodus die Blaupause vor dem Spieler.
- Das Mausrad wechselt Werkzeuge; ein kurzer Symbolhinweis bestätigt jeden Wechsel.
- Rechtsklick beendet den Baumodus.

Werkzeuge:

- Axt: Baeume abbauen.
- Spitzhacke: Felsen und Erze abbauen.
- Reparaturset: Wrack und Bauwerke reparieren; bei vollständig reparierten Bauwerken löst ein weiterer Einsatz das Upgrade aus.
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
| Schrott | Startbestand und Gegnerdrops | Reparaturen, Flak, Tesla |
| Bauteile | seltene Gegnerdrops und Horden | Laser, Module |
| Schluessel | Schluesseltraeger | Schatztruhen |

Es gibt kein Gewichtslimit. Ressourcen werden automatisch ins globale Inventar aufgenommen.

Jeder besiegte Gegner kann Holz, Stein, Schrott, Eisen, Gold, Kristall oder Bauteile hinterlassen. Die Grundmenge richtet sich nach seinen Basis-HP: leichte Gegner geben 1-2 Einheiten, schwere 2-3 und Elitegegner 3-4. Schwarmkreaturen haben wegen ihrer Gruppengroesse nur eine reduzierte Drop-Chance. Schrott sowie Holz und Stein sind haeufig; Eisen ist ungewoehnlich, Bauteile und Kristall selten, Gold am seltensten. Schluessel bleiben ausschliesslich an Horden gebunden. Mehrfach gerollte gleiche Rohstoffe werden zu einem Pickup zusammengefasst.

Die Wirtschaft bleibt dauerhaft spielbar: Baeume wachsen langsam auf freien Waldkacheln ausserhalb des Wrack-Sicherheitsbereichs nach. Waldhuepfer und Mooskaefer erscheinen bis zu ihrem Kartenmaximum erneut und liefern weiter Holz beziehungsweise Stein. Seltene Materialien bleiben ueber Truhen, Horden und seltene Drops spaeter Gegner erreichbar.

## 8. BAU UND VERTEIDIGUNG

Alle Bauwerke stehen auf einzelnen Gitterkacheln. Bau ist nicht auf Wrack, Ressourcen, Truhen, Monsterlager oder blockiertem Terrain moeglich. Die halbtransparente Vorschau schwebt immer auf der Kachel vor dem Spieler. Im dauerhaft umschaltbaren Blaupausenmodus lassen sich kostenfreie, nicht blockierende Bauvorhaben einzeln vormerken; sie werden später mit dem Bauwerkzeug an ihrer Position errichtet. Ein Tipp auf Alt entfernt sie dort wieder.

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
- Schwarm: erscheint immer als schwaches Paket aus 5 bis 7 Einheiten; Katapult-AoE und Tesla-Slow sind die passenden Antworten.
- Panzereinheit: langsam, viele HP und resistent gegen Ballisten; Laser sind der klare Fernkonter.
- Brecher: schnell genug, um Mauern zu bedrohen, und verursacht besonders hohen Blockadenschaden; Ballisten profitieren von gezielter Platzierung und passender allgemeiner Zielpriorität.
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
| 3 | Krabbler, Schwaerme und ein Panzer | Einzelschaden gegen robuste Ziele pruefen |
| 4 | Schwaerme und Panzer | Bodenfeuerlinien unter kombiniertem Druck pruefen |
| 5 | Boden plus erste Drohnen | Luftabwehr erforderlich machen |
| 6 | Schwaerme, Panzer und Drohnen | gemischte Verteidigung pruefen |
| 7 | mehrere Richtungen und Brecher | Verteidigungsring belasten |
| 8 | Stoersender und Brecher | Spezialrollen einfuehren |
| 9 | schwere gemischte Nacht | Vorfinale Belastungsprobe |
| 10 | vollstaendige Welle mit Nesthueter | alle bekannten Konter zusammen pruefen |
| 11-20 | Sturmdoktrin | Schwaerme und Brecher verdichten Bodenlinien |
| 21-30 | Luftdoktrin | Luftabwehr muss eine echte zweite Verteidigungslinie sein |
| 31-40 | Belagerungsdoktrin | Panzer und Nesthueter erfordern starken Einzelzielschaden |
| 41-50 | Zangendoktrin | mehr Richtungen pruefen die Flaechenabdeckung |
| 51-60 | Vorhutdoktrin | Eliten pruefen starken Einzelzielschaden und die äußere Linie |
| 61-70 | Invasionsdoktrin | alle Rollen greifen in wechselnden Gruppen an; danach rotiert die Doktrinfolge |

Die ersten zehn Naechte sind feste Begegnungsskripte: Die angegebene Rolle wird mindestens einmal als Schwerpunkt gespawnt. Danach wiederholt sich die Zehn-Nacht-Kadenz mit einer Doktrin. Jede Doktrin ergaenzt Rollen, gewichtet sie hoeher und kann eine weitere Spawnrichtung hinzufuegen. Innerhalb dieses Rahmens bleiben Gruppenstaerke, Reihenfolge der Pulse und Richtungen seedbasiert unterschiedlich.

Das Threat-Budget skaliert die Gesamtmenge. Zusaetzlich traegt jedes Skript seinen festen Multiplikator; jedes weitere Kapitel erhoeht ihn um 11 Prozent. Nacht 60 liegt damit im sechsten Kapitel bei 1,55-fachem Skriptdruck, Nacht 61 setzt die Doktrinrotation mit 1,66 fort. Neue Mechaniken werden an Mindestnaechte gebunden und nicht durch Balancing uebersprungen.

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

Im Classic Mode duerfen Mauern, Palisaden und Verteidigungstuerme den Bodenweg vollstaendig schliessen. Regulaere Bodengegner ignorieren jede Struktur, solange ein Weg offen ist. Ohne Weg greifen sie ausschliesslich das passende Durchbruchziel mit zwanzigfachem Classic-Strukturschaden an, bis wieder ein Weg offen ist. Das macht eine vollstaendige Einsperrung zu einer bewussten, aber kurzlebigen Entscheidung statt zu einer fehleranfälligen Baupruefung. Luftgegner sowie stationaere Horden- und Aussenpostenwachen behalten ihre lokalen Regeln.

Im Aggressive Mode greifen regulaere Bodengegner eine Mauer, Palisade oder einen Turm an, wenn sie auf ihrem berechneten direkten Weg zum Wrack liegen. Seitliche oder von der Route nicht beruehrte Verteidigungen bleiben unberuehrt. Vollstaendige Blockaden bleiben aufbrechbar; der normale Strukturschaden wird nicht auf das Wrack uebertragen.

Classic erhaelt 372 Prozent des vom Director berechneten Wellenbudgets und bietet beim Neubau nur die Palisade an; Stein- und Stahlmauern bleiben fuer alte Spielstaende erhalten, sind dort aber nicht erneut baubar. Alle gegnerischen Treffer auf Wrack und Bauwerke verursachen im Classic Mode 40 Prozent ihres Grundschadens. Der zwanzigfache Durchbruchschaden bleibt dabei relativ erhalten und entspricht achtfachem Grundschaden. Aggressive erhaelt unveraendert 92 Prozent Wellenbudget, 100 Prozent Gegnerschaden und alle drei Mauertypen, weil die aktive Verteidigung entlang der Direktroute bereits dauerhaft belastet wird. Der Status zeigt den statischen Modusfaktor.

Das Ende einer Nacht stoppt nur neue Spawnpulse. Bereits gespawnte Gegner bleiben in beiden Modi aktiv und greifen bis zu ihrem Tod weiter an.

Eine regulaere Nacht beginnt mit einem sofortigen Spawnimpuls und endet erst, wenn ihr gesamtes Budget ausgespielt und alle zugehoerigen Wellengegner besiegt sind. Der Nachtzähler ist deshalb kein Ablauf-Timer; nur die finale Startsequenz bleibt zeitbasiert.

Jede Nacht besitzt ein Threat-Budget:

```text
Basisbudget + Nachtwachstum + leichte spaete Skalierung
multipliziert mit Schwierigkeitsprofil, einseitigem Balance-Drift, Modus- und Skriptfaktor
```

Bewertet werden aktuell vor allem:

- Wrackschaden und verbleibende HP
- Luftschaden
- zerstoerte Mauern beziehungsweise Bauwerke
- Kills und durchschnittliche Killentfernung

Nach einer harten Nacht bleibt der automatische Druck unveraendert; bei starkem Luftschaden kann ein Eisenhinweis erscheinen. Nach einer wiederholt sehr leichten Nacht kann der Director den Druck in kleinen Schritten erhoehen. Er reduziert weder das Budget noch erhoeht er automatisch Drops.

Grenzen:

- maximal 12 Prozent Verstaerkung pro Nacht
- Balance-Drift zwischen 0 und +30 Prozent
- finale Startsequenz bleibt an Mindestbedingungen gebunden

Vor einer neuen Partie wird eine von fuenf Stufen gewaehlt. Stufe 3 (Standard) nutzt unveraendert die oben genannten Werte. Die Stufen 1 bis 2 senken den Grunddruck, die Stufen 4 bis 5 erhoehen ihn. Gegnerwerte, Turmwerte, Kosten und Gegnerrollen bleiben dabei gleich.

Die gewaehlte Stufe bleibt im Status sichtbar. Der interne automatische Zusatzdruck und sein konkretes Budget sind ausschliesslich im Entwicklungsmenue sichtbar.

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
