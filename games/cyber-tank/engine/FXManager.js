/**
 * FXManager.js
 * High-performance 60FPS particle effects, visual shockwaves, tank tread marks,
 * floating combat typography, and screen shake impulse manager.
 */

export class FXManager {
  constructor() {
    this.particles = [];
    this.treadMarks = [];
    this.floatingTexts = [];
    this.shockwaves = [];
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
  }

  reset() {
    this.particles = [];
    this.treadMarks = [];
    this.floatingTexts = [];
    this.shockwaves = [];
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
  }

  // Add screen shake impulse
  addShake(intensity = 6, duration = 0.25) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeDuration = Math.max(this.shakeDuration, duration);
  }

  getShakeOffset() {
    if (this.shakeDuration <= 0 || this.shakeIntensity <= 0) {
      return { x: 0, y: 0 };
    }
    const currentMag = this.shakeIntensity * (this.shakeDuration / 0.25);
    return {
      x: (Math.random() * 2 - 1) * currentMag,
      y: (Math.random() * 2 - 1) * currentMag
    };
  }

  // Add tank tread skid mark
  addTreadMark(x, y, angle, color = 'rgba(6, 182, 212, 0.2)') {
    // Keep max 150 marks for maximum performance
    if (this.treadMarks.length > 150) {
      this.treadMarks.shift();
    }
    this.treadMarks.push({
      x,
      y,
      angle,
      color,
      life: 1.0,
      decay: 0.15 // Fades over ~6.5 seconds
    });
  }

  // Floating combat text popup
  addFloatingText(text, x, y, color = '#38bdf8', scale = 1.0) {
    this.floatingTexts.push({
      text,
      x,
      y,
      vy: -35,
      color,
      scale,
      life: 1.0,
      decay: 1.4 // Fades over ~0.7s
    });
  }

  // Bullet muzzle flash
  createMuzzleFlash(x, y, angle, color = '#38bdf8') {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    for (let i = 0; i < 6; i++) {
      const spread = (Math.random() - 0.5) * 0.6;
      const speed = 120 + Math.random() * 140;
      this.particles.push({
        x: x + cos * 10,
        y: y + sin * 10,
        vx: Math.cos(angle + spread) * speed,
        vy: Math.sin(angle + spread) * speed,
        size: 3 + Math.random() * 3,
        color,
        life: 1.0,
        decay: 6.0
      });
    }
  }

  // Spark burst on wall ricochet
  createRicochetSparks(x, y, normalX, normalY, color = '#38bdf8') {
    const baseAngle = Math.atan2(normalY, normalX);
    for (let i = 0; i < 10; i++) {
      const spread = (Math.random() - 0.5) * Math.PI * 0.8;
      const angle = baseAngle + spread;
      const speed = 90 + Math.random() * 180;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 2.5,
        color,
        life: 1.0,
        decay: 4.5
      });
    }
  }

  // Fiery explosion with shockwave ring and debris
  createExplosion(x, y, isHeavy = false, color = '#f97316') {
    this.addShake(isHeavy ? 12 : 6, isHeavy ? 0.35 : 0.2);

    // Expanding shockwave ring
    this.shockwaves.push({
      x,
      y,
      radius: 8,
      maxRadius: isHeavy ? 90 : 55,
      color,
      alpha: 1.0,
      expansionRate: isHeavy ? 260 : 200
    });

    const count = isHeavy ? 35 : 20;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * (isHeavy ? 240 : 160);
      const colors = [color, '#facc15', '#ef4444', '#f8fafc'];
      const chosenColor = colors[Math.floor(Math.random() * colors.length)];
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * (isHeavy ? 6 : 4),
        color: chosenColor,
        life: 1.0,
        decay: 1.8 + Math.random() * 1.5
      });
    }
  }

  // Debris from broken barricade block
  createBlockDebris(x, y, color = '#f59e0b') {
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 120;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2.5 + Math.random() * 4,
        color,
        life: 1.0,
        decay: 2.5
      });
    }
  }

  // EMP lightning burst
  createEmpPulse(x, y, radius = 90) {
    this.addShake(5, 0.2);
    this.shockwaves.push({
      x,
      y,
      radius: 10,
      maxRadius: radius,
      color: '#a855f7',
      alpha: 1.0,
      expansionRate: 280
    });
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * radius * 0.8;
      this.particles.push({
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 50,
        vy: (Math.random() - 0.5) * 50,
        size: 2 + Math.random() * 3,
        color: '#c084fc',
        life: 1.0,
        decay: 3.5
      });
    }
  }

  update(dt) {
    // Screen shake decay
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      if (this.shakeDuration <= 0) {
        this.shakeIntensity = 0;
      }
    }

    // Tread marks decay
    for (let i = this.treadMarks.length - 1; i >= 0; i--) {
      const mark = this.treadMarks[i];
      mark.life -= mark.decay * dt;
      if (mark.life <= 0) {
        this.treadMarks.splice(i, 1);
      }
    }

    // Particles update
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.94; // slight drag
      p.vy *= 0.94;
      p.life -= p.decay * dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Shockwaves update
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += sw.expansionRate * dt;
      sw.alpha = Math.max(0, 1.0 - (sw.radius / sw.maxRadius));
      if (sw.radius >= sw.maxRadius || sw.alpha <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    // Floating text update
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.life -= ft.decay * dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  renderUnderlay(ctx) {
    // Render tank tread marks beneath units
    for (let i = 0; i < this.treadMarks.length; i++) {
      const tm = this.treadMarks[i];
      ctx.save();
      ctx.translate(tm.x, tm.y);
      ctx.rotate(tm.angle);
      ctx.fillStyle = tm.color;
      ctx.globalAlpha = Math.max(0, tm.life * 0.45);
      // Dual tread lines
      ctx.fillRect(-10, -11, 20, 4);
      ctx.fillRect(-10, 7, 20, 4);
      ctx.restore();
    }
  }

  renderOverlay(ctx) {
    // Render shockwaves
    for (let i = 0; i < this.shockwaves.length; i++) {
      const sw = this.shockwaves[i];
      ctx.save();
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = 3;
      ctx.globalAlpha = sw.alpha * 0.8;
      ctx.stroke();
      ctx.restore();
    }

    // Render particles
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Render floating combat texts
    for (let i = 0; i < this.floatingTexts.length; i++) {
      const ft = this.floatingTexts[i];
      ctx.save();
      ctx.font = `bold ${Math.round(13 * ft.scale)}px 'Orbitron', sans-serif`;
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = Math.max(0, ft.life);
      ctx.textAlign = 'center';
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 8;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }
}
