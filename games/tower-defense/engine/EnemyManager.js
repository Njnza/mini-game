/**
 * EnemyManager.js
 * Enemy lifecycle, movement along multi-lane waypoints, wave spawning queue, and status effects.
 */

import { createEnemyInstance } from '../data/enemies.js';

export class EnemyManager {
  constructor(map, fxManager, audioManager, callbacks = {}) {
    this.map = map;
    this.fx = fxManager;
    this.audio = audioManager;
    this.callbacks = callbacks; // onEnemyKilled, onBaseBreached, onWaveCompleted, onAllWavesCleared

    this.enemies = [];
    this.waveQueue = [];
    this.currentWaveNum = 1;
    this.totalWaves = map.totalWaves || 10;
    this.isWaveActive = false;
    this.spawnTimer = 0;
    this.autoNextWaveTimer = 0;
  }

  reset() {
    this.enemies = [];
    this.waveQueue = [];
    this.currentWaveNum = 1;
    this.isWaveActive = false;
    this.spawnTimer = 0;
    this.autoNextWaveTimer = 0;
  }

  startWave(waveNum) {
    this.currentWaveNum = waveNum;
    this.isWaveActive = true;
    this.waveQueue = [];

    const config = this.map.mapData.waveConfigs.find(w => w.wave === waveNum) ||
                   this.map.mapData.waveConfigs[this.map.mapData.waveConfigs.length - 1];

    // Build spawn queue
    let cumulativeDelay = 0.5;
    for (const group of config.enemies) {
      for (let i = 0; i < group.count; i++) {
        this.waveQueue.push({
          type: group.type,
          pathIndex: group.pathIndex !== undefined ? group.pathIndex : (i % this.map.pixelPaths.length),
          spawnAt: cumulativeDelay
        });
        cumulativeDelay += group.interval || 1.0;
      }
    }

    this.spawnTimer = 0;
    if (this.audio && typeof this.audio.playClick === 'function') {
      this.audio.playClick();
    }
  }

  spawnEnemy(typeId, pathIndex = 0, initialX = null, initialY = null, startProgress = 0) {
    const enemy = createEnemyInstance(typeId, this.currentWaveNum, 1.0);
    enemy.pathIndex = Math.min(pathIndex, this.map.pixelPaths.length - 1);
    const pixelPath = this.map.pixelPaths[enemy.pathIndex] || this.map.pixelPaths[0];

    if (initialX !== null && initialY !== null) {
      enemy.x = initialX;
      enemy.y = initialY;
      enemy.currentWaypointIndex = Math.max(0, Math.floor(startProgress));
      enemy.pathProgress = startProgress;
    } else {
      enemy.x = pixelPath[0].x;
      enemy.y = pixelPath[0].y;
      enemy.currentWaypointIndex = 0;
      enemy.pathProgress = 0;
    }

    // Attach method hooks to enemy instance
    enemy.takeDamage = (amount, source = 'kinetic') => {
      if (enemy.dead) return;

      // Shield absorbs first
      if (enemy.hasShield && enemy.shield > 0) {
        if (enemy.shield >= amount) {
          enemy.shield -= amount;
          this.fx.addFloatingText(`${amount}`, enemy.x, enemy.y, '#38bdf8', 11);
          return;
        } else {
          const remaining = amount - enemy.shield;
          enemy.shield = 0;
          amount = remaining;
        }
      }

      enemy.hp -= amount;
      this.fx.addFloatingText(`${amount}`, enemy.x, enemy.y, enemy.type === 'boss' ? '#f43f5e' : '#f8fafc', enemy.type === 'boss' ? 14 : 11);

      if (enemy.hp <= 0) {
        enemy.hp = 0;
        enemy.dead = true;
        this.handleEnemyDeath(enemy);
      }
    };

    enemy.applySlow = (factor, duration) => {
      if (enemy.dead || enemy.isImmuneToSlow) return;
      // Refresh or upgrade slow factor
      if (factor > enemy.slowFactor || enemy.slowTimer <= 0) {
        enemy.slowFactor = factor;
        enemy.slowTimer = duration;
      }
    };

    enemy.applyStun = (duration) => {
      if (enemy.dead) return;
      enemy.stunTimer = Math.max(enemy.stunTimer, duration);
    };

    this.enemies.push(enemy);
    return enemy;
  }

