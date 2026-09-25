import { BaseGame } from '../../src/core/BaseGame.js';

export default class CyberFlappyGame extends BaseGame {
  init() {
    this.container.innerHTML = `
      <div class="flappy-wrapper" style="position:relative; width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center;">
        <canvas id="flappy-canvas" style="display:block; border-radius:16px; box-shadow:0 10px 30px rgba(0,0,0,0.6); background:linear-gradient(180deg, #090919 0%, #171033 100%); cursor:pointer;"></canvas>
        <div style="margin-top:10px; color:#94a3b8; font-size:0.85rem; font-weight:500;">
          💡 Click, Tap or press Spacebar to boost
        </div>
      </div>
    `;

    this.canvas = this.container.querySelector('#flappy-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.setupCanvasSize();

    // Input listeners
    const triggerJump = (e) => {
      if (e.type === 'keydown' && e.code !== 'Space') return;
      if (e.target && e.target.tagName === 'BUTTON') return;
      if (e.cancelable) e.preventDefault();
      this.jump();
    };

    this.addTrackedEventListener(this.canvas, 'pointerdown', triggerJump);
    this.addTrackedEventListener(window, 'keydown', triggerJump);

    const onResize = () => this.setupCanvasSize();
    this.addTrackedEventListener(window, 'resize', onResize);
  }

  setupCanvasSize() {
    const rect = this.container.getBoundingClientRect();
    const width = Math.min(rect.width - 24, 480);
    const height = Math.min(rect.height - 60, 560);
    this.canvas.width = Math.max(320, width);
    this.canvas.height = Math.max(400, height);
  }

  start() {
    super.start();

    // Starship state
    this.ship = {
      x: this.canvas.width * 0.25,
      y: this.canvas.height * 0.45,
      radius: 14,
      vy: 0,
      gravity: 880,
      jumpForce: -320,
      angle: 0
    };

    this.pipes = [];
    this.particles = [];
    this.stars = [];
    this.pipeTimer = 0;
    this.pipeInterval = 1.8;
    this.pipeSpeed = 160;
    this.pipeGap = 135;

    // Parallax background stars
    for (let i = 0; i < 40; i++) {
      this.stars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        speed: 20 + Math.random() * 50,
        radius: 0.5 + Math.random() * 1.5,
        alpha: 0.3 + Math.random() * 0.7
      });
    }

