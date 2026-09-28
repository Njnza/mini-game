/**
 * MapEngine.js
 * Manages the arena tile grid, indestructible and destructible barriers,
 * explosive barrels, alternating laser forcefields, teleporters, and raycast collision detection.
 */

import { LEVEL_GRID_COLS, LEVEL_GRID_ROWS, TILE_SIZE } from '../data/levels.js';
import { POWERUPS } from '../data/weapons.js';

export class MapEngine {
  constructor(fx, audio) {
    this.fx = fx;
    this.audio = audio;
    this.cols = LEVEL_GRID_COLS;
    this.rows = LEVEL_GRID_ROWS;
    this.tileSize = TILE_SIZE;
    this.width = this.cols * this.tileSize; // 800
    this.height = this.rows * this.tileSize; // 560

    this.grid = Array.from({ length: this.rows }, () => new Array(this.cols).fill(0));
    this.destructibleHp = new Map(); // key 'c_r' -> hp
    this.explosives = new Map(); // key 'c_r' -> state
    this.laserGates = []; // { col, row, active, timer }
    this.teleporters = { alpha: null, beta: null };
    this.powerupDrops = []; // { x, y, type, life, angle }

    this.laserCycleTimer = 0;
    this.laserActive = true;
  }

  loadLevel(levelData) {
    this.grid = Array.from({ length: this.rows }, () => new Array(this.cols).fill(0));
    this.destructibleHp.clear();
    this.explosives.clear();
    this.laserGates = [];
    this.teleporters = { alpha: null, beta: null };
    this.powerupDrops = [];
    this.laserCycleTimer = 0;
    this.laserActive = true;

    // 1. Build outer boundary perimeter walls
    for (let c = 0; c < this.cols; c++) {
      this.grid[0][c] = 1;
      this.grid[this.rows - 1][c] = 1;
    }
    for (let r = 0; r < this.rows; r++) {
      this.grid[r][0] = 1;
      this.grid[r][this.cols - 1] = 1;
    }

    // 2. Populate level specific tiles
    if (levelData.tiles) {
      for (const [col, row, type] of levelData.tiles) {
        if (col > 0 && col < this.cols - 1 && row > 0 && row < this.rows - 1) {
          this.grid[row][col] = type;
          const key = `${col}_${row}`;

          if (type === 2) {
            // Destructible barricade: 2 HP
            this.destructibleHp.set(key, 2);
          } else if (type === 3) {
            // Explosive fuel barrel
            this.explosives.set(key, { armed: false, detonating: false, timer: 0 });
          } else if (type === 4) {
            // Laser forcefield
            this.laserGates.push({ col, row });
          } else if (type === 5) {
            // Teleporter Alpha
            this.teleporters.alpha = {
              x: (col + 0.5) * this.tileSize,
              y: (row + 0.5) * this.tileSize,
              col,
              row
            };
          } else if (type === 6) {
            // Teleporter Beta
            this.teleporters.beta = {
              x: (col + 0.5) * this.tileSize,
              y: (row + 0.5) * this.tileSize,
              col,
              row
            };
          }
        }
      }
    }
  }

