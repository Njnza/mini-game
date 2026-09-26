/**
 * AbilityManager.js
 * Commander Support Powers: Airstrike, Ion Storm, Overclock, and Energy Barrier.
 */

export class AbilityManager {
  constructor(map, fxManager, audioManager) {
    this.map = map;
    this.fx = fxManager;
    this.audio = audioManager;

    this.activeBarrier = null; // { x, y, duration }
    this.activeStrikes = []; // animated bomb drops
    this.overclockTimer = 0;

    this.abilities = {
      airstrike: {
        id: 'airstrike',
        name: 'Airstrike',
        icon: '✈️',
        cost: 0,
        cooldown: 0,
        maxCooldown: 60,
        description: 'Carpet bomb run drops 5 heavy explosives along lane.'
      },
      ion_storm: {
        id: 'ion_storm',
        name: 'Ion Storm',
        icon: '🌩️',
        cost: 0,
        cooldown: 0,
        maxCooldown: 80,
        description: 'Electromagnetic tempest zaps and stuns all active enemies.'
      },
      overclock: {
        id: 'overclock',
        name: 'Overclock',
        icon: '⚡',
        cost: 0,
        cooldown: 0,
        maxCooldown: 45,
        duration: 8,
        description: 'Doubles attack speed of all deployed turrets for 8 seconds.'
      },
      barrier: {
        id: 'barrier',
        name: 'Force Barrier',
        icon: '🛡️',
        cost: 0,
        cooldown: 0,
        maxCooldown: 35,
        duration: 6,
        description: 'Deploys an impenetrable holographic shield on the lane.'
      }
    };
  }

  reset() {
    this.activeBarrier = null;
    this.activeStrikes = [];
    this.overclockTimer = 0;
    for (const key in this.abilities) {
      this.abilities[key].cooldown = 0;
    }
  }

  triggerAbility(abilityId, targetX = null, targetY = null, enemies = [], towers = []) {
    const ab = this.abilities[abilityId];
    if (!ab || ab.cooldown > 0) return { success: false, reason: 'Ability on cooldown' };

    if (abilityId === 'airstrike') {
      const strikeY = targetY !== null ? targetY : this.map.height / 2;
      for (let i = 0; i < 6; i++) {
        const dropX = 80 + i * 125;
        this.activeStrikes.push({
          x: dropX,
          y: strikeY,
          delay: i * 0.18,
          exploded: false
        });
      }
      ab.cooldown = ab.maxCooldown;
      this.fx.addFloatingText('AIRSTRIKE INCOMING!', 400, 60, '#f43f5e', 16);
      return { success: true };
    }

    if (abilityId === 'ion_storm') {
      ab.cooldown = ab.maxCooldown;
      this.fx.triggerShake(10);
      this.fx.addFloatingText('ION STORM UNLEASHED!', 400, 60, '#38bdf8', 16);

      for (const enemy of enemies) {
        if (enemy.dead) continue;
        enemy.takeDamage(150, 'energy');
        enemy.applyStun(2.2);
        this.fx.addExplosion(enemy.x, enemy.y, '#38bdf8', 12, 100, 30);
      }
      return { success: true };
    }

    if (abilityId === 'overclock') {
      ab.cooldown = ab.maxCooldown;
      this.overclockTimer = ab.duration;
      for (const t of towers) {
        t.speedBuff = Math.max(t.speedBuff, 2.0);
      }
      this.fx.addFloatingText('GLOBAL OVERCLOCK (2X SPEED)!', 400, 60, '#eab308', 16);
      return { success: true };
    }

    if (abilityId === 'barrier') {
      ab.cooldown = ab.maxCooldown;
      const bx = targetX !== null ? targetX : 400;
      const by = targetY !== null ? targetY : 260;
      this.activeBarrier = {
        x: bx,
        y: by,
        radius: 35,
        timer: ab.duration
      };
      this.fx.addFloatingText('BARRIER DEPLOYED!', bx, by - 20, '#06b6d4', 13);
      return { success: true };
    }

    return { success: false };
  }

  update(dt, enemies = [], towers = []) {
    // Cooldown decays
    for (const key in this.abilities) {
      if (this.abilities[key].cooldown > 0) {
        this.abilities[key].cooldown = Math.max(0, this.abilities[key].cooldown - dt);
      }
    }

    // Overclock active timer
    if (this.overclockTimer > 0) {
      this.overclockTimer -= dt;
      for (const t of towers) {
        t.speedBuff = Math.max(t.speedBuff, 2.0);
      }
    }

    // Barrier update
    if (this.activeBarrier) {
      this.activeBarrier.timer -= dt;
      if (this.activeBarrier.timer <= 0) {
        this.activeBarrier = null;
      } else {
        // Slow or stop ground enemies touching barrier
        for (const enemy of enemies) {
          if (enemy.dead || enemy.isAirborne) continue;
          const d = Math.hypot(enemy.x - this.activeBarrier.x, enemy.y - this.activeBarrier.y);
          if (d <= this.activeBarrier.radius + enemy.size) {
            enemy.applyStun(0.3); // Stun locks enemies at the barrier gate
          }
        }
      }
    }

    // Active strikes bomb drops
    for (let i = this.activeStrikes.length - 1; i >= 0; i--) {
      const strike = this.activeStrikes[i];
      strike.delay -= dt;
      if (strike.delay <= 0 && !strike.exploded) {
        strike.exploded = true;
        this.fx.addExplosion(strike.x, strike.y, '#f43f5e', 26, 180, 75);
        this.fx.triggerShake(7);

        // Damage enemies in bomb radius
        for (const enemy of enemies) {
          if (enemy.dead) continue;
          const d = Math.hypot(enemy.x - strike.x, enemy.y - strike.y);
          if (d <= 75) {
            enemy.takeDamage(260, 'bomb');
          }
        }
        this.activeStrikes.splice(i, 1);
      }
    }
  }

  render(ctx) {
    ctx.save();

    // Render Barrier
    if (this.activeBarrier) {
      ctx.strokeStyle = '#06b6d4';
      ctx.fillStyle = 'rgba(6, 182, 212, 0.2)';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 14;

      ctx.beginPath();
      ctx.arc(this.activeBarrier.x, this.activeBarrier.y, this.activeBarrier.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Countdown
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.ceil(this.activeBarrier.timer)}s`, this.activeBarrier.x, this.activeBarrier.y + 4);
    }

    ctx.restore();
  }
}
