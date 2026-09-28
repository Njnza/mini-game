/**
 * BulletSystem.js
 * Handles fast sub-stepped ricochet physics, bullet-vs-wall bounce reflection,
 * bullet-vs-tank impact, bullet interception, mortar artillery shells, and EMP proximity mines.
 */

import { MINE_CONFIG } from '../data/weapons.js';

export class BulletSystem {
  constructor(map, fx, audio) {
    this.map = map;
    this.fx = fx;
    this.audio = audio;
    this.bullets = [];
    this.mortarShells = [];
    this.mines = [];
  }

  reset() {
    this.bullets = [];
    this.mortarShells = [];
    this.mines = [];
  }

  // Spawn standard plasma shell
  spawnBullet({ x, y, angle, speed, maxBounces = 1, isPlayer = true, color = '#06b6d4', damage = 1 }) {
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    this.bullets.push({
      x,
      y,
      vx,
      vy,
      radius: 4.5,
      bouncesLeft: maxBounces,
      isPlayer,
      color,
      damage,
      trail: [],
      life: 5.0, // Despawn safety
      justTeleported: 0
    });
    this.fx.createMuzzleFlash(x, y, angle, color);
    this.audio.playShoot(isPlayer);
  }

  // Spawn lobbed mortar shell
  spawnMortar({ startX, startY, targetX, targetY, isPlayer = false, color = '#eab308' }) {
    const flightDuration = 1.35; // seconds
    const dx = targetX - startX;
    const dy = targetY - startY;
    this.mortarShells.push({
      x: startX,
      y: startY,
      startX,
      startY,
      targetX,
      targetY,
      vx: dx / flightDuration,
      vy: dy / flightDuration,
      totalDuration: flightDuration,
      elapsed: 0,
      radius: 6,
      isPlayer,
      color
    });
    this.audio.playShoot(false);
  }

  // Deploy proximity mine
  deployMine({ x, y, isPlayer = true }) {
    this.mines.push({
      x,
      y,
      isPlayer,
      armTimer: MINE_CONFIG.armDelay,
      isArmed: false,
      fuseTimer: MINE_CONFIG.fuseTime,
      radius: 12,
      triggerRadius: MINE_CONFIG.triggerRadius,
      pulseAngle: 0
    });
    this.audio.playMineArm();
  }

