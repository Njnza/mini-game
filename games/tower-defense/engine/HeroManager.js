/**
 * HeroManager.js
 * Battlefield commandable Hero unit with active tactical skills, EXP progression, and auto-engagement.
 */

export class HeroManager {
  constructor(map, projectileManager, fxManager, audioManager) {
    this.map = map;
    this.projectiles = projectileManager;
    this.fx = fxManager;
    this.audio = audioManager;

    this.isSelected = false;
    this.isTargetingSkill1 = false;

    // Hero core stats
    this.name = 'Commander Rex';
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.isMoving = false;

    this.level = 1;
    this.exp = 0;
    this.nextLevelExp = 250;

    this.maxHp = 300;
    this.hp = 300;
    this.isDowned = false;
    this.reviveTimer = 0;
    this.regenTimer = 0;

    this.speed = 110;
    this.range = 135;
    this.baseDamage = 26;
    this.fireRate = 2.4;
    this.cooldown = 0;
    this.angle = 0;

    // Skill 1: Tactical EMP Bomb [Q]
    this.skill1 = {
      name: 'EMP Bomb',
      key: 'Q',
      icon: '💣',
      cooldown: 0,
      maxCooldown: 18,
      damage: 220,
      radius: 75,
      stunDuration: 2.5
    };

    // Skill 2: Overdrive Stim [E]
    this.skill2 = {
      name: 'Overdrive',
      key: 'E',
      icon: '⚡',
      cooldown: 0,
      maxCooldown: 25,
      duration: 0,
      maxDuration: 8.0,
      isActive: false
    };
  }

  reset(startX = null, startY = null) {
    const baseTile = this.map.base;
    const defaultCenter = this.map.tileToWorldCenter(Math.max(0, baseTile.x - 2), baseTile.y);
    this.x = startX !== null ? startX : defaultCenter.x;
    this.y = startY !== null ? startY : defaultCenter.y;
    this.targetX = this.x;
    this.targetY = this.y;
    this.isMoving = false;
    this.isSelected = false;
    this.isTargetingSkill1 = false;

    this.level = 1;
    this.exp = 0;
    this.nextLevelExp = 250;
    this.maxHp = 300;
    this.hp = 300;
    this.isDowned = false;
    this.reviveTimer = 0;

    this.skill1.cooldown = 0;
    this.skill2.cooldown = 0;
    this.skill2.duration = 0;
    this.skill2.isActive = false;
  }

  commandMove(x, y) {
    if (this.isDowned) return;
    this.targetX = Math.max(20, Math.min(x, this.map.width - 20));
    this.targetY = Math.max(20, Math.min(y, this.map.height - 20));
    this.isMoving = true;

    // Movement destination marker
    this.fx.particles.push({
      type: 'ring',
      x: this.targetX,
      y: this.targetY,
      radius: 4,
      maxRadius: 18,
      color: '#06b6d4',
      alpha: 1.0,
      life: 0.35,
      maxLife: 0.35
    });

    if (this.audio && typeof this.audio.playClick === 'function') {
      this.audio.playClick();
    }
  }

  triggerSkill1(targetX = null, targetY = null) {
    if (this.isDowned || this.skill1.cooldown > 0) return false;

    const tx = targetX !== null ? targetX : this.x + Math.cos(this.angle) * 100;
    const ty = targetY !== null ? targetY : this.y + Math.sin(this.angle) * 100;

    this.projectiles.spawnProjectile({
      type: 'hero_emp_grenade',
      x: this.x,
      y: this.y,
      targetX: tx,
      targetY: ty,
      damage: Math.round(this.skill1.damage * (1 + (this.level - 1) * 0.2)),
      speed: 360,
      color: '#eab308',
      splashRadius: this.skill1.radius,
      stunDuration: this.skill1.stunDuration,
      isHoming: false,
      antiAir: true
    });

    this.skill1.cooldown = this.skill1.maxCooldown;
    this.fx.addFloatingText('EMP LAUNCHED!', this.x, this.y - 18, '#eab308', 13);
    this.fx.triggerShake(4);
    return true;
  }

  triggerSkill2(towers = []) {
    if (this.isDowned || this.skill2.cooldown > 0) return false;

    this.skill2.isActive = true;
    this.skill2.duration = this.skill2.maxDuration;
    this.skill2.cooldown = this.skill2.maxCooldown;

    // Buff nearby towers
    for (const tower of towers) {
      const d = Math.hypot(tower.x - this.x, tower.y - this.y);
      if (d <= 170) {
        tower.speedBuff = Math.max(tower.speedBuff, 1.5);
      }
    }

    this.fx.addExplosion(this.x, this.y, '#38bdf8', 20, 140, 60);
    this.fx.addFloatingText('OVERDRIVE ACTIVE!', this.x, this.y - 18, '#38bdf8', 13);
    return true;
  }

