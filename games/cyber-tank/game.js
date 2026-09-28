/**
 * game.js
 * Cyber Tank: Ricochet Protocol
 * High-octane arcade tank combat with realistic 2-bounce ricochet physics,
 * 12 progressive handcrafted levels, tactical laser aiming, and epic boss fights.
 */

import { BaseGame } from '../../src/core/BaseGame.js';
import { TankAudio } from './audio/TankAudio.js';
import { CAMPAIGN_LEVELS } from './data/levels.js';
import { TANK_TYPES, POWERUPS, DASH_CONFIG, MINE_CONFIG } from './data/weapons.js';
import { FXManager } from './engine/FXManager.js';
import { MapEngine } from './engine/MapEngine.js';
import { BulletSystem } from './engine/BulletSystem.js';
import { EnemyAI } from './engine/EnemyAI.js';

export default class CyberTankGame extends BaseGame {
  constructor(container, audio, storage, callbacks = {}) {
    super(container, audio, storage, callbacks);
    this.tankAudio = new TankAudio();
    this.currentLevelIndex = 0;
    this.unlockedLevels = 1;
    this.levelStars = {}; // { levelId: stars }
    this.state = 'MENU'; // 'MENU' | 'PLAYING' | 'VICTORY' | 'DEFEAT'
    this.levelTime = 0;
    this.damageTakenThisLevel = 0;
    this.totalScore = 0;

    // Player tank state
    this.player = null;
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false,
      dash: false,
      mine: false,
      shoot: false
    };
    this.mouse = { x: 400, y: 280, isDown: false };
    this.touchActive = false;
  }

  init() {
    // 1. Build DOM container structure with responsive canvas and UI overlays
    this.container.innerHTML = `
      <div class="tank-game-wrapper" style="position:relative; width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; user-select:none; overflow:hidden;">
        <!-- In-Game Top Tactical HUD -->
        <div id="tank-hud" style="position:absolute; top:8px; left:12px; right:12px; display:flex; justify-content:space-between; align-items:center; pointer-events:none; z-index:20;">
          <div style="display:flex; align-items:center; gap:8px;">
            <button id="btn-open-levels" style="pointer-events:auto; background:#0f172a; border:1px solid #06b6d4; color:#38bdf8; font-weight:700; font-family:var(--font-display, sans-serif); font-size:0.85rem; padding:6px 12px; border-radius:8px; cursor:pointer; display:flex; align-items:center; gap:6px; box-shadow:0 0 10px rgba(6,182,212,0.25);">
              🗺️ <span id="hud-level-name">MÀN 1</span>
            </button>
            <div style="background:rgba(15,23,42,0.85); backdrop-filter:blur(8px); padding:6px 12px; border-radius:8px; border:1px solid rgba(255,255,255,0.1); color:#ec4899; font-weight:700; font-family:var(--font-display, sans-serif); font-size:0.85rem;">
              ❤️ <span id="hud-hp">3 / 3</span>
            </div>
          </div>
          <div id="hud-powerup-bar" style="display:flex; gap:6px;"></div>
          <div style="display:flex; align-items:center; gap:8px;">
            <div style="background:rgba(15,23,42,0.85); backdrop-filter:blur(8px); padding:6px 12px; border-radius:8px; border:1px solid rgba(255,255,255,0.1); color:#f59e0b; font-weight:700; font-family:var(--font-display, sans-serif); font-size:0.85rem;">
              👾 Còn: <span id="hud-enemies">0</span>
            </div>
            <div style="background:rgba(15,23,42,0.85); backdrop-filter:blur(8px); padding:6px 12px; border-radius:8px; border:1px solid rgba(255,255,255,0.1); color:#38bdf8; font-weight:700; font-family:var(--font-display, sans-serif); font-size:0.85rem;">
              ⏱️ <span id="hud-timer">0.0s</span>
            </div>
          </div>
        </div>

        <!-- Main Canvas Viewport -->
        <div style="position:relative; width:100%; height:100%; display:flex; align-items:center; justify-content:center; overflow:hidden;">
          <canvas id="tank-canvas" width="800" height="560" style="display:block; max-width:100%; max-height:100%; aspect-ratio:800/560; border-radius:12px; box-shadow:0 12px 36px rgba(0,0,0,0.7), 0 0 24px rgba(6,182,212,0.15); background:#060913; cursor:crosshair;"></canvas>
        </div>

        <!-- Level Select Modal (Overlay) -->
        <div id="tank-menu-overlay" style="display:none; position:absolute; inset:0; background:rgba(6,9,19,0.92); backdrop-filter:blur(14px); border-radius:14px; flex-direction:column; align-items:center; justify-content:center; padding:20px; z-index:40;">
          <div style="display:flex; justify-content:space-between; align-items:center; width:100%; max-width:640px; margin-bottom:12px;">
            <div style="font-family:var(--font-display, sans-serif); font-size:1.4rem; font-weight:800; color:#fff; text-shadow:0 0 12px #06b6d4;">
              🗺️ CHỌN MÀN CHƠI (CAMPAIGN)
            </div>
            <button id="btn-close-levels" style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); color:#94a3b8; font-size:1.2rem; border-radius:8px; width:36px; height:36px; cursor:pointer; display:flex; align-items:center; justify-content:center;">✕</button>
          </div>
          <p style="color:#94a3b8; font-size:0.85rem; margin-bottom:16px; text-align:center;">
            Chọn màn chơi đã mở khóa hoặc bắn dội tường để thu thập đủ 3 sao mỗi màn!
          </p>
          <div id="tank-level-grid" style="display:grid; grid-template-columns:repeat(4, 1fr); gap:10px; max-width:640px; width:100%; max-height:360px; overflow-y:auto; padding:4px;"></div>
        </div>

        <!-- Level Cleared Banner Modal -->
        <div id="tank-victory-modal" style="display:none; position:absolute; inset:0; background:rgba(6,9,19,0.88); backdrop-filter:blur(12px); border-radius:14px; flex-direction:column; align-items:center; justify-content:center; z-index:45;">
          <div style="background:#0f172a; border:2px solid #10b981; border-radius:16px; padding:28px; text-align:center; max-width:420px; width:90%; box-shadow:0 0 32px rgba(16,185,129,0.3);">
            <div id="vic-stars" style="font-size:2.2rem; margin-bottom:6px;">⭐⭐⭐</div>
            <h3 style="font-family:var(--font-display, sans-serif); font-size:1.5rem; color:#34d399; margin-bottom:4px;">CHIẾN THẮNG!</h3>
            <p id="vic-brief" style="color:#94a3b8; font-size:0.85rem; margin-bottom:14px;">Màn chơi đã hoàn thành xuất sắc!</p>
            <div style="background:rgba(255,255,255,0.04); border-radius:8px; padding:12px; margin-bottom:18px; display:grid; grid-template-columns:1fr 1fr; gap:10px;">
              <div><span style="font-size:0.75rem; color:#94a3b8;">Thời gian:</span> <div id="vic-time" style="font-weight:700; color:#38bdf8;">0s</div></div>
              <div><span style="font-size:0.75rem; color:#94a3b8;">Điểm số:</span> <div id="vic-score" style="font-weight:700; color:#facc15;">0</div></div>
            </div>
            <div style="display:flex; gap:8px;">
              <button id="btn-next-level" style="flex:1; background:linear-gradient(135deg, #10b981, #059669); color:#fff; font-weight:700; border:none; padding:10px; border-radius:8px; cursor:pointer;">Màn Tiếp ➔</button>
              <button id="btn-replay-level" style="flex:1; background:rgba(255,255,255,0.08); color:#fff; font-weight:600; border:1px solid rgba(255,255,255,0.1); padding:10px; border-radius:8px; cursor:pointer;">Chơi Lại 🔄</button>
              <button id="btn-menu-level" style="background:rgba(255,255,255,0.08); color:#38bdf8; font-weight:600; border:1px solid rgba(6,182,212,0.3); padding:10px; border-radius:8px; cursor:pointer;">Chọn Màn 🗺️</button>
            </div>
          </div>
        </div>

        <!-- Defeat Banner Modal -->
        <div id="tank-defeat-modal" style="display:none; position:absolute; inset:0; background:rgba(6,9,19,0.88); backdrop-filter:blur(12px); border-radius:14px; flex-direction:column; align-items:center; justify-content:center; z-index:45;">
          <div style="background:#0f172a; border:2px solid #ef4444; border-radius:16px; padding:28px; text-align:center; max-width:400px; width:90%; box-shadow:0 0 32px rgba(239,68,68,0.3);">
            <div style="font-size:2.4rem; margin-bottom:6px;">💥</div>
            <h3 style="font-family:var(--font-display, sans-serif); font-size:1.5rem; color:#f87171; margin-bottom:4px;">CHIẾN TĂNG BỊ PHÁ HỦY!</h3>
            <p style="color:#94a3b8; font-size:0.85rem; margin-bottom:18px;">Hãy tận dụng góc phản xạ đạn và di chuyển liên tục để né đạn cối.</p>
            <div style="display:flex; gap:10px;">
              <button id="btn-retry-defeat" style="flex:1; background:linear-gradient(135deg, #ef4444, #dc2626); color:#fff; font-weight:700; border:none; padding:10px; border-radius:8px; cursor:pointer;">Thử Lại 🔄</button>
              <button id="btn-menu-defeat" style="flex:1; background:rgba(255,255,255,0.08); color:#38bdf8; font-weight:600; border:1px solid rgba(6,182,212,0.3); padding:10px; border-radius:8px; cursor:pointer;">Chọn Màn 🗺️</button>
            </div>
          </div>
        </div>

        <!-- Mobile Touch Controls (shown on touch devices) -->
        <div id="tank-touch-controls" style="display:none; position:absolute; bottom:16px; left:16px; right:16px; justify-content:space-between; pointer-events:none; z-index:25;">
          <div id="touch-stick-zone" style="width:110px; height:110px; background:rgba(255,255,255,0.06); border:2px dashed rgba(255,255,255,0.2); border-radius:50%; pointer-events:auto; display:flex; align-items:center; justify-content:center; touch-action:none;">
            <div id="touch-stick-nub" style="width:40px; height:40px; background:#06b6d4; border-radius:50%; box-shadow:0 0 10px #06b6d4;"></div>
          </div>
          <div style="display:flex; flex-direction:column; gap:10px; pointer-events:auto;">
            <button id="btn-touch-shoot" style="width:65px; height:65px; background:linear-gradient(135deg, #ef4444, #dc2626); border:none; border-radius:50%; color:#fff; font-weight:700; font-size:1.1rem; box-shadow:0 0 14px rgba(239,68,68,0.5);">🔥</button>
            <button id="btn-touch-mine" style="width:50px; height:50px; background:linear-gradient(135deg, #a855f7, #7e22ce); border:none; border-radius:50%; color:#fff; font-weight:700; font-size:1rem; align-self:flex-end;">💣</button>
          </div>
        </div>
      </div>
    `;

    this.canvas = this.container.querySelector('#tank-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Cache UI elements
    this.hudEl = this.container.querySelector('#tank-hud');
    this.hudLevelNameEl = this.container.querySelector('#hud-level-name');
    this.hudHpEl = this.container.querySelector('#hud-hp');
    this.hudEnemiesEl = this.container.querySelector('#hud-enemies');
    this.hudTimerEl = this.container.querySelector('#hud-timer');
    this.hudPowerupBarEl = this.container.querySelector('#hud-powerup-bar');

    this.menuOverlay = this.container.querySelector('#tank-menu-overlay');
    this.levelGridEl = this.container.querySelector('#tank-level-grid');
    this.victoryModal = this.container.querySelector('#tank-victory-modal');
    this.defeatModal = this.container.querySelector('#tank-defeat-modal');
    this.touchControlsEl = this.container.querySelector('#tank-touch-controls');

    // Engine subsystems
    this.fx = new FXManager();
    this.map = new MapEngine(this.fx, this.tankAudio);
    this.bullets = new BulletSystem(this.map, this.fx, this.tankAudio);
    this.enemies = new EnemyAI(this.map, this.bullets, this.fx, this.tankAudio);

    // Load saved campaign progress
    this.loadProgress();

    // Bind event handlers
    this.bindEvents();
    this.renderLevelGrid();
    this.setupCanvasSize();
  }

  loadProgress() {
    try {
      const saved = this.storage ? this.storage.getSetting('cyber-tank_progress', null) : null;
      if (saved) {
        this.unlockedLevels = Math.max(1, saved.unlockedLevels || 1);
        this.levelStars = saved.levelStars || {};
      }
    } catch (_) {
      this.unlockedLevels = 1;
      this.levelStars = {};
    }
  }

  saveProgress() {
    try {
      if (this.storage) {
        this.storage.saveSetting('cyber-tank_progress', {
          unlockedLevels: this.unlockedLevels,
          levelStars: this.levelStars
        });
      }
    } catch (_) {}
  }

  setupCanvasSize() {
    if (!this.canvas) return;
    this.canvas.width = 800;
    this.canvas.height = 560;
  }

  bindEvents() {
    // 1. Mouse aiming & shooting
    const onMouseMove = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      this.mouse.x = (e.clientX - rect.left) * scaleX;
      this.mouse.y = (e.clientY - rect.top) * scaleY;
    };
    this.addTrackedEventListener(this.canvas, 'mousemove', onMouseMove);

    const onMouseDown = (e) => {
      this.tankAudio.ensureContext();
      if (e.button === 0) {
        this.mouse.isDown = true;
        this.keys.shoot = true;
      } else if (e.button === 2) {
        // Right click: deploy mine
        e.preventDefault();
        this.deployPlayerMine();
      }
    };
    this.addTrackedEventListener(this.canvas, 'mousedown', onMouseDown);

    const onMouseUp = (e) => {
      if (e.button === 0) {
        this.mouse.isDown = false;
        this.keys.shoot = false;
      }
    };
    this.addTrackedEventListener(window, 'mouseup', onMouseUp);

    const onContextMenu = (e) => e.preventDefault();
    this.addTrackedEventListener(this.canvas, 'contextmenu', onContextMenu);

    // 2. Keyboard controls
    const onKeyDown = (e) => {
      this.tankAudio.ensureContext();
      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') this.keys.up = true;
      if (code === 'KeyS' || code === 'ArrowDown') this.keys.down = true;
      if (code === 'KeyA' || code === 'ArrowLeft') this.keys.left = true;
      if (code === 'KeyD' || code === 'ArrowRight') this.keys.right = true;
      if (code === 'Space') {
        this.keys.shoot = true;
        e.preventDefault();
      }
      if (code === 'KeyE') {
        this.deployPlayerMine();
      }
      if (code === 'ShiftLeft' || code === 'ShiftRight') {
        this.triggerPlayerDash();
      }
      if (code === 'Escape') {
        if (this.menuOverlay && this.menuOverlay.style.display === 'flex') {
          this.closeMenu();
        } else {
          this.openMenu();
        }
      }
    };
    this.addTrackedEventListener(window, 'keydown', onKeyDown);

    const onKeyUp = (e) => {
      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') this.keys.up = false;
      if (code === 'KeyS' || code === 'ArrowDown') this.keys.down = false;
      if (code === 'KeyA' || code === 'ArrowLeft') this.keys.left = false;
      if (code === 'KeyD' || code === 'ArrowRight') this.keys.right = false;
      if (code === 'Space') this.keys.shoot = false;
    };
    this.addTrackedEventListener(window, 'keyup', onKeyUp);

    // 3. UI Button handlers
    const btnOpenLevels = this.container.querySelector('#btn-open-levels');
    if (btnOpenLevels) {
      this.addTrackedEventListener(btnOpenLevels, 'click', () => {
        this.tankAudio.ensureContext();
        this.openMenu();
      });
    }

    const btnCloseLevels = this.container.querySelector('#btn-close-levels');
    if (btnCloseLevels) {
      this.addTrackedEventListener(btnCloseLevels, 'click', () => {
        this.closeMenu();
      });
    }

    const btnNextLevel = this.container.querySelector('#btn-next-level');
    if (btnNextLevel) {
      this.addTrackedEventListener(btnNextLevel, 'click', () => {
        this.tankAudio.ensureContext();
        if (this.currentLevelIndex < CAMPAIGN_LEVELS.length - 1) {
          this.loadLevel(this.currentLevelIndex + 1);
        } else {
          this.openMenu();
        }
      });
    }

    const btnReplayLevel = this.container.querySelector('#btn-replay-level');
    if (btnReplayLevel) {
      this.addTrackedEventListener(btnReplayLevel, 'click', () => {
        this.tankAudio.ensureContext();
        this.loadLevel(this.currentLevelIndex);
      });
    }

    const btnMenuLevel = this.container.querySelector('#btn-menu-level');
    if (btnMenuLevel) {
      this.addTrackedEventListener(btnMenuLevel, 'click', () => {
        this.openMenu();
      });
    }

    const btnRetryDefeat = this.container.querySelector('#btn-retry-defeat');
    if (btnRetryDefeat) {
      this.addTrackedEventListener(btnRetryDefeat, 'click', () => {
        this.tankAudio.ensureContext();
        this.loadLevel(this.currentLevelIndex);
      });
    }

    const btnMenuDefeat = this.container.querySelector('#btn-menu-defeat');
    if (btnMenuDefeat) {
      this.addTrackedEventListener(btnMenuDefeat, 'click', () => {
        this.openMenu();
      });
    }

    // 4. Touch support detection
    const onTouchStart = () => {
      if (!this.touchActive) {
        this.touchActive = true;
        if (this.touchControlsEl) this.touchControlsEl.style.display = 'flex';
      }
    };
    this.addTrackedEventListener(this.container, 'touchstart', onTouchStart, { passive: true });

    const btnTouchShoot = this.container.querySelector('#btn-touch-shoot');
    if (btnTouchShoot) {
      btnTouchShoot.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.keys.shoot = true;
      });
      btnTouchShoot.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.keys.shoot = false;
      });
    }

    const btnTouchMine = this.container.querySelector('#btn-touch-mine');
    if (btnTouchMine) {
      btnTouchMine.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.deployPlayerMine();
      });
    }

    // Touch Virtual Stick
    const stickZone = this.container.querySelector('#touch-stick-zone');
    const stickNub = this.container.querySelector('#touch-stick-nub');
    let touchOrigin = null;

    if (stickZone && stickNub) {
      stickZone.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        const rect = stickZone.getBoundingClientRect();
        touchOrigin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      });

      stickZone.addEventListener('touchmove', (e) => {
        if (!touchOrigin) return;
        const touch = e.touches[0];
        const dx = touch.clientX - touchOrigin.x;
        const dy = touch.clientY - touchOrigin.y;
        const dist = Math.hypot(dx, dy);
        const maxDist = 38;
        const clampedX = dist > 0 ? (dx / dist) * Math.min(dist, maxDist) : 0;
        const clampedY = dist > 0 ? (dy / dist) * Math.min(dist, maxDist) : 0;

        stickNub.style.transform = `translate(${clampedX}px, ${clampedY}px)`;

        this.keys.right = clampedX > 14;
        this.keys.left = clampedX < -14;
        this.keys.down = clampedY > 14;
        this.keys.up = clampedY < -14;
      });

      const resetStick = () => {
        touchOrigin = null;
        stickNub.style.transform = 'translate(0px, 0px)';
        this.keys.left = false;
        this.keys.right = false;
        this.keys.up = false;
        this.keys.down = false;
      };
      stickZone.addEventListener('touchend', resetStick);
      stickZone.addEventListener('touchcancel', resetStick);
    }

    const onResize = () => this.setupCanvasSize();
    this.addTrackedEventListener(window, 'resize', onResize);
  }

  closeMenu() {
    if (this.menuOverlay) this.menuOverlay.style.display = 'none';
    this.state = 'PLAYING';
  }

  renderLevelGrid() {
    this.levelGridEl.innerHTML = '';
    CAMPAIGN_LEVELS.forEach((lvl, idx) => {
      const isUnlocked = idx + 1 <= this.unlockedLevels;
      const stars = this.levelStars[lvl.id] || 0;
      const card = document.createElement('div');
      card.style.cssText = `
        background: ${isUnlocked ? 'rgba(30, 41, 59, 0.8)' : 'rgba(15, 23, 42, 0.4)'};
        border: 1px solid ${isUnlocked ? (idx === this.currentLevelIndex ? '#06b6d4' : 'rgba(255, 255, 255, 0.1)') : 'rgba(255, 255, 255, 0.04)'};
        border-radius: 10px;
        padding: 10px;
        cursor: ${isUnlocked ? 'pointer' : 'not-allowed'};
        opacity: ${isUnlocked ? '1' : '0.45'};
        display: flex;
        flex-direction: column;
        align-items: center;
        transition: transform 0.15s, border-color 0.15s;
      `;

      const starStr = stars > 0 ? '⭐'.repeat(stars) : (isUnlocked ? '☆☆☆' : '🔒');
      card.innerHTML = `
        <div style="font-size:0.75rem; color:#94a3b8; font-weight:700;">MÀN ${lvl.id}</div>
        <div style="font-size:0.85rem; font-weight:700; color:#fff; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width:100%; margin:3px 0;">${lvl.name}</div>
        <div style="font-size:0.85rem;">${starStr}</div>
      `;

      if (isUnlocked) {
        card.addEventListener('mouseenter', () => { card.style.transform = 'translateY(-2px)'; });
        card.addEventListener('mouseleave', () => { card.style.transform = 'translateY(0)'; });
        card.addEventListener('click', () => {
          this.tankAudio.ensureContext();
          this.loadLevel(idx);
        });
      }

      this.levelGridEl.appendChild(card);
    });
  }

  openMenu() {
    this.state = 'MENU';
    if (this.menuOverlay) this.menuOverlay.style.display = 'flex';
    this.renderLevelGrid();
  }

  loadLevel(levelIndex) {
    this.currentLevelIndex = levelIndex;
    const lvl = CAMPAIGN_LEVELS[levelIndex];
    if (!lvl) return;

    this.state = 'PLAYING';
    this.levelTime = 0;
    this.damageTakenThisLevel = 0;

    if (this.menuOverlay) this.menuOverlay.style.display = 'none';
    if (this.victoryModal) this.victoryModal.style.display = 'none';
    if (this.defeatModal) this.defeatModal.style.display = 'none';
    if (this.hudEl) this.hudEl.style.display = 'flex';

    if (this.hudLevelNameEl) this.hudLevelNameEl.textContent = `MÀN ${lvl.id}`;

    // Reset subsystems
    this.fx.reset();
    this.map.loadLevel(lvl);
    this.bullets.reset();
    this.enemies.spawnEnemies(lvl.enemies);

    // Initialize player tank
    const spawnX = (lvl.playerSpawn.col + 0.5) * this.map.tileSize;
    const spawnY = (lvl.playerSpawn.row + 0.5) * this.map.tileSize;

    this.player = {
      x: spawnX,
      y: spawnY,
      vx: 0,
      vy: 0,
      hullAngle: lvl.playerSpawn.angle || 0,
      turretAngle: lvl.playerSpawn.angle || 0,
      speed: TANK_TYPES.player.speed,
      turnSpeed: TANK_TYPES.player.turnSpeed,
      radius: TANK_TYPES.player.radius,
      hp: TANK_TYPES.player.maxHp,
      maxHp: TANK_TYPES.player.maxHp,
      dead: false,
      invulnerableTimer: 1.0,
      fireTimer: 0,
      fireCooldown: TANK_TYPES.player.fireCooldown,
      bulletSpeed: TANK_TYPES.player.bulletSpeed,
      maxBounces: TANK_TYPES.player.maxBounces,
      // Abilities & Power-ups
      dashCooldownTimer: 0,
      dashActiveTimer: 0,
      mineCooldownTimer: 0,
      activePowerups: {}, // key -> time remaining
      trackTimer: 0
    };

    this.updateHUD();
    this.fx.addFloatingText(`MÀN ${lvl.id}: ${lvl.name}`, this.canvas.width / 2, this.canvas.height / 2 - 30, '#06b6d4', 1.4);
    this.fx.addFloatingText(lvl.briefing, this.canvas.width / 2, this.canvas.height / 2 + 10, '#94a3b8', 0.95);
  }

  start() {
    super.start();
    this.totalScore = 0;
    this.emitScore(0);
    this.loadLevel(this.currentLevelIndex || 0);
    this.startLoop(this.ctx);
  }

  restart() {
    this.cleanupLoopAndTimers();
    this.start();
  }

  deployPlayerMine() {
    if (!this.player || this.player.dead || this.state !== 'PLAYING') return;
    if (this.player.mineCooldownTimer <= 0) {
      this.player.mineCooldownTimer = MINE_CONFIG.cooldown;
      this.bullets.deployMine({ x: this.player.x, y: this.player.y, isPlayer: true });
      this.fx.addFloatingText('MÌN ĐÃ CÀI!', this.player.x, this.player.y - 20, '#a855f7', 0.9);
    }
  }

  triggerPlayerDash() {
    if (!this.player || this.player.dead || this.state !== 'PLAYING') return;
    if (this.player.dashCooldownTimer <= 0) {
      this.player.dashCooldownTimer = DASH_CONFIG.cooldown;
      this.player.dashActiveTimer = DASH_CONFIG.duration;
      this.tankAudio.playDash();
      this.fx.addFloatingText('LƯỚT TỐC ĐỘ!', this.player.x, this.player.y - 20, '#38bdf8', 1.0);
    }
  }

  update(dt) {
    if (this.isPaused || this.state !== 'PLAYING') return;

    this.levelTime += dt;
    this.hudTimerEl.textContent = `${this.levelTime.toFixed(1)}s`;

    // 1. Update player input & kinematics
    if (this.player && !this.player.dead) {
      this.updatePlayer(dt);
    }

    // 2. Update map hazards (lasers, teleporters, drops)
    this.map.update(dt, (laserX, laserY) => {
      // Handled directly inside tank collision
    });

    // 3. Update bullets, mortar shells & mines
    this.bullets.update(
      dt,
      this.player,
      this.enemies.enemies,
      (target, damage, isPlayerBullet) => {
        this.handleUnitDamage(target, damage, isPlayerBullet);
      },
      (blastX, blastY, blastRadius, damage) => {
        this.handleExplosionDamage(blastX, blastY, blastRadius, damage);
      }
    );

    // 4. Update enemy AI tanks
    this.enemies.update(dt, this.player);

    // 5. Update FX & particles
    this.fx.update(dt);

    // 6. Check powerup crate collection
    this.checkPowerupCollection();

    // 7. Check Victory condition (all enemies destroyed)
    const aliveEnemies = this.enemies.enemies.filter(e => !e.dead).length;
    this.hudEnemiesEl.textContent = aliveEnemies.toString();

    if (aliveEnemies === 0 && this.state === 'PLAYING') {
      this.handleLevelVictory();
    }
  }

  updatePlayer(dt) {
    const p = this.player;

    // Timers
    if (p.invulnerableTimer > 0) p.invulnerableTimer -= dt;
    if (p.dashCooldownTimer > 0) p.dashCooldownTimer -= dt;
    if (p.dashActiveTimer > 0) p.dashActiveTimer -= dt;
    if (p.mineCooldownTimer > 0) p.mineCooldownTimer -= dt;
    if (p.fireTimer > 0) p.fireTimer -= dt;

    // Update active power-ups
    for (const [key, timeLeft] of Object.entries(p.activePowerups)) {
      p.activePowerups[key] = timeLeft - dt;
      if (p.activePowerups[key] <= 0) {
        delete p.activePowerups[key];
        this.updateHUDPowerups();
      }
    }

    // Movement vector from keys
    let moveX = 0;
    let moveY = 0;
    if (this.keys.up) moveY -= 1;
    if (this.keys.down) moveY += 1;
    if (this.keys.left) moveX -= 1;
    if (this.keys.right) moveX += 1;

    const moveLen = Math.hypot(moveX, moveY);
    if (moveLen > 0) {
      moveX /= moveLen;
      moveY /= moveLen;

      // Rotate hull smoothly towards movement direction
      const targetHullAngle = Math.atan2(moveY, moveX);
      p.hullAngle = this.enemies.rotateTowards(p.hullAngle, targetHullAngle, p.turnSpeed * dt);

      // Current effective speed
      let curSpeed = p.speed;
      if (p.activePowerups.speed) curSpeed *= POWERUPS.speed.speedMultiplier;
      if (p.dashActiveTimer > 0) curSpeed = DASH_CONFIG.speed;

      p.vx = Math.cos(p.hullAngle) * curSpeed;
      p.vy = Math.sin(p.hullAngle) * curSpeed;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Tread marks
      p.trackTimer += dt;
      if (p.trackTimer >= 0.1) {
        p.trackTimer = 0;
        this.fx.addTreadMark(p.x, p.y, p.hullAngle, 'rgba(6, 182, 212, 0.25)');
      }
    } else {
      p.vx = 0;
      p.vy = 0;
    }

    // Check laser forcefield hazard
    if (this.map.laserActive) {
      const col = Math.floor(p.x / this.map.tileSize);
      const row = Math.floor(p.y / this.map.tileSize);
      if (this.map.grid[row] && this.map.grid[row][col] === 4) {
        this.handleUnitDamage(p, 1, false);
      }
    }

    // Check teleporter warp
    const warp = this.map.checkTeleport(p.x, p.y);
    if (warp) {
      p.x = warp.targetX;
      p.y = warp.targetY;
      this.fx.createEmpPulse(p.x, p.y, 40);
    }

    // Resolve wall collision
    this.map.resolveTankCollision(p);

    // Turret aiming at mouse
    p.turretAngle = Math.atan2(this.mouse.y - p.y, this.mouse.x - p.x);

    // Primary weapon firing
    if (this.keys.shoot && p.fireTimer <= 0) {
      const isRapid = !!p.activePowerups.rapid;
      const isScatter = !!p.activePowerups.scatter;
      p.fireTimer = isRapid ? POWERUPS.rapid.fireCooldown : p.fireCooldown;

      const barrelDist = p.radius + 8;
      const muzzleX = p.x + Math.cos(p.turretAngle) * barrelDist;
      const muzzleY = p.y + Math.sin(p.turretAngle) * barrelDist;

      if (isScatter) {
        // Scatter shot fires 3 shells
        [-0.18, 0, 0.18].forEach(offset => {
          this.bullets.spawnBullet({
            x: muzzleX,
            y: muzzleY,
            angle: p.turretAngle + offset,
            speed: p.bulletSpeed,
            maxBounces: p.maxBounces,
            isPlayer: true,
            color: '#38bdf8'
          });
        });
      } else {
        this.bullets.spawnBullet({
          x: muzzleX,
          y: muzzleY,
          angle: p.turretAngle,
          speed: p.bulletSpeed,
          maxBounces: p.maxBounces,
          isPlayer: true,
          color: isRapid ? '#facc15' : '#06b6d4'
        });
      }
    }
  }

  checkPowerupCollection() {
    if (!this.player || this.player.dead) return;
    for (let i = this.map.powerupDrops.length - 1; i >= 0; i--) {
      const drop = this.map.powerupDrops[i];
      const dist = Math.hypot(this.player.x - drop.x, this.player.y - drop.y);
      if (dist <= this.player.radius + 14) {
        // Collected!
        this.map.powerupDrops.splice(i, 1);
        this.tankAudio.playPowerup();
        this.fx.addFloatingText(`${drop.config.name}!`, drop.x, drop.y - 15, drop.config.color, 1.2);

        if (drop.type === 'emp') {
          // Instant EMP shockwave
          this.fx.createEmpPulse(this.player.x, this.player.y, 800);
          this.enemies.enemies.forEach(e => {
            if (!e.dead) e.empTimer = POWERUPS.emp.duration;
          });
        } else if (drop.type === 'shield') {
          this.player.activePowerups.shield = POWERUPS.shield.duration;
        } else {
          this.player.activePowerups[drop.type] = drop.config.duration;
        }
        this.updateHUDPowerups();
      }
    }
  }

  updateHUDPowerups() {
    if (!this.hudPowerupBarEl || !this.player) return;
    this.hudPowerupBarEl.innerHTML = '';
    for (const [key, timeLeft] of Object.entries(this.player.activePowerups)) {
      const conf = POWERUPS[key];
      if (conf) {
        const badge = document.createElement('div');
        badge.style.cssText = `background:rgba(15,23,42,0.85); border:1px solid ${conf.color}; color:#fff; font-size:0.75rem; font-weight:700; padding:4px 8px; border-radius:6px; display:flex; align-items:center; gap:4px;`;
        badge.innerHTML = `<span>${conf.icon}</span> <span>${Math.ceil(timeLeft)}s</span>`;
        this.hudPowerupBarEl.appendChild(badge);
      }
    }
  }

  handleUnitDamage(unit, damage, isPlayerSource) {
    if (unit.dead) return;

    // Player damage handling
    if (unit === this.player) {
      if (this.player.invulnerableTimer > 0) return;

      // Shield absorption
      if (this.player.activePowerups.shield) {
        delete this.player.activePowerups.shield;
        this.updateHUDPowerups();
        this.tankAudio.playHit(true);
        this.fx.addFloatingText('LÁ CHẮN ĐỠ ĐÒN!', unit.x, unit.y - 25, '#38bdf8', 1.2);
        this.player.invulnerableTimer = 0.8;
        return;
      }

      this.player.hp -= damage;
      this.damageTakenThisLevel += damage;
      this.player.invulnerableTimer = 1.0;
      this.tankAudio.playHit(false);
      this.fx.addShake(8, 0.25);
      this.updateHUD();

      if (this.player.hp <= 0) {
        this.player.hp = 0;
        this.player.dead = true;
        this.fx.createExplosion(unit.x, unit.y, true, '#06b6d4');
        this.tankAudio.playDefeat();
        this.handlePlayerDefeat();
      }
      return;
    }

    // Enemy damage handling
    if (unit.shieldHp > 0) {
      unit.shieldHp -= damage;
      this.tankAudio.playHit(true);
      this.fx.createRicochetSparks(unit.x, unit.y, 0, 1, '#38bdf8');
      return;
    }

    unit.hp -= damage;
    this.tankAudio.playHit(false);
    this.fx.createRicochetSparks(unit.x, unit.y, 0, -1, unit.color);

    if (unit.hp <= 0) {
      this.enemies.killEnemy(unit, this.player);
      this.totalScore += unit.score;
      this.emitScore(this.totalScore);
    }
  }

  handleExplosionDamage(blastX, blastY, blastRadius, damage) {
    // Damage player if caught
    if (this.player && !this.player.dead) {
      const dist = Math.hypot(this.player.x - blastX, this.player.y - blastY);
      if (dist <= blastRadius + this.player.radius) {
        this.handleUnitDamage(this.player, damage, false);
      }
    }

    // Damage enemies
    for (const e of this.enemies.enemies) {
      if (!e.dead) {
        const dist = Math.hypot(e.x - blastX, e.y - blastY);
        if (dist <= blastRadius + e.radius) {
          this.handleUnitDamage(e, damage, true);
        }
      }
    }
  }

  handleLevelVictory() {
    this.state = 'VICTORY';
    this.tankAudio.playVictory();

    const lvl = CAMPAIGN_LEVELS[this.currentLevelIndex];
    // Calculate star rating (1 to 3 stars)
    let stars = 1;
    if (this.levelTime <= lvl.starTime && this.damageTakenThisLevel <= lvl.starDamage) {
      stars = 3;
    } else if (this.levelTime <= lvl.starTime * 1.5 || this.damageTakenThisLevel <= lvl.starDamage + 1) {
      stars = 2;
    }

    // Save star rating
    const prevStars = this.levelStars[lvl.id] || 0;
    if (stars > prevStars) {
      this.levelStars[lvl.id] = stars;
    }

    // Unlock next level
    if (this.currentLevelIndex + 1 < CAMPAIGN_LEVELS.length) {
      this.unlockedLevels = Math.max(this.unlockedLevels, this.currentLevelIndex + 2);
    }
    this.saveProgress();

    // Show Victory Modal
    this.victoryModal.style.display = 'flex';
    this.victoryModal.querySelector('#vic-stars').textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    this.victoryModal.querySelector('#vic-brief').textContent = `Xuất sắc! Bạn đã quét sạch quân địch trong ${this.levelTime.toFixed(1)} giây.`;
    this.victoryModal.querySelector('#vic-time').textContent = `${this.levelTime.toFixed(1)}s`;
    this.victoryModal.querySelector('#vic-score').textContent = this.totalScore.toString();
  }

  handlePlayerDefeat() {
    this.state = 'DEFEAT';
    this.defeatModal.style.display = 'flex';
    this.emitGameOver();
  }

  updateHUD() {
    if (this.player && this.hudHpEl) {
      this.hudHpEl.textContent = `${this.player.hp} / ${this.player.maxHp}`;
    }
  }

  render(ctx) {
    ctx.save();
    // Screen shake translation
    const shake = this.fx.getShakeOffset();
    ctx.translate(shake.x, shake.y);

    // 1. Clear background
    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 2. Render Map Arena & Barriers
    this.map.render(ctx);

    // 3. Render Ground Tread Marks
    this.fx.renderUnderlay(ctx);

    // 4. Render Tactical Laser Sight & Ricochet Trajectory
    if (this.player && !this.player.dead && this.state === 'PLAYING') {
      this.renderPlayerLaserSight(ctx);
    }

    // 5. Render Bullets, Mortars & Mines
    this.bullets.render(ctx);

    // 6. Render Enemies
    this.enemies.render(ctx);

    // 7. Render Player Tank
    if (this.player && !this.player.dead) {
      this.renderPlayerTank(ctx);
    }

    // 8. Render Explosions, Shockwaves, Particles & Combat Text
    this.fx.renderOverlay(ctx);

    ctx.restore();
  }

  renderPlayerLaserSight(ctx) {
    const p = this.player;
    const barrelDist = p.radius + 8;
    const startX = p.x + Math.cos(p.turretAngle) * barrelDist;
    const startY = p.y + Math.sin(p.turretAngle) * barrelDist;
    const dirX = Math.cos(p.turretAngle);
    const dirY = Math.sin(p.turretAngle);

    // First raycast hit against solid walls
    const ray1 = this.map.raycast(startX, startY, dirX, dirY, 900);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(ray1.x, ray1.y);
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.stroke();

    // Hit dot at first bounce
    ctx.beginPath();
    ctx.arc(ray1.x, ray1.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 8;
    ctx.fill();

    // Second bounce reflection angle prediction!
    if (ray1.hit && (ray1.tileType === 1 || ray1.tileType === 4)) {
      const dot = dirX * ray1.normalX + dirY * ray1.normalY;
      const reflectX = dirX - 2 * dot * ray1.normalX;
      const reflectY = dirY - 2 * dot * ray1.normalY;

      const ray2 = this.map.raycast(ray1.x + ray1.normalX * 2, ray1.y + ray1.normalY * 2, reflectX, reflectY, 500);
      ctx.beginPath();
      ctx.moveTo(ray1.x, ray1.y);
      ctx.lineTo(ray2.x, ray2.y);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 6]);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(ray2.x, ray2.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();
    }
    ctx.restore();
  }

  renderPlayerTank(ctx) {
    const p = this.player;

    ctx.save();
    ctx.translate(p.x, p.y);

    // Flashing when invulnerable
    if (p.invulnerableTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    // Energy Shield Aura
    if (p.activePowerups.shield) {
      ctx.beginPath();
      ctx.arc(0, 0, p.radius + 8, 0, Math.PI * 2);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.stroke();
    }

    // 1. Tank Hull & Treads
    ctx.save();
    ctx.rotate(p.hullAngle);

    // Left & Right Treads
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-p.radius, -p.radius, p.radius * 2, p.radius * 0.45);
    ctx.fillRect(-p.radius, p.radius * 0.55, p.radius * 2, p.radius * 0.45);

    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 1;
    ctx.strokeRect(-p.radius, -p.radius, p.radius * 2, p.radius * 0.45);
    ctx.strokeRect(-p.radius, p.radius * 0.55, p.radius * 2, p.radius * 0.45);

    // Armor Core
    ctx.beginPath();
    ctx.roundRect(-p.radius * 0.85, -p.radius * 0.65, p.radius * 1.7, p.radius * 1.3, 4);
    ctx.fillStyle = '#0891b2';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // 2. Rotating Turret & Barrel
    ctx.save();
    ctx.rotate(p.turretAngle);

    // Cannon Barrel
    const barrelLen = p.radius * 1.45;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, -3, barrelLen, 6);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(0, -3, barrelLen, 6);

    // Turret Dome
    ctx.beginPath();
    ctx.arc(0, 0, p.radius * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  destroy() {
    super.destroy();
    // Clear audio context if needed
    this.tankAudio.setMuted(true);
  }
}
