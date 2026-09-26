/**
 * FXManager.js
 * Particle effects, floating combat text, screen shake, and visual juice.
 */

export class FXManager {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
    this.shakeIntensity = 0;
    this.shakeTimer = 0;
  }

  reset() {
    this.particles = [];
    this.floatingTexts = [];
    this.shakeIntensity = 0;
    this.shakeTimer = 0;
  }

  triggerScreenShake(intensity = 6, duration = 0.25) {
    this.shakeIntensity = intensity;
    this.shakeTimer = duration;
  }

  getShakeOffset() {
    if (this.shakeTimer <= 0) return { x: 0, y: 0 };
    const factor = this.shakeIntensity * (this.shakeTimer / 0.25);
    return {
      x: (Math.random() - 0.5) * 2 * factor,
      y: (Math.random() - 0.5) * 2 * factor
    };
  }

  addFloatingText(text, x, y, color = '#fbbf24', fontSize = 16) {
    this.floatingTexts.push({
      text,
      x,
      y,
      color,
      fontSize,
      life: 0.9,
      maxLife: 0.9,
      vy: -40
    });
  }

  createMooncakeCatchSparks(x, y) {
    // Golden crumb burst
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 90;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: Math.random() > 0.4 ? '#fbbf24' : '#f59e0b',
        radius: 2 + Math.random() * 3,
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.8
      });
    }
  }

  createThrustSparks(x, y, color = '#34d399') {
    // Sparks shooting downwards and backwards from banyan branch
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + Math.random() * 6,
        vx: -60 - Math.random() * 80,
        vy: 40 + Math.random() * 80,
        color: Math.random() > 0.5 ? color : '#fef08a',
        radius: 2 + Math.random() * 2.5,
        life: 0.3 + Math.random() * 0.2,
        maxLife: 0.5
      });
    }
  }

  createExplosion(x, y, mainColor = '#f97316') {
    for (let i = 0; i < 22; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 140;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: Math.random() > 0.3 ? mainColor : '#ef4444',
        radius: 3 + Math.random() * 4,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 1.0
      });
    }
  }

  update(dt) {
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      if (this.shakeTimer <= 0) this.shakeIntensity = 0;
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.y += t.vy * dt;
      t.life -= dt;
      if (t.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  render(ctx) {
    // Draw particles
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

    // Draw floating combat texts
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
  }
}
