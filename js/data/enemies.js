"use strict";

PW.ENEMIES = Object.freeze({
  crawler: {
    id: "crawler",
    name: "Krabbler",
    moveType: "ground",
    budget: 1,
    hp: 36,
    speed: 48,
    damage: 8,
    attackCooldown: 1.2,
    wallDamage: 12,
    color: "#bd6654",
    drops: { scrap: [0.35, 1, 2] }
  },
  swarm: {
    id: "swarm",
    name: "Schwarm",
    moveType: "ground",
    budget: 0.65,
    hp: 20,
    speed: 62,
    damage: 5,
    attackCooldown: 1.0,
    wallDamage: 7,
    color: "#d08b51",
    drops: { scrap: [0.22, 1, 1] }
  },
  armored: {
    id: "armored",
    name: "Panzereinheit",
    moveType: "ground",
    budget: 3.2,
    hp: 130,
    speed: 32,
    damage: 18,
    attackCooldown: 1.6,
    wallDamage: 20,
    color: "#8a5d68",
    drops: { scrap: [1, 2, 4], parts: [0.08, 1, 1] }
  },
  breaker: {
    id: "breaker",
    name: "Brecher",
    moveType: "ground",
    budget: 4.2,
    hp: 170,
    speed: 29,
    damage: 12,
    attackCooldown: 1.25,
    wallDamage: 42,
    color: "#9e493e",
    drops: { scrap: [1, 3, 5], parts: [0.14, 1, 1] }
  },
  drone: {
    id: "drone",
    name: "Drohne",
    moveType: "air",
    budget: 2.1,
    hp: 42,
    speed: 70,
    damage: 10,
    attackCooldown: 1.15,
    color: "#7d83d6",
    drops: { scrap: [0.55, 1, 2], iron: [0.08, 1, 1] }
  },
  bomber: {
    id: "bomber",
    name: "Bomber",
    moveType: "air",
    budget: 4.8,
    hp: 115,
    speed: 38,
    damage: 26,
    attackCooldown: 1.8,
    color: "#6157b8",
    drops: { scrap: [1, 2, 4], parts: [0.18, 1, 1] }
  },
  disruptor: {
    id: "disruptor",
    name: "Stoersender",
    moveType: "air",
    budget: 5.4,
    hp: 92,
    speed: 44,
    damage: 7,
    attackCooldown: 1.3,
    aura: 4.2,
    slowTowers: 0.45,
    color: "#a267c7",
    drops: { scrap: [1, 2, 4], parts: [0.28, 1, 1] }
  },
  guardian: {
    id: "guardian",
    name: "Nesthueter",
    moveType: "ground",
    budget: 7.2,
    hp: 260,
    speed: 25,
    damage: 28,
    attackCooldown: 1.55,
    wallDamage: 36,
    color: "#7a5a2e",
    drops: { scrap: [1, 5, 8], parts: [0.75, 1, 2] }
  }
});

