/**
 * ObstacleManager.js
 * Spawns and manages obstacles, hazards, and floating power-ups.
 */

import { OBSTACLE_TYPES } from '../data/enemies.js';
import { POWERUP_TYPES } from '../data/powerups.js';

export class ObstacleManager {
  constructor(canvasWidth = 800, canvasHeight = 520) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.obstacles = [];
    this.powerups = [];
    this.warnings = []; // Top indicators for falling moon projectiles
    this.spawnTimer = 2.0;
    this.powerupTimer = 10.0;
    this.activeDecoyTimer = 0;
    this.activeLieTimer = 0;
    this.animTime = 0;
    this.difficultyLevel = 1; // 1 to 5 phases
  }

  reset() {
    this.obstacles = [];
    this.powerups = [];
    this.warnings = [];
    this.spawnTimer = 2.0;
    this.powerupTimer = 10.0;
    this.activeDecoyTimer = 0;
    this.activeLieTimer = 0;
    this.animTime = 0;
    this.difficultyLevel = 1;
  }

  activateDecoy(duration = 5.0) {
    this.activeDecoyTimer = duration;
  }

  activateLieCharm(duration = 4.0) {
    this.activeLieTimer = duration;
    // Reverse current obstacles
    for (const obs of this.obstacles) {
      obs.vx = -Math.abs(obs.vx) * 0.8;
    }
  }

  setDifficulty(level) {
    this.difficultyLevel = level;
  }

  spawnObstacle(typeKey) {
    const def = OBSTACLE_TYPES[typeKey] || OBSTACLE_TYPES.lantern;
    const baseSpeed = (140 + this.difficultyLevel * 18) * def.speedFactor;

    if (typeKey === 'mini_moon') {
      // Spawn falling moon with top warning indicator
      const spawnX = 250 + Math.random() * (this.canvasWidth - 350);
      this.warnings.push({
        x: spawnX,
        timer: 0.75,
        targetY: 20
      });
      return;
    }

    const y = 60 + Math.random() * (this.canvasHeight - 140);
    this.obstacles.push({
      x: this.canvasWidth + 40,
      y,
      baseY: y,
      vx: baseSpeed,
      vy: 0,
      width: def.width,
      height: def.height,
      radius: Math.max(def.width, def.height) * 0.45,
      type: def.type,
      def,
      phaseOffset: Math.random() * Math.PI * 2
    });
  }

  spawnPowerup() {
    const keys = Object.keys(POWERUP_TYPES);
    const chosenKey = keys[Math.floor(Math.random() * keys.length)];
    const def = POWERUP_TYPES[chosenKey];

    const y = 80 + Math.random() * (this.canvasHeight - 180);
    this.powerups.push({
      x: this.canvasWidth + 30,
      y,
      baseY: y,
      vx: 130,
      radius: 18,
      def,
      phaseOffset: Math.random() * Math.PI * 2
    });
  }

  update(dt, player, fxManager, audio, onHitCallback, onPowerupCollected) {
    this.animTime += dt;
    this.spawnTimer -= dt;
    this.powerupTimer -= dt;

    if (this.activeDecoyTimer > 0) this.activeDecoyTimer -= dt;
    if (this.activeLieTimer > 0) this.activeLieTimer -= dt;

    // Spawning logic based on difficulty phase
    const interval = Math.max(1.1, 2.5 - this.difficultyLevel * 0.25);
    if (this.spawnTimer <= 0) {
      this.spawnTimer = interval + Math.random() * 0.6;

      const roll = Math.random();
      if (this.difficultyLevel === 1) {
        this.spawnObstacle('lantern');
      } else if (this.difficultyLevel === 2) {
        roll < 0.6 ? this.spawnObstacle('lantern') : this.spawnObstacle('rabbit');
      } else if (this.difficultyLevel === 3) {
        if (roll < 0.4) this.spawnObstacle('rabbit');
        else if (roll < 0.7) this.spawnObstacle('mini_moon');
        else this.spawnObstacle('fox');
      } else {
        // High intensity
        if (roll < 0.3) this.spawnObstacle('mini_moon');
        else if (roll < 0.55) this.spawnObstacle('rabbit');
        else if (roll < 0.8) this.spawnObstacle('fox');
        else this.spawnObstacle('lantern');
      }
    }

    // Powerup spawn
    if (this.powerupTimer <= 0) {
      this.powerupTimer = 11.0 + Math.random() * 5.0;
      this.spawnPowerup();
    }

    // Update Warnings and trigger falling mini moons
    for (let w = this.warnings.length - 1; w >= 0; w--) {
      const warn = this.warnings[w];
      warn.timer -= dt;
      if (warn.timer <= 0) {
        // Drop the mini moon
        this.obstacles.push({
          x: warn.x,
          y: -20,
          baseY: 0,
          vx: 40,
          vy: 360,
          width: 36,
          height: 36,
          radius: 17,
          type: 'mini_moon',
          def: OBSTACLE_TYPES.mini_moon,
          phaseOffset: 0
        });
        this.warnings.splice(w, 1);
      }
    }

    // Update Obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];

      if (this.activeDecoyTimer > 0) {
        // Obstacles stop moving or drift harmlessly
        obs.x += 10 * dt;
      } else if (this.activeLieTimer > 0) {
        // Obstacles move away to the right
        obs.x += 160 * dt;
      } else {
        obs.x -= obs.vx * dt;
        if (obs.type === 'mini_moon') {
          obs.y += obs.vy * dt;
        } else if (obs.type === 'lantern') {
          obs.y = obs.baseY + Math.sin(this.animTime * 4 + obs.phaseOffset) * 25;
        } else if (obs.type === 'rabbit') {
          obs.y = obs.baseY + Math.abs(Math.sin(this.animTime * 6 + obs.phaseOffset)) * -22;
        }
      }

      // Check collision with player
      const dist = Math.hypot(player.x - obs.x, player.y - obs.y);
      if (dist < player.width * 0.45 + obs.radius) {
        if (this.activeDecoyTimer <= 0 && this.activeLieTimer <= 0) {
          const tookDamage = player.applyDamage();
          if (fxManager) {
            fxManager.createExplosion(obs.x, obs.y);
            fxManager.triggerScreenShake(7, 0.3);
            fxManager.addFloatingText('ỐI GIỜI ƠI! 💥', player.x, player.y - 28, '#ef4444', 18);
          }
          if (audio) audio.playDamage();

          if (onHitCallback) onHitCallback(tookDamage);

          this.obstacles.splice(i, 1);
          continue;
        }
      }

      // Despawn
      if (obs.x < -60 || obs.x > this.canvasWidth + 120 || obs.y > this.canvasHeight + 60) {
        this.obstacles.splice(i, 1);
      }
    }

    // Update Power-ups
    for (let p = this.powerups.length - 1; p >= 0; p--) {
      const pw = this.powerups[p];
      pw.x -= pw.vx * dt;
      pw.y = pw.baseY + Math.sin(this.animTime * 3 + pw.phaseOffset) * 12;

      const pDist = Math.hypot(player.x - pw.x, player.y - pw.y);
      if (pDist < player.width * 0.5 + pw.radius) {
        // Collected power-up!
        if (fxManager) {
          fxManager.createMooncakeCatchSparks(pw.x, pw.y);
          fxManager.addFloatingText(pw.def.name, pw.x, pw.y - 18, pw.def.color, 16);
        }
        if (audio) audio.playPowerup();

        if (onPowerupCollected) onPowerupCollected(pw.def);

        this.powerups.splice(p, 1);
        continue;
      }

      if (pw.x < -40) {
        this.powerups.splice(p, 1);
      }
    }
  }

  render(ctx) {
    // 1. Draw Warnings for falling mini-moons
    for (const warn of this.warnings) {
      const blink = Math.floor(this.animTime * 12) % 2 === 0;
      ctx.save();
      ctx.fillStyle = blink ? 'rgba(239, 68, 68, 0.9)' : 'rgba(234, 179, 8, 0.9)';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚠️', warn.x, 28);
      // Warning laser beam pointing down
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(warn.x, 32);
      ctx.lineTo(warn.x, this.canvasHeight);
      ctx.stroke();
      ctx.restore();
    }

    // 2. Draw Obstacles
    for (const obs of this.obstacles) {
      ctx.save();
      ctx.translate(obs.x, obs.y);

      if (obs.type === 'lantern') {
        // Red Hanging Mid-Autumn Lantern
        // Lantern Body
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.ellipse(0, 0, 16, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        // Inner warm light
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Top & bottom caps
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(-10, -22, 20, 4);
        ctx.fillRect(-8, 20, 16, 4);

        // Hanging yellow tassel
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 24);
        ctx.lineTo(0, 34);
        ctx.stroke();
      } else if (obs.type === 'rabbit') {
        // Angry On-Strike Rabbit
        // Body
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(0, 4, 16, 0, Math.PI * 2);
        ctx.fill();

        // Long Ears
        ctx.beginPath();
        ctx.ellipse(-6, -18, 4, 12, -0.15, 0, Math.PI * 2);
        ctx.ellipse(6, -18, 4, 12, 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f472b6'; // Inner pink ears
        ctx.beginPath();
        ctx.ellipse(-6, -18, 2, 8, -0.15, 0, Math.PI * 2);
        ctx.ellipse(6, -18, 2, 8, 0.15, 0, Math.PI * 2);
        ctx.fill();

        // Angry Eyes
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-9, -2);
        ctx.lineTo(-3, 1);
        ctx.moveTo(9, -2);
        ctx.lineTo(3, 1);
        ctx.stroke();

        // Strike Picket Sign
        ctx.fillStyle = '#b45309';
        ctx.fillRect(14, -20, 3, 30);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(8, -28, 26, 14);
        ctx.fillStyle = '#b91c1c';
        ctx.font = 'bold 8px sans-serif';
        ctx.fillText('STRIKE', 9, -18);
      } else if (obs.type === 'mini_moon') {
        // Glowing Mini Moon Projectile
        const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, obs.radius);
        grad.addColorStop(0, '#fff');
        grad.addColorStop(0.5, '#fef08a');
        grad.addColorStop(1, '#f59e0b');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, obs.radius, 0, Math.PI * 2);
        ctx.fill();

        // Flame trail
        ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.beginPath();
        ctx.arc(0, -obs.radius * 0.8, obs.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
      } else if (obs.type === 'fox') {
        // Fast Disguised Fox
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.ellipse(0, 0, 20, 13, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pointy ears
        ctx.beginPath();
        ctx.moveTo(-12, -8);
        ctx.lineTo(-16, -18);
        ctx.lineTo(-6, -12);
        ctx.closePath();
        ctx.fill();

        // Bushy Tail
        ctx.fillStyle = '#c2410c';
        ctx.beginPath();
        ctx.arc(18, 0, 10, 0, Math.PI * 2);
        ctx.fill();

        // Shifty Fox Eyes
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(-8, -2, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // 3. Draw Power-Ups
    for (const pw of this.powerups) {
      ctx.save();
      ctx.translate(pw.x, pw.y);

      // Outer Pulsating Halo
      const pulse = 1 + Math.sin(this.animTime * 8) * 0.15;
      ctx.fillStyle = pw.def.color;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(0, 0, pw.radius * 1.5 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Power-up Orb
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.arc(0, 0, pw.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = pw.def.color;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Icon
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pw.def.icon.split('')[0] || '✨', 0, 0);

      ctx.restore();
    }
  }
}