  addExp(amount) {
    this.exp += amount;
    if (this.exp >= this.nextLevelExp && this.level < 5) {
      this.level++;
      this.exp -= this.nextLevelExp;
      this.nextLevelExp = Math.round(this.nextLevelExp * 1.6);
      this.maxHp = Math.round(this.maxHp * 1.25);
      this.hp = this.maxHp;
      this.fx.addExplosion(this.x, this.y, '#eab308', 24, 150, 50);
      this.fx.addFloatingText(`HERO LEVEL ${this.level}!`, this.x, this.y - 22, '#eab308', 15);
    }
  }

  takeDamage(amount) {
    if (this.isDowned) return;
    this.hp -= amount;
    this.regenTimer = 4.0; // delay regen
    this.fx.addFloatingText(`-${amount}`, this.x, this.y, '#ef4444', 12);

    if (this.hp <= 0) {
      this.hp = 0;
      this.isDowned = true;
      this.reviveTimer = 14.0;
      this.isMoving = false;
      this.fx.addExplosion(this.x, this.y, '#ef4444', 20, 120, 45);
      this.fx.addFloatingText('HERO DOWN!', this.x, this.y - 18, '#ef4444', 14);
    }
  }

  update(dt, enemies = []) {
    // Cooldown decrements
    if (this.skill1.cooldown > 0) this.skill1.cooldown = Math.max(0, this.skill1.cooldown - dt);
    if (this.skill2.cooldown > 0) this.skill2.cooldown = Math.max(0, this.skill2.cooldown - dt);

    if (this.skill2.isActive) {
      this.skill2.duration -= dt;
      if (this.skill2.duration <= 0) {
        this.skill2.isActive = false;
      }
    }

    // Downed / Revive state
    if (this.isDowned) {
      this.reviveTimer -= dt;
      if (this.reviveTimer <= 0) {
        this.isDowned = false;
        this.hp = Math.round(this.maxHp * 0.5);
        this.fx.addExplosion(this.x, this.y, '#10b981', 18, 120, 40);
        this.fx.addFloatingText('HERO REVIVED!', this.x, this.y - 18, '#10b981', 14);
      }
      return;
    }

    // Out of combat regeneration
    if (this.regenTimer > 0) {
      this.regenTimer -= dt;
    } else if (this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + dt * 18);
    }

    // Movement handling
    if (this.isMoving) {
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const dist = Math.hypot(dx, dy);
      const moveSpeed = this.speed * (this.skill2.isActive ? 1.4 : 1.0);
      const step = moveSpeed * dt;

      if (dist <= step) {
        this.x = this.targetX;
        this.y = this.targetY;
        this.isMoving = false;
      } else {
        this.x += (dx / dist) * step;
        this.y += (dy / dist) * step;
        this.angle = Math.atan2(dy, dx);
      }
    }

    // Auto-attack targeting
    if (this.cooldown > 0) {
      this.cooldown -= dt;
    }

    // Find nearest enemy in range
    let bestTarget = null;
    let closestDist = this.range;

    for (const enemy of enemies) {
      if (enemy.dead) continue;
      const d = Math.hypot(enemy.x - this.x, enemy.y - this.y);
      if (d <= closestDist) {
        closestDist = d;
        bestTarget = enemy;
      }
    }

    if (bestTarget) {
      this.angle = Math.atan2(bestTarget.y - this.y, bestTarget.x - this.x);

      if (this.cooldown <= 0) {
        const dmg = Math.round(this.baseDamage * (1 + (this.level - 1) * 0.25));
        const fireInterval = 1.0 / (this.fireRate * (this.skill2.isActive ? 1.5 : 1.0));
        this.cooldown = fireInterval;

        // Dual plasma blaster
        this.projectiles.spawnProjectile({
          type: 'bullet',
          x: this.x,
          y: this.y,
          target: bestTarget,
          damage: dmg,
          speed: 560,
          color: '#06b6d4',
          antiAir: true
        });
      }
    }
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Selected indicator ring
    if (this.isSelected) {
      ctx.strokeStyle = '#06b6d4';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Range circle if selected
    if (this.isSelected) {
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, this.range, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Overdrive aura
    if (this.skill2.isActive) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Downed marker or active hero avatar
    if (this.isDowned) {
      ctx.fillStyle = '#ef4444';
      ctx.font = '16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('💀', 0, 5);
      ctx.font = '10px monospace';
      ctx.fillText(`${Math.ceil(this.reviveTimer)}s`, 0, 18);
    } else {
      ctx.save();
      ctx.rotate(this.angle);

      // Hero Body (Specialized Sci-Fi Commando)
      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 8;

      // Armor torso
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();

      // Dual blaster weapons
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(6, -6, 8, 3);
      ctx.fillRect(6, 3, 8, 3);

      // Cyber Visor
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(2, -3, 5, 6);

      ctx.restore();

      // HP Bar above Hero
      const barW = 28;
      const barH = 3.5;
      const barY = -16;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(-barW / 2, barY, barW, barH);

      const hpPct = Math.max(0, this.hp / this.maxHp);
      ctx.fillStyle = hpPct > 0.5 ? '#10b981' : hpPct > 0.25 ? '#f59e0b' : '#ef4444';
      ctx.fillRect(-barW / 2, barY, barW * hpPct, barH);
    }

    ctx.restore();
  }
}
