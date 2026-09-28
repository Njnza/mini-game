/**
 * EnemyAI.js
 * Comprehensive behavior tree & state machine for all 8 enemy tank classes,
 * line-of-sight raycasting, bullet dodging reflexes, and 3-phase Apex Titan boss mechanics.
 */

import { TANK_TYPES } from '../data/weapons.js';

export class EnemyAI {
  constructor(map, bulletSystem, fx, audio) {
    this.map = map;
    this.bullets = bulletSystem;
    this.fx = fx;
    this.audio = audio;
    this.enemies = [];
    this.bossPhase = 1;
    this.bossShieldAngle = 0;
  }

  reset() {
    this.enemies = [];
    this.bossPhase = 1;
    this.bossShieldAngle = 0;
  }

  spawnEnemies(levelEnemies) {
    this.enemies = [];
    this.bossPhase = 1;

    for (const def of levelEnemies) {
      const spec = TANK_TYPES[def.type] || TANK_TYPES.scout;
      const x = (def.col + 0.5) * this.map.tileSize;
      const y = (def.row + 0.5) * this.map.tileSize;

      this.enemies.push({
        type: def.type,
        name: spec.name,
        x,
        y,
        vx: 0,
        vy: 0,
        hullAngle: def.angle || 0,
        turretAngle: def.angle || 0,
        targetAngle: def.angle || 0,
        speed: spec.speed,
        turnSpeed: spec.turnSpeed,
        radius: spec.radius,
        hp: spec.maxHp,
        maxHp: spec.maxHp,
        color: spec.color,
        turretColor: spec.turretColor,
        glowColor: spec.glowColor,
        score: spec.score,
        fireCooldown: spec.fireCooldown,
        fireTimer: Math.random() * spec.fireCooldown,
        bulletSpeed: spec.bulletSpeed || 300,
        maxBounces: spec.maxBounces || 1,
        dead: false,
        empTimer: 0,
        // Class specific traits
        hasLaserSight: !!spec.hasLaserSight,
        isMortar: !!spec.isMortar,
        canCloak: !!spec.canCloak,
        laysMines: !!spec.laysMines,
        hasShield: !!spec.hasShield,
        shieldHp: spec.hasShield ? 2 : 0,
        mineTimer: 4.0 + Math.random() * 3.0,
        // AI states
        moveTimer: 0,
        moveDir: { x: 0, y: 0 },
        sniperAimTime: 0,
        cloaked: !!spec.canCloak,
        trackTimer: 0
      });
    }
  }

  update(dt, player) {
    this.bossShieldAngle += dt * 2.5;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.dead) continue;

      // EMP Stun check
      if (e.empTimer > 0) {
        e.empTimer -= dt;
        if (Math.random() < 0.2) {
          this.fx.particles.push({
            x: e.x + (Math.random() - 0.5) * e.radius * 2,
            y: e.y + (Math.random() - 0.5) * e.radius * 2,
            vx: (Math.random() - 0.5) * 30,
            vy: (Math.random() - 0.5) * 30,
            size: 2,
            color: '#c084fc',
            life: 0.5,
            decay: 3.0
          });
        }
        continue; // Cannot move or shoot while stunned
      }

      // Check laser damage
      if (this.map.laserActive) {
        const col = Math.floor(e.x / this.map.tileSize);
        const row = Math.floor(e.y / this.map.tileSize);
        if (this.map.grid[row] && this.map.grid[row][col] === 4) {
          e.hp -= 2 * dt;
          if (e.hp <= 0) {
            this.killEnemy(e, player);
            continue;
          }
        }
      }

      // Track tread marks
      e.trackTimer += dt;
      if (e.trackTimer >= 0.12 && (Math.abs(e.vx) > 5 || Math.abs(e.vy) > 5)) {
        e.trackTimer = 0;
        this.fx.addTreadMark(e.x, e.y, e.hullAngle, 'rgba(255, 255, 255, 0.08)');
      }

