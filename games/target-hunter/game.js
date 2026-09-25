import { BaseGame } from '../../src/core/BaseGame.js';

export default class TargetHunterGame extends BaseGame {
  init() {
    this.container.innerHTML = `
      <div class="target-hunter-wrapper" style="position:relative; width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center;">
        <div class="game-hud" style="position:absolute; top:12px; left:20px; right:20px; display:flex; justify-content:space-between; font-weight:700; font-size:1.1rem; pointer-events:none; z-index:10;">
          <div style="background:rgba(15,23,42,0.8); backdrop-filter:blur(8px); padding:8px 16px; border-radius:12px; border:1px solid rgba(255,255,255,0.1); color:#38bdf8;">
            ⏱ Time: <span id="th-time">30</span>s
          </div>
          <div style="background:rgba(15,23,42,0.8); backdrop-filter:blur(8px); padding:8px 16px; border-radius:12px; border:1px solid rgba(255,255,255,0.1); color:#f59e0b;">
            🔥 Combo: <span id="th-combo">0</span>x
          </div>
        </div>
        <canvas id="th-canvas" style="display:block; max-width:100%; max-height:100%; border-radius:16px; box-shadow:0 10px 30px rgba(0,0,0,0.5); cursor:crosshair; background:radial-gradient(circle at center, #1e1b4b 0%, #09090b 100%);"></canvas>
      </div>
    `;

    this.canvas = this.container.querySelector('#th-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.timeEl = this.container.querySelector('#th-time');
    this.comboEl = this.container.querySelector('#th-combo');

    this.setupCanvasSize();

    // Game state
    this.timeLeft = 30;
    this.combo = 0;
    this.targets = [];
    this.particles = [];
    this.spawnTimer = 0;
    this.spawnInterval = 0.8; // Spawn interval in seconds

    // Listeners
    const onCanvasClick = (e) => this.handleClick(e);
    this.addTrackedEventListener(this.canvas, 'pointerdown', onCanvasClick);

    const onResize = () => this.setupCanvasSize();
    this.addTrackedEventListener(window, 'resize', onResize);
  }

  setupCanvasSize() {
    const rect = this.container.getBoundingClientRect();
    const width = Math.min(rect.width - 24, 760);
    const height = Math.min(rect.height - 40, 520);
    this.canvas.width = Math.max(320, width);
    this.canvas.height = Math.max(360, height);
  }

  start() {
    super.start();
    this.timeLeft = 30;
    this.combo = 0;
    this.targets = [];
    this.particles = [];
    this.spawnTimer = 0;
    this.updateHUD();

    // 1-second countdown timer
    this.addTrackedInterval(() => {
      if (!this.isRunning || this.isPaused || this.isGameOver) return;
      this.timeLeft--;
      this.updateHUD();
      if (this.timeLeft <= 0) {
        this.emitGameOver();
      }
    }, 1000);

    this.startLoop(this.ctx);
  }

  updateHUD() {
    if (this.timeEl) this.timeEl.textContent = this.timeLeft;
    if (this.comboEl) this.comboEl.textContent = this.combo;
  }

  spawnTarget() {
    const padding = 50;
    const x = padding + Math.random() * (this.canvas.width - padding * 2);
    const y = padding + Math.random() * (this.canvas.height - padding * 2);

    const rand = Math.random();
    let type = 'normal'; // 65% normal
    let radius = 28;
    let duration = 2.2;

    if (rand < 0.18) {
      type = 'bomb'; // 18% hazard bomb
      radius = 26;
      duration = 2.8;
    } else if (rand < 0.35) {
      type = 'golden'; // 17% golden bonus
      radius = 22;
      duration = 1.6;
    }

    this.targets.push({
      x,
      y,
      radius,
      type,
      maxLife: duration,
      life: duration,
      scale: 0.1
    });
  }

  handleClick(e) {
    if (!this.isRunning || this.isPaused || this.isGameOver) return;

    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    let hit = false;
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];
      const dist = Math.hypot(clickX - t.x, clickY - t.y);

      if (dist <= t.radius * t.scale + 6) {
        hit = true;
        this.targets.splice(i, 1);

        if (t.type === 'bomb') {
          // Hit bomb: penalty and break combo
          this.combo = 0;
          this.emitScore(Math.max(0, this.score - 20));
          this.audio.playExplosion();
          this.createExplosion(t.x, t.y, '#ef4444', 30);
        } else if (t.type === 'golden') {
          // Hit golden: bonus points and extra seconds
          this.combo++;
          const pts = 25 * Math.min(this.combo, 5);
          this.emitScore(this.score + pts);
          this.timeLeft = Math.min(this.timeLeft + 2, 60);
          this.audio.playCombo(this.combo);
          this.createExplosion(t.x, t.y, '#f59e0b', 25);
        } else {
          // Hit normal target
          this.combo++;
          const pts = 10 * Math.min(this.combo, 4);
          this.emitScore(this.score + pts);
          this.audio.playScore();
          this.createExplosion(t.x, t.y, '#38bdf8', 16);
        }

        this.updateHUD();
        break;
      }
    }

    if (!hit) {
      // Miss click: reset combo
      if (this.combo > 0) {
        this.combo = 0;
        this.updateHUD();
        this.audio.playHit();
      }
    }
  }

  createExplosion(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 160;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 3.5,
        color,
        life: 0.5 + Math.random() * 0.4,
        maxLife: 0.9
      });
    }
  }

  update(dt) {
    // Spawn targets
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      if (this.targets.length < 7) {
        this.spawnTarget();
      }
    }

    // Update targets
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];
      t.life -= dt;
      const lifeRatio = t.life / t.maxLife;
      if (lifeRatio > 0.8) {
        t.scale = Math.min(1, (1 - lifeRatio) * 5);
      } else {
        t.scale = 0.9 + Math.sin((t.maxLife - t.life) * 10) * 0.1;
      }

      if (t.life <= 0) {
        if (t.type === 'normal') {
          this.combo = Math.max(0, this.combo - 1);
          this.updateHUD();
        }
        this.targets.splice(i, 1);
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.vx *= 0.95;
      p.vy *= 0.95;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx) {
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Subtle background grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    const step = 40;
    for (let x = 0; x < this.canvas.width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.canvas.height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvas.width, y);
      ctx.stroke();
    }

    // Render targets
    this.targets.forEach(t => {
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.scale(t.scale, t.scale);

      let mainColor = '#06b6d4';
      let centerText = '🎯';

      if (t.type === 'bomb') {
        mainColor = '#ef4444';
        centerText = '💣';
      } else if (t.type === 'golden') {
        mainColor = '#f59e0b';
        centerText = '⭐';
      }

      ctx.shadowColor = mainColor;
      ctx.shadowBlur = 15;

      // Outer ring
      ctx.beginPath();
      ctx.arc(0, 0, t.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = mainColor;
      ctx.stroke();

      // Countdown radial ring
      const ratio = Math.max(0, t.life / t.maxLife);
      ctx.beginPath();
      ctx.arc(0, 0, t.radius * 0.75, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
      ctx.strokeStyle = mainColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Center icon
      ctx.font = `${t.radius * 0.9}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(centerText, 0, 1);

      ctx.restore();
    });

    // Render particles
    this.particles.forEach(p => {
      ctx.save();
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }
}
