"use strict";

PW.SHIP_MODULES = Object.freeze({
  hull: {
    id: "hull",
    name: "Rumpfplatten",
    unlockNight: 0,
    cost: { wood: 80, stone: 55, iron: 16 },
    effect: "Max. Wrack-HP +100 und sofort +100 HP.",
    description: "Stabilisiert den Rumpf fuer die letzten Naechte."
  },
  energy: {
    id: "energy",
    name: "Energiezelle",
    unlockNight: 3,
    requiresKnown: ["iron"],
    cost: { iron: 34, crystal: 8, scrap: 35 },
    effect: "Alle Tuerme feuern 10 Prozent schneller.",
    description: "Versorgt Waffen und Startsysteme."
  },
  comms: {
    id: "comms",
    name: "Kommunikationsarray",
    unlockNight: 4,
    cost: { crystal: 10, scrap: 45 },
    effect: "Spawnwarnungen werden genauer.",
    description: "Macht die kommende Nacht planbarer."
  },
  nav: {
    id: "nav",
    name: "Navigationskern",
    unlockNight: 6,
    requiresKnown: ["gold"],
    cost: { gold: 18, crystal: 16, parts: 4 },
    effect: "Startsequenz-Fortschritt.",
    description: "Berechnet einen Fluchtkurs."
  },
  engine: {
    id: "engine",
    name: "Antrieb",
    unlockNight: 8,
    requiresKnown: ["parts"],
    cost: { gold: 28, iron: 36, parts: 8 },
    effect: "Schaltet die Startsequenz frei. Vollstaendige Module aktivieren beim Start einen Schadensschild.",
    description: "Macht aus dem Wrack wieder ein Schiff."
  }
});
