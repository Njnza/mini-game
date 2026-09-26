/**
 * FXManager.js
 * Particle effects, floating combat/combo text, screen shake, and confetti.
 */

export class FXManager {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
    this.confetti = [];
    this.shakeIntensity = 0;
    this.shakeTimer = 0;
  }

  reset() {
    this.particles = [];
    this.floatingTexts = [];
    this.confetti = [];
    this.shakeIntensity = 0;
    this.shakeTimer = 0;
  }

  triggerScreenShake(intensity = 5, duration = 0.2) {
    this.shakeIntensity = intensity;
    this.shakeTimer = duration;
  }

  getShakeOffset() {
    if (this.shakeTimer <= 0) return { x: 0, y: 0 };
    const factor = this.shakeIntensity * (this.shakeTimer / 0.2);
    return {
      x: (Math.random() - 0.5) * 2 * factor,
      y: (Math.random() - 0.5) * 2 * factor
    };
  }

  addFloatingText(text, x, y, color = '#fbbf24', fontSize = 18) {
    this.floatingTexts.push({
      text,
      x,
      y,
      color,
      fontSize,
      life: 0.9,
      maxLife: 0.9,
      vy: -35
    });
  }

  createMergeSparks(x, y, color = '#fbbf24', count = 18) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 120;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        radius: 2.5 + Math.random() * 3.5,
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.8
      });
    }
  }

  createIceBreakSparks(x, y) {
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 100;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: Math.random() > 0.4 ? '#38bdf8' : '#e0f2fe',
        radius: 3 + Math.random() * 3,
        life: 0.6 + Math.random() * 0.3,
        maxLife: 0.9
      });
    }
  }

  spawnVictoryConfetti(width, height) {
    const colors = ['#f43f5e', '#38bdf8', '#fbbf24', '#10b981', '#a855f7', '#ec4899'];
    for (let i = 0; i < 70; i++) {
      this.confetti.push({
        x: Math.random() * width,
        y: -10 - Math.random() * 50,
        vx: (Math.random() - 0.5) * 80,
        vy: 120 + Math.random() * 160,
        color: colors[Math.floor(Math.random() * colors.length)],
        width: 6 + Math.random() * 6,
        height: 10 + Math.random() * 8,
        angle: Math.random() * Math.PI * 2,
        vAngle: (Math.random() - 0.5) * 8,
        life: 2.5,
        maxLife: 2.5
      });
    }
  }

  update(dt) {
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      if (this.shakeTimer <= 0) this.shakeIntensity = 0;
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // Update Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.y += t.vy * dt;
      t.life -= dt;
      if (t.life <= 0) this.floatingTexts.splice(i, 1);
    }

    // Update Confetti
    for (let i = this.confetti.length - 1; i >= 0; i--) {
      const c = this.confetti[i];
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.angle += c.vAngle * dt;
      c.life -= dt;
      if (c.life <= 0) this.confetti.splice(i, 1);
    }
  }

  render(ctx) {
    // Draw Particles
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw Floating Texts
    for (const t of this.floatingTexts) {
      const alpha = Math.max(0, t.life / t.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `bold ${t.fontSize}px 'Outfit', sans-serif`;
      ctx.fillStyle = t.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 6;
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    }

    // Draw Confetti
    for (const c of this.confetti) {
      const alpha = Math.max(0, c.life / c.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(c.x, c.y);
      ctx.rotate(c.angle);
      ctx.fillStyle = c.color;
      ctx.fillRect(-c.width / 2, -c.height / 2, c.width, c.height);
      ctx.restore();
    }
  }
}
