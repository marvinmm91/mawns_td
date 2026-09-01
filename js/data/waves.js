"use strict";

PW.WAVES = Object.freeze([
  { night: 1, enemies: ["crawler"], directions: 1, air: false, note: "Erster Bodenkontakt." },
  { night: 2, enemies: ["crawler", "swarm"], directions: 2, air: false, note: "Mehrere Bodengruppen." },
  { night: 3, enemies: ["crawler", "drone"], directions: 2, air: true, droneCap: 2, note: "Erste Luftsignatur." },
  { night: 4, enemies: ["crawler", "swarm", "armored"], directions: 2, air: false, note: "Panzerung erkannt." },
  { night: 5, enemies: ["crawler", "swarm", "drone"], directions: 3, air: true, note: "Luftangriffe beginnen." },
  { night: 6, enemies: ["swarm", "armored", "drone"], directions: 3, air: true, note: "Gemischter Angriff." },
  { night: 7, enemies: ["crawler", "armored", "breaker", "drone"], directions: 3, air: true, note: "Mauerbrecher aktiv." },
  { night: 8, enemies: ["swarm", "armored", "breaker", "drone", "disruptor"], directions: 4, air: true, note: "Störsignale im Anflug." },
  { night: 9, enemies: ["crawler", "swarm", "armored", "breaker", "drone", "bomber"], directions: 4, air: true, note: "Schwerer Vorfinalangriff." },
  { night: 10, enemies: ["swarm", "armored", "breaker", "drone", "bomber", "disruptor", "guardian"], directions: 4, air: true, note: "Startfenster erreichbar." }
]);

