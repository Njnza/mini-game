/**
 * Player.js
 * Chú Cuội character controller, physics engine, and vector renderer.
 */

import { SKINS } from '../data/skins.js';

export class Player {
  constructor(canvasWidth = 800, canvasHeight = 520) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    this.width = 46;
    this.height = 50;
    this.x = 120;
    this.y = 220;
    this.vy = 0;
    this.angle = 0;

    this.gravity = 620;
    this.thrustPower = 950;
    this.maxFallSpeed = 380;
    this.maxRiseSpeed = -400;

    this.isThrusting = false;
    this.invulnerableTimer = 0;
    this.hasShield = false;
    this.isTurbo = false;
    this.turboTimer = 0;

    this.expression = 'normal'; // 'normal', 'happy', 'scared', 'dizzy'
    this.expressionTimer = 0;

    this.currentSkinId = 'classic';
    this.skin = SKINS.classic;

    this.animTime = 0;
  }

  reset() {
    this.x = 120;
    this.y = 220;
    this.vy = 0;
    this.angle = 0;
    this.isThrusting = false;
    this.invulnerableTimer = 0;
    this.hasShield = false;
    this.isTurbo = false;
    this.turboTimer = 0;
    this.expression = 'normal';
    this.expressionTimer = 0;
    this.animTime = 0;
  }

  setSkin(skinId) {
    if (SKINS[skinId]) {
      this.currentSkinId = skinId;
      this.skin = SKINS[skinId];
    }
  }

  setExpression(expr, duration = 1.0) {
    this.expression = expr;
    this.expressionTimer = duration;
  }

  applyDamage() {
    if (this.invulnerableTimer > 0 || this.isTurbo) return false;

    if (this.hasShield) {
      this.hasShield = false;
      this.invulnerableTimer = 1.0;
      this.setExpression('scared', 1.0);
      return false; // Shield absorbed hit
    }

    this.invulnerableTimer = 1.8;
    this.setExpression('dizzy', 1.2);
    return true; // Took actual life damage
  }

  update(dt, fxManager) {
    this.animTime += dt;

    if (this.expressionTimer > 0) {
      this.expressionTimer -= dt;
      if (this.expressionTimer <= 0) {
        this.expression = 'normal';
      }
    }

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }

    if (this.turboTimer > 0) {
      this.turboTimer -= dt;
      if (this.turboTimer <= 0) {
        this.isTurbo = false;
      }
    }

    // Physics
    if (this.isThrusting) {
      this.vy -= this.thrustPower * dt;
      if (fxManager) {
        const sparkColor = this.isTurbo ? '#fde047' : this.skin.branchColor;
        fxManager.createThrustSparks(this.x - 15, this.y + 18, sparkColor);
      }
    } else {
      this.vy += this.gravity * dt;
    }

    // Clamp vertical velocity
    this.vy = Math.max(this.maxRiseSpeed, Math.min(this.maxFallSpeed, this.vy));
    this.y += this.vy * dt;

    // Boundary constraints
    const topLimit = 32;
    const bottomLimit = this.canvasHeight - 65;

    if (this.y < topLimit) {
      this.y = topLimit;
      this.vy = 0;
    } else if (this.y > bottomLimit) {
      this.y = bottomLimit;
      this.vy = 0;
    }

    // Smooth tilt angle
    const targetAngle = (this.vy / this.maxFallSpeed) * 0.35;
    this.angle += (targetAngle - this.angle) * 10 * dt;
  }

  render(ctx) {
    // Blink when invulnerable
    if (this.invulnerableTimer > 0 && Math.floor(this.animTime * 14) % 2 === 0) {
      return;
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // 1. Turbo / Shield Glowing Auras
    if (this.isTurbo) {
      ctx.save();
      ctx.fillStyle = 'rgba(250, 204, 21, 0.3)';
      ctx.beginPath();
      ctx.arc(0, 0, 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    } else if (this.hasShield) {
      ctx.save();
      ctx.fillStyle = 'rgba(244, 63, 94, 0.25)';
      ctx.beginPath();
      ctx.arc(0, 0, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.restore();
    }

    // 2. The Magical Banyan Branch (underneath Cuội)
    const branchBob = Math.sin(this.animTime * 8) * 2;
    ctx.save();
    ctx.fillStyle = '#78350f'; // Dark wood
    ctx.beginPath();
    ctx.roundRect(-24, 12 + branchBob, 48, 8, 4);
    ctx.fill();

    // Glowing banyan leaves on branch
    ctx.fillStyle = this.skin.branchColor;
    ctx.beginPath();
    ctx.ellipse(-18, 14 + branchBob, 8, 4, -0.2, 0, Math.PI * 2);
    ctx.ellipse(16, 14 + branchBob, 7, 4, 0.3, 0, Math.PI * 2);
    ctx.ellipse(-2, 18 + branchBob, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Branch magic exhaust glow
    if (this.isThrusting) {
      ctx.fillStyle = this.isTurbo ? '#fef08a' : '#38bdf8';
      ctx.beginPath();
      ctx.arc(-22, 16 + branchBob, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 3. Cuội's Body / Robe
    ctx.fillStyle = this.skin.robeColor;
    ctx.beginPath();
    ctx.roundRect(-12, -10, 24, 24, 6);
    ctx.fill();

    // Robe sash / belt
    ctx.fillStyle = this.skin.robeSecondary;
    ctx.fillRect(-12, 2, 24, 4);

    // Patch on robe (humorous detail)
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(2, -4, 6, 6);
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1;
    ctx.strokeRect(2, -4, 6, 6);

    // 4. Cuội's Head & Face
    const headY = -22;
    ctx.fillStyle = '#fed7aa'; // Skin tone
    ctx.beginPath();
    ctx.arc(0, headY, 13, 0, Math.PI * 2);
    ctx.fill();

    // Hat / Hair based on skin
    if (this.currentSkinId === 'classic') {
      // Traditional Vietnamese Conical Straw Hat (Nón Lá)
      ctx.fillStyle = this.skin.hatColor;
      ctx.beginPath();
      ctx.moveTo(0, headY - 18);
      ctx.lineTo(-18, headY - 2);
      ctx.lineTo(18, headY - 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#a16207';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else if (this.currentSkinId === 'genz') {
      // Cool Cap & Sunglasses
      ctx.fillStyle = this.skin.hatColor;
      ctx.beginPath();
      ctx.arc(0, headY - 5, 14, Math.PI, 0);
      ctx.lineTo(16, headY - 5);
      ctx.fill();
      // Cyber Shades
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-8, headY - 3, 16, 6);
    } else if (this.currentSkinId === 'bunny') {
      // Bunny Ears hood
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.ellipse(-7, headY - 17, 4, 11, -0.2, 0, Math.PI * 2);
      ctx.ellipse(7, headY - 17, 4, 11, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.ellipse(-7, headY - 17, 2, 8, -0.2, 0, Math.PI * 2);
      ctx.ellipse(7, headY - 17, 2, 8, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Eyes & Expressions
    if (this.expression === 'dizzy') {
      // Spiral dizzy eyes
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(-4, headY, 3, 0, Math.PI * 1.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(4, headY, 3, 0, Math.PI * 1.5);
      ctx.stroke();
    } else if (this.expression === 'scared') {
      // Big alarmed eyes
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-4, headY - 1, 4, 0, Math.PI * 2);
      ctx.arc(4, headY - 1, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(-4, headY - 1, 1.8, 0, Math.PI * 2);
      ctx.arc(4, headY - 1, 1.8, 0, Math.PI * 2);
      ctx.fill();
      // O mouth
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.arc(0, headY + 5, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.expression === 'happy') {
      // Winking happy eyes (^_~)
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(-4, headY - 1, 3, Math.PI, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(4, headY - 1, 3, Math.PI, 0);
      ctx.stroke();
      // Big grin
      ctx.beginPath();
      ctx.arc(0, headY + 3, 4, 0, Math.PI);
      ctx.stroke();
    } else {
      // Normal cartoon face
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-4, headY - 1, 2, 0, Math.PI * 2);
      ctx.arc(4, headY - 1, 2, 0, Math.PI * 2);
      ctx.fill();
      // Friendly smile
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, headY + 4, 3, 0, Math.PI);
      ctx.stroke();
    }

    // 5. Arms holding the branch
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(6, 6, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
