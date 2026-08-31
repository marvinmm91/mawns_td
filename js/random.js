"use strict";

PW.Random = {
  create(seed) {
    let s = (seed >>> 0) || 123456789;
    return {
      seed: s,
      next() {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
      },
      int(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
      },
      float(min, max) {
        return this.next() * (max - min) + min;
      },
      pick(items) {
        return items[Math.floor(this.next() * items.length)];
      },
      chance(value) {
        return this.next() < value;
      }
    };
  }
};

