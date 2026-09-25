import { BaseGame } from '../../src/core/BaseGame.js';

export default class ZapPetsGame extends BaseGame {
  init() {
    this.container.innerHTML = `
      <div class="zappets-wrapper" style="position:relative; width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; overflow:hidden; user-select:none;">
        
        <!-- Top HUD (Wave, Boss, Level, EXP) -->
        <div class="zp-hud-top" style="position:absolute; top:8px; left:12px; right:12px; display:flex; justify-content:space-between; align-items:flex-start; pointer-events:none; z-index:15;">
          
          <!-- Left: Level & EXP Bar -->
          <div style="display:flex; flex-direction:column; gap:4px; min-width:140px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span id="zp-level-badge" style="background:#eab308; color:#0f172a; font-weight:800; font-size:0.8rem; padding:2px 8px; border-radius:12px; font-family:var(--font-display);">LV 1</span>
              <span id="zp-coins-text" style="color:#fbbf24; font-weight:700; font-size:0.9rem;">🪙 0</span>
            </div>
            <!-- EXP Progress Track -->
            <div style="width:140px; height:7px; background:rgba(255,255,255,0.15); border-radius:4px; overflow:hidden; border:1px solid rgba(255,255,255,0.2);">
              <div id="zp-exp-fill" style="width:0%; height:100%; background:linear-gradient(90deg, #38bdf8, #06b6d4); transition:width 0.15s ease;"></div>
            </div>
          </div>

          <!-- Center: Wave & Boss Bar -->
          <div style="display:flex; flex-direction:column; align-items:center; gap:4px;">
            <div style="background:rgba(15,23,42,0.85); backdrop-filter:blur(8px); border:1px solid rgba(255,255,255,0.15); border-radius:20px; padding:4px 18px; font-family:var(--font-display); font-size:0.95rem; font-weight:800; color:#f8fafc; letter-spacing:0.5px;">
              WAVE <span id="zp-wave-num" style="color:#eab308;">1</span> • <span id="zp-wave-timer">30</span>s
            </div>
            <!-- Boss Bar (Hidden until boss arrives) -->
            <div id="zp-boss-bar" style="display:none; width:220px; flex-direction:column; align-items:center;">
              <span style="font-size:0.75rem; color:#ef4444; font-weight:700; margin-bottom:2px;">⚠️ GOLIATH BOSS ⚠️</span>
              <div style="width:100%; height:8px; background:rgba(0,0,0,0.6); border:1px solid #ef4444; border-radius:4px; overflow:hidden;">
                <div id="zp-boss-fill" style="width:100%; height:100%; background:#ef4444;"></div>
              </div>
            </div>
          </div>

          <!-- Right: Minimap Radar -->
          <div style="position:relative; width:80px; height:80px; background:rgba(15,23,42,0.85); border:1px solid rgba(56,189,248,0.3); border-radius:10px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.5);">
            <canvas id="zp-minimap" width="80" height="80" style="display:block;"></canvas>
          </div>
        </div>

        <!-- Main World Canvas -->
        <canvas id="zp-canvas" style="display:block; border-radius:14px; background:#0b0f19; box-shadow:0 12px 35px rgba(0,0,0,0.7); cursor:crosshair;"></canvas>

        <!-- Touch Controls (Virtual Joystick & Action Buttons) -->
        <div class="zp-touch-layer" style="position:absolute; inset:0; pointer-events:none; z-index:20;">
          <!-- Virtual Joystick Zone (Bottom-Left) -->
          <div id="zp-joystick-zone" style="position:absolute; bottom:20px; left:20px; width:120px; height:120px; border-radius:50%; background:rgba(255,255,255,0.06); border:2px dashed rgba(255,255,255,0.2); pointer-events:auto; display:none; align-items:center; justify-content:center;">
            <div id="zp-joystick-knob" style="width:48px; height:48px; border-radius:50%; background:#38bdf8; box-shadow:0 0 15px #38bdf8; transform:translate(0,0);"></div>
          </div>

          <!-- Skills Buttons (Bottom-Right) -->
          <div class="zp-skills-container" style="position:absolute; bottom:24px; right:24px; display:flex; gap:14px; pointer-events:auto;">
            <!-- Skill 1: Dash -->
            <button id="zp-btn-dash" style="width:58px; height:58px; border-radius:50%; background:#1e1b4b; border:2px solid #38bdf8; color:#fff; font-size:1.4rem; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 4px 15px rgba(56,189,248,0.4); position:relative;">
              💨
              <span style="font-size:0.6rem; font-weight:700; color:#38bdf8;">SPACE</span>
              <div id="zp-dash-cd" style="position:absolute; inset:0; border-radius:50%; background:rgba(0,0,0,0.65); display:none; align-items:center; justify-content:center; font-size:0.75rem; font-weight:800; color:#fff;"></div>
            </button>
            <!-- Skill 2: Nova Blast -->
            <button id="zp-btn-nova" style="width:58px; height:58px; border-radius:50%; background:#3b0764; border:2px solid #ec4899; color:#fff; font-size:1.4rem; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 4px 15px rgba(236,72,153,0.4); position:relative;">
              💥
              <span style="font-size:0.6rem; font-weight:700; color:#ec4899;">E</span>
              <div id="zp-nova-cd" style="position:absolute; inset:0; border-radius:50%; background:rgba(0,0,0,0.65); display:none; align-items:center; justify-content:center; font-size:0.75rem; font-weight:800; color:#fff;"></div>
            </button>
          </div>
        </div>

        <!-- Level Up Selection Modal Overlay -->
        <div id="zp-upgrade-modal" style="position:absolute; inset:0; background:rgba(5,7,15,0.88); backdrop-filter:blur(10px); z-index:50; display:none; flex-direction:column; align-items:center; justify-content:center; padding:20px;">
          <div style="font-family:var(--font-display); font-size:1.6rem; font-weight:900; color:#fbbf24; margin-bottom:4px; text-shadow:0 0 20px #eab308;">
            ⚡ LEVEL UP SURGE! ⚡
          </div>
          <div style="color:#94a3b8; font-size:0.9rem; margin-bottom:24px;">Choose 1 upgrade perk to boost your cyber pet:</div>
          <div id="zp-cards-container" style="display:flex; gap:16px; flex-wrap:wrap; justify-content:center; max-width:680px;"></div>
        </div>

      </div>
    `;

    this.canvas = this.container.querySelector('#zp-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.minimapCanvas = this.container.querySelector('#zp-minimap');
    this.minimapCtx = this.minimapCanvas.getContext('2d');

    // Cached UI elements
    this.levelBadge = this.container.querySelector('#zp-level-badge');
    this.coinsText = this.container.querySelector('#zp-coins-text');
    this.expFill = this.container.querySelector('#zp-exp-fill');
    this.waveNumEl = this.container.querySelector('#zp-wave-num');
    this.waveTimerEl = this.container.querySelector('#zp-wave-timer');
    this.bossBar = this.container.querySelector('#zp-boss-bar');
    this.bossFill = this.container.querySelector('#zp-boss-fill');
    this.upgradeModal = this.container.querySelector('#zp-upgrade-modal');
    this.cardsContainer = this.container.querySelector('#zp-cards-container');
    this.btnDash = this.container.querySelector('#zp-btn-dash');
    this.dashCdEl = this.container.querySelector('#zp-dash-cd');
    this.btnNova = this.container.querySelector('#zp-btn-nova');
    this.novaCdEl = this.container.querySelector('#zp-nova-cd');
    this.joystickZone = this.container.querySelector('#zp-joystick-zone');
    this.joystickKnob = this.container.querySelector('#zp-joystick-knob');

    // World sizing
    this.worldWidth = 2400;
    this.worldHeight = 2400;

    this.setupCanvasSize();

    // Check touch devices for virtual joystick
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      this.joystickZone.style.display = 'flex';
      this.setupTouchJoystick();
    }

    // Input listeners
    this.keys = {};
    const onKeyDown = (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        this.triggerDash();
      } else if (e.key === 'e' || e.key === 'E') {
        this.triggerNova();
      }
    };
    const onKeyUp = (e) => {
      this.keys[e.key.toLowerCase()] = false;
    };

