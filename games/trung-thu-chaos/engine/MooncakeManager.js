/**
 * MooncakeManager.js
 * Manages fugitive running mooncakes, catching collisions, and the Strike System.
 */

export class MooncakeManager {
  constructor(canvasWidth = 800, canvasHeight = 520) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.mooncakes = [];
    this.spawnTimer = 0.5;
    this.spawnInterval = 1.3;
    this.totalCaught = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.strikes = 0; // 0 to 3 strikes before losing a life
    this.maxStrikes = 3;
    this.animTime = 0;
  }

  reset() {
    this.mooncakes = [];
    this.spawnTimer = 0.5;
    this.totalCaught = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.strikes = 0;
    this.animTime = 0;
  }

  spawnMooncake(type = 'nuong', y = null) {
    const targetY = y !== null ? y : 60 + Math.random() * (this.canvasHeight - 140);
    let speed = 160 + Math.random() * 40;
    let points = 10;
    let gold = 1;
    let radius = 17;
    let color = '#d97706'; // Golden brown
    let secondary = '#fbbf24';

    if (type === 'deo') {
      speed = 210;
      points = 15;
      gold = 2;
      color = '#f8fafc';
      secondary = '#e2e8f0';
    } else if (type === 'trung_muoi') {
      speed = 140;
      points = 25;
      gold = 4;
      radius = 21;
      color = '#f59e0b';
      secondary = '#ef4444';
    } else if (type === 'thap_cam') {
      speed = 180;
      points = 20;
      gold = 3;
      color = '#b45309';
      secondary = '#10b981';
    }

    this.mooncakes.push({
      x: this.canvasWidth + 30,
      y: targetY,
      baseY: targetY,
      vx: speed,
      radius,
      type,
      points,
      gold,
      color,
      secondary,
      bobOffset: Math.random() * Math.PI * 2,
      isSuctioned: false
    });
  }

  update(dt, player, fxManager, audio, onStrikePenalty, onCatchCallback) {
    this.animTime += dt;
    this.spawnTimer -= dt;

    // Spawn logic
    if (this.spawnTimer <= 0) {
      this.spawnTimer = 0.9 + Math.random() * 0.8;
      const roll = Math.random();
      if (roll < 0.55) {
        this.spawnMooncake('nuong');
      } else if (roll < 0.75) {
        this.spawnMooncake('deo');
      } else if (roll < 0.90) {
        this.spawnMooncake('thap_cam');
      } else {
        this.spawnMooncake('trung_muoi');
      }

      // Occasional pair or arc
      if (Math.random() < 0.3) {
        const patternY = 90 + Math.random() * 260;
        this.spawnMooncake('nuong', patternY);
        this.spawnMooncake('nuong', patternY + 35);
      }
    }

    // Update existing mooncakes
    for (let i = this.mooncakes.length - 1; i >= 0; i--) {
      const cake = this.mooncakes[i];

      // Turbo Magnetic Suction
      if (player.isTurbo) {
        const dx = player.x - cake.x;
        const dy = player.y - cake.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 260) {
          cake.x += (dx / dist) * 450 * dt;
          cake.y += (dy / dist) * 450 * dt;
          cake.isSuctioned = true;
        }
      }

      if (!cake.isSuctioned) {
        cake.x -= cake.vx * dt;
        cake.y = cake.baseY + Math.sin(this.animTime * 5 + cake.bobOffset) * 6;
      }

      // Check collision with player
      const distToPlayer = Math.hypot(player.x - cake.x, player.y - cake.y);
      if (distToPlayer < player.width * 0.5 + cake.radius) {
        // CAUGHT!
        this.totalCaught++;
        this.combo++;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;

        // Combo reward: every 5 combo clears 1 strike
        if (this.combo % 5 === 0 && this.strikes > 0) {
          this.strikes--;
          if (fxManager) {
            fxManager.addFloatingText('XÓA 1 LỖI! 🎉', player.x, player.y - 30, '#10b981', 18);
          }
        }

        // Multiplier based on combo
        let multiplier = 1;
        if (this.combo >= 15) multiplier = 3;
        else if (this.combo >= 5) multiplier = 2;

        const earnedScore = cake.points * multiplier;
        const earnedGold = cake.gold * multiplier;

        if (fxManager) {
          fxManager.createMooncakeCatchSparks(cake.x, cake.y);
          const comboText = multiplier > 1 ? ` (x${multiplier})` : '';
          fxManager.addFloatingText(`+${earnedScore}${comboText}`, cake.x, cake.y - 12, '#fbbf24', 16);
        }

        if (audio) {
          if (this.combo >= 5 && this.combo % 5 === 0) {
            audio.playCombo();
          } else {
            audio.playCatch();
          }
        }

        player.setExpression('happy', 0.6);

        if (onCatchCallback) {
          onCatchCallback(earnedScore, earnedGold, this.combo, this.totalCaught);
        }

        this.mooncakes.splice(i, 1);
        continue;
      }

      // Check if missed (slipped past left screen boundary)
      if (cake.x < -40) {
        this.mooncakes.splice(i, 1);

        // Strike penalty
        this.combo = 0;
        this.strikes++;

        if (audio) audio.playStrike();

        if (fxManager) {
          fxManager.addFloatingText(`⚠️ BÁNH RƠI! (${this.strikes}/3)`, 80, 160, '#ef4444', 18);
          fxManager.triggerScreenShake(4, 0.2);
        }

        // 3 strikes = lose 1 life!
        if (this.strikes >= this.maxStrikes) {
          this.strikes = 0;
          if (onStrikePenalty) {
            onStrikePenalty();
          }
        }
      }
    }
  }

  render(ctx) {
    for (const cake of this.mooncakes) {
      const r = cake.radius;
      ctx.save();
      ctx.translate(cake.x, cake.y);

      // 1. Running Little Feet with Red Shoes
      const legOffset = Math.sin(this.animTime * 16 + cake.bobOffset) * 6;
      ctx.fillStyle = '#ef4444'; // Red shoes
      // Left foot
      ctx.beginPath();
      ctx.ellipse(-6, r + 4 + legOffset, 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      // Right foot
      ctx.beginPath();
      ctx.ellipse(6, r + 4 - legOffset, 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. Mooncake Fluted Outer Crust
      ctx.fillStyle = cake.color;
      ctx.beginPath();
      const petals = 12;
      for (let p = 0; p < petals; p++) {
        const angle = (p / petals) * Math.PI * 2;
        const px = Math.cos(angle) * (r + 2);
        const py = Math.sin(angle) * (r + 2);
        ctx.arc(px, py, 3, 0, Math.PI * 2);
      }
      ctx.fill();

      // 3. Mooncake Golden Body
      ctx.fillStyle = cake.color;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Inner floral imprint
      ctx.strokeStyle = cake.secondary;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
      ctx.stroke();

      // 4. Cute Big Eyes Looking Around
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-5, -2, 3.5, 0, Math.PI * 2);
      ctx.arc(5, -2, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Pupils looking backward towards Cuội
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-6, -2, 1.8, 0, Math.PI * 2);
      ctx.arc(4, -2, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Rosy cheeks
      ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.beginPath();
      ctx.arc(-8, 3, 2, 0, Math.PI * 2);
      ctx.arc(8, 3, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }
}
