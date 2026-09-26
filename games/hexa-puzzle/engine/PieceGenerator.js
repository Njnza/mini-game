/**
 * PieceGenerator.js
 * Generates and manages draggable/clickable waiting pieces (Singles and Duos) with rotation support.
 */

import { HexGrid } from './HexGrid.js';

export class Piece {
  constructor(id, runes, isDuo = false) {
    this.id = id;
    this.runes = runes; // Array of { element, tier }
    this.isDuo = isDuo;
    this.rotationIndex = 0; // 0 to 5 (60 deg increments)
  }

  rotate() {
    if (!this.isDuo) return;
    this.rotationIndex = (this.rotationIndex + 1) % 6;
  }

  getPlacementCoords(originQ, originR) {
    if (!this.isDuo) {
      return [{ q: originQ, r: originR }];
    }

    const neighborOffsets = [
      { q: 1, r: 0 },
      { q: 1, r: -1 },
      { q: 0, r: -1 },
      { q: -1, r: 0 },
      { q: -1, r: 1 },
      { q: 0, r: 1 }
    ];

    const offset = neighborOffsets[this.rotationIndex];
    return [
      { q: originQ, r: originR },
      { q: originQ + offset.q, r: originR + offset.r }
    ];
  }
}

export class PieceGenerator {
  constructor() {
    this.slots = [null, null, null];
    this.nextPieceId = 1;
  }

  reset() {
    this.slots = [null, null, null];
  }

  generateSlotPieces(allowedElements = ['fire', 'water', 'nature']) {
    for (let i = 0; i < 3; i++) {
      if (!this.slots[i]) {
        this.slots[i] = this.createRandomPiece(allowedElements);
      }
    }
  }

  createRandomPiece(allowedElements) {
    const isDuo = Math.random() < 0.4;
    const runes = [];

    // First rune
    const elem1 = allowedElements[Math.floor(Math.random() * allowedElements.length)];
    // Mostly Tier 1 (75%), occasionally Tier 2 (25%)
    const tier1 = Math.random() < 0.25 ? 2 : 1;
    runes.push({ element: elem1, tier: tier1 });

    if (isDuo) {
      // Second rune
      const elem2 = Math.random() < 0.65 ? elem1 : allowedElements[Math.floor(Math.random() * allowedElements.length)];
      runes.push({ element: elem2, tier: 1 });
    }

    const piece = new Piece(this.nextPieceId++, runes, isDuo);
    if (isDuo) {
      piece.rotationIndex = Math.floor(Math.random() * 6);
    }
    return piece;
  }

  hasEmptySlots() {
    return this.slots.every(s => s === null);
  }

  consumeSlot(index) {
    if (index >= 0 && index < 3) {
      this.slots[index] = null;
    }
  }
}
