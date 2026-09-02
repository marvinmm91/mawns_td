"use strict";

// Ten encounter slots form a chapter. The opening chapter is a fixed tutorial;
// later chapters reuse the same readable cadence with a changing invasion doctrine.
const openingEncounters = Object.freeze([
  { id: "contact", title: "Erster Kontakt", enemies: ["crawler"], featured: ["crawler"], directions: 1, budgetMultiplier: 0.82, note: "Ein einzelner Bodentrupp tastet die Verteidigung ab." },
  { id: "swarm", title: "Schwarmsignal", enemies: ["crawler", "swarm"], featured: ["swarm"], directions: 2, budgetMultiplier: 0.88, note: "Dichte Schwärme verlangen erstmals Flächenschaden oder eine gute Feuerlinie." },
  { id: "armor", title: "Panzerprobe", enemies: ["crawler", "swarm", "armored"], featured: ["armored"], directions: 2, budgetMultiplier: 0.94, note: "Eine Panzereinheit prüft den Schaden gegen robuste Ziele." },
  { id: "pressure", title: "Bodendruck", enemies: ["crawler", "swarm", "armored"], featured: ["swarm", "armored"], directions: 2, budgetMultiplier: 1, note: "Schwarm und Panzer treffen aus zwei Richtungen ein." },
  { id: "air", title: "Luftsignal", enemies: ["crawler", "swarm", "drone"], featured: ["drone"], directions: 2, budgetMultiplier: 1.04, note: "Die erste Drohne macht Luftabwehr notwendig." },
  { id: "mixed", title: "Gemischte Front", enemies: ["swarm", "armored", "drone"], featured: ["armored", "drone"], directions: 3, budgetMultiplier: 1.08, note: "Bodenpanzer und Luftziele verlangen getrennte Antworten." },
  { id: "breaker", title: "Brecherangriff", enemies: ["crawler", "swarm", "breaker", "drone"], featured: ["breaker"], directions: 3, budgetMultiplier: 1.12, note: "Brecher setzen Palisaden und lange Feuerlinien unter Druck." },
  { id: "disruption", title: "Störfeld", enemies: ["swarm", "armored", "breaker", "drone", "disruptor"], featured: ["disruptor"], directions: 3, budgetMultiplier: 1.16, note: "Ein Störsender schützt den übrigen Angriff vor Turmfeuer." },
  { id: "siege", title: "Belagerung", enemies: ["swarm", "armored", "breaker", "drone", "bomber"], featured: ["bomber"], directions: 4, budgetMultiplier: 1.2, note: "Bomber und Brecher erzwingen eine belastbare Mehrfachverteidigung." },
  { id: "guardian", title: "Nesthüter", enemies: ["swarm", "armored", "breaker", "drone", "bomber", "disruptor", "guardian"], featured: ["guardian", "bomber"], directions: 4, budgetMultiplier: 1.26, note: "Der Nesthüter führt einen vollständigen Angriff aller bekannten Rollen an." }
]);

const doctrines = Object.freeze([
  { id: "assault", name: "Sturmdoktrin", enemies: ["swarm", "breaker"], featured: ["swarm", "breaker"], weights: { swarm: 1.7, breaker: 1.35 }, directionBonus: 0, note: "Schnelle Bodengruppen und Brecher suchen gleichzeitig Druckpunkte." },
  { id: "air", name: "Luftdoktrin", enemies: ["drone", "bomber", "disruptor"], featured: ["drone", "bomber"], weights: { drone: 1.55, bomber: 1.35, disruptor: 1.25 }, directionBonus: 0, note: "Luftangriffe überlagern die Bodenfront." },
  { id: "siege", name: "Belagerungsdoktrin", enemies: ["armored", "breaker", "guardian"], featured: ["armored", "guardian"], weights: { armored: 1.55, breaker: 1.25, guardian: 1.3 }, directionBonus: 0, note: "Robuste Ziele testen Einzelzielschaden und vorbereitete Wege." },
  { id: "encirclement", name: "Zangendoktrin", enemies: ["swarm", "drone", "breaker", "disruptor"], featured: ["swarm", "drone", "disruptor"], weights: { swarm: 1.35, drone: 1.35, breaker: 1.2, disruptor: 1.3 }, directionBonus: 1, note: "Mehrere Richtungen zwingen zur räumlich breiten Verteidigung." },
  { id: "vanguard", name: "Vorhutdoktrin", enemies: ["crawler", "armored", "bomber", "guardian"], featured: ["armored", "bomber", "guardian"], weights: { armored: 1.35, bomber: 1.3, guardian: 1.45 }, directionBonus: 1, note: "Eliten rücken hinter einer kleineren Vorhut vor." },
  { id: "invasion", name: "Invasionsdoktrin", enemies: ["swarm", "armored", "breaker", "drone", "bomber", "disruptor", "guardian"], featured: ["breaker", "bomber", "guardian"], weights: { swarm: 1.35, armored: 1.25, breaker: 1.35, drone: 1.25, bomber: 1.25, disruptor: 1.2, guardian: 1.35 }, directionBonus: 1, note: "Alle Rollen greifen in wechselnden Gruppen an." }
]);

PW.WaveScript = Object.freeze({
  chapterSize: openingEncounters.length,
  opening: openingEncounters,
  doctrines,
  forNight(night) {
    const normalizedNight = Math.max(1, Math.floor(Number(night) || 1));
    const slot = (normalizedNight - 1) % this.chapterSize;
    const chapter = Math.floor((normalizedNight - 1) / this.chapterSize);
    const base = this.opening[slot];
    if (chapter === 0) return { ...base, night: normalizedNight, chapter, doctrine: null, enemyWeights: {} };

    const doctrine = this.doctrines[(chapter - 1) % this.doctrines.length];
    const enemies = [...new Set([...base.enemies, ...doctrine.enemies])];
    const featured = [...new Set([...base.featured, ...doctrine.featured])];
    const escalation = 1 + chapter * 0.11;
    return {
      ...base,
      id: `${doctrine.id}-${base.id}`,
      title: `${base.title}: ${doctrine.name}`,
      night: normalizedNight,
      chapter,
      doctrine: doctrine.id,
      enemies,
      featured,
      enemyWeights: { ...doctrine.weights },
      directions: Math.min(8, base.directions + doctrine.directionBonus + Math.floor(chapter / 3)),
      budgetMultiplier: base.budgetMultiplier * escalation,
      note: `${doctrine.note} ${base.note}`
    };
  }
});

// Kept as a read-only opening reference for existing tools and saved-wave inspection.
PW.WAVES = Object.freeze(openingEncounters);