    this.addTrackedEventListener(window, 'keydown', onKeyDown);
    this.addTrackedEventListener(window, 'keyup', onKeyUp);

    // Skill button clicks
    this.addTrackedEventListener(this.btnDash, 'pointerdown', (e) => {
      e.stopPropagation();
      this.triggerDash();
    });
    this.addTrackedEventListener(this.btnNova, 'pointerdown', (e) => {
      e.stopPropagation();
      this.triggerNova();
    });

    const onResize = () => this.setupCanvasSize();
    this.addTrackedEventListener(window, 'resize', onResize);
  }

  setupCanvasSize() {
    const rect = this.container.getBoundingClientRect();
    const width = Math.min(rect.width - 16, 960);
    const height = Math.min(rect.height - 20, 640);
    this.canvas.width = Math.max(320, width);
    this.canvas.height = Math.max(380, height);
  }

  setupTouchJoystick() {
    let activeTouchId = null;
    let startX = 0, startY = 0;

    const onTouchStart = (e) => {
      const touch = e.changedTouches[0];
      activeTouchId = touch.identifier;
      const rect = this.joystickZone.getBoundingClientRect();
      startX = rect.left + rect.width / 2;
      startY = rect.top + rect.height / 2;
    };

    const onTouchMove = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === activeTouchId) {
          const dx = touch.clientX - startX;
          const dy = touch.clientY - startY;
          const dist = Math.hypot(dx, dy);
          const maxDist = 45;
          const angle = Math.atan2(dy, dx);
          const clampedDist = Math.min(dist, maxDist);

          const knobX = Math.cos(angle) * clampedDist;
          const knobY = Math.sin(angle) * clampedDist;
          this.joystickKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;

          // Normalize vector
          this.touchDir = {
            x: clampedDist > 8 ? Math.cos(angle) : 0,
            y: clampedDist > 8 ? Math.sin(angle) : 0
          };
          break;
        }
      }
    };

    const onTouchEnd = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === activeTouchId) {
          activeTouchId = null;
          this.joystickKnob.style.transform = 'translate(0,0)';
          this.touchDir = { x: 0, y: 0 };
          break;
        }
      }
    };

    this.addTrackedEventListener(this.joystickZone, 'touchstart', onTouchStart, { passive: true });
    this.addTrackedEventListener(window, 'touchmove', onTouchMove, { passive: true });
    this.addTrackedEventListener(window, 'touchend', onTouchEnd, { passive: true });
  }

  start() {
    super.start();

    // Player State
    this.player = {
      x: this.worldWidth / 2,
      y: this.worldHeight / 2,
      radius: 20,
      baseSpeed: 230,
      maxHp: 100,
      hp: 100,
      facingAngle: 0,
      invulnerableTimer: 0,

      // Level & XP
      level: 1,
      xp: 0,
      xpNeeded: 80,
      coins: 0,

      // Skills cooldowns
      dashCd: 0,
      dashMaxCd: 3.5,
      isDashing: false,
      dashDuration: 0,

      novaCd: 0,
      novaMaxCd: 8.0,

      // Upgrades stats
      attackRate: 0.38, // Shoot interval
      shootTimer: 0,
      multishot: 1,
      bulletDamage: 24,
      bulletSpeed: 520,
      bulletRange: 380,
      critChance: 0.12,
      orbitingOrbs: 0,
      speedMultiplier: 1.0,
      magnetRadius: 180
    };

    // Camera
    this.camera = {
      x: this.player.x - this.canvas.width / 2,
      y: this.player.y - this.canvas.height / 2
    };

    // Wave Progression
    this.wave = 1;
    this.waveTimeLeft = 30;
    this.waveTimerAcc = 0;
    this.spawnTimer = 0;
    this.spawnInterval = 1.0;

    // Collections
    this.enemies = [];
    this.projectiles = [];
    this.enemyProjectiles = [];
    this.items = [];
    this.particles = [];
    this.damageNumbers = [];
    this.screenShake = 0;

    // Boss reference
    this.currentBoss = null;

    // Pre-generate arena decoration stars / cyber grid nodes
    this.cyberProps = [];
    for (let i = 0; i < 90; i++) {
      this.cyberProps.push({
        x: 80 + Math.random() * (this.worldWidth - 160),
        y: 80 + Math.random() * (this.worldHeight - 160),
        size: 14 + Math.random() * 22,
        color: Math.random() < 0.5 ? '#1e293b' : '#312e81'
      });
    }

    this.updateHUD();
    this.startLoop(this.ctx);
  }

  updateHUD() {
    if (this.levelBadge) this.levelBadge.textContent = `LV ${this.player.level}`;
    if (this.coinsText) this.coinsText.textContent = `🪙 ${this.player.coins}`;
    if (this.waveNumEl) this.waveNumEl.textContent = this.wave;
    if (this.waveTimerEl) this.waveTimerEl.textContent = Math.ceil(this.waveTimeLeft);

    const expPercent = Math.min(100, (this.player.xp / this.player.xpNeeded) * 100);
    if (this.expFill) this.expFill.style.width = `${expPercent}%`;

    // Dash CD overlay
    if (this.dashCdEl) {
      if (this.player.dashCd > 0) {
        this.dashCdEl.style.display = 'flex';
        this.dashCdEl.textContent = this.player.dashCd.toFixed(1);
      } else {
        this.dashCdEl.style.display = 'none';
      }
    }

    // Nova CD overlay
    if (this.novaCdEl) {
      if (this.player.novaCd > 0) {
        this.novaCdEl.style.display = 'flex';
        this.novaCdEl.textContent = this.player.novaCd.toFixed(1);
      } else {
        this.novaCdEl.style.display = 'none';
      }
    }

    // Boss Bar
    if (this.currentBoss && this.currentBoss.hp > 0) {
      this.bossBar.style.display = 'flex';
      const pct = Math.max(0, (this.currentBoss.hp / this.currentBoss.maxHp) * 100);
      this.bossFill.style.width = `${pct}%`;
    } else {
      this.bossBar.style.display = 'none';
    }
  }

  triggerDash() {
    if (!this.isRunning || this.isPaused || this.isGameOver) return;
    if (this.player.dashCd > 0) return;

    this.player.dashCd = this.player.dashMaxCd;
    this.player.isDashing = true;
    this.player.dashDuration = 0.32;
    this.player.invulnerableTimer = 0.35;
    this.audio.playJump();

    // Create lightning dash trail
    for (let i = 0; i < 12; i++) {
      this.particles.push({
        x: this.player.x + (Math.random() - 0.5) * 20,
        y: this.player.y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 60,
        vy: (Math.random() - 0.5) * 60,
        radius: 3 + Math.random() * 3,
        color: '#38bdf8',
        life: 0.35,
        maxLife: 0.35
      });
    }
  }

  triggerNova() {
    if (!this.isRunning || this.isPaused || this.isGameOver) return;
    if (this.player.novaCd > 0) return;

    this.player.novaCd = this.player.novaMaxCd;
    this.audio.playExplosion();
    this.screenShake = 12;

    const novaRadius = 260;
    // Damage and knockback all enemies in range
    this.enemies.forEach(e => {
      const dist = Math.hypot(e.x - this.player.x, e.y - this.player.y);
      if (dist <= novaRadius) {
        const angle = Math.atan2(e.y - this.player.y, e.x - this.player.x);
        e.hp -= 65;
        e.x += Math.cos(angle) * 70;
        e.y += Math.sin(angle) * 70;
        this.addDamageNumber(e.x, e.y, 65, true);

        if (e.hp <= 0) {
          this.handleEnemyDefeated(e);
        }
      }
    });

    // Particle ring shockwave
    for (let i = 0; i < 36; i++) {
      const angle = (i / 36) * Math.PI * 2;
      this.particles.push({
        x: this.player.x,
        y: this.player.y,
        vx: Math.cos(angle) * 380,
        vy: Math.sin(angle) * 380,
        radius: 4 + Math.random() * 3,
        color: '#ec4899',
        life: 0.45,
        maxLife: 0.45
      });
    }
  }

  spawnEnemy() {
    const angle = Math.random() * Math.PI * 2;
    const distance = 480 + Math.random() * 120;
    const x = Math.max(80, Math.min(this.worldWidth - 80, this.player.x + Math.cos(angle) * distance));
    const y = Math.max(80, Math.min(this.worldHeight - 80, this.player.y + Math.sin(angle) * distance));

    const rand = Math.random();
    let type = 'minion';
    let hp = 30 + this.wave * 8;
    let speed = 95 + Math.random() * 25;
    let radius = 16;
    let color = '#f43f5e';
    let points = 10;

    if (rand < 0.25) {
      type = 'stalker'; // Fast spider
      hp = 18 + this.wave * 4;
      speed = 175;
      radius = 13;
      color = '#a855f7';
      points = 15;
    } else if (rand < 0.45 && this.wave >= 2) {
      type = 'shooter'; // Ranged drone
      hp = 50 + this.wave * 10;
      speed = 70;
      radius = 18;
      color = '#eab308';
      points = 20;
    }

    this.enemies.push({
      x,
      y,
      type,
      radius,
      color,
      hp,
      maxHp: hp,
      speed,
      points,
      shootTimer: 1.5 + Math.random()
    });
  }

  spawnBoss() {
    const angle = Math.random() * Math.PI * 2;
    const x = Math.max(150, Math.min(this.worldWidth - 150, this.player.x + Math.cos(angle) * 520));
    const y = Math.max(150, Math.min(this.worldHeight - 150, this.player.y + Math.sin(angle) * 520));

    const hp = 700 + this.wave * 250;
    this.currentBoss = {
      x,
      y,
      type: 'boss',
      radius: 44,
      color: '#ef4444',
      hp,
      maxHp: hp,
      speed: 75,
      points: 250,
      shootTimer: 2.0,
      slamTimer: 4.5
    };
    this.enemies.push(this.currentBoss);
    this.audio.playExplosion();
    this.screenShake = 14;
  }

  addDamageNumber(x, y, amount, isCrit = false) {
    this.damageNumbers.push({
      x,
      y: y - 10,
      text: Math.round(amount).toString(),
      color: isCrit ? '#facc15' : '#ffffff',
      size: isCrit ? 18 : 13,
      life: 0.6,
      maxLife: 0.6
    });
  }

  handleEnemyDefeated(enemy) {
    enemy.dead = true;
    this.emitScore(this.score + enemy.points);

    // Death explosion particles
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 120;
      this.particles.push({
        x: enemy.x,
        y: enemy.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 3,
        color: enemy.color,
        life: 0.4,
        maxLife: 0.4
      });
    }

    // Drop loot: EXP Gem
    this.items.push({
      x: enemy.x,
      y: enemy.y,
      type: 'exp',
      val: enemy.type === 'boss' ? 120 : (enemy.type === 'shooter' ? 30 : 15),
      radius: 7,
      color: '#38bdf8'
    });

    // Chance for coin
    if (Math.random() < 0.4 || enemy.type === 'boss') {
      this.items.push({
        x: enemy.x + 12,
        y: enemy.y - 8,
        type: 'coin',
        val: 1,
        radius: 8,
        color: '#fbbf24'
      });
    }

    // Chance for health pack if low HP
    if (this.player.hp < this.player.maxHp * 0.7 && Math.random() < 0.12) {
      this.items.push({
        x: enemy.x - 10,
        y: enemy.y + 10,
        type: 'heal',
        val: 35,
        radius: 9,
        color: '#10b981'
      });
    }
  }

  showLevelUpModal() {
    this.pause();

    const perks = [
      { id: 'multishot', title: 'Multishot Zap', icon: '🎯', desc: 'Add +1 plasma projectile per firing volley' },
      { id: 'attackspeed', title: 'Overclock Drive', icon: '⚡', desc: '+25% faster attack firing rate' },
      { id: 'damage', title: 'Heavy Plasma', icon: '💥', desc: '+35% projectile impact damage' },
      { id: 'speed', title: 'Cyber Agility', icon: '👟', desc: '+20% faster movement speed' },
      { id: 'shield', title: 'Thunder Orbs', icon: '🌀', desc: 'Summon/Upgrade lightning barrier orbs' },
      { id: 'crit', title: 'Critical Matrix', icon: '✨', desc: '+15% critical hit rate for 2x damage' },
      { id: 'heal', title: 'Nano Medkit', icon: '❤️', desc: 'Instantly restore +50% of max health' }
    ];

    // Pick 3 random distinct perks
    const selected = [...perks].sort(() => Math.random() - 0.5).slice(0, 3);

    this.cardsContainer.innerHTML = '';
    selected.forEach(perk => {
      const card = document.createElement('div');
      card.style.cssText = `
        background: linear-gradient(145deg, #1e1b4b, #0f172a);
        border: 2px solid rgba(56,189,248,0.4);
        border-radius: 14px;
        padding: 18px 16px;
        width: 190px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        cursor: pointer;
        transition: transform 0.2s, border-color 0.2s;
        box-shadow: 0 8px 20px rgba(0,0,0,0.5);
      `;
      card.innerHTML = `
        <div style="font-size:2.2rem; margin-bottom:8px;">${perk.icon}</div>
        <div style="font-family:var(--font-display); font-weight:800; font-size:1rem; color:#f8fafc; margin-bottom:6px;">${perk.title}</div>
        <div style="font-size:0.75rem; color:#94a3b8; line-height:1.4;">${perk.desc}</div>
      `;

      card.onmouseenter = () => {
        card.style.transform = 'translateY(-6px)';
        card.style.borderColor = '#38bdf8';
      };
      card.onmouseleave = () => {
        card.style.transform = 'none';
        card.style.borderColor = 'rgba(56,189,248,0.4)';
      };

      card.onclick = () => {
        this.applyPerk(perk.id);
        this.upgradeModal.style.display = 'none';
        this.resume();
      };

      this.cardsContainer.appendChild(card);
    });

    this.upgradeModal.style.display = 'flex';
  }

  applyPerk(perkId) {
    this.audio.playCombo(3);
    switch (perkId) {
      case 'multishot':
        this.player.multishot = Math.min(this.player.multishot + 1, 5);
        break;
      case 'attackspeed':
        this.player.attackRate = Math.max(0.14, this.player.attackRate * 0.8);
        break;
      case 'damage':
        this.player.bulletDamage = Math.round(this.player.bulletDamage * 1.35);
        break;
      case 'speed':
        this.player.speedMultiplier += 0.2;
        break;
      case 'shield':
        this.player.orbitingOrbs = Math.min(this.player.orbitingOrbs + 1, 4);
        break;
      case 'crit':
        this.player.critChance = Math.min(this.player.critChance + 0.15, 0.6);
        break;
      case 'heal':
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + this.player.maxHp * 0.5);
        break;
    }
  }

  update(dt) {
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 25);
    }

    // Cooldown timers
    if (this.player.dashCd > 0) this.player.dashCd = Math.max(0, this.player.dashCd - dt);
    if (this.player.novaCd > 0) this.player.novaCd = Math.max(0, this.player.novaCd - dt);
    if (this.player.invulnerableTimer > 0) this.player.invulnerableTimer = Math.max(0, this.player.invulnerableTimer - dt);

    if (this.player.isDashing) {
      this.player.dashDuration -= dt;
      if (this.player.dashDuration <= 0) {
        this.player.isDashing = false;
      }
    }

    // Movement Vector
    let mx = 0, my = 0;
    if (this.keys['w'] || this.keys['arrowup']) my -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) my += 1;
    if (this.keys['a'] || this.keys['arrowleft']) mx -= 1;
    if (this.keys['d'] || this.keys['arrowright']) mx += 1;

    if (this.touchDir && (this.touchDir.x !== 0 || this.touchDir.y !== 0)) {
      mx = this.touchDir.x;
      my = this.touchDir.y;
    }

    const moveLen = Math.hypot(mx, my);
    if (moveLen > 0) {
      const normX = mx / moveLen;
      const normY = my / moveLen;
      const currentSpeed = (this.player.isDashing ? this.player.baseSpeed * 2.3 : this.player.baseSpeed) * this.player.speedMultiplier;
      this.player.x += normX * currentSpeed * dt;
      this.player.y += normY * currentSpeed * dt;

      this.player.facingAngle = Math.atan2(normY, normX);

      // Clamp inside arena walls
      this.player.x = Math.max(this.player.radius + 15, Math.min(this.worldWidth - this.player.radius - 15, this.player.x));
      this.player.y = Math.max(this.player.radius + 15, Math.min(this.worldHeight - this.player.radius - 15, this.player.y));
    }

    // Camera follow (Smooth Lerp)
    const targetCamX = this.player.x - this.canvas.width / 2;
    const targetCamY = this.player.y - this.canvas.height / 2;
    this.camera.x += (targetCamX - this.camera.x) * 8 * dt;
    this.camera.y += (targetCamY - this.camera.y) * 8 * dt;
    this.camera.x = Math.max(0, Math.min(this.worldWidth - this.canvas.width, this.camera.x));
    this.camera.y = Math.max(0, Math.min(this.worldHeight - this.canvas.height, this.camera.y));

    // Auto-Targeting & Shooting
    this.player.shootTimer += dt;
    if (this.player.shootTimer >= this.player.attackRate) {
      let nearestEnemy = null;
      let minDistance = this.player.bulletRange;

      for (const e of this.enemies) {
        const d = Math.hypot(e.x - this.player.x, e.y - this.player.y);
        if (d < minDistance) {
          minDistance = d;
          nearestEnemy = e;
        }
      }

      if (nearestEnemy) {
        this.player.shootTimer = 0;
        this.fireProjectiles(nearestEnemy);
      }
    }

    // Orbiting orbs collision logic
    if (this.player.orbitingOrbs > 0) {
      const orbAngleSpeed = Date.now() / 400;
      const orbDist = 62;
      for (let k = 0; k < this.player.orbitingOrbs; k++) {
        const angle = orbAngleSpeed + (k * Math.PI * 2) / this.player.orbitingOrbs;
        const ox = this.player.x + Math.cos(angle) * orbDist;
        const oy = this.player.y + Math.sin(angle) * orbDist;

        // Damage enemies on touch
        this.enemies.forEach(e => {
          if (Math.hypot(e.x - ox, e.y - oy) <= e.radius + 12) {
            e.hp -= 35 * dt;
            if (Math.random() < 0.15) {
              this.audio.playHit();
              this.addDamageNumber(e.x, e.y, 8);
            }
            if (e.hp <= 0 && !e.dead) {
              this.handleEnemyDefeated(e);
            }
          }
        });
      }
    }

    // Update Player Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.distanceTraveled += p.speed * dt;

      // Hit enemy
      let hit = false;
      for (const e of this.enemies) {
        if (Math.hypot(p.x - e.x, p.y - e.y) <= e.radius + p.radius) {
          hit = true;
          const isCrit = Math.random() < this.player.critChance;
          const finalDamage = isCrit ? p.damage * 2 : p.damage;
          e.hp -= finalDamage;
          this.audio.playHit();
          this.addDamageNumber(e.x, e.y, finalDamage, isCrit);

          if (e.hp <= 0 && !e.dead) {
            this.handleEnemyDefeated(e);
          }
          break;
        }
      }

      if (hit || p.distanceTraveled >= p.maxRange) {
        this.projectiles.splice(i, 1);
      }
    }

    // Update Enemy Projectiles
    for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
      const ep = this.enemyProjectiles[i];
      ep.x += ep.vx * dt;
      ep.y += ep.vy * dt;
      ep.life -= dt;

      // Hit Player
      if (Math.hypot(ep.x - this.player.x, ep.y - this.player.y) <= this.player.radius + ep.radius) {
        if (this.player.invulnerableTimer <= 0) {
          this.player.hp -= ep.damage;
          this.audio.playHit();
          this.screenShake = 6;
          this.addDamageNumber(this.player.x, this.player.y, ep.damage, true);
          if (this.player.hp <= 0) {
            this.emitGameOver();
            return;
          }
        }
        this.enemyProjectiles.splice(i, 1);
        continue;
      }

      if (ep.life <= 0) {
        this.enemyProjectiles.splice(i, 1);
      }
    }

    // Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.dead) {
        this.enemies.splice(i, 1);
        continue;
      }

      const dx = this.player.x - e.x;
      const dy = this.player.y - e.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 0) {
        const nx = dx / dist;
        const ny = dy / dist;

        // Shooter keeps distance
        if (e.type === 'shooter' && dist < 240) {
          e.x -= nx * e.speed * dt;
          e.y -= ny * e.speed * dt;
        } else {
          e.x += nx * e.speed * dt;
          e.y += ny * e.speed * dt;
        }
      }

      // Shooter projectile attack
      if (e.type === 'shooter' || e.type === 'boss') {
        e.shootTimer -= dt;
        if (e.shootTimer <= 0) {
          e.shootTimer = e.type === 'boss' ? 1.6 : 2.2;
          const bAngle = Math.atan2(dy, dx);
          if (e.type === 'boss') {
            // Radial burst
            for (let a = -0.4; a <= 0.4; a += 0.2) {
              this.enemyProjectiles.push({
                x: e.x,
                y: e.y,
                vx: Math.cos(bAngle + a) * 240,
                vy: Math.sin(bAngle + a) * 240,
                radius: 7,
                damage: 16,
                color: '#ef4444',
                life: 3.5
              });
            }
          } else {
            this.enemyProjectiles.push({
              x: e.x,
              y: e.y,
              vx: Math.cos(bAngle) * 260,
              vy: Math.sin(bAngle) * 260,
              radius: 6,
              damage: 12,
              color: '#f97316',
              life: 3.0
            });
          }
        }
      }

      // Melee damage to player
      if (dist <= this.player.radius + e.radius) {
        if (this.player.invulnerableTimer <= 0) {
          const dmg = e.type === 'boss' ? 25 : 10;
          this.player.hp -= dmg;
          this.player.invulnerableTimer = 0.5; // Damage cooldown
          this.audio.playHit();
          this.screenShake = 8;
          this.addDamageNumber(this.player.x, this.player.y, dmg, true);

          if (this.player.hp <= 0) {
            this.emitGameOver();
            return;
          }
        }
      }
    }

    // Magnet and Item collection
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      const d = Math.hypot(it.x - this.player.x, it.y - this.player.y);

      // Vacuum towards player
      if (d < this.player.magnetRadius) {
        const pullSpeed = 400 * dt;
        it.x += ((this.player.x - it.x) / d) * pullSpeed;
        it.y += ((this.player.y - it.y) / d) * pullSpeed;
      }

      // Collect
      if (d <= this.player.radius + it.radius) {
        if (it.type === 'exp') {
          this.player.xp += it.val;
          this.audio.playScore();
          if (this.player.xp >= this.player.xpNeeded) {
            this.player.xp -= this.player.xpNeeded;
            this.player.level++;
            this.player.xpNeeded = Math.round(this.player.xpNeeded * 1.35);
            this.showLevelUpModal();
          }
        } else if (it.type === 'coin') {
          this.player.coins += it.val;
          this.emitScore(this.score + 15);
          this.audio.playScore();
        } else if (it.type === 'heal') {
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + it.val);
          this.audio.playVictory();
        }
        this.items.splice(i, 1);
      }
    }

    // Spawning Waves
    this.waveTimeLeft -= dt;
    if (this.waveTimeLeft <= 0) {
      this.wave++;
      this.waveTimeLeft = 30;
      this.spawnInterval = Math.max(0.35, 1.0 - this.wave * 0.1);
      this.audio.playVictory();

      // Boss arrival on wave 3 and 5
      if (this.wave === 3 || this.wave % 5 === 0) {
        this.spawnBoss();
      }
    }

    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      if (this.enemies.length < 55) {
        this.spawnEnemy();
      }
    }

    // Damage numbers animation
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const dn = this.damageNumbers[i];
      dn.y -= 25 * dt;
      dn.life -= dt;
      if (dn.life <= 0) this.damageNumbers.splice(i, 1);
    }

    // Particles animation
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    this.updateHUD();
  }

  fireProjectiles(target) {
    const angle = Math.atan2(target.y - this.player.y, target.x - this.player.x);
    const count = this.player.multishot;
    const spreadAngle = 0.18; // In radians
    const startAngle = angle - ((count - 1) * spreadAngle) / 2;

    for (let i = 0; i < count; i++) {
      const bAngle = startAngle + i * spreadAngle;
      this.projectiles.push({
        x: this.player.x,
        y: this.player.y,
        vx: Math.cos(bAngle) * this.player.bulletSpeed,
        vy: Math.sin(bAngle) * this.player.bulletSpeed,
        speed: this.player.bulletSpeed,
        maxRange: this.player.bulletRange,
        distanceTraveled: 0,
        damage: this.player.bulletDamage,
        radius: 5,
        color: '#38bdf8'
      });
    }
    this.audio.playJump();
  }

  render(ctx) {
    ctx.save();

    // Screen Shake effect
    if (this.screenShake > 0) {
      const sx = (Math.random() - 0.5) * this.screenShake;
      const sy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(sx, sy);
    }

    // Clear viewport
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply Camera Transform
    ctx.translate(-Math.floor(this.camera.x), -Math.floor(this.camera.y));

    // Render Arena Floor Grid
    this.renderArenaFloor(ctx);

    // Render Items
    this.items.forEach(it => {
      ctx.save();
      ctx.fillStyle = it.color;
      ctx.shadowColor = it.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(it.x, it.y, it.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Render Enemies
    this.enemies.forEach(e => {
      ctx.save();
      ctx.shadowColor = e.color;
      ctx.shadowBlur = e.type === 'boss' ? 22 : 10;
      ctx.fillStyle = e.color;

      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.fill();

      // Enemy eyes
      ctx.fillStyle = '#ffffff';
      const lookAngle = Math.atan2(this.player.y - e.y, this.player.x - e.x);
      const ex = e.x + Math.cos(lookAngle) * (e.radius * 0.45);
      const ey = e.y + Math.sin(lookAngle) * (e.radius * 0.45);
      ctx.beginPath();
      ctx.arc(ex, ey, Math.max(2, e.radius * 0.25), 0, Math.PI * 2);
      ctx.fill();

      // Health bar above enemy
      if (e.hp < e.maxHp && e.type !== 'boss') {
        const bw = e.radius * 2;
        const bh = 4;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(e.x - bw / 2, e.y - e.radius - 8, bw, bh);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(e.x - bw / 2, e.y - e.radius - 8, (e.hp / e.maxHp) * bw, bh);
      }

      ctx.restore();
    });

    // Render Player Projectiles
    this.projectiles.forEach(p => {
      ctx.save();
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 12;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Render Enemy Projectiles
    this.enemyProjectiles.forEach(ep => {
      ctx.save();
      ctx.shadowColor = ep.color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = ep.color;
      ctx.beginPath();
      ctx.arc(ep.x, ep.y, ep.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Render Particles
    this.particles.forEach(p => {
      ctx.save();
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Render Orbiting Orbs
    if (this.player.orbitingOrbs > 0) {
      const orbAngleSpeed = Date.now() / 400;
      const orbDist = 62;
      for (let k = 0; k < this.player.orbitingOrbs; k++) {
        const angle = orbAngleSpeed + (k * Math.PI * 2) / this.player.orbitingOrbs;
        const ox = this.player.x + Math.cos(angle) * orbDist;
        const oy = this.player.y + Math.sin(angle) * orbDist;

        ctx.save();
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(ox, oy, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ox, oy, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Render Player Cyber Pet (Spark Fox)
    this.renderPlayerPet(ctx);

    // Render Damage Floating Numbers
    this.damageNumbers.forEach(dn => {
      ctx.save();
      ctx.font = `bold ${dn.size}px Outfit, sans-serif`;
      ctx.fillStyle = dn.color;
      ctx.shadowColor = dn.color;
      ctx.shadowBlur = 4;
      ctx.globalAlpha = Math.max(0, dn.life / dn.maxLife);
      ctx.fillText(dn.text, dn.x, dn.y);
      ctx.restore();
    });

    ctx.restore();

    // Render Minimap Radar
    this.renderMinimap();
  }

  renderArenaFloor(ctx) {
    // Outer perimeter neon fence
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, this.worldWidth - 16, this.worldHeight - 16);

    // Subtle arena grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const step = 80;
    const startX = Math.floor(this.camera.x / step) * step;
    const endX = startX + this.canvas.width + step * 2;
    const startY = Math.floor(this.camera.y / step) * step;
    const endY = startY + this.canvas.height + step * 2;

    for (let x = startX; x <= endX; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }
    for (let y = startY; y <= endY; y += step) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }

    // Render props in viewport
    this.cyberProps.forEach(prop => {
      if (
        prop.x >= this.camera.x - 50 &&
        prop.x <= this.camera.x + this.canvas.width + 50 &&
        prop.y >= this.camera.y - 50 &&
        prop.y <= this.camera.y + this.canvas.height + 50
      ) {
        ctx.fillStyle = prop.color;
        ctx.beginPath();
        ctx.roundRect(prop.x - prop.size / 2, prop.y - prop.size / 2, prop.size, prop.size, 4);
        ctx.fill();
      }
    });
  }

  renderPlayerPet(ctx) {
    ctx.save();
    ctx.translate(this.player.x, this.player.y);

    // Flash white when invulnerable
    if (this.player.invulnerableTimer > 0 && Math.sin(Date.now() / 40) > 0) {
      ctx.globalAlpha = 0.6;
    }

    // Glow
    ctx.shadowColor = '#eab308';
    ctx.shadowBlur = 18;

    // Body (Cyber Gold/Amber)
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(0, 0, this.player.radius, 0, Math.PI * 2);
    ctx.fill();

    // Cute Ears
    ctx.fillStyle = '#ca8a04';
    ctx.beginPath();
    ctx.moveTo(-12, -14);
    ctx.lineTo(-20, -28);
    ctx.lineTo(-4, -18);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(12, -14);
    ctx.lineTo(20, -28);
    ctx.lineTo(4, -18);
    ctx.closePath();
    ctx.fill();

    // Eyes looking towards facingAngle
    const eyeDist = 8;
    const lookX = Math.cos(this.player.facingAngle) * 5;
    const lookY = Math.sin(this.player.facingAngle) * 5;

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-eyeDist + lookX, -2 + lookY, 3.5, 0, Math.PI * 2);
    ctx.arc(eyeDist + lookX, -2 + lookY, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Eye sparkles
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-eyeDist + lookX - 1, -3 + lookY, 1.2, 0, Math.PI * 2);
    ctx.arc(eyeDist + lookX - 1, -3 + lookY, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Health Bar above player head
    const hpBarW = 38;
    const hpBarH = 5;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(-hpBarW / 2, -this.player.radius - 14, hpBarW, hpBarH);
    ctx.fillStyle = this.player.hp > 30 ? '#22c55e' : '#ef4444';
    ctx.fillRect(-hpBarW / 2, -this.player.radius - 14, (this.player.hp / this.player.maxHp) * hpBarW, hpBarH);

    ctx.restore();
  }

  renderMinimap() {
    this.minimapCtx.clearRect(0, 0, 80, 80);

    const scale = 80 / this.worldWidth;

    // Viewport box
    this.minimapCtx.strokeStyle = 'rgba(255,255,255,0.4)';
    this.minimapCtx.lineWidth = 1;
    this.minimapCtx.strokeRect(
      this.camera.x * scale,
      this.camera.y * scale,
      this.canvas.width * scale,
      this.canvas.height * scale
    );

    // Enemies (Red dots)
    this.minimapCtx.fillStyle = '#ef4444';
    this.enemies.forEach(e => {
      this.minimapCtx.fillRect(e.x * scale - 1, e.y * scale - 1, e.type === 'boss' ? 4 : 2, e.type === 'boss' ? 4 : 2);
    });

    // Player (Yellow dot)
    this.minimapCtx.fillStyle = '#eab308';
    this.minimapCtx.beginPath();
    this.minimapCtx.arc(this.player.x * scale, this.player.y * scale, 2.5, 0, Math.PI * 2);
    this.minimapCtx.fill();
  }
}