    this.startLoop(this.ctx);
  }

  jump() {
    if (!this.isRunning || this.isPaused || this.isGameOver) return;
    this.ship.vy = this.ship.jumpForce;
    this.audio.playJump();

    // Thruster particle blast
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: this.ship.x - 12,
        y: this.ship.y,
        vx: -80 - Math.random() * 80,
        vy: (Math.random() - 0.5) * 60,
        radius: 3 + Math.random() * 2,
        color: '#c084fc',
        life: 0.3,
        maxLife: 0.3
      });
    }
  }

  spawnPipe() {
    const minHeight = 60;
    const maxHeight = this.canvas.height - this.pipeGap - minHeight;
    const topHeight = minHeight + Math.random() * (maxHeight - minHeight);

    this.pipes.push({
      x: this.canvas.width,
      width: 55,
      topHeight,
      bottomY: topHeight + this.pipeGap,
      passed: false
    });
  }

  update(dt) {
    // Parallax stars
    this.stars.forEach(s => {
      s.x -= s.speed * dt;
      if (s.x < 0) {
        s.x = this.canvas.width;
        s.y = Math.random() * this.canvas.height;
      }
    });

    // Physics
    this.ship.vy += this.ship.gravity * dt;
    this.ship.y += this.ship.vy * dt;

    // Smooth angle interpolation
    const targetAngle = Math.min(Math.max(this.ship.vy / 400, -0.6), 0.8);
    this.ship.angle += (targetAngle - this.ship.angle) * 8 * dt;

    // Thruster exhaust trail
    if (Math.random() < 0.6) {
      this.particles.push({
        x: this.ship.x - 10,
        y: this.ship.y + (Math.random() - 0.5) * 6,
        vx: -60 - Math.random() * 40,
        vy: (Math.random() - 0.5) * 20,
        radius: 2 + Math.random() * 2,
        color: '#818cf8',
        life: 0.25,
        maxLife: 0.25
      });
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // Ceiling & floor boundaries
    if (this.ship.y - this.ship.radius <= 0 || this.ship.y + this.ship.radius >= this.canvas.height) {
      this.audio.playExplosion();
      this.emitGameOver();
      return;
    }

    // Spawn pipes
    this.pipeTimer += dt;
    if (this.pipeTimer >= this.pipeInterval) {
      this.pipeTimer = 0;
      this.spawnPipe();
    }

    // Pipes and collision
    for (let i = this.pipes.length - 1; i >= 0; i--) {
      const p = this.pipes[i];
      p.x -= this.pipeSpeed * dt;

      // Score upon passing
      if (!p.passed && p.x + p.width < this.ship.x) {
        p.passed = true;
        this.emitScore(this.score + 1);
        this.audio.playScore();
      }

      // AABB Collision check
      const shipLeft = this.ship.x - this.ship.radius + 3;
      const shipRight = this.ship.x + this.ship.radius - 3;
      const shipTop = this.ship.y - this.ship.radius + 3;
      const shipBottom = this.ship.y + this.ship.radius - 3;

      const collidesWithTop =
        shipRight > p.x &&
        shipLeft < p.x + p.width &&
        shipTop < p.topHeight;

      const collidesWithBottom =
        shipRight > p.x &&
        shipLeft < p.x + p.width &&
        shipBottom > p.bottomY;

      if (collidesWithTop || collidesWithBottom) {
        this.audio.playExplosion();
        this.emitGameOver();
        return;
      }

      // Cleanup offscreen pipes
      if (p.x + p.width < -10) {
        this.pipes.splice(i, 1);
      }
    }
  }

  render(ctx) {
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Render stars
    this.stars.forEach(s => {
      ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Render pipes
    this.pipes.forEach(p => {
      ctx.save();
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 12;

      // Top pipe
      const gradTop = ctx.createLinearGradient(p.x, 0, p.x + p.width, 0);
      gradTop.addColorStop(0, '#581c87');
      gradTop.addColorStop(0.5, '#9333ea');
      gradTop.addColorStop(1, '#581c87');
      ctx.fillStyle = gradTop;
      ctx.fillRect(p.x, 0, p.width, p.topHeight);

      // Top laser emitter edge
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(p.x - 3, p.topHeight - 10, p.width + 6, 10);

      // Bottom pipe
      const gradBottom = ctx.createLinearGradient(p.x, 0, p.x + p.width, 0);
      gradBottom.addColorStop(0, '#581c87');
      gradBottom.addColorStop(0.5, '#9333ea');
      gradBottom.addColorStop(1, '#581c87');
      ctx.fillStyle = gradBottom;
      const bHeight = this.canvas.height - p.bottomY;
      ctx.fillRect(p.x, p.bottomY, p.width, bHeight);

      // Bottom laser emitter edge
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(p.x - 3, p.bottomY, p.width + 6, 10);

      ctx.restore();
    });

    // Render particles
    this.particles.forEach(p => {
      ctx.save();
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Render starship
    ctx.save();
    ctx.translate(this.ship.x, this.ship.y);
    ctx.rotate(this.ship.angle);

    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 16;

    // Ship hull
    ctx.fillStyle = '#0ea5e9';
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(-14, -10);
    ctx.lineTo(-8, 0);
    ctx.lineTo(-14, 10);
    ctx.closePath();
    ctx.fill();

    // Canopy glass
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.ellipse(2, 0, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wing thrusters
    ctx.fillStyle = '#818cf8';
    ctx.fillRect(-12, -4, 4, 8);

    ctx.restore();
  }
}
