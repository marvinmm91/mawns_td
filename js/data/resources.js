"use strict";

PW.RESOURCES = Object.freeze({
  wood: { id: "wood", name: "Holz", icon: "H", color: "#8fbe63", tool: "axe" },
  stone: { id: "stone", name: "Stein", icon: "S", color: "#a7aaa1", tool: "pickaxe" },
  iron: { id: "iron", name: "Eisen", icon: "E", color: "#9fb8c1", tool: "pickaxe" },
  gold: { id: "gold", name: "Gold", icon: "G", color: "#f0c45a", tool: "pickaxe" },
  crystal: { id: "crystal", name: "Kristall", icon: "K", color: "#83e3da", tool: "pickaxe" },
  scrap: { id: "scrap", name: "Schrott", icon: "C", color: "#c59d76", tool: null },
  parts: { id: "parts", name: "Bauteile", icon: "B", color: "#e6d7a3", tool: null },
  key: { id: "key", name: "Schlüssel", icon: "Y", color: "#f3d36b", tool: null }
});

PW.RESOURCE_NODES = Object.freeze({
  tree: { id: "tree", resource: "wood", name: "Baum", amount: [5, 9], hp: [1, 2], blocks: true, color: "#477342" },
  rock: { id: "rock", resource: "stone", name: "Felsen", amount: [4, 8], hp: [2, 3], blocks: true, color: "#77786f" },
  iron: { id: "iron", resource: "iron", name: "Eisenerz", amount: [3, 6], hp: [3, 4], blocks: true, color: "#7d9da9" },
  gold: { id: "gold", resource: "gold", name: "Goldader", amount: [2, 4], hp: [4, 5], blocks: true, color: "#d6a845" },
  crystal: { id: "crystal", resource: "crystal", name: "Kristallnest", amount: [2, 4], hp: [4, 5], blocks: true, color: "#65cec8" }
});
