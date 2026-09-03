"use strict";

PW.PERK_BRANCHES = Object.freeze([
  { id: "salvage", name: "Bergung", description: "Sammeln, Vorkommen und Kartenwissen." },
  { id: "logistics", name: "Verteidigung & Baulogistik", description: "Planung, Bau und Feuerleitung." },
  { id: "technology", name: "Technik & Aufklärung", description: "Weitere Forschung wird vorbereitet.", planned: true }
]);

PW.PERKS = Object.freeze({
  reinforcedTools: { id: "reinforcedTools", branch: "salvage", name: "Verstärkte Werkzeuge", cost: 1, description: "Kristalle können abgebaut werden." },
  rapidHarvest: { id: "rapidHarvest", branch: "salvage", name: "Schnelle Hände", cost: 1, requires: ["reinforcedTools"], description: "Rohstoffe werden 25 % schneller abgebaut." },
  richDeposits: { id: "richDeposits", branch: "salvage", name: "Ergiebige Vorkommen", cost: 2, requires: ["reinforcedTools"], description: "Jedes Vorkommen liefert 50 % mehr Rohstoffe." },
  salvageMagnet: { id: "salvageMagnet", branch: "salvage", name: "Bergungsmagnet", cost: 1, requires: ["rapidHarvest"], description: "Beute wird aus deutlich größerer Entfernung eingesammelt." },
  recoveryProtocol: { id: "recoveryProtocol", branch: "salvage", name: "Verwertungsprotokoll", cost: 3, requires: ["salvageMagnet"], description: "Besiegte Gegner lassen häufiger einen zusätzlichen Rohstoff fallen." },
  groundScanner: { id: "groundScanner", branch: "salvage", name: "Bodendetektor", cost: 2, requires: ["reinforcedTools"], description: "Entdeckt verborgene Lagerstätten in deiner Nähe." },
  orbitalCartography: { id: "orbitalCartography", branch: "salvage", name: "Orbitalkartografie", cost: 3, requires: ["groundScanner"], description: "Deckt die gesamte Karte dauerhaft auf." },

  fieldMechanic: { id: "fieldMechanic", branch: "logistics", name: "Feldmonteur", cost: 1, description: "Bauwerke werden 25 % schneller errichtet." },
  maintenanceTraining: { id: "maintenanceTraining", branch: "logistics", name: "Wartungsroutine", cost: 1, requires: ["fieldMechanic"], description: "Jede Reparatur stellt 35 % mehr Struktur wieder her." },
  fireControlRadar: { id: "fireControlRadar", branch: "logistics", name: "Feuerleit-Radar", cost: 2, requires: ["fieldMechanic"], description: "Nach 4 Sekunden Ruhe erreicht der erste Schuss die doppelte Reichweite." },
  blueprintLogistics: { id: "blueprintLogistics", branch: "logistics", name: "Bauplanlogistik", cost: 2, requires: ["fieldMechanic"], description: "Der Materialaufschlag beim Sammelbau sinkt auf 10 %." },
  builderDrones: { id: "builderDrones", branch: "logistics", name: "Bauhelfer-Drohnen", cost: 3, requires: ["blueprintLogistics"], description: "Tagsüber werden laufende Baustellen doppelt so schnell fertig." },
  precisionCalibration: { id: "precisionCalibration", branch: "logistics", name: "Präzisionskalibrierung", cost: 3, requires: ["fireControlRadar"], description: "Alle Türme verursachen 12 % mehr Schaden." },
  tacticalCapacitors: { id: "tacticalCapacitors", branch: "logistics", name: "Taktkondensatoren", cost: 3, requires: ["fireControlRadar"], description: "Alle Türme feuern 12 % schneller." }
});

PW.PLANNED_PERKS = Object.freeze([
  { name: "Autoreparatur-Bots", description: "Eine spätere Forschungsoption." },
  { name: "Feldscanner", description: "Weitere Aufklärung wird untersucht." },
  { name: "Energie-Netz", description: "Weitere Technik wird untersucht." }
]);