  update(dt, player, enemies, onTankHit, onExplosion) {
    // ==========================================
    // 1. UPDATE MINES
    // ==========================================
    for (let i = this.mines.length - 1; i >= 0; i--) {
      const mine = this.mines[i];
      mine.pulseAngle += dt * 5;

      if (!mine.isArmed) {
        mine.armTimer -= dt;
        if (mine.armTimer <= 0) {
          mine.isArmed = true;
        }
      } else {
        mine.fuseTimer -= dt;
        // Trigger condition: enemy stepped near or fuse ran out
        let triggered = mine.fuseTimer <= 0;

        if (!triggered) {
          const targets = mine.isPlayer ? enemies : [player];
          for (const target of targets) {
            if (!target.dead) {
              const dist = Math.hypot(target.x - mine.x, target.y - mine.y);
              if (dist <= mine.triggerRadius + target.radius) {
                triggered = true;
                break;
              }
            }
          }
        }

        if (triggered) {
          this.mines.splice(i, 1);
          this.detonateMine(mine, player, enemies, onTankHit, onExplosion);
        }
      }
    }

    // ==========================================
    // 2. UPDATE MORTAR SHELLS
    // ==========================================
    for (let i = this.mortarShells.length - 1; i >= 0; i--) {
      const shell = this.mortarShells[i];
      shell.elapsed += dt;
      shell.x += shell.vx * dt;
      shell.y += shell.vy * dt;

      if (shell.elapsed >= shell.totalDuration) {
        // Shell landed!
        this.mortarShells.splice(i, 1);
        this.fx.createExplosion(shell.targetX, shell.targetY, true, '#eab308');
        this.audio.playExplosion(true);
        if (typeof onExplosion === 'function') {
          onExplosion(shell.targetX, shell.targetY, 65, 2);
        }
      }
    }

    // ==========================================
    // 3. UPDATE RICOCHET BULLETS (Sub-stepped)
    // ==========================================
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.life -= dt;
      if (b.justTeleported > 0) b.justTeleported -= dt;

      if (b.life <= 0) {
        this.bullets.splice(i, 1);
        continue;
      }

      // Add to visual trail
      b.trail.push({ x: b.x, y: b.y });
      if (b.trail.length > 5) b.trail.shift();

      // Sub-step movement: move at most 8px per sub-step for bullet tunneling safety
      const fullStepX = b.vx * dt;
      const fullStepY = b.vy * dt;
      const dist = Math.hypot(fullStepX, fullStepY);
      const subSteps = Math.max(1, Math.ceil(dist / 8));
      const stepX = fullStepX / subSteps;
      const stepY = fullStepY / subSteps;

      let bulletDestroyed = false;

      for (let s = 0; s < subSteps; s++) {
        b.x += stepX;
        b.y += stepY;

        // Check teleporter warp
        if (b.justTeleported <= 0) {
          const warp = this.map.checkTeleport(b.x, b.y);
          if (warp) {
            b.x = warp.targetX;
            b.y = warp.targetY;
            b.justTeleported = 0.5;
            this.fx.createEmpPulse(b.x, b.y, 30);
          }
        }

        // Check Wall Collision & Ricochet Reflection
        const col = Math.floor(b.x / this.map.tileSize);
        const row = Math.floor(b.y / this.map.tileSize);

        if (this.map.isSolid(col, row, true)) {
          // If hit destructible block or barrel
          const tileType = this.map.grid[row] ? this.map.grid[row][col] : 1;
          if (tileType === 2 || tileType === 3) {
            this.map.damageTile(col, row, 1, onExplosion);
            bulletDestroyed = true;
            this.bullets.splice(i, 1);
            break;
          }

          // Otherwise solid wall: calculate reflection normal
          const tileLeft = col * this.map.tileSize;
          const tileRight = tileLeft + this.map.tileSize;
          const tileTop = row * this.map.tileSize;
          const tileBottom = tileTop + this.map.tileSize;

          const distLeft = Math.abs(b.x - tileLeft);
          const distRight = Math.abs(b.x - tileRight);
          const distTop = Math.abs(b.y - tileTop);
          const distBottom = Math.abs(b.y - tileBottom);
          const minDist = Math.min(distLeft, distRight, distTop, distBottom);

          let nx = 0, ny = 0;
          if (minDist === distLeft) nx = -1;
          else if (minDist === distRight) nx = 1;
          else if (minDist === distTop) ny = -1;
          else ny = 1;

          if (b.bouncesLeft > 0) {
            b.bouncesLeft--;
            // Velocity reflection: v' = v - 2(v·n)n
            const dot = b.vx * nx + b.vy * ny;
            b.vx = b.vx - 2 * dot * nx;
            b.vy = b.vy - 2 * dot * ny;

            // Push bullet slightly out of wall
            b.x += nx * 4;
            b.y += ny * 4;

            this.fx.createRicochetSparks(b.x, b.y, nx, ny, b.color);
            this.audio.playRicochet();
          } else {
            // Out of bounces: fizzle out
            this.fx.createRicochetSparks(b.x, b.y, nx, ny, b.color);
            bulletDestroyed = true;
            this.bullets.splice(i, 1);
            break;
          }
        }

        // Check collision against tanks
        const targets = b.isPlayer ? enemies : [player];
        for (const target of targets) {
          if (!target.dead) {
            const distSq = (target.x - b.x) ** 2 + (target.y - b.y) ** 2;
            const hitRadius = target.radius + b.radius;
            if (distSq <= hitRadius * hitRadius) {
              bulletDestroyed = true;
              this.bullets.splice(i, 1);
              if (typeof onTankHit === 'function') {
                onTankHit(target, b.damage, b.isPlayer);
              }
              break;
            }
          }
        }
        if (bulletDestroyed) break;

        // Check collision against active mines (shoot mine to detonate early)
        for (let m = this.mines.length - 1; m >= 0; m--) {
          const mine = this.mines[m];
          const distSq = (mine.x - b.x) ** 2 + (mine.y - b.y) ** 2;
          if (distSq <= (mine.radius + b.radius) ** 2) {
            bulletDestroyed = true;
            this.bullets.splice(i, 1);
            this.mines.splice(m, 1);
            this.detonateMine(mine, player, enemies, onTankHit, onExplosion);
            break;
          }
        }
        if (bulletDestroyed) break;
      }

      if (bulletDestroyed) continue;

      // Bullet vs Bullet interception (opposing bullets destroy each other)
      for (let j = i - 1; j >= 0; j--) {
        const other = this.bullets[j];
        if (b.isPlayer !== other.isPlayer) {
          const distSq = (b.x - other.x) ** 2 + (b.y - other.y) ** 2;
          if (distSq <= (b.radius + other.radius + 3) ** 2) {
            this.fx.createRicochetSparks((b.x + other.x) / 2, (b.y + other.y) / 2, 0, 1, '#facc15');
            this.fx.addFloatingText('INTERCEPT!', (b.x + other.x) / 2, (b.y + other.y) / 2 - 10, '#facc15', 0.9);
            this.audio.playRicochet();
            this.bullets.splice(i, 1);
            this.bullets.splice(j, 1);
            break;
          }
        }
      }
    }
  }

  detonateMine(mine, player, enemies, onTankHit, onExplosion) {
    this.fx.createExplosion(mine.x, mine.y, true, '#a855f7');
    this.fx.createEmpPulse(mine.x, mine.y, MINE_CONFIG.blastRadius);
    this.audio.playExplosion(true);

    if (typeof onExplosion === 'function') {
      onExplosion(mine.x, mine.y, MINE_CONFIG.blastRadius, MINE_CONFIG.damage);
    }

    // Damage and stun units within blast radius
    const allUnits = [player, ...enemies];
    for (const unit of allUnits) {
      if (!unit.dead) {
        const dist = Math.hypot(unit.x - mine.x, unit.y - mine.y);
        if (dist <= MINE_CONFIG.blastRadius + unit.radius) {
          if (typeof onTankHit === 'function') {
            onTankHit(unit, MINE_CONFIG.damage, mine.isPlayer);
          }
          if (unit !== player) {
            unit.empTimer = 3.5; // Stun enemy for 3.5s
          }
        }
      }
    }
  }

  render(ctx) {
    // 1. Render Mines
    for (let i = 0; i < this.mines.length; i++) {
      const mine = this.mines[i];
      ctx.save();
      ctx.translate(mine.x, mine.y);

      // Warning pulse radius
      const pulseSize = 14 + Math.sin(mine.pulseAngle) * 3;
      ctx.beginPath();
      ctx.arc(0, 0, pulseSize, 0, Math.PI * 2);
      ctx.strokeStyle = mine.isArmed ? '#a855f7' : '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Core
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fillStyle = mine.isArmed ? '#7e22ce' : '#b45309';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // 2. Render Mortar Shells (with shadow and altitude arc)
    for (let i = 0; i < this.mortarShells.length; i++) {
      const shell = this.mortarShells[i];
      const progress = shell.elapsed / shell.totalDuration;
      // Parabolic altitude arc: peak height 60px
      const altitude = Math.sin(progress * Math.PI) * 60;

      ctx.save();
      // Ground shadow
      ctx.beginPath();
      ctx.arc(shell.x, shell.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fill();

      // Shadow target landing marker
      ctx.beginPath();
      ctx.arc(shell.targetX, shell.targetY, 18 * (1 - progress), 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Flying shell
      ctx.beginPath();
      ctx.arc(shell.x, shell.y - altitude, shell.radius, 0, Math.PI * 2);
      ctx.fillStyle = shell.color;
      ctx.shadowColor = shell.color;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.restore();
    }

    // 3. Render Ricochet Bullets & Light Trails
    for (let i = 0; i < this.bullets.length; i++) {
      const b = this.bullets[i];
      ctx.save();

      // Neon trail line
      if (b.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(b.trail[0].x, b.trail[0].y);
        for (let t = 1; t < b.trail.length; t++) {
          ctx.lineTo(b.trail[t].x, b.trail[t].y);
        }
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = b.color;
        ctx.lineWidth = b.radius * 0.9;
        ctx.globalAlpha = 0.4;
        ctx.stroke();
      }

      // Bullet glowing plasma core
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 12;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius + 1.5, 0, Math.PI * 2);
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }
  }
}
