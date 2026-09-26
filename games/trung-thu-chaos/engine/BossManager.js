/**
 * BossManager.js
 * Thỏ Ngọc Siêu Hình (Giant Cosmic Rabbit Boss) fight controller.
 */

export class BossManager {
  constructor(canvasWidth = 800, canvasHeight = 520) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    this.isActive = false;
    this.isDefeated = false;
    this.maxHp = 20;
    this.hp = 20;

    this.x = canvasWidth + 120;
    this.targetX = canvasWidth - 110;
    this.y = canvasHeight * 0.45;
    this.vy = 0;
    this.radius = 55;

    this.animTime = 0;
    this.patternTimer = 3.0;
    this.currentPattern = 'idle'; // 'idle', 'pestle_smash', 'vacuum', 'carrot_barrage'

    this.magicCakes = []; // Golden cakes player catches to damage boss
    this.magicCakeTimer = 1.8;
    this.carrotBullets = []; // Projectiles fired by boss
  }

  reset() {
    this.isActive = false;
    this.isDefeated = false;
    this.hp = this.maxHp;
    this.x = this.canvasWidth + 120;
    this.y = this.canvasHeight * 0.45;
    this.patternTimer = 3.0;
    this.currentPattern = 'idle';
    this.magicCakes = [];
    this.carrotBullets = [];
  }

  startBossFight() {
    this.isActive = true;
    this.isDefeated = false;
    this.hp = this.maxHp;
    this.x = this.canvasWidth + 120;
    this.currentPattern = 'idle';
    this.patternTimer = 2.5;
  }

  damageBoss(amount = 2, fxManager) {
    if (!this.isActive || this.isDefeated) return false;

    this.hp = Math.max(0, this.hp - amount);
    if (fxManager) {
      fxManager.createExplosion(this.x, this.y, '#f59e0b');
      fxManager.addFloatingText(`-${amount} HP!`, this.x - 30, this.y - 40, '#f59e0b', 20);
      fxManager.triggerScreenShake(8, 0.3);
    }

    if (this.hp <= 0) {
      this.isDefeated = true;
      this.isActive = false;
      return true; // Boss killed!
    }
    return false;
  }

  update(dt, player, fxManager, audio, onBossDefeated) {
    if (!this.isActive) return;

    this.animTime += dt;
    this.patternTimer -= dt;
    this.magicCakeTimer -= dt;

    // Smooth entry into arena
    if (this.x > this.targetX) {
      this.x -= 80 * dt;
    }

    // Gentle vertical floating
    this.y = this.canvasHeight * 0.45 + Math.sin(this.animTime * 2.5) * 60;

    // Pattern state machine
    if (this.patternTimer <= 0) {
      const patterns = ['pestle_smash', 'carrot_barrage', 'vacuum'];
      this.currentPattern = patterns[Math.floor(Math.random() * patterns.length)];
      this.patternTimer = 4.0;

      if (this.currentPattern === 'carrot_barrage') {
        // Fire 3 carrot bullets towards player
        for (let i = -1; i <= 1; i++) {
          this.carrotBullets.push({
            x: this.x - 40,
            y: this.y + i * 25,
            vx: -260,
            vy: i * 50,
            radius: 12
          });
        }
      } else if (this.currentPattern === 'pestle_smash' && fxManager) {
        fxManager.addFloatingText('GIÃ GẠO ĐỘNG ĐẤT! 💥', this.x - 40, this.y - 60, '#ef4444', 18);
        fxManager.triggerScreenShake(6, 0.4);
      }
    }

    // Spawn Magic Mooncakes for Cuội to catch and attack Boss
    if (this.magicCakeTimer <= 0) {
      this.magicCakeTimer = 2.2;
      this.magicCakes.push({
        x: this.canvasWidth + 20,
        y: 80 + Math.random() * (this.canvasHeight - 180),
        vx: 180,
        radius: 19
      });
    }

    // Update Magic Mooncakes
    for (let m = this.magicCakes.length - 1; m >= 0; m--) {
      const mc = this.magicCakes[m];
      mc.x -= mc.vx * dt;

      // Check collision with player
      const dist = Math.hypot(player.x - mc.x, player.y - mc.y);
      if (dist < player.width * 0.5 + mc.radius) {
        // Cuội caught the magic mooncake -> Shoots magic beam at Boss!
        if (fxManager) {
          fxManager.createMooncakeCatchSparks(mc.x, mc.y);
          fxManager.addFloatingText('BÁNH PHÉP CUNG TRĂNG! ⚡', player.x, player.y - 20, '#fbbf24', 18);
        }
        if (audio) audio.playCombo();

        const dead = this.damageBoss(2, fxManager);
        this.magicCakes.splice(m, 1);

        if (dead && onBossDefeated) {
          onBossDefeated();
        }
        continue;
      }

      if (mc.x < -30) {
        this.magicCakes.splice(m, 1);
      }
    }

    // Update Carrot Bullets
    for (let c = this.carrotBullets.length - 1; c >= 0; c--) {
      const cb = this.carrotBullets[c];
      cb.x += cb.vx * dt;
      cb.y += cb.vy * dt;

      // Collision with player
      const cDist = Math.hypot(player.x - cb.x, player.y - cb.y);
      if (cDist < player.width * 0.45 + cb.radius) {
        player.applyDamage();
        if (fxManager) {
          fxManager.createExplosion(cb.x, cb.y, '#f97316');
          fxManager.addFloatingText('CÀ RỐT ĐẬP TRÚNG! 🥕', player.x, player.y - 20, '#ef4444', 16);
        }
        if (audio) audio.playDamage();
        this.carrotBullets.splice(c, 1);
        continue;
      }

      if (cb.x < -40) {
        this.carrotBullets.splice(c, 1);
      }
    }
  }

  render(ctx) {
    if (!this.isActive) return;

    // 1. Boss HP Bar at Top
    ctx.save();
    const barWidth = 320;
    const barHeight = 16;
    const barX = (this.canvasWidth - barWidth) / 2;
    const barY = 16;

    // Title
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('👑 BOSS: THỎ NGỌC SIÊU HÌNH (ĐÌNH CÔNG CỰC ĐẠI)', this.canvasWidth / 2, barY - 4);

    // Background bar
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, 8);
    ctx.fill();

    // HP fill
    const hpRatio = Math.max(0, this.hp / this.maxHp);
    const grad = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
    grad.addColorStop(0, '#ef4444');
    grad.addColorStop(0.5, '#f59e0b');
    grad.addColorStop(1, '#10b981');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth * hpRatio, barHeight, 8);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    ctx.restore();

    // 2. Draw Giant Boss Rabbit
    ctx.save();
    ctx.translate(this.x, this.y);

    // Glowing Cosmic Aura
    const auraPulse = 1 + Math.sin(this.animTime * 6) * 0.12;
    const aura = ctx.createRadialGradient(0, 0, this.radius * 0.7, 0, 0, this.radius * 1.8 * auraPulse);
    aura.addColorStop(0, 'rgba(167, 243, 208, 0.4)');
    aura.addColorStop(1, 'rgba(167, 243, 208, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 1.8 * auraPulse, 0, Math.PI * 2);
    ctx.fill();

    // Giant Body
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Huge Fluffy Ears
    ctx.beginPath();
    ctx.ellipse(-24, -this.radius - 20, 14, 38, -0.2, 0, Math.PI * 2);
    ctx.ellipse(24, -this.radius - 20, 14, 38, 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f472b6'; // Inner ear
    ctx.beginPath();
    ctx.ellipse(-24, -this.radius - 20, 7, 26, -0.2, 0, Math.PI * 2);
    ctx.ellipse(24, -this.radius - 20, 7, 26, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Red Angry Glowing Boss Eyes
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(-20, -10, 8, 0, Math.PI * 2);
    ctx.arc(20, -10, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(-22, -12, 3, 0, Math.PI * 2);
    ctx.arc(18, -12, 3, 0, Math.PI * 2);
    ctx.fill();

    // Pestle / Mortar in Hand (Giã Gạo)
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.roundRect(-this.radius - 18, -30, 22, 65, 8);
    ctx.fill();

    ctx.restore();

    // 3. Draw Magic Mooncakes for Cuội to catch
    for (const mc of this.magicCakes) {
      ctx.save();
      ctx.translate(mc.x, mc.y);

      // Golden Halo
      ctx.fillStyle = 'rgba(250, 204, 21, 0.4)';
      ctx.beginPath();
      ctx.arc(0, 0, mc.radius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Cake Body
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(0, 0, mc.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚡', 0, 0);

      ctx.restore();
    }

    // 4. Draw Boss Carrot Bullets
    for (const cb of this.carrotBullets) {
      ctx.save();
      ctx.translate(cb.x, cb.y);
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(cb.radius, 0);
      ctx.lineTo(-cb.radius, -cb.radius * 0.6);
      ctx.lineTo(-cb.radius, cb.radius * 0.6);
      ctx.closePath();
      ctx.fill();
      // Green stem
      ctx.fillStyle = '#10b981';
      ctx.fillRect(cb.radius, -2, 5, 4);
      ctx.restore();
    }
  }
}
