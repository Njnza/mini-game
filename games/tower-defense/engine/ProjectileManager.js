/**
 * ProjectileManager.js
 * Physics, homing projectiles, beam rendering, splash damage, and collision triggers.
 */

export class ProjectileManager {
  constructor(fxManager, audioManager) {
    this.fx = fxManager;
    this.audio = audioManager;
    this.projectiles = [];
    this.beams = []; // Instant or continuous optical beams
  }

  reset() {
    this.projectiles = [];
    this.beams = [];
  }

  /**
   * Spawn standard ballistic or homing projectile
   */
  spawnProjectile({
    type,
    x,
    y,
    target,
    targetX,
    targetY,
    damage,
    speed,
    color,
    splashRadius = 0,
    slowFactor = 0,
    slowDuration = 0,
    stunDuration = 0,
    isHoming = true,
    shatterDmg = 0,
    bomblets = 0,
    antiAir = false
  }) {
    this.projectiles.push({
      type,
      x,
      y,
      prevX: x,
      prevY: y,
      target, // Reference to enemy instance
      targetX: target ? target.x : (targetX || x),
      targetY: target ? target.y : (targetY || y),
      damage,
      speed,
      color,
      splashRadius,
      slowFactor,
      slowDuration,
      stunDuration,
      isHoming,
      shatterDmg,
      bomblets,
      antiAir,
      life: 0,
      maxLife: 4.0
    });
  }

  /**
   * Fire instant piercing beam (e.g. Railgun)
   */
  firePiercingBeam(sourceX, sourceY, targetX, targetY, damage, pierce = 6, enemies = [], color = '#06b6d4') {
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const len = Math.hypot(dx, dy) || 1;
    const dirX = dx / len;
    const dirY = dy / len;

    const beamLength = 800; // Across battlefield
    const endX = sourceX + dirX * beamLength;
    const endY = sourceY + dirY * beamLength;

    // Register visual beam
    this.beams.push({
      type: 'railgun',
      x1: sourceX,
      y1: sourceY,
      x2: endX,
      y2: endY,
      color,
      width: 4.5,
      alpha: 1.0,
      life: 0.2,
      maxLife: 0.2
    });

    // Raycast hit against enemies within line segment distance
    let piercedCount = 0;
    for (const enemy of enemies) {
      if (enemy.dead) continue;
      // Distance from enemy point to line segment
      const dist = this.distPointToSegment(enemy.x, enemy.y, sourceX, sourceY, endX, endY);
      if (dist <= enemy.size + 14) {
        enemy.takeDamage(damage, 'pierce');
        this.fx.addLaserImpact(enemy.x, enemy.y, color);
        piercedCount++;
        if (piercedCount >= pierce) break;
      }
    }
  }

  /**
   * Register continuous laser beam for this frame
   */
  addContinuousLaser(sourceX, sourceY, targetX, targetY, color = '#a855f7', width = 3) {
    this.beams.push({
      type: 'laser',
      x1: sourceX,
      y1: sourceY,
      x2: targetX,
      y2: targetY,
      color,
      width,
      alpha: 0.9,
      life: 0.05,
      maxLife: 0.05
    });
  }

  distPointToSegment(px, py, x1, y1, x2, y2) {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }

