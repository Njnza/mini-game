/**
 * HexGrid.js
 * Hexagonal grid logic using axial coordinates (q, r), geometry mapping, and chain merge detection.
 */

import { ELEMENTS, TIERS, getRuneScore } from '../data/elements.js';

export class HexGrid {
  constructor(radius = 2, hexSize = 34, centerX = 400, centerY = 240) {
    this.radius = radius;
    this.hexSize = hexSize;
    this.centerX = centerX;
    this.centerY = centerY;
    this.cells = new Map(); // key "q,r" -> cell object
    this.initGrid(radius);
  }

  static getKey(q, r) {
    return `${q},${r}`;
  }

  static getNeighbors(q, r) {
    return [
      { q: q + 1, r: r },
      { q: q + 1, r: r - 1 },
      { q: q, r: r - 1 },
      { q: q - 1, r: r },
      { q: q - 1, r: r + 1 },
      { q: q, r: r + 1 }
    ];
  }

  initGrid(radius) {
    this.radius = radius;
    this.cells.clear();

    for (let q = -radius; q <= radius; q++) {
      const r1 = Math.max(-radius, -q - radius);
      const r2 = Math.min(radius, -q + radius);
      for (let r = r1; r <= r2; r++) {
        const { x, y } = this.axialToPixel(q, r);
        const key = HexGrid.getKey(q, r);
        this.cells.set(key, {
          q,
          r,
          x,
          y,
          rune: null, // { element: 'fire', tier: 1 }
          obstacle: null // { type: 'ice', hp: 1 } or { type: 'stone' }
        });
      }
    }
  }

