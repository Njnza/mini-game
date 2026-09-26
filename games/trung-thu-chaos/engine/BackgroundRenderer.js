/**
 * BackgroundRenderer.js
 * Multi-layer Parallax Vietnamese Mid-Autumn Night Sky.
 * Features glowing full moon, floating lotus lanterns, ancient rooftops, and twinkling stars.
 */

export class BackgroundRenderer {
  constructor(width = 800, height = 520) {
    this.width = width;
    this.height = height;
    this.stars = [];
    this.clouds = [];
    this.lotusLanterns = [];
    this._initStars();
    this._initClouds();
    this._initLotusLanterns();
  }

  _initStars() {
    this.stars = [];
    for (let i = 0; i < 65; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * (this.height * 0.7),
        radius: 0.8 + Math.random() * 1.6,
        pulseSpeed: 1 + Math.random() * 2,
        baseAlpha: 0.3 + Math.random() * 0.6
      });
    }
  }

  _initClouds() {
    this.clouds = [];
    for (let i = 0; i < 6; i++) {
      this.clouds.push({
        x: Math.random() * this.width,
        y: 40 + Math.random() * 160,
        radius: 35 + Math.random() * 45,
        speed: 8 + Math.random() * 12,
        alpha: 0.15 + Math.random() * 0.15
      });
    }
  }

  _initLotusLanterns() {
    this.lotusLanterns = [];
    for (let i = 0; i < 5; i++) {
      this.lotusLanterns.push({
        x: Math.random() * this.width,
        y: this.height - 35 - Math.random() * 30,
        speed: 15 + Math.random() * 15,
        bobSpeed: 1.5 + Math.random() * 1.5,
        size: 16 + Math.random() * 8
      });
    }
  }

  update(dt, scrollSpeed = 120) {
    // Drifting clouds
    for (const c of this.clouds) {
      c.x -= (c.speed + scrollSpeed * 0.1) * dt;
      if (c.x < -c.radius * 2) {
        c.x = this.width + c.radius * 2;
        c.y = 40 + Math.random() * 160;
      }
    }

    // Drifting bottom river lotus lanterns
    for (const l of this.lotusLanterns) {
      l.x -= (l.speed + scrollSpeed * 0.4) * dt;
      if (l.x < -40) {
        l.x = this.width + 40;
        l.y = this.height - 35 - Math.random() * 30;
      }
    }
  }

  render(ctx, scrollDistance = 0, time = 0) {
    const w = this.width;
    const h = this.height;

    // 1. Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, '#090518');
    skyGrad.addColorStop(0.5, '#190e38');
    skyGrad.addColorStop(1, '#2c144d');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Giant Glowing Full Moon (Layer 0 - far background)
    const moonX = w * 0.78;
    const moonY = 110;
    const moonRadius = 55;

    // Moon soft aura
    const moonAura = ctx.createRadialGradient(moonX, moonY, moonRadius * 0.8, moonX, moonY, moonRadius * 2.4);
    moonAura.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
    moonAura.addColorStop(0.5, 'rgba(250, 204, 21, 0.15)');
    moonAura.addColorStop(1, 'rgba(250, 204, 21, 0)');
    ctx.fillStyle = moonAura;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonRadius * 2.4, 0, Math.PI * 2);
    ctx.fill();

    // Moon body
    const moonBody = ctx.createRadialGradient(moonX - 12, moonY - 12, 10, moonX, moonY, moonRadius);
    moonBody.addColorStop(0, '#fef9c3');
    moonBody.addColorStop(0.8, '#fef08a');
    moonBody.addColorStop(1, '#fde047');
    ctx.fillStyle = moonBody;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
    ctx.fill();

    // Folklore silhouette on the moon (Banyan tree + Cuội silhouette)
    ctx.save();
    ctx.fillStyle = 'rgba(180, 83, 9, 0.22)';
    ctx.beginPath();
    ctx.arc(moonX - 8, moonY - 6, 20, 0, Math.PI * 2);
    ctx.arc(moonX + 10, moonY - 14, 16, 0, Math.PI * 2);
    ctx.arc(moonX + 14, moonY + 12, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. Twinkling Stars
    for (const s of this.stars) {
      const alpha = s.baseAlpha + Math.sin(time * s.pulseSpeed) * 0.25;
      ctx.fillStyle = `rgba(254, 249, 195, ${Math.max(0.1, Math.min(1, alpha))})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Distant Parallax Clouds
    for (const c of this.clouds) {
      ctx.fillStyle = `rgba(216, 180, 254, ${c.alpha})`;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
      ctx.arc(c.x + c.radius * 0.7, c.y - 6, c.radius * 0.8, 0, Math.PI * 2);
      ctx.arc(c.x - c.radius * 0.7, c.y + 4, c.radius * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Far Mountains / Skyline (Layer 2)
    const farOffset = (scrollDistance * 0.2) % 300;
    ctx.fillStyle = '#140c2e';
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = -300; x < w + 300; x += 150) {
      const peakX = x - farOffset;
      ctx.lineTo(peakX, h - 130);
      ctx.lineTo(peakX + 75, h - 85);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // 6. Midground Pagoda Silhouettes & Ancient Roofs (Layer 3)
    const midOffset = (scrollDistance * 0.5) % 240;
    ctx.fillStyle = '#1c103f';
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = -240; x < w + 240; x += 120) {
      const rx = x - midOffset;
      // Roof curve
      ctx.lineTo(rx, h - 70);
      ctx.quadraticCurveTo(rx + 30, h - 110, rx + 60, h - 65);
      ctx.lineTo(rx + 120, h - 55);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // 7. Foreground Floating River & Lotus Lanterns (Bottom boundary)
    const riverGrad = ctx.createLinearGradient(0, h - 50, 0, h);
    riverGrad.addColorStop(0, 'rgba(49, 18, 92, 0.85)');
    riverGrad.addColorStop(1, 'rgba(15, 6, 32, 0.98)');
    ctx.fillStyle = riverGrad;
    ctx.fillRect(0, h - 50, w, 50);

    // Glowing waterline
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, h - 50);
    ctx.lineTo(w, h - 50);
    ctx.stroke();

    // Draw lotus lanterns on river
    for (const l of this.lotusLanterns) {
      const bobY = l.y + Math.sin(time * l.bobSpeed) * 3;
      ctx.save();
      // Glow
      ctx.fillStyle = 'rgba(244, 63, 94, 0.25)';
      ctx.beginPath();
      ctx.arc(l.x, bobY, l.size * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Petals
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.ellipse(l.x - 8, bobY, 7, 4, -0.2, 0, Math.PI * 2);
      ctx.ellipse(l.x + 8, bobY, 7, 4, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Center candle
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(l.x, bobY - 3, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
