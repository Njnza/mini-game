import { BaseGame } from '../../src/core/BaseGame.js';

export default class BrickBreakerGame extends BaseGame {
  init() {
    this.container.innerHTML = `
      <div class="breaker-wrapper" style="position:relative; width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center;">
        <div style="position:absolute; top:12px; left:20px; right:20px; display:flex; justify-content:space-between; font-weight:700; font-size:1.1rem; pointer-events:none; z-index:10;">
          <div style="background:rgba(15,23,42,0.8); backdrop-filter:blur(8px); padding:8px 16px; border-radius:12px; border:1px solid rgba(255,255,255,0.1); color:#ec4899;">
            ❤️ Lives: <span id="bb-lives">3</span>
          </div>
          <div style="background:rgba(15,23,42,0.8); backdrop-filter:blur(8px); padding:8px 16px; border-radius:12px; border:1px solid rgba(255,255,255,0.1); color:#06b6d4;">
            🧱 Remaining: <span id="bb-bricks">0</span>
          </div>
        </div>
        <canvas id="breaker-canvas" style="display:block; border-radius:16px; box-shadow:0 10px 30px rgba(0,0,0,0.6); background:#040714; cursor:none;"></canvas>
      </div>
    `;

    this.canvas = this.container.querySelector('#breaker-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.livesEl = this.container.querySelector('#bb-lives');
    this.bricksEl = this.container.querySelector('#bb-bricks');

    this.setupCanvasSize();

    // Mouse / Touch movement
    const onPointerMove = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
      this.paddle.x = Math.max(0, Math.min(mouseX - this.paddle.width / 2, this.canvas.width - this.paddle.width));
    };
    this.addTrackedEventListener(this.canvas, 'pointermove', onPointerMove);

    // Launch ball on click
    const onPointerDown = () => {
      if (this.ballAttached) {
        this.launchBall();
      }
    };
    this.addTrackedEventListener(this.canvas, 'pointerdown', onPointerDown);

    // Keyboard controls
    this.keys = { left: false, right: false };
    const onKeyDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = true;
      if (e.code === 'Space' && this.ballAttached) this.launchBall();
    };
    const onKeyUp = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = false;
    };
    this.addTrackedEventListener(window, 'keydown', onKeyDown);
    this.addTrackedEventListener(window, 'keyup', onKeyUp);

    const onResize = () => this.setupCanvasSize();
    this.addTrackedEventListener(window, 'resize', onResize);
  }

  setupCanvasSize() {
    const rect = this.container.getBoundingClientRect();
    const width = Math.min(rect.width - 24, 680);
    const height = Math.min(rect.height - 40, 520);
    this.canvas.width = Math.max(320, width);
    this.canvas.height = Math.max(400, height);
  }

  start() {
    super.start();
    this.lives = 3;
    this.ballAttached = true;
    this.particles = [];
    this.powerups = [];

    this.paddle = {
      width: 100,
      height: 14,
      x: (this.canvas.width - 100) / 2,
      y: this.canvas.height - 32,
      speed: 550
    };

    this.balls = [];
    this.resetBall();

    this.initBricks();
    this.updateHUD();
    this.startLoop(this.ctx);
  }

  resetBall() {
    this.ballAttached = true;
    this.balls = [{
      x: this.paddle.x + this.paddle.width / 2,
      y: this.paddle.y - 8,
      radius: 7,
      vx: 0,
      vy: 0,
      speed: 340
    }];
  }

  launchBall() {
    this.ballAttached = false;
    this.balls.forEach(b => {
      const angle = -Math.PI / 4 + (Math.random() * -Math.PI) / 2;
      b.vx = Math.cos(angle) * b.speed;
      b.vy = Math.sin(angle) * b.speed;
    });
    this.audio.playJump();
  }

  initBricks() {
    this.bricks = [];
    const rows = 5;
    const cols = 8;
    const padding = 8;
    const offsetTop = 55;
    const offsetLeft = 16;
    const brickWidth = (this.canvas.width - offsetLeft * 2 - (cols - 1) * padding) / cols;
    const brickHeight = 20;

    const rowColors = ['#f43f5e', '#fb923c', '#eab308', '#10b981', '#06b6d4'];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = offsetLeft + c * (brickWidth + padding);
        const y = offsetTop + r * (brickHeight + padding);
        const maxHp = r === 0 ? 2 : 1; // Top row has 2 hit points

        this.bricks.push({
          x,
          y,
          width: brickWidth,
          height: brickHeight,
          color: rowColors[r % rowColors.length],
          hp: maxHp,
          maxHp
        });
      }
    }
  }

  updateHUD() {
    if (this.livesEl) this.livesEl.textContent = this.lives;
    if (this.bricksEl) this.bricksEl.textContent = this.bricks.length;
  }

  createBrickParticles(x, y, color) {
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 120;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 2.5,
        color,
        life: 0.4,
        maxLife: 0.4
      });
    }
  }

  spawnPowerup(x, y) {
    if (Math.random() < 0.25) { // 25% drop rate
      const type = Math.random() < 0.5 ? 'expand' : 'multiball';
      this.powerups.push({
        x,
        y,
        width: 20,
        height: 20,
        vy: 140,
        type
      });
    }
  }

  update(dt) {
    // Keyboard paddle movement
    if (this.keys.left) {
      this.paddle.x = Math.max(0, this.paddle.x - this.paddle.speed * dt);
    }
    if (this.keys.right) {
      this.paddle.x = Math.min(this.canvas.width - this.paddle.width, this.paddle.x + this.paddle.speed * dt);
    }

    // Attached ball tracking
    if (this.ballAttached && this.balls.length > 0) {
      this.balls[0].x = this.paddle.x + this.paddle.width / 2;
      this.balls[0].y = this.paddle.y - this.balls[0].radius;
    }

    // Update balls
    for (let bIdx = this.balls.length - 1; bIdx >= 0; bIdx--) {
      const b = this.balls[bIdx];
      if (this.ballAttached) continue;

      b.x += b.vx * dt;
      b.y += b.vy * dt;

      // Left & right walls
      if (b.x - b.radius <= 0) {
        b.x = b.radius;
        b.vx = Math.abs(b.vx);
        this.audio.playHit();
      } else if (b.x + b.radius >= this.canvas.width) {
        b.x = this.canvas.width - b.radius;
        b.vx = -Math.abs(b.vx);
        this.audio.playHit();
      }

      // Ceiling wall
      if (b.y - b.radius <= 0) {
        b.y = b.radius;
        b.vy = Math.abs(b.vy);
        this.audio.playHit();
      }

      // Paddle bounce with angle modification based on impact point
      if (
        b.y + b.radius >= this.paddle.y &&
        b.y - b.radius <= this.paddle.y + this.paddle.height &&
        b.x >= this.paddle.x - 4 &&
        b.x <= this.paddle.x + this.paddle.width + 4 &&
        b.vy > 0
      ) {
        b.vy = -Math.abs(b.vy);
        const hitPoint = (b.x - (this.paddle.x + this.paddle.width / 2)) / (this.paddle.width / 2);
        const maxAngle = (75 * Math.PI) / 180;
        const currentSpeed = Math.hypot(b.vx, b.vy);
        const newSpeed = Math.min(currentSpeed * 1.01, 520);
        b.vx = newSpeed * Math.sin(hitPoint * maxAngle);
        b.vy = -newSpeed * Math.cos(hitPoint * maxAngle);

        this.audio.playHit();
      }

      // Brick collisions
      for (let i = this.bricks.length - 1; i >= 0; i--) {
        const br = this.bricks[i];
        if (
          b.x + b.radius >= br.x &&
          b.x - b.radius <= br.x + br.width &&
          b.y + b.radius >= br.y &&
          b.y - b.radius <= br.y + br.height
        ) {
          b.vy = -b.vy;
          br.hp--;

          if (br.hp <= 0) {
            this.emitScore(this.score + 15 * br.maxHp);
            this.audio.playScore();
            this.createBrickParticles(br.x + br.width / 2, br.y + br.height / 2, br.color);
            this.spawnPowerup(br.x + br.width / 2, br.y + br.height / 2);
            this.bricks.splice(i, 1);
            this.updateHUD();

            if (this.bricks.length === 0) {
              // Victory clear
              this.audio.playVictory();
              this.emitScore(this.score + 200);
              this.emitGameOver();
              return;
            }
          } else {
            this.audio.playHit();
          }
          break;
        }
      }

      // Ball drops below paddle
      if (b.y - b.radius > this.canvas.height) {
        this.balls.splice(bIdx, 1);
      }
    }

    // Ball loss logic
    if (this.balls.length === 0 && !this.ballAttached) {
      this.lives--;
      this.updateHUD();
      this.audio.playHit();

      if (this.lives <= 0) {
        this.emitGameOver();
        return;
      } else {
        this.resetBall();
      }
    }

    // Update powerups
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      p.y += p.vy * dt;

      // Paddle catches powerup
      if (
        p.y + p.height >= this.paddle.y &&
        p.y <= this.paddle.y + this.paddle.height &&
        p.x + p.width >= this.paddle.x &&
        p.x <= this.paddle.x + this.paddle.width
      ) {
        if (p.type === 'expand') {
          this.paddle.width = Math.min(this.canvas.width * 0.5, this.paddle.width + 30);
          this.audio.playCombo(2);
        } else if (p.type === 'multiball') {
          if (this.balls.length > 0) {
            const src = this.balls[0];
            for (let k = 0; k < 2; k++) {
              this.balls.push({
                x: src.x,
                y: src.y,
                radius: src.radius,
                vx: (Math.random() - 0.5) * 300,
                vy: -Math.abs(src.vy),
                speed: src.speed
              });
            }
          }
          this.audio.playCombo(4);
        }
        this.powerups.splice(i, 1);
      } else if (p.y > this.canvas.height) {
        this.powerups.splice(i, 1);
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  render(ctx) {
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Render bricks
    this.bricks.forEach(br => {
      ctx.save();
      ctx.shadowColor = br.color;
      ctx.shadowBlur = br.hp === br.maxHp ? 10 : 3;
      ctx.fillStyle = br.color;
      ctx.beginPath();
      ctx.roundRect(br.x, br.y, br.width, br.height, 4);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    });

    // Render powerups
    this.powerups.forEach(p => {
      ctx.save();
      ctx.fillStyle = p.type === 'expand' ? '#38bdf8' : '#f59e0b';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(p.x, p.y, p.width, p.height, 6);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.type === 'expand' ? '↔️' : '⚪', p.x + p.width / 2, p.y + p.height / 2);
      ctx.restore();
    });

    // Render paddle
    ctx.save();
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 16;
    const grad = ctx.createLinearGradient(this.paddle.x, 0, this.paddle.x + this.paddle.width, 0);
    grad.addColorStop(0, '#0284c7');
    grad.addColorStop(0.5, '#38bdf8');
    grad.addColorStop(1, '#0284c7');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height, 7);
    ctx.fill();
    ctx.restore();

    // Render balls
    this.balls.forEach(b => {
      ctx.save();
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Render particles
    this.particles.forEach(p => {
      ctx.save();
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }
}