  update(dt, enemies = []) {
    // 1. Update Beams
    for (let i = this.beams.length - 1; i >= 0; i--) {
      const beam = this.beams[i];
      beam.life -= dt;
      if (beam.life <= 0) {
        this.beams.splice(i, 1);
        continue;
      }
      beam.alpha = Math.max(0, beam.life / beam.maxLife);
    }

    // 2. Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life += dt;

      if (p.life > p.maxLife) {
        this.projectiles.splice(i, 1);
        continue;
      }

      p.prevX = p.x;
      p.prevY = p.y;

      // Update homing target position if target still alive
      if (p.isHoming && p.target && !p.target.dead) {
        p.targetX = p.target.x;
        p.targetY = p.target.y;
      }

      const dx = p.targetX - p.x;
      const dy = p.targetY - p.y;
      const dist = Math.hypot(dx, dy);

      const moveStep = p.speed * dt;

      if (dist <= moveStep || dist < 8) {
        // Hit reached!
        this.handleHit(p, enemies);
        this.projectiles.splice(i, 1);
      } else {
        p.x += (dx / dist) * moveStep;
        p.y += (dy / dist) * moveStep;
      }
    }
  }

  handleHit(p, enemies) {
    if (p.splashRadius > 0) {
      // Area of Effect Blast
      this.fx.addExplosion(p.x, p.y, p.color, p.type === 'mega_shell' ? 24 : 14, 150, p.splashRadius);
      this.fx.triggerShake(p.type === 'mega_shell' ? 7 : 3);

      for (const enemy of enemies) {
        if (enemy.dead) continue;
        if (enemy.isAirborne && !p.antiAir) continue;

        const d = Math.hypot(enemy.x - p.x, enemy.y - p.y);
        if (d <= p.splashRadius) {
          // Splash falloff: minimum 50% damage at edge
          const falloff = 1 - (d / p.splashRadius) * 0.5;
          const dmg = Math.round(p.damage * falloff);
          enemy.takeDamage(dmg, p.type);

          if (p.slowFactor > 0) {
            enemy.applySlow(p.slowFactor, p.slowDuration);
          }
          if (p.stunDuration > 0) {
            enemy.applyStun(p.stunDuration);
          }
        }
      }

      // Cluster launcher sub-bomblets
      if (p.bomblets > 0) {
        for (let b = 0; b < p.bomblets; b++) {
          const angle = (b / p.bomblets) * Math.PI * 2 + Math.random() * 0.4;
          const offsetDist = 20 + Math.random() * 25;
          const subX = p.x + Math.cos(angle) * offsetDist;
          const subY = p.y + Math.sin(angle) * offsetDist;

          this.spawnProjectile({
            type: 'bomblet',
            x: p.x,
            y: p.y,
            targetX: subX,
            targetY: subY,
            damage: Math.round(p.damage * 0.35),
            speed: 240,
            color: '#fbbf24',
            splashRadius: 32,
            isHoming: false,
            antiAir: true
          });
        }
      }
    } else {
      // Single Target Hit
      if (p.target && !p.target.dead) {
        p.target.takeDamage(p.damage, p.type);

        if (p.slowFactor > 0) {
          p.target.applySlow(p.slowFactor, p.slowDuration);
          this.fx.addFrostBurst(p.x, p.y, 25);
        } else {
          this.fx.addLaserImpact(p.x, p.y, p.color);
        }

        if (p.stunDuration > 0) {
          p.target.applyStun(p.stunDuration);
        }

        if (p.shatterDmg > 0 && p.target.slowTimer > 0) {
          p.target.takeDamage(p.shatterDmg, 'shatter');
          this.fx.addFloatingText('SHATTER!', p.x, p.y - 12, '#38bdf8', 12);
        }
      }
    }
  }

  render(ctx) {
    ctx.save();

    // 1. Render Beams
    for (const beam of this.beams) {
      ctx.globalAlpha = beam.alpha;
      ctx.strokeStyle = beam.color;
      ctx.shadowColor = beam.color;
      ctx.shadowBlur = 12;
      ctx.lineWidth = beam.width;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(beam.x1, beam.y1);
      ctx.lineTo(beam.x2, beam.y2);
      ctx.stroke();

      // Bright inner core
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(1, beam.width * 0.35);
      ctx.beginPath();
      ctx.moveTo(beam.x1, beam.y1);
      ctx.lineTo(beam.x2, beam.y2);
      ctx.stroke();
    }

    // 2. Render Projectiles
    for (const p of this.projectiles) {
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;

      if (p.type === 'bullet' || p.type === 'vulcan_bullet') {
        // Tracer line
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.type === 'vulcan_bullet' ? 3 : 2;
        ctx.beginPath();
        ctx.moveTo(p.prevX, p.prevY);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      } else if (p.type === 'missile' || p.type === 'cluster_missile' || p.type === 'emp_warhead') {
        // Missile rocket body
        const angle = Math.atan2(p.y - p.prevY, p.x - p.prevX);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);

        ctx.fillStyle = p.color;
        ctx.fillRect(-6, -2.5, 12, 5);

        // Rocket exhaust flame
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(-6, -2);
        ctx.lineTo(-11, 0);
        ctx.lineTo(-6, 2);
        ctx.fill();

        ctx.restore();
      } else {
        // Glowing energy sphere / cannon shell
        const rad = p.type === 'mega_shell' ? 7 : 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
        ctx.fill();

        // White core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}
