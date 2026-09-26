/**
 * game.js
 * Cuội Ơi Cẩn Thận! (Trung Thu Chaos)
 * Main Game Controller extending BaseGame.
 */

import { BaseGame } from '../../src/core/BaseGame.js';
import { BackgroundRenderer } from './engine/BackgroundRenderer.js';
import { Player } from './engine/Player.js';
import { MooncakeManager } from './engine/MooncakeManager.js';
import { ObstacleManager } from './engine/ObstacleManager.js';
import { BossManager } from './engine/BossManager.js';
import { FXManager } from './engine/FXManager.js';
import { SynthAudio } from './audio/SynthAudio.js';
import { SKINS, getSkinList } from './data/skins.js';
import { CHI_HANG_REACTIONS, getEndGameRating } from './data/dialogues.js';

export default class TrungThuChaosGame extends BaseGame {
  init() {
    this.canvasWidth = 800;
    this.canvasHeight = 520;

    this.lives = 3;
    this.maxLives = 3;
    this.gold = 50; // Starter gold
    this.score = 0;
    this.distance = 0;
    this.runTime = 0;
    this.currentPhase = 1; // 1 to 5
    this.unlockedSkins = ['classic'];
    this.activeSkinId = 'classic';
    this.activePowerupInventory = []; // Up to 3 power-ups stored

    // Load saved gold and skins from storage
    this._loadSavedData();

    // DOM Setup
    this.container.innerHTML = `
      <div class="tt-wrapper" style="position:relative; width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:flex-start; overflow:hidden; user-select:none; font-family:'Outfit',sans-serif; color:#f8fafc; background:#070a1e;">
        
        <!-- Top HUD -->
        <div class="tt-hud" style="width:100%; max-width:840px; display:flex; justify-content:space-between; align-items:center; padding:8px 16px; background:rgba(12,8,34,0.88); backdrop-filter:blur(10px); border-bottom:1px solid rgba(251,191,36,0.2); z-index:20;">
          <div style="display:flex; align-items:center; gap:12px;">
            <!-- Lives (Mooncake Hearts) -->
            <div id="tt-lives-box" style="font-weight:700; font-size:1.0rem; color:#f59e0b; display:flex; align-items:center; gap:4px;">
              ❤️ <span id="tt-lives">🥮 🥮 🥮</span>
            </div>

            <!-- Strikes Indicator -->
            <div id="tt-strikes-box" style="font-weight:700; font-size:0.85rem; color:#ef4444; background:rgba(239,68,68,0.12); padding:3px 8px; border-radius:6px; border:1px solid rgba(239,68,68,0.3);">
              ⚠️ Lỗi: <span id="tt-strikes">0/3</span>
            </div>

            <!-- Gold -->
            <div style="font-weight:700; font-size:0.95rem; color:#fbbf24; display:flex; align-items:center; gap:4px;">
              🪙 <span id="tt-gold">${this.gold}</span>
            </div>

            <!-- Distance & Phase -->
            <div style="font-weight:600; font-size:0.85rem; color:#94a3b8;">
              🚩 <span id="tt-distance">0</span>m | Phase <span id="tt-phase">1</span>
            </div>
          </div>

          <div style="display:flex; align-items:center; gap:8px;">
            <!-- Combo Badge -->
            <div id="tt-combo-badge" style="display:none; font-weight:800; font-size:0.9rem; color:#f59e0b; background:rgba(245,158,11,0.2); padding:4px 10px; border-radius:8px; border:1px solid #f59e0b; animation:pulse 1s infinite;">
              🔥 COMBO x<span id="tt-combo">0</span>
            </div>

            <!-- Boss Challenge Button -->
            <button id="tt-boss-btn" style="background:linear-gradient(135deg, #ef4444, #b91c1c); color:#fff; border:none; border-radius:8px; padding:4px 10px; font-weight:700; font-size:0.8rem; cursor:pointer; box-shadow:0 0 8px rgba(239,68,68,0.4);">
              👑 Boss
            </button>

            <!-- Skin Shop Button -->
            <button id="tt-shop-btn" style="background:#1e1b4b; border:1px solid rgba(251,191,36,0.4); color:#fbbf24; border-radius:8px; padding:4px 10px; font-weight:700; font-size:0.8rem; cursor:pointer;">
              👘 Skin
            </button>
          </div>
        </div>

        <!-- Canvas Viewport -->
        <div class="tt-viewport" style="position:relative; width:100%; flex:1; display:flex; align-items:center; justify-content:center; padding:4px;">
          <canvas id="tt-canvas" width="800" height="520" style="display:block; max-width:100%; max-height:100%; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.8); cursor:pointer; background:#070a1e;"></canvas>

          <!-- Chị Hằng Dynamic Speech Bubble -->
          <div id="tt-hang-bubble" style="position:absolute; top:14px; right:20px; background:rgba(26,16,61,0.92); border:1px solid rgba(251,191,36,0.4); border-radius:12px; padding:8px 14px; display:flex; align-items:center; gap:8px; max-width:280px; box-shadow:0 8px 24px rgba(0,0,0,0.6); pointer-events:none; transition:all 0.3s ease;">
            <div style="font-size:1.6rem;">👸</div>
            <div style="font-size:0.75rem; color:#fef08a; line-height:1.3;" id="tt-hang-text">
              "Cuội! Đừng có vừa bắt bánh vừa ăn vụng đấy nha!"
            </div>
          </div>

          <!-- Skin Shop Modal (Overlay) -->
          <div id="tt-shop-modal" style="display:none; position:absolute; width:92%; max-width:540px; background:rgba(18,12,42,0.96); backdrop-filter:blur(14px); border:1px solid rgba(251,191,36,0.4); border-radius:16px; padding:18px; box-shadow:0 12px 40px rgba(0,0,0,0.85); z-index:35;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
              <div style="font-weight:800; font-size:1.15rem; color:#fbbf24;">
                👘 Cửa Hàng Trang Phục Cuội
              </div>
              <button id="tt-shop-close" style="background:transparent; border:none; color:#94a3b8; font-size:1.2rem; cursor:pointer;">✕</button>
            </div>
            <div style="color:#cbd5e1; font-size:0.85rem; margin-bottom:14px;">
              Dùng vàng 🪙 kiếm được từ các màn chơi để mua trang phục độc quyền cho Chú Cuội!
            </div>
            <div id="tt-skin-cards" style="display:flex; flex-direction:column; gap:10px; max-height:300px; overflow-y:auto;">
              <!-- Populated dynamically -->
            </div>
          </div>

          <!-- Game Over Modal (Overlay) -->
          <div id="tt-gameover-modal" style="display:none; position:absolute; width:90%; max-width:480px; background:rgba(18,12,42,0.96); backdrop-filter:blur(14px); border:2px solid rgba(251,191,36,0.5); border-radius:18px; padding:22px; box-shadow:0 14px 45px rgba(0,0,0,0.9); text-align:center; z-index:40;">
            <div style="font-size:2.8rem; margin-bottom:4px;" id="tt-go-icon">👸🤦</div>
            <div style="font-weight:900; font-size:1.4rem; color:#f8fafc; margin-bottom:2px;" id="tt-go-grade">Hạng: C</div>
            <div style="font-size:1.0rem; color:#fbbf24; font-weight:700; margin-bottom:10px;" id="tt-go-title">Kẻ Ăn Vụng Cung Quảng</div>
            
            <div style="background:rgba(255,255,255,0.06); border-radius:12px; padding:12px; font-style:italic; font-size:0.85rem; color:#fef08a; line-height:1.4; margin-bottom:14px;" id="tt-go-quote">
              "Trời ơi Cuội! Ngươi là nỗi thất vọng lớn nhất của Cung Trăng!"
            </div>

            <div style="display:flex; justify-content:space-around; margin-bottom:16px; font-size:0.9rem; color:#cbd5e1;">
              <div>🥮 Bắt được: <b id="tt-go-caught" style="color:#fbbf24;">0</b></div>
              <div>🚩 Quãng đường: <b id="tt-go-distance" style="color:#38bdf8;">0m</b></div>
              <div>🔥 Combo max: <b id="tt-go-combo" style="color:#f59e0b;">0</b></div>
            </div>

            <div style="display:flex; gap:10px; justify-content:center;">
              <button id="tt-restart-btn" style="background:linear-gradient(135deg, #f97316, #ea580c); color:#fff; border:none; border-radius:10px; padding:9px 20px; font-weight:800; font-size:0.9rem; cursor:pointer; box-shadow:0 0 14px rgba(249,115,22,0.4);">
                🔄 Chơi Lại Ngay
              </button>
              <button id="tt-go-shop-btn" style="background:#1e1b4b; border:1px solid rgba(251,191,36,0.5); color:#fbbf24; border-radius:10px; padding:9px 18px; font-weight:700; font-size:0.9rem; cursor:pointer;">
                👘 Đổi Skin
              </button>
            </div>
          </div>

        </div>

        <!-- Bottom Controls / Power-up Bar -->
        <div style="width:100%; max-width:840px; display:flex; justify-content:space-between; align-items:center; padding:6px 16px; background:rgba(12,8,34,0.85); border-top:1px solid rgba(255,255,255,0.06); font-size:0.8rem; color:#94a3b8; z-index:20;">
          <div>
            ⚡ Phím: <kbd style="background:#1e1b4b; padding:2px 6px; border-radius:4px; color:#f8fafc;">Space / Click</kbd> Giữ để bay lên | Thả để lượn xuống
          </div>
          <div style="display:flex; gap:8px;">
            <button id="tt-btn-turbo" class="tt-act-btn" style="background:#064e3b; border:1px solid #10b981; color:#34d399; border-radius:6px; padding:3px 8px; font-weight:700; cursor:pointer; font-size:0.75rem;">1: 🌳 Turbo</button>
            <button id="tt-btn-decoy" class="tt-act-btn" style="background:#78350f; border:1px solid #f59e0b; color:#fbbf24; border-radius:6px; padding:3px 8px; font-weight:700; cursor:pointer; font-size:0.75rem;">2: 🥮 Bánh Giả</button>
            <button id="tt-btn-lie" class="tt-act-btn" style="background:#4c1d95; border:1px solid #8b5cf6; color:#c084fc; border-radius:6px; padding:3px 8px; font-weight:700; cursor:pointer; font-size:0.75rem;">3: 👅 Bùa Nói Dối</button>
          </div>
        </div>

      </div>
    `;

    // Elements
    this.canvas = this.container.querySelector('#tt-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.livesEl = this.container.querySelector('#tt-lives');
    this.strikesEl = this.container.querySelector('#tt-strikes');
    this.goldEl = this.container.querySelector('#tt-gold');
    this.distanceEl = this.container.querySelector('#tt-distance');
    this.phaseEl = this.container.querySelector('#tt-phase');
    this.comboBadge = this.container.querySelector('#tt-combo-badge');
    this.comboEl = this.container.querySelector('#tt-combo');
    this.hangTextEl = this.container.querySelector('#tt-hang-text');
    this.shopModal = this.container.querySelector('#tt-shop-modal');
    this.gameoverModal = this.container.querySelector('#tt-gameover-modal');

    // Engine Subsystems
    this.synthAudio = new SynthAudio();
    this.fx = new FXManager();
    this.bg = new BackgroundRenderer(this.canvasWidth, this.canvasHeight);
    this.player = new Player(this.canvasWidth, this.canvasHeight);
    this.player.setSkin(this.activeSkinId);
    this.mooncakes = new MooncakeManager(this.canvasWidth, this.canvasHeight);
    this.obstacles = new ObstacleManager(this.canvasWidth, this.canvasHeight);
    this.boss = new BossManager(this.canvasWidth, this.canvasHeight);

    // Event Listeners
    this._bindControls();
    this._renderSkinCards();
  }

  _loadSavedData() {
    try {
      if (this.storage && typeof this.storage.getItem === 'function') {
        const savedGold = this.storage.getItem('trung_thu_gold');
        if (savedGold) this.gold = parseInt(savedGold, 10) || 50;

        const savedSkins = this.storage.getItem('trung_thu_skins');
        if (savedSkins) this.unlockedSkins = JSON.parse(savedSkins);

        const currentSkin = this.storage.getItem('trung_thu_active_skin');
        if (currentSkin && SKINS[currentSkin]) this.activeSkinId = currentSkin;
      }
    } catch (_) {
      // Fallback in case of sandboxed env
    }
  }

  _saveData() {
    try {
      if (this.storage && typeof this.storage.setItem === 'function') {
        this.storage.setItem('trung_thu_gold', this.gold.toString());
        this.storage.setItem('trung_thu_skins', JSON.stringify(this.unlockedSkins));
        this.storage.setItem('trung_thu_active_skin', this.activeSkinId);
      }
    } catch (_) {}
  }

  _bindControls() {
    // 1. Pointer Down / Up (Thrust)
    const onPointerDown = (e) => {
      e.preventDefault();
      this.player.isThrusting = true;
      this.synthAudio.ensureContext();
    };
    const onPointerUp = () => {
      this.player.isThrusting = false;
    };

    this.addTrackedEventListener(this.canvas, 'pointerdown', onPointerDown);
    this.addTrackedEventListener(window, 'pointerup', onPointerUp);

    // 2. Keyboard Space / Arrow Up
    const onKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        this.player.isThrusting = true;
        this.synthAudio.ensureContext();
      } else if (e.key === '1') {
        this.triggerTurboPower();
      } else if (e.key === '2') {
        this.triggerDecoyPower();
      } else if (e.key === '3') {
        this.triggerLiePower();
      } else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        this.isPaused ? this.resume() : this.pause();
      }
    };

    const onKeyUp = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        this.player.isThrusting = false;
      }
    };

    this.addTrackedEventListener(window, 'keydown', onKeyDown);
    this.addTrackedEventListener(window, 'keyup', onKeyUp);

    // 3. Buttons
    const turboBtn = this.container.querySelector('#tt-btn-turbo');
    if (turboBtn) this.addTrackedEventListener(turboBtn, 'click', () => this.triggerTurboPower());

    const decoyBtn = this.container.querySelector('#tt-btn-decoy');
    if (decoyBtn) this.addTrackedEventListener(decoyBtn, 'click', () => this.triggerDecoyPower());

    const lieBtn = this.container.querySelector('#tt-btn-lie');
    if (lieBtn) this.addTrackedEventListener(lieBtn, 'click', () => this.triggerLiePower());

    const bossBtn = this.container.querySelector('#tt-boss-btn');
    if (bossBtn) this.addTrackedEventListener(bossBtn, 'click', () => this.triggerBossBattle());

    const shopBtn = this.container.querySelector('#tt-shop-btn');
    if (shopBtn) this.addTrackedEventListener(shopBtn, 'click', () => this.toggleSkinShop(true));

    const shopClose = this.container.querySelector('#tt-shop-close');
    if (shopClose) this.addTrackedEventListener(shopClose, 'click', () => this.toggleSkinShop(false));

    const restartBtn = this.container.querySelector('#tt-restart-btn');
    if (restartBtn) this.addTrackedEventListener(restartBtn, 'click', () => this.restart());

    const goShopBtn = this.container.querySelector('#tt-go-shop-btn');
    if (goShopBtn) this.addTrackedEventListener(goShopBtn, 'click', () => {
      this.gameoverModal.style.display = 'none';
      this.toggleSkinShop(true);
    });
  }

  triggerTurboPower() {
    this.player.isTurbo = true;
    this.player.turboTimer = 4.5;
    this.synthAudio.playPowerup();
    this.fx.addFloatingText('CÂY ĐA TURBO! 🌳⚡', this.player.x, this.player.y - 30, '#10b981', 18);
    this.fx.triggerScreenShake(4, 0.2);
  }

  triggerDecoyPower() {
    this.obstacles.activateDecoy(5.0);
    this.synthAudio.playPowerup();
    this.fx.addFloatingText('BÁNH GIẢ NHỬ ĐỊCH! 🥮💫', this.player.x, this.player.y - 30, '#f59e0b', 18);
  }

  triggerLiePower() {
    this.obstacles.activateLieCharm(4.0);
    this.synthAudio.playPowerup();
    this.fx.addFloatingText('BÙA NÓI DỐI CỦA CUỘI! 👅✨', this.player.x, this.player.y - 30, '#8b5cf6', 18);
  }

  triggerBossBattle() {
    if (!this.boss.isActive && !this.boss.isDefeated) {
      this.boss.startBossFight();
      this.synthAudio.playBossRoar();
      this.fx.addFloatingText('👑 THỎ NGỌC ĐÌNH CÔNG XUẤT HIỆN!', 400, 200, '#ef4444', 22);
      this.fx.triggerScreenShake(10, 0.5);
      this.setHangReaction('boss_enter');
    }
  }

  toggleSkinShop(show) {
    if (this.shopModal) {
      this.shopModal.style.display = show ? 'block' : 'none';
      if (show) this._renderSkinCards();
    }
  }

  _renderSkinCards() {
    const listEl = this.container.querySelector('#tt-skin-cards');
    if (!listEl) return;

    const allSkins = getSkinList();
    listEl.innerHTML = allSkins.map(s => {
      const isUnlocked = this.unlockedSkins.includes(s.id);
      const isEquipped = this.activeSkinId === s.id;
      let btnLabel = isEquipped ? 'Đang Dùng' : (isUnlocked ? 'Trang Bị' : `Mua (${s.cost} 🪙)`);
      let btnBg = isEquipped ? '#10b981' : (isUnlocked ? '#38bdf8' : (this.gold >= s.cost ? '#f59e0b' : '#475569'));

      return `
        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); padding:8px 12px; border-radius:10px; border:1px solid rgba(255,255,255,0.08);">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="font-size:1.8rem;">${s.icon}</div>
            <div>
              <div style="font-weight:700; color:#f8fafc; font-size:0.9rem;">${s.name}</div>
              <div style="font-size:0.75rem; color:#94a3b8;">${s.description}</div>
            </div>
          </div>
          <button class="tt-skin-action-btn" data-skin="${s.id}" data-cost="${s.cost}" style="background:${btnBg}; color:#fff; border:none; border-radius:8px; padding:6px 12px; font-weight:700; font-size:0.8rem; cursor:${isEquipped ? 'default' : 'pointer'}; min-width:90px;">
            ${btnLabel}
          </button>
        </div>
      `;
    }).join('');

    // Bind action buttons
    if (typeof listEl.querySelectorAll === 'function') {
      listEl.querySelectorAll('.tt-skin-action-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const skinId = btn.dataset.skin;
          const cost = parseInt(btn.dataset.cost, 10);
          if (this.activeSkinId === skinId) return;

          if (this.unlockedSkins.includes(skinId)) {
            this.activeSkinId = skinId;
            this.player.setSkin(skinId);
            this._saveData();
            this._renderSkinCards();
          } else if (this.gold >= cost) {
            this.gold -= cost;
            this.unlockedSkins.push(skinId);
            this.activeSkinId = skinId;
            this.player.setSkin(skinId);
            this._saveData();
            this._renderSkinCards();
            this.updateHUD();
            this.fx.addFloatingText('MỞ KHÓA SKIN THÀNH CÔNG! 🎉', 400, 200, '#fbbf24', 20);
          }
        });
      });
    }
  }

  setHangReaction(category) {
    const list = CHI_HANG_REACTIONS[category];
    if (list && list.length > 0 && this.hangTextEl) {
      const line = list[Math.floor(Math.random() * list.length)];
      this.hangTextEl.textContent = `"${line}"`;
    }
  }

  start() {
    super.start();
    this.restart();
    this.startLoop(this.ctx);
  }

  restart() {
    this.lives = this.maxLives;
    this.score = 0;
    this.distance = 0;
    this.runTime = 0;
    this.currentPhase = 1;

    this.fx.reset();
    this.player.reset();
    this.player.setSkin(this.activeSkinId);
    this.mooncakes.reset();
    this.obstacles.reset();
    this.boss.reset();

    if (this.gameoverModal) this.gameoverModal.style.display = 'none';
    if (this.shopModal) this.shopModal.style.display = 'none';

    this.updateHUD();
  }

  updateHUD() {
    if (this.livesEl) {
      const hearts = [];
      for (let i = 0; i < this.lives; i++) hearts.push('🥮');
      this.livesEl.textContent = hearts.join(' ') || '💀';
    }

    if (this.strikesEl) {
      this.strikesEl.textContent = `${this.mooncakes.strikes}/3`;
    }

    if (this.goldEl) {
      this.goldEl.textContent = this.gold;
    }

    if (this.distanceEl) {
      this.distanceEl.textContent = Math.floor(this.distance);
    }

    if (this.phaseEl) {
      this.phaseEl.textContent = this.currentPhase;
    }

    if (this.comboBadge && this.comboEl) {
      if (this.mooncakes.combo >= 2) {
        this.comboBadge.style.display = 'block';
        this.comboEl.textContent = this.mooncakes.combo;
      } else {
        this.comboBadge.style.display = 'none';
      }
    }
  }

  update(dt) {
    if (this.isPaused || this.isGameOver) return;

    this.runTime += dt;
    this.distance += dt * 25; // 25 meters per second

    // Progressive Difficulty Phase transitions
    if (this.runTime < 60) {
      this.currentPhase = 1;
    } else if (this.runTime < 130) {
      this.currentPhase = 2;
    } else if (this.runTime < 220) {
      this.currentPhase = 3;
    } else if (this.runTime < 320) {
      this.currentPhase = 4;
    } else {
      this.currentPhase = 5;
      // Auto-trigger Boss at Phase 5 if not active and not yet defeated
      if (!this.boss.isActive && !this.boss.isDefeated) {
        this.triggerBossBattle();
      }
    }
    this.obstacles.setDifficulty(this.currentPhase);

    // Update Engines
    this.bg.update(dt, 120 + this.currentPhase * 15);
    this.fx.update(dt);
    this.player.update(dt, this.fx);

    // Update Mooncakes
    this.mooncakes.update(
      dt,
      this.player,
      this.fx,
      this.synthAudio,
      () => {
        // Strike penalty: 3 strikes -> lose 1 life!
        this.lives--;
        this.setHangReaction('strike');
        this.fx.addFloatingText('-1 MẠNG! (3 Lỗi Bánh) 💔', this.player.x, this.player.y - 30, '#ef4444', 20);
        this.updateHUD();

        if (this.lives <= 0) {
          this.handleGameOver();
        }
      },
      (earnedScore, earnedGold, combo, totalCaught) => {
        // Caught mooncake callback
        this.score += earnedScore;
        this.gold += earnedGold;
        this.emitScore(this.score);

        if (combo >= 5 && combo % 5 === 0) {
          this.setHangReaction('combo');
        }
        this.updateHUD();
      }
    );

    // Update Obstacles & Hazards
    this.obstacles.update(
      dt,
      this.player,
      this.fx,
      this.synthAudio,
      (tookDamage) => {
        // Hit by obstacle
        if (tookDamage) {
          this.lives--;
          this.updateHUD();
          if (this.lives <= 0) {
            this.handleGameOver();
          }
        }
      },
      (powerupDef) => {
        // Power-up picked up
        if (powerupDef.id === 'super_cake') {
          this.lives = Math.min(this.maxLives, this.lives + 1);
          if (this.mooncakes.strikes > 0) this.mooncakes.strikes--;
          this.updateHUD();
        } else if (powerupDef.id === 'turbo_tree') {
          this.triggerTurboPower();
        } else if (powerupDef.id === 'decoy_cake') {
          this.triggerDecoyPower();
        } else if (powerupDef.id === 'lie_charm') {
          this.triggerLiePower();
        } else if (powerupDef.id === 'giant_lantern') {
          this.player.hasShield = true;
          this.fx.addFloatingText('LỒNG ĐÈN HỘ THỂ! 🏮👑', this.player.x, this.player.y - 30, '#f43f5e', 18);
        }
      }
    );

    // Update Boss
    this.boss.update(
      dt,
      this.player,
      this.fx,
      this.synthAudio,
      () => {
        // Boss Defeated callback
        this.gold += 150;
        this.score += 500;
        this.emitScore(this.score);
        this._saveData();
        this.fx.createExplosion(this.boss.x, this.boss.y, '#fbbf24');
        this.fx.addFloatingText('🎉 THỎ NGỌC ĐÃ BỊ THU PHỤC! +150 🪙', 400, 200, '#fbbf24', 24);
        this.fx.triggerScreenShake(12, 0.6);
        this.setHangReaction('boss_defeat');
        this.updateHUD();
      }
    );
  }

  handleGameOver() {
    this.isGameOver = true;
    this.synthAudio.playDamage();
    this._saveData();

    // End Game Rating Evaluation from Chị Hằng
    const rating = getEndGameRating(this.mooncakes.totalCaught, this.boss.isDefeated);

    if (this.gameoverModal) {
      const iconEl = this.container.querySelector('#tt-go-icon');
      const gradeEl = this.container.querySelector('#tt-go-grade');
      const titleEl = this.container.querySelector('#tt-go-title');
      const quoteEl = this.container.querySelector('#tt-go-quote');
      const caughtEl = this.container.querySelector('#tt-go-caught');
      const distEl = this.container.querySelector('#tt-go-distance');
      const comboEl = this.container.querySelector('#tt-go-combo');

      if (iconEl) iconEl.textContent = rating.reactionIcon;
      if (gradeEl) gradeEl.textContent = `Hạng: ${rating.grade}`;
      if (titleEl) titleEl.textContent = rating.title;
      if (quoteEl) quoteEl.textContent = `"${rating.quote}"`;
      if (caughtEl) caughtEl.textContent = this.mooncakes.totalCaught;
      if (distEl) distEl.textContent = `${Math.floor(this.distance)}m`;
      if (comboEl) comboEl.textContent = this.mooncakes.maxCombo;

      this.gameoverModal.style.display = 'block';
    }

    // MANDATORY METHOD INTEGRITY: Must call this.emitGameOver()!
    this.emitGameOver(this.score);
  }

  render(ctx) {
    if (!ctx) return;

    // Apply Screen Shake
    const shake = this.fx.getShakeOffset();
    ctx.save();
    ctx.translate(shake.x, shake.y);

    // 1. Multi-layer Parallax Background
    this.bg.render(ctx, this.distance, this.runTime);

    // 2. Obstacles and Hazards
    this.obstacles.render(ctx);

    // 3. Fugitive Mooncakes
    this.mooncakes.render(ctx);

    // 4. Boss (if active)
    this.boss.render(ctx);

    // 5. Chú Cuội
    this.player.render(ctx);

    // 6. FX Particles and Floating Texts
    this.fx.render(ctx);

    ctx.restore();
  }

  destroy() {
    super.destroy();
    this._saveData();
    if (this.synthAudio) {
      this.synthAudio.setMuted(true);
    }
  }
}
