"use strict";

PW.WILDLIFE = Object.freeze({
  birds: {
    target: [18, 28],
    size: [7, 11],
    speed: [42, 78],
    colors: ["#d9c39b", "#83e3da", "#f0b84d", "#f2eddc"]
  },
  critters: {
    forestHopper: {
      id: "forestHopper",
      name: "Waldhuepfer",
      description: "Scheu, flink und friedlich.",
      hp: 18,
      radius: 8,
      speed: 34,
      fleeRange: 66,
      homeRadius: 5,
      preferredTiles: ["forestFloor", "soil"],
      color: "#6fb65d",
      accent: "#d9c39b",
      rewards: {
        wood: [1, 2, 4],
        parts: [0.35, 1, 1]
      }
    },
    mossBeetle: {
      id: "mossBeetle",
      name: "Mooskaefer",
      description: "Robuster Waldbewohner mit steinigem Panzer.",
      hp: 26,
      radius: 9,
      speed: 22,
      fleeRange: 48,
      homeRadius: 4,
      preferredTiles: ["forestFloor", "wetland"],
      color: "#486f45",
      accent: "#a7aaa1",
      rewards: {
        stone: [1, 1, 3],
        scrap: [0.45, 1, 2]
      }
    }
  },
  critterMax: [18, 26],
  respawnEvery: [24, 42]
});