  axialToPixel(q, r) {
    // Pointy-topped hexagon coordinate projection
    const x = this.hexSize * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r) + this.centerX;
    const y = this.hexSize * (1.5 * r) + this.centerY;
    return { x, y };
  }

  pixelToAxial(px, py) {
    const ptX = (px - this.centerX) / this.hexSize;
    const ptY = (py - this.centerY) / this.hexSize;

    const q = (Math.sqrt(3) / 3) * ptX - (1 / 3) * ptY;
    const r = (2 / 3) * ptY;

    // Cube coordinate rounding
    let x = q;
    let z = r;
    let y = -x - z;

    let rx = Math.round(x);
    let ry = Math.round(y);
    let rz = Math.round(z);

    const xDiff = Math.abs(rx - x);
    const yDiff = Math.abs(ry - y);
    const zDiff = Math.abs(rz - z);

    if (xDiff > yDiff && xDiff > zDiff) {
      rx = -ry - rz;
    } else if (yDiff > zDiff) {
      ry = -rx - rz;
    } else {
      rz = -rx - ry;
    }

    return { q: rx, r: rz };
  }

  getCell(q, r) {
    return this.cells.get(HexGrid.getKey(q, r)) || null;
  }

  canPlace(q, r) {
    const cell = this.getCell(q, r);
    if (!cell) return false;
    return cell.rune === null && cell.obstacle === null;
  }

  placeRune(q, r, rune) {
    const cell = this.getCell(q, r);
    if (!cell || cell.rune !== null || cell.obstacle !== null) return false;
    cell.rune = { ...rune };
    return true;
  }

  findConnected(startQ, startR, element, tier) {
    const visited = new Set();
    const matches = [];
    const queue = [{ q: startQ, r: startR }];
    visited.add(HexGrid.getKey(startQ, startR));

    while (queue.length > 0) {
      const current = queue.shift();
      const currentCell = this.getCell(current.q, current.r);
      if (!currentCell || !currentCell.rune) continue;

      if (currentCell.rune.element === element && currentCell.rune.tier === tier) {
        matches.push(currentCell);

        const neighbors = HexGrid.getNeighbors(current.q, current.r);
        for (const n of neighbors) {
          const nKey = HexGrid.getKey(n.q, n.r);
          if (!visited.has(nKey)) {
            visited.add(nKey);
            const nCell = this.getCell(n.q, n.r);
            if (nCell && nCell.rune && nCell.rune.element === element && nCell.rune.tier === tier) {
              queue.push(n);
            }
          }
        }
      }
    }

    return matches;
  }

  processMerges(startQ, startR, fxManager, audio, comboCount = 1) {
    const originCell = this.getCell(startQ, startR);
    if (!originCell || !originCell.rune) {
      return { merged: false, totalScore: 0, comboCount: 0, iceBroken: 0, upgradedRunes: [] };
    }

    const { element, tier } = originCell.rune;
    const connected = this.findConnected(startQ, startR, element, tier);

    if (connected.length < 3) {
      return { merged: false, totalScore: 0, comboCount: 0, iceBroken: 0, upgradedRunes: [] };
    }

    // MATCH 3+ FOUND!
    let totalScore = getRuneScore(tier, comboCount);
    let iceBroken = 0;
    const upgradedRunes = [];

    // Damage adjacent ice blocks for all connected runes
    const adjacentCoords = new Set();
    connected.forEach(c => {
      HexGrid.getNeighbors(c.q, c.r).forEach(n => adjacentCoords.add(HexGrid.getKey(n.q, n.r)));
    });

    adjacentCoords.forEach(key => {
      const [q, r] = key.split(',').map(Number);
      const neighborCell = this.getCell(q, r);
      if (neighborCell && neighborCell.obstacle && neighborCell.obstacle.type === 'ice') {
        neighborCell.obstacle.hp--;
        if (fxManager) {
          fxManager.createIceBreakSparks(neighborCell.x, neighborCell.y);
          fxManager.addFloatingText('NỨT BĂNG! ❄️', neighborCell.x, neighborCell.y - 15, '#38bdf8', 16);
        }
        if (neighborCell.obstacle.hp <= 0) {
          neighborCell.obstacle = null;
          iceBroken++;
          totalScore += 100;
          if (audio) audio.playIceShatter();
          if (fxManager) {
            fxManager.addFloatingText('TAN BĂNG! 💎', neighborCell.x, neighborCell.y - 20, '#67e8f9', 18);
          }
        }
      }
    });

    // Clear secondary matched cells
    connected.forEach(c => {
      if (c !== originCell) {
        if (fxManager) {
          const elemDef = ELEMENTS[c.rune.element] || ELEMENTS.fire;
          fxManager.createMergeSparks(c.x, c.y, elemDef.baseColor, 10);
        }
        c.rune = null;
      }
    });

    // Upgrade origin rune
    let newTier = tier + 1;
    let newElement = element;

    // Special Tier 4 Transformation:
    // If Arcane reaches Tier 4 -> Becomes Prism Star!
    if (element === 'arcane' && newTier >= 4) {
      newElement = 'prism';
      newTier = 4;
      totalScore += 500;
      if (fxManager) {
        fxManager.addFloatingText('💎 NGỌC CẦU VỒNG PRISM!', originCell.x, originCell.y - 30, '#ec4899', 22);
      }
    } else if (newTier > 4) {
      // Nova burst!
      newTier = 4;
      totalScore += 300;
    }

    originCell.rune = { element: newElement, tier: newTier };
    upgradedRunes.push({ q: originCell.q, r: originCell.r, element: newElement, tier: newTier });

    // Audio & FX
    if (audio) audio.playMerge(comboCount);
    if (fxManager) {
      const elemDef = ELEMENTS[newElement] || ELEMENTS.fire;
      fxManager.createMergeSparks(originCell.x, originCell.y, elemDef.baseColor, 20);
      fxManager.triggerScreenShake(3 + comboCount * 2, 0.25);
      const comboLabel = comboCount > 1 ? `COMBO x${comboCount}! ` : '';
      fxManager.addFloatingText(`${comboLabel}+${totalScore}`, originCell.x, originCell.y - 22, elemDef.baseColor, 18);
    }

    // Cascade check: does the newly formed rune trigger another match?
    const cascadeResult = this.processMerges(startQ, startR, fxManager, audio, comboCount + 1);
    if (cascadeResult.merged) {
      totalScore += cascadeResult.totalScore;
      iceBroken += cascadeResult.iceBroken;
      upgradedRunes.push(...cascadeResult.upgradedRunes);
      return {
        merged: true,
        totalScore,
        comboCount: cascadeResult.comboCount,
        iceBroken,
        upgradedRunes
      };
    }

    return {
      merged: true,
      totalScore,
      comboCount,
      iceBroken,
      upgradedRunes
    };
  }

  isFull() {
    for (const cell of this.cells.values()) {
      if (cell.rune === null && cell.obstacle === null) {
        return false;
      }
    }
    return true;
  }

  countIce() {
    let count = 0;
    for (const cell of this.cells.values()) {
      if (cell.obstacle && cell.obstacle.type === 'ice') {
        count++;
      }
    }
    return count;
  }

  render(ctx, selectedPiece = null, hoverAxial = null) {
    // 1. Draw Board Cells
    for (const cell of this.cells.values()) {
      this.drawHex(ctx, cell.x, cell.y, this.hexSize - 2, '#181236', 'rgba(139, 92, 246, 0.25)', 1.5);

      // Obstacle: Stone
      if (cell.obstacle && cell.obstacle.type === 'stone') {
        this.drawStone(ctx, cell.x, cell.y, this.hexSize - 6);
      }

      // Obstacle: Ice
      if (cell.obstacle && cell.obstacle.type === 'ice') {
        this.drawIce(ctx, cell.x, cell.y, this.hexSize - 5, cell.obstacle.hp);
      }

      // Rune
      if (cell.rune) {
        this.drawRune(ctx, cell.x, cell.y, this.hexSize - 5, cell.rune);
      }
    }

    // 2. Hover placement preview
    if (selectedPiece && hoverAxial) {
      const coords = selectedPiece.getPlacementCoords(hoverAxial.q, hoverAxial.r);
      const canPlaceAll = coords.every(c => this.canPlace(c.q, c.r));

      coords.forEach((c, idx) => {
        const targetCell = this.getCell(c.q, c.r);
        if (targetCell) {
          const ghostColor = canPlaceAll ? 'rgba(52, 211, 153, 0.45)' : 'rgba(239, 68, 68, 0.45)';
          const strokeColor = canPlaceAll ? '#10b981' : '#ef4444';
          this.drawHex(ctx, targetCell.x, targetCell.y, this.hexSize - 4, ghostColor, strokeColor, 2);

          if (canPlaceAll && selectedPiece.runes[idx]) {
            ctx.save();
            ctx.globalAlpha = 0.65;
            this.drawRune(ctx, targetCell.x, targetCell.y, this.hexSize - 6, selectedPiece.runes[idx]);
            ctx.restore();
          }
        }
      });
    }
  }

  drawHex(ctx, x, y, size, fillColor, strokeColor, lineWidth = 1) {
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      // Pointy-topped angles: 30, 90, 150, 210, 270, 330 deg
      const angle = (Math.PI / 180) * (60 * i - 30);
      const px = x + size * Math.cos(angle);
      const py = y + size * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();

    if (fillColor) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }
    ctx.restore();
  }

  drawRune(ctx, x, y, size, rune) {
    const elemDef = ELEMENTS[rune.element] || ELEMENTS.fire;
    const tierDef = TIERS[rune.tier] || TIERS[1];

    ctx.save();
    // 1. Glowing outer border
    this.drawHex(ctx, x, y, size, elemDef.baseColor, elemDef.secondaryColor, 2);

    // 2. Dark inner plate
    this.drawHex(ctx, x, y, size * 0.82, '#120b29', 'rgba(255, 255, 255, 0.15)', 1);

    // 3. Central Element Icon
    ctx.font = `${Math.floor(size * 0.72)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(elemDef.icon, x, y - 2);

    // 4. Tier Dots (I, II, III, IV)
    const dotCount = tierDef.dots;
    const dotRadius = 2.2;
    const spacing = 6;
    const startX = x - ((dotCount - 1) * spacing) / 2;
    const dotY = y + size * 0.55;

    ctx.fillStyle = rune.tier >= 3 ? '#fbbf24' : '#f8fafc';
    for (let d = 0; d < dotCount; d++) {
      ctx.beginPath();
      ctx.arc(startX + d * spacing, dotY, dotRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Tier 3+ Golden Rim
    if (rune.tier >= 3) {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.5;
      this.drawHex(ctx, x, y, size - 1, null, '#fbbf24', 1.5);
    }

    ctx.restore();
  }

  drawStone(ctx, x, y, size) {
    ctx.save();
    this.drawHex(ctx, x, y, size, '#334155', '#475569', 2);
    // Rough rock cracks
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 8);
    ctx.lineTo(x + 4, y + 2);
    ctx.lineTo(x + 10, y - 4);
    ctx.stroke();
    ctx.restore();
  }

  drawIce(ctx, x, y, size, hp) {
    ctx.save();
    const iceColor = hp > 1 ? 'rgba(56, 189, 248, 0.75)' : 'rgba(125, 211, 252, 0.55)';
    this.drawHex(ctx, x, y, size, iceColor, '#e0f2fe', 2);

    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('❄️', x, y);

    if (hp > 1) {
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#0369a1';
      ctx.fillText(hp, x + 10, y + 10);
    }
    ctx.restore();
  }
}