  isSolid(col, row, forBullet = false) {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
      return true; // Outside bounds is solid
    }
    const val = this.grid[row][col];
    if (val === 1 || val === 2 || val === 3) return true;
    if (val === 4 && this.laserActive) return true;
    return false;
  }

  // Continuous raycast to detect hit against walls/obstacles with normal reflection vector
  raycast(startX, startY, dirX, dirY, maxDist = 1200) {
    const len = Math.hypot(dirX, dirY);
    if (len === 0) return null;
    const dx = dirX / len;
    const dy = dirY / len;

    const step = 4; // 4px precision step
    let curX = startX;
    let curY = startY;
    let dist = 0;

    while (dist < maxDist) {
      curX += dx * step;
      curY += dy * step;
      dist += step;

      const col = Math.floor(curX / this.tileSize);
      const row = Math.floor(curY / this.tileSize);

      if (this.isSolid(col, row, true)) {
        // Calculate collision normal using tile boundary box
        const tileLeft = col * this.tileSize;
        const tileRight = tileLeft + this.tileSize;
        const tileTop = row * this.tileSize;
        const tileBottom = tileTop + this.tileSize;

        const distLeft = Math.abs(curX - tileLeft);
        const distRight = Math.abs(curX - tileRight);
        const distTop = Math.abs(curY - tileTop);
        const distBottom = Math.abs(curY - tileBottom);

        const minDist = Math.min(distLeft, distRight, distTop, distBottom);
        let normalX = 0;
        let normalY = 0;

        if (minDist === distLeft) normalX = -1;
        else if (minDist === distRight) normalX = 1;
        else if (minDist === distTop) normalY = -1;
        else normalY = 1;

        return {
          hit: true,
          x: curX,
          y: curY,
          dist,
          col,
          row,
          tileType: this.grid[row] ? this.grid[row][col] : 1,
          normalX,
          normalY
        };
      }
    }

    return {
      hit: false,
      x: curX,
      y: curY,
      dist: maxDist,
      col: -1,
      row: -1,
      tileType: 0,
      normalX: -dx,
      normalY: -dy
    };
  }

  // Circle vs Tile Wall collision resolver for tanks
  resolveTankCollision(tank) {
    const minCol = Math.max(0, Math.floor((tank.x - tank.radius) / this.tileSize));
    const maxCol = Math.min(this.cols - 1, Math.floor((tank.x + tank.radius) / this.tileSize));
    const minRow = Math.max(0, Math.floor((tank.y - tank.radius) / this.tileSize));
    const maxRow = Math.min(this.rows - 1, Math.floor((tank.y + tank.radius) / this.tileSize));

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        if (this.isSolid(c, r)) {
          const tileLeft = c * this.tileSize;
          const tileRight = tileLeft + this.tileSize;
          const tileTop = r * this.tileSize;
          const tileBottom = tileTop + this.tileSize;

          // Closest point on tile AABB to circle center
          const closestX = Math.max(tileLeft, Math.min(tank.x, tileRight));
          const closestY = Math.max(tileTop, Math.min(tank.y, tileBottom));

          const diffX = tank.x - closestX;
          const diffY = tank.y - closestY;
          const distSq = diffX * diffX + diffY * diffY;

          if (distSq < tank.radius * tank.radius && distSq > 0) {
            const dist = Math.sqrt(distSq);
            const overlap = tank.radius - dist;
            tank.x += (diffX / dist) * overlap;
            tank.y += (diffY / dist) * overlap;
          }
        }
      }
    }
  }

  // Damage destructible wall or barrel
  damageTile(col, row, damage = 1, onExplosionCallback = null) {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return;
    const type = this.grid[row][col];
    const key = `${col}_${row}`;
    const worldX = (col + 0.5) * this.tileSize;
    const worldY = (row + 0.5) * this.tileSize;

    if (type === 2) {
      // Destructible block
      const currentHp = (this.destructibleHp.get(key) || 2) - damage;
      if (currentHp <= 0) {
        this.grid[row][col] = 0;
        this.destructibleHp.delete(key);
        this.fx.createBlockDebris(worldX, worldY, '#f59e0b');
        this.audio.playExplosion(false);

        // 35% chance to drop powerup crate!
        if (Math.random() < 0.35) {
          const powerupKeys = ['shield', 'rapid', 'scatter', 'emp', 'speed'];
          const chosenKey = powerupKeys[Math.floor(Math.random() * powerupKeys.length)];
          this.spawnPowerup(worldX, worldY, chosenKey);
        }
      } else {
        this.destructibleHp.set(key, currentHp);
        this.fx.createRicochetSparks(worldX, worldY, 0, -1, '#f59e0b');
        this.audio.playHit();
      }
    } else if (type === 3) {
      // Explosive Fuel Barrel
      const barrel = this.explosives.get(key);
      if (barrel && !barrel.detonating) {
        barrel.detonating = true;
        this.grid[row][col] = 0;
        this.explosives.delete(key);

        // Immediate detonation
        this.fx.createExplosion(worldX, worldY, true, '#ef4444');
        this.audio.playExplosion(true);

        if (typeof onExplosionCallback === 'function') {
          onExplosionCallback(worldX, worldY, 110, 3);
        }

        // Trigger adjacent barrels in chain reaction!
        const neighbors = [
          [col - 1, row], [col + 1, row],
          [col, row - 1], [col, row + 1]
        ];
        neighbors.forEach(([nc, nr]) => {
          if (this.grid[nr] && this.grid[nr][nc] === 3) {
            setTimeout(() => {
              this.damageTile(nc, nr, 1, onExplosionCallback);
            }, 80);
          }
        });
      }
    }
  }

  // Spawn powerup crate
  spawnPowerup(x, y, type) {
    this.powerupDrops.push({
      x,
      y,
      type,
      config: POWERUPS[type],
      angle: 0,
      life: 18.0 // Despawns after 18 seconds if untouched
    });
  }

  update(dt, onLaserDamage = null) {
    // 1. Cycle laser gates
    this.laserCycleTimer += dt;
    if (this.laserCycleTimer >= 3.5) {
      this.laserCycleTimer = 0;
      this.laserActive = !this.laserActive;
      if (this.laserActive && this.laserGates.length > 0) {
        this.audio.playLaserWarning();
      }
    }

    // 2. Update powerup drops
    for (let i = this.powerupDrops.length - 1; i >= 0; i--) {
      const drop = this.powerupDrops[i];
      drop.angle += dt * 2;
      drop.life -= dt;
      if (drop.life <= 0) {
        this.powerupDrops.splice(i, 1);
      }
    }
  }

  // Check if tank or bullet touches teleporter
  checkTeleport(x, y) {
    if (!this.teleporters.alpha || !this.teleporters.beta) return null;
    const threshold = this.tileSize * 0.55;

    const distAlpha = Math.hypot(x - this.teleporters.alpha.x, y - this.teleporters.alpha.y);
    if (distAlpha < threshold) {
      return { targetX: this.teleporters.beta.x, targetY: this.teleporters.beta.y };
    }

    const distBeta = Math.hypot(x - this.teleporters.beta.x, y - this.teleporters.beta.y);
    if (distBeta < threshold) {
      return { targetX: this.teleporters.alpha.x, targetY: this.teleporters.alpha.y };
    }

    return null;
  }

  render(ctx) {
    // 1. Base grid floor pattern
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
    ctx.lineWidth = 1;
    for (let c = 0; c <= this.cols; c++) {
      ctx.beginPath();
      ctx.moveTo(c * this.tileSize, 0);
      ctx.lineTo(c * this.tileSize, this.height);
      ctx.stroke();
    }
    for (let r = 0; r <= this.rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * this.tileSize);
      ctx.lineTo(this.width, r * this.tileSize);
      ctx.stroke();
    }
    ctx.restore();

    // 2. Render Teleporters
    ['alpha', 'beta'].forEach((key) => {
      const tp = this.teleporters[key];
      if (tp) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(tp.x, tp.y, 16, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(168, 85, 247, 0.25)';
        ctx.fill();
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(key === 'alpha' ? 'Ω' : 'Ψ', tp.x, tp.y);
        ctx.restore();
      }
    });

    // 3. Render Tiles
    for (let r = 0; r < this.rows; r++) {
      if (!this.grid || !this.grid[r]) continue;
      for (let c = 0; c < this.cols; c++) {
        const type = this.grid[r][c];
        const x = c * this.tileSize;
        const y = r * this.tileSize;

        if (type === 1) {
          // Solid Indestructible Neon Wall
          ctx.save();
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(x + 1, y + 1, this.tileSize - 2, this.tileSize - 2);
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = 2;
          ctx.shadowColor = '#06b6d4';
          ctx.shadowBlur = 6;
          ctx.strokeRect(x + 1.5, y + 1.5, this.tileSize - 3, this.tileSize - 3);

          // Inner tech cross
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x + 8, y + 8);
          ctx.lineTo(x + this.tileSize - 8, y + this.tileSize - 8);
          ctx.moveTo(x + this.tileSize - 8, y + 8);
          ctx.lineTo(x + 8, y + this.tileSize - 8);
          ctx.stroke();
          ctx.restore();
        } else if (type === 2) {
          // Destructible Barricade
          const hp = this.destructibleHp.get(`${c}_${r}`) || 2;
          ctx.save();
          ctx.fillStyle = hp === 2 ? '#1e1b4b' : '#311042';
          ctx.fillRect(x + 2, y + 2, this.tileSize - 4, this.tileSize - 4);
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = hp === 2 ? 2 : 1.5;
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 4;
          ctx.strokeRect(x + 2, y + 2, this.tileSize - 4, this.tileSize - 4);

          // Crack indicators if damaged
          if (hp === 1) {
            ctx.strokeStyle = '#ef4444';
            ctx.beginPath();
            ctx.moveTo(x + 6, y + 12);
            ctx.lineTo(x + 22, y + 24);
            ctx.lineTo(x + 34, y + 18);
            ctx.stroke();
          }
          ctx.restore();
        } else if (type === 3) {
          // Explosive Fuel Barrel
          ctx.save();
          ctx.beginPath();
          ctx.arc(x + this.tileSize / 2, y + this.tileSize / 2, 14, 0, Math.PI * 2);
          ctx.fillStyle = '#7f1d1d';
          ctx.fill();
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 8;
          ctx.stroke();

          // Hazard symbol
          ctx.fillStyle = '#facc15';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⚡', x + this.tileSize / 2, y + this.tileSize / 2);
          ctx.restore();
        } else if (type === 4) {
          // Laser Forcefield Gate
          ctx.save();
          if (this.laserActive) {
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.moveTo(x, y + this.tileSize / 2);
            ctx.lineTo(x + this.tileSize, y + this.tileSize / 2);
            ctx.stroke();
          } else {
            // Inactive warning dashes
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.2)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(x, y + this.tileSize / 2);
            ctx.lineTo(x + this.tileSize, y + this.tileSize / 2);
            ctx.stroke();
          }
          ctx.restore();
        }
      }
    }

    // 4. Render Power-Up Drops
    for (let i = 0; i < this.powerupDrops.length; i++) {
      const drop = this.powerupDrops[i];
      ctx.save();
      ctx.translate(drop.x, drop.y);
      ctx.rotate(drop.angle);

      // Glowing badge
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.beginPath();
      ctx.roundRect(-14, -14, 28, 28, 6);
      ctx.fill();
      ctx.strokeStyle = drop.config.color;
      ctx.lineWidth = 2;
      ctx.shadowColor = drop.config.color;
      ctx.shadowBlur = 12;
      ctx.stroke();

      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(drop.config.icon, 0, 1);
      ctx.restore();
    }
  }
}
