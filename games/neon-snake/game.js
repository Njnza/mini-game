import { BaseGame } from '../../src/core/BaseGame.js';

export default class NeonSnakeGame extends BaseGame {
  init() {
    this.container.innerHTML = `
      <div class="snake-wrapper" style="position:relative; width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center;">
        <canvas id="snake-canvas" style="display:block; border-radius:16px; box-shadow:0 10px 30px rgba(0,0,0,0.6); background:#050508;"></canvas>
        
        <!-- On-screen D-Pad for Mobile Touch -->
        <div class="mobile-dpad" style="display:none; margin-top:12px; gap:8px; flex-direction:column; align-items:center; user-select:none;">
          <button class="dpad-btn" id="dpad-up" style="width:50px; height:45px; border-radius:10px; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); color:#fff; font-size:1.2rem;">⬆️</button>
          <div style="display:flex; gap:16px;">
            <button class="dpad-btn" id="dpad-left" style="width:50px; height:45px; border-radius:10px; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); color:#fff; font-size:1.2rem;">⬅️</button>
            <button class="dpad-btn" id="dpad-down" style="width:50px; height:45px; border-radius:10px; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); color:#fff; font-size:1.2rem;">⬇️</button>
            <button class="dpad-btn" id="dpad-right" style="width:50px; height:45px; border-radius:10px; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); color:#fff; font-size:1.2rem;">➡️</button>
          </div>
        </div>
      </div>
    `;

    this.canvas = this.container.querySelector('#snake-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.dpad = this.container.querySelector('.mobile-dpad');

    // Show D-Pad on touch devices
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      this.dpad.style.display = 'flex';
    }

    this.gridSize = 20; // 20x20 grid
    this.cellSize = 24;

    this.setupCanvasSize();

    // Keyboard controls
    const onKeyDown = (e) => this.handleKeyDown(e);
    this.addTrackedEventListener(window, 'keydown', onKeyDown);

    // Virtual D-Pad bindings
    const bindDpad = (id, dx, dy) => {
      const btn = this.container.querySelector(id);
      if (btn) {
        this.addTrackedEventListener(btn, 'pointerdown', (e) => {
          e.preventDefault();
          this.setDirection(dx, dy);
        });
      }
    };
    bindDpad('#dpad-up', 0, -1);
    bindDpad('#dpad-down', 0, 1);
    bindDpad('#dpad-left', -1, 0);
    bindDpad('#dpad-right', 1, 0);

    const onResize = () => this.setupCanvasSize();
    this.addTrackedEventListener(window, 'resize', onResize);
  }

  setupCanvasSize() {
    const rect = this.container.getBoundingClientRect();
    const availableSize = Math.min(rect.width - 24, rect.height - (this.dpad.style.display === 'flex' ? 140 : 40));
    const targetSize = Math.max(280, Math.min(availableSize, 520));
    
    this.cellSize = Math.floor(targetSize / this.gridSize);
    this.canvas.width = this.cellSize * this.gridSize;
    this.canvas.height = this.cellSize * this.gridSize;
  }