      // Route AI behavior by class
      switch (e.type) {
        case 'scout':
          this.updateScoutAI(e, dt, player);
          break;
        case 'striker':
          this.updateStrikerAI(e, dt, player);
          break;
        case 'pyro':
          this.updatePyroAI(e, dt, player);
          break;
        case 'sniper':
          this.updateSniperAI(e, dt, player);
          break;
        case 'mortar':
          this.updateMortarAI(e, dt, player);
          break;
        case 'stealth':
          this.updateStealthAI(e, dt, player);
          break;
        case 'commander':
          this.updateCommanderAI(e, dt, player);
          break;
        case 'boss':
          this.updateBossAI(e, dt, player);
          break;
        default:
          this.updateStrikerAI(e, dt, player);
      }

      // Resolve collision against walls & arena bounds
      this.map.resolveTankCollision(e);

      // Separate from other tanks
      for (let j = i - 1; j >= 0; j--) {
        const other = this.enemies[j];
        if (!other.dead) {
          const dx = e.x - other.x;
          const dy = e.y - other.y;
          const dist = Math.hypot(dx, dy);
          const minDist = e.radius + other.radius;
          if (dist < minDist && dist > 0) {
            const overlap = (minDist - dist) * 0.5;
            e.x += (dx / dist) * overlap;
            e.y += (dy / dist) * overlap;
            other.x -= (dx / dist) * overlap;
            other.y -= (dy / dist) * overlap;
          }
        }
      }
    }
  }

  // SCOUT AI: Stationary or slow pivot turret, shoots when player enters line of sight
  updateScoutAI(e, dt, player) {
    if (player.dead) return;
    const angleToPlayer = Math.atan2(player.y - e.y, player.x - e.x);
    e.turretAngle = this.rotateTowards(e.turretAngle, angleToPlayer, e.turnSpeed * dt);

    e.fireTimer += dt;
    if (e.fireTimer >= e.fireCooldown) {
      if (this.hasLineOfSight(e.x, e.y, player.x, player.y)) {
        e.fireTimer = 0;
        this.bullets.spawnBullet({
          x: e.x + Math.cos(e.turretAngle) * (e.radius + 6),
          y: e.y + Math.sin(e.turretAngle) * (e.radius + 6),
          angle: e.turretAngle,
          speed: e.bulletSpeed,
          maxBounces: e.maxBounces,
          isPlayer: false,
          color: e.color
        });
      }
    }
  }

  // STRIKER AI: Wanders in unpredictable directions, dodges incoming bullets, aims & fires bouncing shots
  updateStrikerAI(e, dt, player) {
    if (player.dead) return;

    // Movement state
    e.moveTimer -= dt;
    if (e.moveTimer <= 0) {
      e.moveTimer = 1.5 + Math.random() * 2.0;
      const angle = Math.random() * Math.PI * 2;
      e.moveDir = { x: Math.cos(angle), y: Math.sin(angle) };
      e.hullAngle = angle;
    }

    // Bullet dodging reflex: check if any player bullet is heading near
    for (const b of this.bullets.bullets) {
      if (b.isPlayer) {
        const dist = Math.hypot(b.x - e.x, b.y - e.y);
        if (dist < 120) {
          // Dodge perpendicular to bullet velocity
          const bAngle = Math.atan2(b.vy, b.vx);
          const dodgeAngle = bAngle + Math.PI / 2;
          e.moveDir = { x: Math.cos(dodgeAngle), y: Math.sin(dodgeAngle) };
          e.hullAngle = dodgeAngle;
          break;
        }
      }
    }

    e.vx = e.moveDir.x * e.speed;
    e.vy = e.moveDir.y * e.speed;
    e.x += e.vx * dt;
    e.y += e.vy * dt;

    // Turret aiming
    const angleToPlayer = Math.atan2(player.y - e.y, player.x - e.x);
    e.turretAngle = this.rotateTowards(e.turretAngle, angleToPlayer, e.turnSpeed * dt);

    e.fireTimer += dt;
    if (e.fireTimer >= e.fireCooldown) {
      if (this.hasLineOfSight(e.x, e.y, player.x, player.y)) {
        e.fireTimer = 0;
        this.bullets.spawnBullet({
          x: e.x + Math.cos(e.turretAngle) * (e.radius + 6),
          y: e.y + Math.sin(e.turretAngle) * (e.radius + 6),
          angle: e.turretAngle,
          speed: e.bulletSpeed,
          maxBounces: e.maxBounces,
          isPlayer: false,
          color: e.color
        });
      }
    }
  }

  // PYRO AI: Aggressively charges player, fires twin rapid-fire shells
  updatePyroAI(e, dt, player) {
    if (player.dead) return;

    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.hypot(dx, dy);
    const targetAngle = Math.atan2(dy, dx);

    e.hullAngle = this.rotateTowards(e.hullAngle, targetAngle, e.turnSpeed * dt);
    e.turretAngle = e.hullAngle;

    // Move forward
    e.vx = Math.cos(e.hullAngle) * e.speed;
    e.vy = Math.sin(e.hullAngle) * e.speed;
    e.x += e.vx * dt;
    e.y += e.vy * dt;

    e.fireTimer += dt;
    if (e.fireTimer >= e.fireCooldown && dist < 320) {
      if (this.hasLineOfSight(e.x, e.y, player.x, player.y)) {
        e.fireTimer = 0;
        // Twin burst fire
        [-0.1, 0.1].forEach(offset => {
          this.bullets.spawnBullet({
            x: e.x + Math.cos(e.turretAngle + offset) * (e.radius + 6),
            y: e.y + Math.sin(e.turretAngle + offset) * (e.radius + 6),
            angle: e.turretAngle + offset,
            speed: e.bulletSpeed,
            maxBounces: 1,
            isPlayer: false,
            color: e.color
          });
        });
      }
    }
  }

  // SNIPER AI: Maintains long range, paints laser line, fires high-speed 2-bounce sniper shot
  updateSniperAI(e, dt, player) {
    if (player.dead) return;

    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.hypot(dx, dy);
    const angleToPlayer = Math.atan2(dy, dx);

    // Keep distance if player gets too close
    if (dist < 200) {
      e.vx = -Math.cos(angleToPlayer) * e.speed;
      e.vy = -Math.sin(angleToPlayer) * e.speed;
      e.hullAngle = angleToPlayer + Math.PI;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
    }

    e.turretAngle = this.rotateTowards(e.turretAngle, angleToPlayer, e.turnSpeed * dt);

    const hasLOS = this.hasLineOfSight(e.x, e.y, player.x, player.y);
    if (hasLOS) {
      e.sniperAimTime += dt;
      if (e.sniperAimTime >= 1.2 && e.fireTimer >= e.fireCooldown) {
        e.sniperAimTime = 0;
        e.fireTimer = 0;
        this.bullets.spawnBullet({
          x: e.x + Math.cos(e.turretAngle) * (e.radius + 8),
          y: e.y + Math.sin(e.turretAngle) * (e.radius + 8),
          angle: e.turretAngle,
          speed: e.bulletSpeed,
          maxBounces: 2,
          isPlayer: false,
          color: '#c084fc',
          damage: 1
        });
        this.audio.playRailgun();
      }
    } else {
      e.sniperAimTime = Math.max(0, e.sniperAimTime - dt * 2);
      e.fireTimer += dt;
    }
  }

  // MORTAR AI: Artillery tank, stays behind cover, periodically launches mortar shell
  updateMortarAI(e, dt, player) {
    if (player.dead) return;

    e.fireTimer += dt;
    const angleToPlayer = Math.atan2(player.y - e.y, player.x - e.x);
    e.turretAngle = this.rotateTowards(e.turretAngle, angleToPlayer, e.turnSpeed * dt);

    if (e.fireTimer >= e.fireCooldown) {
      e.fireTimer = 0;
      // Target player position with slight spread
      const targetX = player.x + (Math.random() - 0.5) * 40;
      const targetY = player.y + (Math.random() - 0.5) * 40;
      this.bullets.spawnMortar({
        startX: e.x,
        startY: e.y,
        targetX,
        targetY,
        isPlayer: false,
        color: '#eab308'
      });
    }
  }

  // STEALTH AI: Cloaked, leaves proximity mines, uncloaks on firing
  updateStealthAI(e, dt, player) {
    if (player.dead) return;

    // Wander
    e.moveTimer -= dt;
    if (e.moveTimer <= 0) {
      e.moveTimer = 2.0 + Math.random() * 2.0;
      const angle = Math.random() * Math.PI * 2;
      e.moveDir = { x: Math.cos(angle), y: Math.sin(angle) };
      e.hullAngle = angle;
    }
    e.vx = e.moveDir.x * e.speed;
    e.vy = e.moveDir.y * e.speed;
    e.x += e.vx * dt;
    e.y += e.vy * dt;

    // Lay mines
    e.mineTimer -= dt;
    if (e.mineTimer <= 0) {
      e.mineTimer = 6.0 + Math.random() * 4.0;
      this.bullets.deployMine({ x: e.x, y: e.y, isPlayer: false });
    }

    // Aim & fire
    const angleToPlayer = Math.atan2(player.y - e.y, player.x - e.x);
    e.turretAngle = this.rotateTowards(e.turretAngle, angleToPlayer, e.turnSpeed * dt);

    e.fireTimer += dt;
    if (e.fireTimer >= e.fireCooldown) {
      if (this.hasLineOfSight(e.x, e.y, player.x, player.y)) {
        e.fireTimer = 0;
        e.cloaked = false;
        setTimeout(() => { e.cloaked = true; }, 1200);
        this.bullets.spawnBullet({
          x: e.x + Math.cos(e.turretAngle) * (e.radius + 6),
          y: e.y + Math.sin(e.turretAngle) * (e.radius + 6),
          angle: e.turretAngle,
          speed: e.bulletSpeed,
          maxBounces: 1,
          isPlayer: false,
          color: '#94a3b8'
        });
      }
    }
  }

  // COMMANDER AI: Heavy boss unit with shield
  updateCommanderAI(e, dt, player) {
    if (player.dead) return;

    const angleToPlayer = Math.atan2(player.y - e.y, player.x - e.x);
    e.hullAngle = this.rotateTowards(e.hullAngle, angleToPlayer, e.turnSpeed * dt);
    e.turretAngle = e.hullAngle;

    // Slow advance
    e.vx = Math.cos(e.hullAngle) * e.speed;
    e.vy = Math.sin(e.hullAngle) * e.speed;
    e.x += e.vx * dt;
    e.y += e.vy * dt;

    e.fireTimer += dt;
    if (e.fireTimer >= e.fireCooldown) {
      e.fireTimer = 0;
      // Twin cannon blast
      [-0.15, 0.15].forEach(offset => {
        this.bullets.spawnBullet({
          x: e.x + Math.cos(e.turretAngle + offset) * (e.radius + 8),
          y: e.y + Math.sin(e.turretAngle + offset) * (e.radius + 8),
          angle: e.turretAngle + offset,
          speed: e.bulletSpeed,
          maxBounces: 2,
          isPlayer: false,
          color: e.color
        });
      });
    }
  }

  // APEX TITAN BOSS AI: 3 Epic Phases
  updateBossAI(e, dt, player) {
    if (player.dead) return;

    const hpRatio = e.hp / e.maxHp;
    if (hpRatio > 0.66) {
      this.bossPhase = 1;
    } else if (hpRatio > 0.33) {
      if (this.bossPhase === 1) {
        this.bossPhase = 2;
        this.audio.playBossAlarm();
        this.fx.addFloatingText('PHASE 2: MISSILE BARRAGE!', e.x, e.y - 45, '#ef4444', 1.3);
      }
    } else {
      if (this.bossPhase !== 3) {
        this.bossPhase = 3;
        this.audio.playBossAlarm();
        this.fx.addFloatingText('PHASE 3: OVERDRIVE ENRAGE!', e.x, e.y - 45, '#ef4444', 1.5);
      }
    }

    const angleToPlayer = Math.atan2(player.y - e.y, player.x - e.x);
    const turnMult = this.bossPhase === 3 ? 1.8 : 1.0;
    e.hullAngle = this.rotateTowards(e.hullAngle, angleToPlayer, e.turnSpeed * turnMult * dt);
    e.turretAngle = e.hullAngle;

    // Movement
    const speedMult = this.bossPhase === 3 ? 1.5 : 1.0;
    e.vx = Math.cos(e.hullAngle) * e.speed * speedMult;
    e.vy = Math.sin(e.hullAngle) * e.speed * speedMult;
    e.x += e.vx * dt;
    e.y += e.vy * dt;

    e.fireTimer += dt;

    // Attack pattern based on phase
    if (this.bossPhase === 1) {
      // Quad Gatling burst
      if (e.fireTimer >= e.fireCooldown) {
        e.fireTimer = 0;
        [-0.2, -0.07, 0.07, 0.2].forEach(offset => {
          this.bullets.spawnBullet({
            x: e.x + Math.cos(e.turretAngle + offset) * (e.radius + 12),
            y: e.y + Math.sin(e.turretAngle + offset) * (e.radius + 12),
            angle: e.turretAngle + offset,
            speed: e.bulletSpeed,
            maxBounces: 1,
            isPlayer: false,
            color: '#ef4444'
          });
        });
      }
    } else if (this.bossPhase === 2) {
      // Missile Salvo + Gatling
      if (e.fireTimer >= e.fireCooldown) {
        e.fireTimer = 0;
        // 2 Mortar missiles
        for (let m = 0; m < 2; m++) {
          const tX = player.x + (Math.random() - 0.5) * 80;
          const tY = player.y + (Math.random() - 0.5) * 80;
          this.bullets.spawnMortar({
            startX: e.x,
            startY: e.y,
            targetX: tX,
            targetY: tY,
            isPlayer: false,
            color: '#f97316'
          });
        }
        // Direct shots
        [-0.15, 0.15].forEach(offset => {
          this.bullets.spawnBullet({
            x: e.x + Math.cos(e.turretAngle + offset) * (e.radius + 12),
            y: e.y + Math.sin(e.turretAngle + offset) * (e.radius + 12),
            angle: e.turretAngle + offset,
            speed: e.bulletSpeed,
            maxBounces: 2,
            isPlayer: false,
            color: '#ef4444'
          });
        });
      }
    } else {
      // Phase 3: Rapid Enrage Barrage
      if (e.fireTimer >= 0.35) {
        e.fireTimer = 0;
        const spread = (Math.random() - 0.5) * 0.4;
        this.bullets.spawnBullet({
          x: e.x + Math.cos(e.turretAngle + spread) * (e.radius + 12),
          y: e.y + Math.sin(e.turretAngle + spread) * (e.radius + 12),
          angle: e.turretAngle + spread,
          speed: e.bulletSpeed * 1.2,
          maxBounces: 2,
          isPlayer: false,
          color: '#ef4444'
        });
      }
    }
  }

  // Smooth angular rotation helper
  rotateTowards(current, target, maxStep) {
    let diff = target - current;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    if (Math.abs(diff) <= maxStep) return target;
    return current + Math.sign(diff) * maxStep;
  }

  // Raycast line of sight check between two points
  hasLineOfSight(x1, y1, x2, y2) {
    const ray = this.map.raycast(x1, y1, x2 - x1, y2 - y1, Math.hypot(x2 - x1, y2 - y1));
    return !ray.hit;
  }

  killEnemy(e, player) {
    e.dead = true;
    this.fx.createExplosion(e.x, e.y, e.type === 'boss' || e.type === 'commander', e.color);
    this.audio.playExplosion(e.type === 'boss' || e.type === 'commander');
    this.fx.addFloatingText(`+${e.score}`, e.x, e.y - 20, '#facc15', 1.2);
  }

  render(ctx) {
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.dead) continue;

      ctx.save();
      ctx.translate(e.x, e.y);

      // Cloak transparency for stealth tank
      if (e.canCloak && e.cloaked) {
        ctx.globalAlpha = 0.22;
      }

      // Sniper aiming laser sight line
      if (e.hasLaserSight && e.sniperAimTime > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        const aimDist = 600;
        ctx.lineTo(Math.cos(e.turretAngle) * aimDist, Math.sin(e.turretAngle) * aimDist);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 6;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.restore();
      }

      // 1. Tank Hull & Treads
      ctx.save();
      ctx.rotate(e.hullAngle);

      // Left & Right Treads
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-e.radius, -e.radius, e.radius * 2, e.radius * 0.45);
      ctx.fillRect(-e.radius, e.radius * 0.55, e.radius * 2, e.radius * 0.45);

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.strokeRect(-e.radius, -e.radius, e.radius * 2, e.radius * 0.45);
      ctx.strokeRect(-e.radius, e.radius * 0.55, e.radius * 2, e.radius * 0.45);

      // Tank Body Core
      ctx.beginPath();
      ctx.roundRect(-e.radius * 0.8, -e.radius * 0.65, e.radius * 1.6, e.radius * 1.3, 4);
      ctx.fillStyle = e.color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // 2. Rotating Turret & Cannon
      ctx.save();
      ctx.rotate(e.turretAngle);

      // Cannon Barrel
      const barrelLen = e.radius * 1.4;
      const barrelWidth = e.type === 'boss' ? 7 : (e.type === 'mortar' ? 6 : 4);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, -barrelWidth / 2, barrelLen, barrelWidth);
      ctx.strokeStyle = e.turretColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(0, -barrelWidth / 2, barrelLen, barrelWidth);

      // Turret Dome
      ctx.beginPath();
      ctx.arc(0, 0, e.radius * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = e.turretColor;
      ctx.shadowColor = e.color;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // 3. Orbiting Shields for Commander and Boss
      if (e.type === 'boss' || (e.type === 'commander' && e.shieldHp > 0)) {
        ctx.save();
        const shieldCount = e.type === 'boss' ? (this.bossPhase === 1 ? 3 : 2) : 2;
        const orbitDist = e.radius + 14;
        for (let s = 0; s < shieldCount; s++) {
          const sAngle = this.bossShieldAngle + (s * (Math.PI * 2 / shieldCount));
          const sx = Math.cos(sAngle) * orbitDist;
          const sy = Math.sin(sAngle) * orbitDist;

          ctx.beginPath();
          ctx.arc(sx, sy, 7, 0, Math.PI * 2);
          ctx.fillStyle = '#38bdf8';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 10;
          ctx.fill();
        }
        ctx.restore();
      }

      // 4. Stun Arc effect
      if (e.empTimer > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, e.radius + 4, 0, Math.PI * 2);
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.restore();
      }

      // 5. Overhead Health Bar (for multi-HP units)
      if (e.maxHp > 1) {
        const barW = e.radius * 2;
        const barH = 4;
        const barY = -e.radius - 10;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(-barW / 2, barY, barW, barH);

        const hpWidth = Math.max(0, (e.hp / e.maxHp) * barW);
        ctx.fillStyle = e.hp > e.maxHp * 0.4 ? '#10b981' : '#ef4444';
        ctx.fillRect(-barW / 2, barY, hpWidth, barH);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(-barW / 2, barY, barW, barH);
      }

      ctx.restore();
    }
  }
}
