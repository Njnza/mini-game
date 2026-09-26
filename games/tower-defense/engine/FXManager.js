/**
 * FXManager.js
 * Particle effects, floating combat text, screen shake, and visual juice.
 */

export class FXManager {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
    this.screenShake = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }

  reset() {
    this.particles = [];
    this.floatingTexts = [];
    this.screenShake = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }

  triggerShake(intensity = 6) {
    this.screenShake = Math.max(this.screenShake, intensity);
  }

  addFloatingText(text, x, y, color = '#f8fafc', size = 13, duration = 0.8) {
    this.floatingTexts.push({
      text,
      x: x + (Math.random() - 0.5) * 12,
      y: y - 8,
      color,
      size,
      alpha: 1.0,
      duration,
      life: duration,
      vy: -35 - Math.random() * 20
    });
  }

  addExplosion(x, y, color = '#f59e0b', count = 16, maxSpeed = 120, radius = 40) {
    // Blast ring
    this.particles.push({
      type: 'ring',
      x,
      y,
      radius: 4,
      maxRadius: radius,
      color,
      alpha: 1.0,
      life: 0.35,
      maxLife: 0.35
    });

    // Sparks
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 25 + Math.random() * maxSpeed;
      this.particles.push({
        type: 'spark',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        color,
        alpha: 1.0,
        life: 0.3 + Math.random() * 0.35,
        maxLife: 0.65
      });
    }
  }

  addFrostBurst(x, y, radius = 45) {
    this.particles.push({
      type: 'ring',
      x,
      y,
      radius: 6,
      maxRadius: radius,
      color: '#38bdf8',
      alpha: 0.9,
      life: 0.4,
      maxLife: 0.4
    });

    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 20 + Math.random() * 60;
      this.particles.push({
        type: 'spark',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 2.5,
        color: '#7dd3fc',
        alpha: 1.0,
        life: 0.45,
        maxLife: 0.45
      });
    }
  }

  addLaserImpact(x, y, color = '#a855f7') {
    for (let i = 0; i < 3; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 50;
      this.particles.push({
        type: 'spark',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1.5 + Math.random() * 2,
        color,
        alpha: 0.9,
        life: 0.15 + Math.random() * 0.15,
        maxLife: 0.3
      });
    }
  }

  update(dt) {
    // Screen shake decay
    if (this.screenShake > 0) {
      this.shakeOffsetX = (Math.random() - 0.5) * this.screenShake * 2;
      this.shakeOffsetY = (Math.random() - 0.5) * this.screenShake * 2;
      this.screenShake = Math.max(0, this.screenShake - dt * 25);
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      ft.y += ft.vy * dt;
      ft.alpha = Math.max(0, ft.life / ft.duration);
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      p.alpha = Math.max(0, p.life / p.maxLife);

      if (p.type === 'spark') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.93;
        p.vy *= 0.93;
      } else if (p.type === 'ring') {
        const progress = 1 - (p.life / p.maxLife);
        p.radius = 4 + progress * (p.maxRadius - 4);
      }
    }
  }

  render(ctx) {
    ctx.save();

    // Render particles
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      ctx.globalAlpha = p.alpha;

      if (p.type === 'spark') {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'ring') {
        ctx.strokeStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.lineWidth = 2.5 * p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, p.radius), 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Render floating combat text
    ctx.shadowBlur = 4;
    for (let i = 0; i < this.floatingTexts.length; i++) {
      const ft = this.floatingTexts[i];
      ctx.globalAlpha = ft.alpha;
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.font = `700 ${ft.size}px 'Orbitron', monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
    }

    ctx.restore();
  }
}