  start() {
    super.start();

    // Initialize snake
    const startX = Math.floor(this.gridSize / 2);
    const startY = Math.floor(this.gridSize / 2);
    this.snake = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY }
    ];

    this.dir = { x: 1, y: 0 };
    this.nextDir = { x: 1, y: 0 };
    this.moveTimer = 0;
    this.moveInterval = 0.13; // Initial tick rate
    this.particles = [];
    this.specialFood = null;
    this.specialTimer = 0;

    this.spawnFood();
    this.startLoop(this.ctx);
  }

  setDirection(dx, dy) {
    if (!this.isRunning || this.isPaused || this.isGameOver) return;
    // Prevent 180-degree instant reversal
    if (this.dir.x + dx === 0 && this.dir.y + dy === 0) return;
    this.nextDir = { x: dx, y: dy };
  }

  handleKeyDown(e) {
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        this.setDirection(0, -1);
        e.preventDefault();
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        this.setDirection(0, 1);
        e.preventDefault();
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        this.setDirection(-1, 0);
        e.preventDefault();
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        this.setDirection(1, 0);
        e.preventDefault();
        break;
    }
  }

  spawnFood() {
    let emptyCells = [];
    for (let x = 0; x < this.gridSize; x++) {
      for (let y = 0; y < this.gridSize; y++) {
        if (!this.snake.some(segment => segment.x === x && segment.y === y)) {
          emptyCells.push({ x, y });
        }
      }
    }

    if (emptyCells.length === 0) {
      // Victory condition: filled entire board
      this.emitGameOver();
      return;
    }

    const idx = Math.floor(Math.random() * emptyCells.length);
    this.food = emptyCells[idx];

    // 25% chance to spawn glowing golden bonus food
    if (Math.random() < 0.25 && !this.specialFood && emptyCells.length > 2) {
      const specialIdx = (idx + 5) % emptyCells.length;
      this.specialFood = {
        ...emptyCells[specialIdx],
        life: 6.0
      };
    }
  }

  createEatParticles(x, y, color) {
    const px = (x + 0.5) * this.cellSize;
    const py = (y + 0.5) * this.cellSize;
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 80;
      this.particles.push({
        x: px,
        y: py,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 2.5,
        color,
        life: 0.4,
        maxLife: 0.4
      });
    }
  }

  update(dt) {
    // Special food expiration
    if (this.specialFood) {
      this.specialFood.life -= dt;
      if (this.specialFood.life <= 0) {
        this.specialFood = null;
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

    // Snake movement interval
    this.moveTimer += dt;
    if (this.moveTimer >= this.moveInterval) {
      this.moveTimer = 0;
      this.dir = { ...this.nextDir };

      const head = this.snake[0];
      const newHead = {
        x: head.x + this.dir.x,
        y: head.y + this.dir.y
      };

      // Wall collision
      if (
        newHead.x < 0 ||
        newHead.x >= this.gridSize ||
        newHead.y < 0 ||
        newHead.y >= this.gridSize
      ) {
        this.createEatParticles(head.x, head.y, '#ef4444');
        this.emitGameOver();
        return;
      }

      // Self collision
      if (this.snake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
        this.createEatParticles(head.x, head.y, '#ef4444');
        this.emitGameOver();
        return;
      }

      this.snake.unshift(newHead);

      // Normal food consumed
      if (newHead.x === this.food.x && newHead.y === this.food.y) {
        this.emitScore(this.score + 10);
        this.audio.playScore();
        this.createEatParticles(this.food.x, this.food.y, '#10b981');
        // Gradually increase speed
        this.moveInterval = Math.max(0.065, 0.13 - (this.score / 600) * 0.05);
        this.spawnFood();
      } else if (
        this.specialFood &&
        newHead.x === this.specialFood.x &&
        newHead.y === this.specialFood.y
      ) {
        // Bonus special food consumed
        this.emitScore(this.score + 35);
        this.audio.playCombo(3);
        this.createEatParticles(this.specialFood.x, this.specialFood.y, '#eab308');
        this.specialFood = null;
      } else {
        this.snake.pop();
      }
    }
  }

  render(ctx) {
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Subtle grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= this.gridSize; i++) {
      ctx.beginPath();
      ctx.moveTo(i * this.cellSize, 0);
      ctx.lineTo(i * this.cellSize, this.canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * this.cellSize);
      ctx.lineTo(this.canvas.width, i * this.cellSize);
      ctx.stroke();
    }

    // Normal food (Neon Green)
    if (this.food) {
      const fx = this.food.x * this.cellSize + this.cellSize / 2;
      const fy = this.food.y * this.cellSize + this.cellSize / 2;
      ctx.save();
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(fx, fy, this.cellSize * 0.38, 0, Math.PI * 2);
      ctx.fill();

      // White inner core
      ctx.fillStyle = '#d1fae5';
      ctx.beginPath();
      ctx.arc(fx, fy, this.cellSize * 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Special bonus food (Neon Gold)
    if (this.specialFood) {
      const sx = this.specialFood.x * this.cellSize + this.cellSize / 2;
      const sy = this.specialFood.y * this.cellSize + this.cellSize / 2;
      const pulse = 1 + Math.sin(Date.now() / 150) * 0.15;
      ctx.save();
      ctx.shadowColor = '#eab308';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(sx, sy, this.cellSize * 0.42 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Snake body & head
    this.snake.forEach((seg, idx) => {
      const sx = seg.x * this.cellSize;
      const sy = seg.y * this.cellSize;
      const isHead = idx === 0;

      ctx.save();
      if (isHead) {
        ctx.shadowColor = '#34d399';
        ctx.shadowBlur = 16;
        ctx.fillStyle = '#10b981';
      } else {
        const alpha = Math.max(0.3, 1 - idx / (this.snake.length + 5));
        ctx.fillStyle = `rgba(16, 185, 129, ${alpha})`;
        ctx.shadowBlur = 0;
      }

      const pad = 2;
      ctx.beginPath();
      ctx.roundRect(sx + pad, sy + pad, this.cellSize - pad * 2, this.cellSize - pad * 2, isHead ? 6 : 4);
      ctx.fill();

      // Snake eyes
      if (isHead) {
        ctx.fillStyle = '#ffffff';
        const eyeOffset = this.cellSize * 0.28;
        const eyeSize = Math.max(2, this.cellSize * 0.12);
        const cx = sx + this.cellSize / 2;
        const cy = sy + this.cellSize / 2;

        let eye1X = cx, eye1Y = cy, eye2X = cx, eye2Y = cy;
        if (this.dir.x !== 0) {
          eye1X = cx + this.dir.x * eyeOffset * 0.5;
          eye2X = eye1X;
          eye1Y = cy - eyeOffset;
          eye2Y = cy + eyeOffset;
        } else {
          eye1Y = cy + this.dir.y * eyeOffset * 0.5;
          eye2Y = eye1Y;
          eye1X = cx - eyeOffset;
          eye2X = cx + eyeOffset;
        }

        ctx.beginPath();
        ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2);
        ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    // Particle rendering
    this.particles.forEach(p => {
      ctx.save();
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }
}
