# PLANET-WRACK ROADMAP

Diese Datei ist eine Ideensammlung fuer moegliche spaetere Erweiterungen. Die Eintraege sind nicht beschlossen und veraendern den aktuellen Entwicklungsumfang nicht.

Bewertung:

- `S`: klein
- `M`: mittel
- `L`: gross

Status aller folgenden Punkte: **IDEE**.

## EMPFOHLENE REIHENFOLGE ALS INITIATIVEN

1. Performance-Infrastruktur und reproduzierbare Messung.
2. Turmzielwahl und strategische Planung.
3. Balancing-Verifikation und Belohnungsskalierung.
4. Neue Weltziele wie Aussenposten.
5. Visuelle und akustische Veredelung.

## PERFORMANCE

| Idee | Aufwand | Nutzen |
|---|---:|---:|
| FPS-/Systemzeit-Anzeige und reproduzierbarer Stresstest mit vielen Gegnern | S | Sehr hoch |
| Raeumliches Raster fuer Ressourcen, Gebaeude, Drops und Einheiten | M | Sehr hoch |
| Terrain in 8x8- oder 16x16-Kachelbloecken cachen | M | Hoch |
| Raeumliche Kampfabfragen fuer Tuerme und Projektile | M | Sehr hoch |
| Partikel ausserhalb des Bildes entfernen und Maximalzahl setzen | S | Mittel |

Aktueller Befund: `renderWorld.js` durchlaeuft pro Frame alle Ressourcen und Bauwerke; `combat.js` prueft jeden Turm gegen jeden Gegner. Die Pfadsuche wird dagegen bereits nur nach Bauveraenderungen neu berechnet.

## GAMEPLAY

| Idee | Aufwand | Nutzen |
|---|---:|---:|
| Kartennadeln fuer Ressourcen, Truhen, Horden und Brueckenplaetze | S | Hoch |
| Blaupausen fuer geplante Gebaeudelinien | M | Hoch |
| Turm-Zielprioritaeten wie naechster, staerkster, Luft zuerst oder Brecher zuerst | M | Sehr hoch |
| Taeglicher Scanner-Ping fuer Erz, Truhe oder Horde | M | Hoch |
| Notfallaktionen am Wrack wie Schild oder Lockimpuls gegen Schrott | M | Hoch |

Ziel: Die Kernentscheidung „expedieren oder absichern“ verstaerken, ohne ein ueberladenes Strategiespiel zu bauen.

## DESIGN UND UX

| Idee | Aufwand | Nutzen |
|---|---:|---:|
| Einheitliche Lesbarkeit durch Schatten, Umrisse und Zustandsfarben | M | Sehr hoch |
| Deutliche Schadenszustaende an Mauern, Tuerme, Bruecken und Wrack | S | Hoch |
| Dezente Weltbewegung fuer Wasser, Gras, Baeume, Rauch und Tiere | M | Hoch |
| Klangdesign fuer Tuerme, Fund, Treffer, Warnung und Modulreparatur | M | Sehr hoch |
| Design-Pakete im Pixel-Editor mit Vorschau, Name und Beschreibung | M | Hoch |

Das bestehende Pixel-Art-System in `js/systems/pixelArt.js` ist die technische Grundlage fuer zusammengehoerende Design-Pakete.

## NEUE SPIELINHALTE

| Idee | Aufwand | Nutzen |
|---|---:|---:|
| Verlassene Aussenposten mit Bauplaenen, Ressourcen oder kurzer Verteidigung | M | Sehr hoch |
| Biomspezifische Fundorte wie Holzfaellerlager oder Treibgut am Bach | M | Hoch |
| Horde mit Anfuehrer und garantiertem Schluessel-/Bauteildrop | M | Hoch |
| Feldstationen wie Saegewerk, Schrottpresse oder Erzbohrer | L | Hoch |
| Spielmodi nach dem Sieg: Endlos, taeglicher Seed oder Sonderregeln | M | Mittel |

Erste Kandidaten fuer eine spaetere Umsetzung sind Aussenposten, weil sie der grossen Karte Ziele geben, ohne Handel oder komplexe NPC-Systeme vorauszusetzen.

## BALANCING

| Idee | Aufwand | Nutzen |
|---|---:|---:|
| Viele feste Seeds automatisch bis Nacht 10 simulieren | M | Sehr hoch |
| Truhen- und Hordenbelohnungen nach Distanz, Nacht und Staerke skalieren | M | Sehr hoch |
| Gegnerrollen technisch schaerfen, etwa Panzerresistenz gegen Ballisten | M | Hoch |
| Tuerme ueber Schaden pro Kosten, Reichweite und Zieltyp vergleichen | S | Hoch |
| Autobalancing als sichtbare Bedrohungsprognose formulieren | M | Hoch |

### BEOBACHTUNG ZUR ENERGIEZELLE

`js/data/shipModules.js` beschreibt bei der Energiezelle 5 Prozent schnellere Tuerme, waehrend `js/systems/combat.js` aktuell einen Faktor von 10 Prozent verwendet. Vor einer weiteren Balance-Runde muss entschieden werden, welcher Wert die verbindliche Regel wird.

## TESTS UND TECHNIK

| Idee | Aufwand | Nutzen |
|---|---:|---:|
| Seed-basierter Balance- und Lasttest als eigener Testlauf | M | Sehr hoch |
| Messung von FPS, Updatezeit, Renderzeit und Entity-Anzahl | S | Sehr hoch |
| Regressionstests fuer Zielprioritaeten und Gegnerrollen | M | Hoch |

## UEBERFUEHRUNG IN DEVELOPMENT

Ein Roadmap-Eintrag wird erst dann verbindlich, wenn:

1. sein Ziel und sein Umfang festgelegt sind;
2. betroffene Codebereiche und Abhaengigkeiten bekannt sind;
3. Akzeptanzkriterien und Tests definiert sind;
4. der Punkt in `DEVELOPMENT.md` unter den offenen Festlegungen aufgenommen wurde;
5. bei Regel- oder Zahlenentscheidungen `GAME_DESIGN.md` aktualisiert wurde.