  handleEnemyDeath(enemy) {
    this.fx.addExplosion(enemy.x, enemy.y, enemy.color, enemy.type === 'boss' ? 36 : 14, 140, enemy.size * 2.5);
    this.fx.addFloatingText(`+${enemy.bounty}G`, enemy.x, enemy.y - 14, '#f59e0b', 13);

    if (this.audio && typeof this.audio.playScore === 'function') {
      this.audio.playScore();
    }

    // Handle Splitter multiplication
    if (enemy.splitsInto && enemy.splitCount > 0) {
      for (let s = 0; s < enemy.splitCount; s++) {
        const offset = (s - 0.5) * 14;
        this.spawnEnemy(
          enemy.splitsInto,
          enemy.pathIndex,
          enemy.x + offset,
          enemy.y + offset,
          enemy.pathProgress
        );
      }
    }

    if (typeof this.callbacks.onEnemyKilled === 'function') {
      this.callbacks.onEnemyKilled(enemy.bounty, enemy.scoreValue);
    }
  }

  handleEnemyBreach(enemy) {
    enemy.dead = true;
    enemy.reachedBase = true;
    this.fx.triggerShake(enemy.type === 'boss' ? 12 : 6);
    this.fx.addExplosion(enemy.x, enemy.y, '#ef4444', 20, 160, 50);

    if (typeof this.callbacks.onBaseBreached === 'function') {
      this.callbacks.onBaseBreached(enemy.livesTaken || 1);
    }
  }

  update(dt) {
    // 1. Process Spawn Queue
    if (this.isWaveActive && this.waveQueue.length > 0) {
      this.spawnTimer += dt;
      while (this.waveQueue.length > 0 && this.spawnTimer >= this.waveQueue[0].spawnAt) {
        const item = this.waveQueue.shift();
        this.spawnEnemy(item.type, item.pathIndex);
      }
    }

    // 2. Update Active Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (enemy.dead) {
        this.enemies.splice(i, 1);
        continue;
      }

      // Decrement timers
      if (enemy.stunTimer > 0) {
        enemy.stunTimer -= dt;
        continue; // Stunned, cannot move!
      }

      if (enemy.slowTimer > 0) {
        enemy.slowTimer -= dt;
        if (enemy.slowTimer <= 0) enemy.slowFactor = 0;
      }

      // Calculate speed
      const currentSpeed = enemy.baseSpeed * (1 - enemy.slowFactor);
      const pixelPath = this.map.pixelPaths[enemy.pathIndex] || this.map.pixelPaths[0];

