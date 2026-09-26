/**
 * PieceGenerator.js
 * Intelligent piece generator with objective-bias, board match assist, and tier scaling.
 * Guarantees player winnability while maintaining strategic puzzle challenge.
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
    this.rerollCount = 3;
  }

  reset() {
    this.slots = [null, null, null];
    this.rerollCount = 3;
  }

  generateSlotPieces(allowedElements = ['fire', 'water', 'nature'], objective = null, grid = null, levelId = 1, movesLeft = 20) {
    for (let i = 0; i < 3; i++) {
      if (!this.slots[i]) {
        this.slots[i] = this.createSmartPiece(allowedElements, objective, grid, levelId, movesLeft);
      }
    }
  }

  rerollPieces(allowedElements, objective, grid, levelId = 1, movesLeft = 20) {
    if (this.rerollCount <= 0) return false;
    this.rerollCount--;
    for (let i = 0; i < 3; i++) {
      this.slots[i] = this.createSmartPiece(allowedElements, objective, grid, levelId, movesLeft);
    }
    return true;
  }

  createSmartPiece(allowedElements, objective = null, grid = null, levelId = 1, movesLeft = 20) {
    // Levels 1 to 3: 100% single hex pieces for smooth learning curve
    // Level 4+: 25% duo pieces with matching elements
    const isDuo = levelId >= 4 && Math.random() < 0.25;
    const runes = [];

    // 1. Identify Target Elements from level objective
    const targetElements = [];
    if (objective) {
      if (objective.element) targetElements.push(objective.element);
      if (objective.elemA) targetElements.push(objective.elemA);
      if (objective.elemB) targetElements.push(objective.elemB);
      if (objective.type === 'prism') targetElements.push('arcane');
    }

    // 2. Board Analysis: Identify pairs of matching adjacent runes on the board
    let boardWantedElement = null;
    let boardWantedTier = 1;
    if (grid && grid.cells) {
      for (const cell of grid.cells.values()) {
        if (cell.rune) {
          const neighbors = HexGrid.getNeighbors(cell.q, cell.r);
          for (const n of neighbors) {
            const nCell = grid.getCell(n.q, n.r);
            if (nCell && nCell.rune && nCell.rune.element === cell.rune.element && nCell.rune.tier === cell.rune.tier) {
              boardWantedElement = cell.rune.element;
              boardWantedTier = cell.rune.tier;
              break;
            }
          }
          if (boardWantedElement) break;
        }
      }
    }

    // 3. High Winnability Element Selection
    // If low on moves or in early levels, target bias goes up to 80%
    const targetBias = movesLeft <= 6 || levelId <= 2 ? 0.80 : 0.65;
    let elem1;
    const roll = Math.random();

    if (targetElements.length > 0 && roll < targetBias) {
      elem1 = targetElements[Math.floor(Math.random() * targetElements.length)];
    } else if (boardWantedElement && roll < 0.88 && allowedElements.includes(boardWantedElement)) {
      elem1 = boardWantedElement;
    } else {
      elem1 = allowedElements[Math.floor(Math.random() * allowedElements.length)];
    }

    // 4. Smart Tier Scaling
    let tier1 = 1;
    const tierRoll = Math.random();

    if (objective && (objective.targetTier >= 3 || objective.type === 'prism' || (objective.tierA >= 3 && elem1 === objective.elemA))) {
      // For Level requiring Tier 3 or Prism: generous Tier 2 (45%) & Tier 3 (20%)
      if (tierRoll < 0.45) {
        tier1 = 2;
      } else if (tierRoll < 0.65) {
        tier1 = 3;
      } else {
        tier1 = 1;
      }
    } else if (objective && objective.targetTier === 2) {
      // Level requiring Tier 2: 45% Tier 2, 55% Tier 1
      if (tierRoll < 0.45) {
        tier1 = 2;
      } else {
        tier1 = 1;
      }
    } else {
      // General level: 30% Tier 2, 70% Tier 1
      if (tierRoll < 0.30) {
        tier1 = 2;
      } else {
        tier1 = 1;
      }
    }

    // Board wanted tier synergy boost
    if (boardWantedElement === elem1 && boardWantedTier > tier1 && Math.random() < 0.6) {
      tier1 = boardWantedTier;
    }

    runes.push({ element: elem1, tier: tier1 });

    if (isDuo) {
      // Duo pieces in Hexa Rune always have matching element so they are instantly useful
      const elem2 = elem1;
      const tier2 = Math.random() < 0.4 ? tier1 : 1;
      runes.push({ element: elem2, tier: tier2 });
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