      if (enemy.isAirborne) {
        // Airborne flies directly toward the Citadel Core!
        const target = pixelPath[pixelPath.length - 1];
        const dx = target.x - enemy.x;
        const dy = target.y - enemy.y;
        const dist = Math.hypot(dx, dy);
        const step = currentSpeed * dt;

        if (dist <= step || dist < 12) {
          this.handleEnemyBreach(enemy);
          this.enemies.splice(i, 1);
        } else {
          enemy.x += (dx / dist) * step;
          enemy.y += (dy / dist) * step;
          enemy.pathProgress += step;
        }
      } else {
        // Ground path follow
        const currentTargetPt = pixelPath[enemy.currentWaypointIndex + 1];
        if (!currentTargetPt) {
          this.handleEnemyBreach(enemy);
          this.enemies.splice(i, 1);
          continue;
        }

        const dx = currentTargetPt.x - enemy.x;
        const dy = currentTargetPt.y - enemy.y;
        const dist = Math.hypot(dx, dy);
        const step = currentSpeed * dt;

        if (dist <= step) {
          enemy.x = currentTargetPt.x;
          enemy.y = currentTargetPt.y;
          enemy.currentWaypointIndex++;
          enemy.pathProgress += dist;

          if (enemy.currentWaypointIndex >= pixelPath.length - 1) {
            this.handleEnemyBreach(enemy);
            this.enemies.splice(i, 1);
          }
        } else {
          enemy.x += (dx / dist) * step;
          enemy.y += (dy / dist) * step;
          enemy.pathProgress += step;
        }
      }
    }

    // 3. Check Wave Completion
    if (this.isWaveActive && this.waveQueue.length === 0 && this.enemies.length === 0) {
      this.isWaveActive = false;
      if (typeof this.callbacks.onWaveCompleted === 'function') {
        this.callbacks.onWaveCompleted(this.currentWaveNum);
      }

      if (this.currentWaveNum >= this.totalWaves) {
        if (typeof this.callbacks.onAllWavesCleared === 'function') {
          this.callbacks.onAllWavesCleared();
        }
      }
    }
  }

  render(ctx) {
    ctx.save();

    for (const enemy of this.enemies) {
      if (enemy.dead) continue;

      ctx.save();
      ctx.translate(enemy.x, enemy.y);

      // Stun visual
      if (enemy.stunTimer > 0) {
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(0, 0, enemy.size + 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Slow cryogenic aura
      if (enemy.slowTimer > 0) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, enemy.size + 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Main body
      ctx.fillStyle = enemy.color;
      ctx.shadowColor = enemy.glowColor;
      ctx.shadowBlur = enemy.type === 'boss' ? 16 : 8;

      if (enemy.type === 'scout') {
        // Sleek diamond
        ctx.beginPath();
        ctx.moveTo(0, -enemy.size);
        ctx.lineTo(enemy.size * 0.75, 0);
        ctx.lineTo(0, enemy.size);
        ctx.lineTo(-enemy.size * 0.75, 0);
        ctx.closePath();
        ctx.fill();
      } else if (enemy.type === 'tank' || enemy.type === 'boss') {
        // Hexagon / Heavy Armor
        ctx.beginPath();
        for (let a = 0; a < 6; a++) {
          const angle = (a / 6) * Math.PI * 2;
          const px = Math.cos(angle) * enemy.size;
          const py = Math.sin(angle) * enemy.size;
          if (a === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (enemy.isAirborne) {
        // Triangle stealth drone
        ctx.beginPath();
        ctx.moveTo(0, -enemy.size * 1.2);
        ctx.lineTo(enemy.size, enemy.size * 0.8);
        ctx.lineTo(0, enemy.size * 0.3);
        ctx.lineTo(-enemy.size, enemy.size * 0.8);
        ctx.closePath();
        ctx.fill();
      } else {
        // Standard circle
        ctx.beginPath();
        ctx.arc(0, 0, enemy.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Render Health & Shield Bars above unit
      const barW = Math.max(enemy.size * 2, 22);
      const barH = enemy.type === 'boss' ? 5 : 3.5;
      const barY = -enemy.size - 8;

      // HP Background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(-barW / 2, barY, barW, barH);

      // HP Fill
      const hpPct = Math.max(0, enemy.hp / enemy.maxHp);
      ctx.fillStyle = hpPct > 0.5 ? '#10b981' : hpPct > 0.25 ? '#f59e0b' : '#ef4444';
      ctx.fillRect(-barW / 2, barY, barW * hpPct, barH);

      // Shield Bar (if any)
      if (enemy.hasShield && enemy.maxShield > 0) {
        const shieldY = barY - barH - 1;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(-barW / 2, shieldY, barW, barH);
        const shieldPct = Math.max(0, enemy.shield / enemy.maxShield);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(-barW / 2, shieldY, barW * shieldPct, barH);
      }

      ctx.restore();
    }

    ctx.restore();
  }
}
