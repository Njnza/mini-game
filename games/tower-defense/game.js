/**
 * game.js
 * Cyber Defense: Neon Siege (Tower Defense)
 * Main Game Controller extending BaseGame.
 */

import { BaseGame } from '../../src/core/BaseGame.js';
import { MAPS, getMapById } from './data/maps.js';
import { TOWER_TYPES, calculateSellValue, getTowerStats } from './data/towers.js';
import { Map } from './engine/Map.js';
import { FXManager } from './engine/FXManager.js';
import { ProjectileManager } from './engine/ProjectileManager.js';
import { EnemyManager } from './engine/EnemyManager.js';
import { TowerManager } from './engine/TowerManager.js';
import { HeroManager } from './engine/HeroManager.js';
import { AbilityManager } from './engine/AbilityManager.js';

export default class TowerDefenseGame extends BaseGame {
  init() {
    this.currentLevelIndex = 0;
    this.gameSpeed = 1.0;
    this.lives = 20;
    this.gold = 260;
    this.wave = 1;
    this.bonusCountdown = 10;
    this.isBetweenWaves = true;
    this.activeTargetingSkill = null; // for Hero Q or Commander powers

    // Build DOM structure
    this.container.innerHTML = `
      <div class="td-wrapper" style="position:relative; width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:flex-start; overflow:hidden; user-select:none; font-family:'Outfit',sans-serif; color:#f8fafc; background:#080a10;">
        
        <!-- Top HUD -->
        <div class="td-top-hud" style="width:100%; max-width:840px; display:flex; justify-content:space-between; align-items:center; padding:8px 16px; background:rgba(15,20,34,0.85); backdrop-filter:blur(10px); border-bottom:1px solid rgba(255,255,255,0.08); z-index:20;">
          <div style="display:flex; align-items:center; gap:14px;">
            <div id="td-map-select-btn" style="background:#1e293b; border:1px solid rgba(56,189,248,0.3); border-radius:8px; padding:4px 10px; font-weight:700; font-size:0.85rem; color:#38bdf8; cursor:pointer; font-family:'Orbitron',sans-serif;">
              🗺️ <span id="td-map-title">Neon Outpost</span> ▾
            </div>
            <div style="font-weight:700; font-size:0.95rem; color:#f59e0b; display:flex; align-items:center; gap:4px;">
              🪙 <span id="td-gold">260</span>G
            </div>
            <div style="font-weight:700; font-size:0.95rem; color:#ef4444; display:flex; align-items:center; gap:4px;">
              💖 <span id="td-lives">20</span>
            </div>
            <div style="font-weight:700; font-size:0.95rem; color:#38bdf8; display:flex; align-items:center; gap:4px;">
              🌊 Wave <span id="td-wave">1</span>/<span id="td-total-waves">10</span>
            </div>
          </div>

          <div style="display:flex; align-items:center; gap:8px;">
            <!-- Speed Toggles -->
            <div style="display:flex; background:#1e293b; border-radius:8px; padding:2px; border:1px solid rgba(255,255,255,0.08);">
              <button id="td-spd-1" class="td-spd-btn" style="background:#06b6d4; color:#fff; border:none; border-radius:6px; padding:3px 8px; font-size:0.75rem; font-weight:700; cursor:pointer;">1x</button>
              <button id="td-spd-2" class="td-spd-btn" style="background:transparent; color:#94a3b8; border:none; border-radius:6px; padding:3px 8px; font-size:0.75rem; font-weight:700; cursor:pointer;">2x</button>
              <button id="td-spd-3" class="td-spd-btn" style="background:transparent; color:#94a3b8; border:none; border-radius:6px; padding:3px 8px; font-size:0.75rem; font-weight:700; cursor:pointer;">3x</button>
            </div>

            <!-- Call Wave Button -->
            <button id="td-next-wave-btn" style="background:linear-gradient(135deg, #06b6d4, #3b82f6); color:#fff; border:none; border-radius:8px; padding:6px 14px; font-weight:700; font-size:0.85rem; cursor:pointer; box-shadow:0 0 12px rgba(6,182,212,0.4); display:flex; align-items:center; gap:6px;">
              ▶ Start Wave (<span id="td-bonus-timer">10</span>s)
            </button>
          </div>
        </div>

        <!-- Canvas Battlefield Viewport -->
        <div class="td-viewport" style="position:relative; width:100%; flex:1; display:flex; align-items:center; justify-content:center; padding:6px;">
          <canvas id="td-canvas" style="display:block; max-width:100%; max-height:100%; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.7); cursor:crosshair; background:#090d16;"></canvas>

          <!-- Inspector Overlay Panel (appears on tower click) -->
          <div id="td-inspector" style="display:none; position:absolute; right:16px; top:16px; width:250px; background:rgba(15,20,34,0.92); backdrop-filter:blur(12px); border:1px solid rgba(56,189,248,0.3); border-radius:14px; padding:14px; box-shadow:0 8px 32px rgba(0,0,0,0.6); z-index:30;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <div style="font-weight:700; font-size:1.0rem; color:#38bdf8; display:flex; align-items:center; gap:6px;" id="td-ins-title">
                💣 Heavy Cannon
              </div>
              <button id="td-ins-close" style="background:transparent; border:none; color:#94a3b8; font-size:1.1rem; cursor:pointer;">✕</button>
            </div>
            <div id="td-ins-tier" style="font-size:0.75rem; color:#f59e0b; font-weight:600; margin-bottom:8px;">Tier 1 / 4</div>
            <div id="td-ins-stats" style="font-size:0.8rem; line-height:1.5; color:#cbd5e1; margin-bottom:12px;"></div>
            
            <div style="display:flex; gap:6px; margin-bottom:8px;">
              <select id="td-ins-target-mode" style="width:100%; background:#1e293b; color:#fff; border:1px solid rgba(255,255,255,0.15); border-radius:6px; padding:4px 8px; font-size:0.75rem;">
                <option value="first">Target: First</option>
                <option value="strongest">Target: Strongest</option>
                <option value="weakest">Target: Weakest</option>
                <option value="nearest">Target: Nearest</option>
              </select>
            </div>

            <!-- Upgrade & Evolution Buttons -->
            <div id="td-ins-upgrade-box" style="margin-bottom:8px;">
              <button id="td-ins-upgrade-btn" style="width:100%; background:#10b981; color:#fff; border:none; border-radius:8px; padding:7px; font-weight:700; font-size:0.8rem; cursor:pointer; margin-bottom:4px;">
                Upgrade (85G)
              </button>
            </div>
            <div id="td-ins-evo-box" style="display:none; flex-direction:column; gap:6px; margin-bottom:8px;">
              <button id="td-ins-evo-a" style="background:#8b5cf6; color:#fff; border:none; border-radius:8px; padding:6px; font-weight:700; font-size:0.75rem; cursor:pointer;"></button>
              <button id="td-ins-evo-b" style="background:#06b6d4; color:#fff; border:none; border-radius:8px; padding:6px; font-weight:700; font-size:0.75rem; cursor:pointer;"></button>
            </div>

            <button id="td-ins-sell-btn" style="width:100%; background:rgba(239,68,68,0.2); border:1px solid #ef4444; color:#ef4444; border-radius:8px; padding:6px; font-weight:700; font-size:0.8rem; cursor:pointer;">
              Sell (50% Refund: +50G)
            </button>
          </div>

          <!-- Level Select Modal -->
          <div id="td-level-modal" style="display:none; position:absolute; inset:0; background:rgba(0,0,0,0.8); backdrop-filter:blur(8px); z-index:40; align-items:center; justify-content:center;">
            <div style="background:#0f172a; border:1px solid rgba(56,189,248,0.3); border-radius:16px; padding:24px; width:90%; max-width:480px; text-align:center;">
              <h3 style="font-family:'Orbitron',sans-serif; color:#38bdf8; margin-bottom:14px; font-size:1.3rem;">Tactical Deployment Sector</h3>
              <div id="td-level-list" style="display:flex; flex-direction:column; gap:8px; margin-bottom:16px;"></div>
              <button id="td-level-close" style="background:#334155; border:none; border-radius:8px; color:#fff; padding:8px 16px; cursor:pointer; font-weight:700;">Cancel</button>
            </div>
          </div>
        </div>

        <!-- Bottom Controls & Turret Palette -->
        <div class="td-bottom-hud" style="width:100%; max-width:840px; background:rgba(15,20,34,0.92); backdrop-filter:blur(10px); border-top:1px solid rgba(255,255,255,0.08); padding:8px 14px; display:flex; justify-content:space-between; align-items:center; gap:12px; z-index:20;">
          
          <!-- Hero Panel -->
          <div id="td-hero-card" style="display:flex; align-items:center; gap:10px; background:#1e293b; padding:6px 12px; border-radius:10px; border:1px solid rgba(6,182,212,0.3); cursor:pointer;">
            <div style="font-size:1.5rem;">🎖️</div>
            <div>
              <div style="font-weight:700; font-size:0.8rem; color:#06b6d4;">Commander [H]</div>
              <div style="font-size:0.7rem; color:#94a3b8;">Lv.<span id="td-hero-lvl">1</span> (<span id="td-hero-hp">300</span> HP)</div>
            </div>
            <div style="display:flex; gap:4px; margin-left:6px;">
              <button id="td-skill-q" style="background:#334155; border:1px solid #eab308; color:#eab308; border-radius:6px; width:30px; height:30px; font-size:0.75rem; font-weight:700; cursor:pointer;">Q</button>
              <button id="td-skill-e" style="background:#334155; border:1px solid #38bdf8; color:#38bdf8; border-radius:6px; width:30px; height:30px; font-size:0.75rem; font-weight:700; cursor:pointer;">E</button>
            </div>
          </div>

          <!-- Turret Cards -->
          <div style="display:flex; gap:6px; overflow-x:auto;" id="td-turret-bar">
            <!-- Populated dynamically via JS -->
          </div>

          <!-- Commander Powers Bar -->
          <div style="display:flex; gap:4px;">
            <button id="td-power-airstrike" title="Airstrike (60s)" style="background:#1e293b; border:1px solid #f43f5e; color:#f43f5e; border-radius:8px; width:36px; height:36px; font-size:1.0rem; cursor:pointer;">✈️</button>
            <button id="td-power-ion" title="Ion Storm (80s)" style="background:#1e293b; border:1px solid #38bdf8; color:#38bdf8; border-radius:8px; width:36px; height:36px; font-size:1.0rem; cursor:pointer;">🌩️</button>
            <button id="td-power-overclock" title="Overclock (45s)" style="background:#1e293b; border:1px solid #eab308; color:#eab308; border-radius:8px; width:36px; height:36px; font-size:1.0rem; cursor:pointer;">⚡</button>
            <button id="td-power-barrier" title="Force Barrier (35s)" style="background:#1e293b; border:1px solid #06b6d4; color:#06b6d4; border-radius:8px; width:36px; height:36px; font-size:1.0rem; cursor:pointer;">🛡️</button>
          </div>
        </div>

      </div>
    `;

    // Cache elements
    this.canvas = this.container.querySelector('#td-canvas');
    this.ctx = this.canvas && this.canvas.getContext ? this.canvas.getContext('2d') : null;

    this.goldEl = this.container.querySelector('#td-gold');
    this.livesEl = this.container.querySelector('#td-lives');
    this.waveEl = this.container.querySelector('#td-wave');
    this.totalWavesEl = this.container.querySelector('#td-total-waves');
    this.mapTitleEl = this.container.querySelector('#td-map-title');
    this.bonusTimerEl = this.container.querySelector('#td-bonus-timer');
    this.nextWaveBtn = this.container.querySelector('#td-next-wave-btn');
    this.heroLvlEl = this.container.querySelector('#td-hero-lvl');
    this.heroHpEl = this.container.querySelector('#td-hero-hp');

    this.inspectorEl = this.container.querySelector('#td-inspector');
    this.insTitleEl = this.container.querySelector('#td-ins-title');
    this.insTierEl = this.container.querySelector('#td-ins-tier');
    this.insStatsEl = this.container.querySelector('#td-ins-stats');
    this.insTargetModeEl = this.container.querySelector('#td-ins-target-mode');
    this.insUpgradeBoxEl = this.container.querySelector('#td-ins-upgrade-box');
    this.insUpgradeBtn = this.container.querySelector('#td-ins-upgrade-btn');
    this.insEvoBoxEl = this.container.querySelector('#td-ins-evo-box');
    this.insEvoABtn = this.container.querySelector('#td-ins-evo-a');
    this.insEvoBBtn = this.container.querySelector('#td-ins-evo-b');
    this.insSellBtn = this.container.querySelector('#td-ins-sell-btn');
    this.insCloseBtn = this.container.querySelector('#td-ins-close');

    this.levelModalEl = this.container.querySelector('#td-level-modal');
    this.levelListEl = this.container.querySelector('#td-level-list');
    this.levelCloseBtn = this.container.querySelector('#td-level-close');
    this.mapSelectBtn = this.container.querySelector('#td-map-select-btn');

    this.setupCanvasSize();
    this.renderTurretBar();
    this.setupEngine(0);
    this.bindEvents();
  }

  setupEngine(levelIndex = 0) {
    this.currentLevelIndex = levelIndex;
    const mapData = MAPS[levelIndex] || MAPS[0];

    this.gold = mapData.startingGold;
    this.lives = mapData.startingLives;
    this.wave = 1;
    this.bonusCountdown = 10;
    this.isBetweenWaves = true;

    this.map = new Map(mapData);
    this.fx = new FXManager();
    this.projectiles = new ProjectileManager(this.fx, this.audio);
    this.towers = new TowerManager(this.map, this.projectiles, this.fx, this.audio);
    this.hero = new HeroManager(this.map, this.projectiles, this.fx, this.audio);
    this.abilities = new AbilityManager(this.map, this.fx, this.audio);

    this.enemies = new EnemyManager(this.map, this.fx, this.audio, {
      onEnemyKilled: (bounty, scoreVal) => {
        this.gold += bounty;
        this.emitScore(this.score + scoreVal);
        this.hero.addExp(Math.round(bounty * 1.5));
        this.updateHUD();
      },
      onBaseBreached: (livesLost) => {
        this.lives = Math.max(0, this.lives - livesLost);
        this.updateHUD();
        if (this.lives <= 0) {
          this.emitGameOver();
        }
      },
      onWaveCompleted: (waveNum) => {
        this.isBetweenWaves = true;
        this.bonusCountdown = 10;
        this.hero.hp = this.hero.maxHp; // Heal hero between waves
        this.updateHUD();
      },
      onAllWavesCleared: () => {
        // Victory!
        this.fx.addExplosion(400, 260, '#38bdf8', 40, 200, 100);
        this.fx.addFloatingText('VICTORY! SECTOR SECURED!', 400, 200, '#34d399', 24);
        if (this.audio && typeof this.audio.playVictory === 'function') {
          this.audio.playVictory();
        }
        // Auto unlock next level if available
        if (this.currentLevelIndex < MAPS.length - 1) {
          this.addTrackedTimeout(() => {
            this.setupEngine(this.currentLevelIndex + 1);
            this.updateHUD();
          }, 3500);
        }
      }
    });

    this.hero.reset();
    this.updateHUD();
  }

  setupCanvasSize() {
    if (!this.canvas) return;
    this.canvas.width = 800;
    this.canvas.height = 520;
  }

  renderTurretBar() {
    const bar = this.container.querySelector('#td-turret-bar');
    if (!bar) return;
    bar.innerHTML = '';

    const keys = ['cannon', 'gatling', 'frost', 'rocket', 'laser', 'support'];
    keys.forEach((typeId, idx) => {
      const data = TOWER_TYPES[typeId];
      const card = document.createElement('button');
      card.className = 'td-turret-card';
      card.dataset.type = typeId;
      card.style.cssText = `
        background:#1e293b; border:1px solid rgba(255,255,255,0.1); border-radius:10px;
        padding:5px 8px; display:flex; flex-direction:column; align-items:center;
        min-width:64px; cursor:pointer; color:#f8fafc; transition:all 0.15s ease;
      `;
      card.innerHTML = `
        <div style="font-size:1.2rem;">${data.icon}</div>
        <div style="font-size:0.65rem; font-weight:700; color:${data.color};">[${idx + 1}] ${data.name.split(' ')[0]}</div>
        <div style="font-size:0.7rem; color:#f59e0b; font-weight:700;">${data.cost}G</div>
      `;

      card.addEventListener('click', () => {
        this.selectPlacementType(typeId);
      });

      bar.appendChild(card);
    });
  }

  selectPlacementType(typeId) {
    if (this.towers.placementType === typeId) {
      this.towers.placementType = null;
    } else {
      this.towers.placementType = typeId;
      this.towers.selectedTower = null;
      this.hero.isSelected = false;
      this.hideInspector();
    }
    this.updateTurretBarSelection();
  }

  updateTurretBarSelection() {
    const bar = this.container.querySelector('#td-turret-bar');
    if (!bar) return;
    bar.querySelectorAll('.td-turret-card').forEach(card => {
      if (card.dataset.type === this.towers.placementType) {
        card.style.borderColor = '#06b6d4';
        card.style.background = 'rgba(6,182,212,0.2)';
        card.style.boxShadow = '0 0 10px rgba(6,182,212,0.4)';
      } else {
        card.style.borderColor = 'rgba(255,255,255,0.1)';
        card.style.background = '#1e293b';
        card.style.boxShadow = 'none';
      }
    });
  }

  bindEvents() {
    if (!this.canvas) return;

    // Pointer events on Canvas
    const onPointerDown = (e) => this.handlePointerDown(e);
    const onPointerMove = (e) => this.handlePointerMove(e);
    this.addTrackedEventListener(this.canvas, 'pointerdown', onPointerDown);
    this.addTrackedEventListener(this.canvas, 'pointermove', onPointerMove);

    // Prevent context menu on right click for hero moves
    const onContextMenu = (e) => {
      e.preventDefault();
      this.handleRightClick(e);
    };
    this.addTrackedEventListener(this.canvas, 'contextmenu', onContextMenu);

    // Call next wave button
    if (this.nextWaveBtn) {
      this.addTrackedEventListener(this.nextWaveBtn, 'click', () => this.callNextWave(true));
    }

    // Speed buttons
    const spd1 = this.container.querySelector('#td-spd-1');
    const spd2 = this.container.querySelector('#td-spd-2');
    const spd3 = this.container.querySelector('#td-spd-3');
    const setSpeed = (spd, activeBtn) => {
      this.gameSpeed = spd;
      [spd1, spd2, spd3].forEach(b => {
        if (b) {
          b.style.background = 'transparent';
          b.style.color = '#94a3b8';
        }
      });
      if (activeBtn) {
        activeBtn.style.background = '#06b6d4';
        activeBtn.style.color = '#fff';
      }
    };
    if (spd1) this.addTrackedEventListener(spd1, 'click', () => setSpeed(1.0, spd1));
    if (spd2) this.addTrackedEventListener(spd2, 'click', () => setSpeed(2.0, spd2));
    if (spd3) this.addTrackedEventListener(spd3, 'click', () => setSpeed(3.0, spd3));

    // Hero buttons & skills
    const heroCard = this.container.querySelector('#td-hero-card');
    if (heroCard) {
      this.addTrackedEventListener(heroCard, 'click', () => {
        this.hero.isSelected = !this.hero.isSelected;
        this.towers.selectedTower = null;
        this.towers.placementType = null;
        this.updateTurretBarSelection();
        this.hideInspector();
      });
    }

    const skillQ = this.container.querySelector('#td-skill-q');
    if (skillQ) {
      this.addTrackedEventListener(skillQ, 'click', (e) => {
        e.stopPropagation();
        this.activeTargetingSkill = 'hero_q';
        this.fx.addFloatingText('SELECT TARGET AREA [Q]', this.hero.x, this.hero.y - 20, '#eab308', 12);
      });
    }

    const skillE = this.container.querySelector('#td-skill-e');
    if (skillE) {
      this.addTrackedEventListener(skillE, 'click', (e) => {
        e.stopPropagation();
        this.hero.triggerSkill2(this.towers.towers);
      });
    }

    // Commander Powers
    const btnAirstrike = this.container.querySelector('#td-power-airstrike');
    const btnIon = this.container.querySelector('#td-power-ion');
    const btnOverclock = this.container.querySelector('#td-power-overclock');
    const btnBarrier = this.container.querySelector('#td-power-barrier');

    if (btnAirstrike) this.addTrackedEventListener(btnAirstrike, 'click', () => this.abilities.triggerAbility('airstrike', null, null, this.enemies.enemies, this.towers.towers));
    if (btnIon) this.addTrackedEventListener(btnIon, 'click', () => this.abilities.triggerAbility('ion_storm', null, null, this.enemies.enemies, this.towers.towers));
    if (btnOverclock) this.addTrackedEventListener(btnOverclock, 'click', () => this.abilities.triggerAbility('overclock', null, null, this.enemies.enemies, this.towers.towers));
    if (btnBarrier) this.addTrackedEventListener(btnBarrier, 'click', () => {
      this.activeTargetingSkill = 'barrier';
      this.fx.addFloatingText('CLICK LANE FOR BARRIER', 400, 200, '#06b6d4', 13);
    });

    // Inspector close button
    if (this.insCloseBtn) {
      this.addTrackedEventListener(this.insCloseBtn, 'click', () => this.hideInspector());
    }

    // Inspector upgrade & sell
    if (this.insUpgradeBtn) {
      this.addTrackedEventListener(this.insUpgradeBtn, 'click', () => {
        if (!this.towers.selectedTower) return;
        const res = this.towers.upgradeTower(this.towers.selectedTower, null, this.gold);
        if (res.success) {
          this.gold -= res.cost;
          this.showInspector(this.towers.selectedTower);
          this.updateHUD();
        }
      });
    }

    if (this.insEvoABtn) {
      this.addTrackedEventListener(this.insEvoABtn, 'click', () => {
        if (!this.towers.selectedTower) return;
        const base = TOWER_TYPES[this.towers.selectedTower.type];
        const evoKeys = Object.keys(base.evolutions);
        const res = this.towers.upgradeTower(this.towers.selectedTower, evoKeys[0], this.gold);
        if (res.success) {
          this.gold -= res.cost;
          this.showInspector(this.towers.selectedTower);
          this.updateHUD();
        }
      });
    }

    if (this.insEvoBBtn) {
      this.addTrackedEventListener(this.insEvoBBtn, 'click', () => {
        if (!this.towers.selectedTower) return;
        const base = TOWER_TYPES[this.towers.selectedTower.type];
        const evoKeys = Object.keys(base.evolutions);
        const res = this.towers.upgradeTower(this.towers.selectedTower, evoKeys[1], this.gold);
        if (res.success) {
          this.gold -= res.cost;
          this.showInspector(this.towers.selectedTower);
          this.updateHUD();
        }
      });
    }

    if (this.insSellBtn) {
      this.addTrackedEventListener(this.insSellBtn, 'click', () => {
        if (!this.towers.selectedTower) return;
        const res = this.towers.sellTower(this.towers.selectedTower);
        if (res.success) {
          this.gold += res.refund;
          this.hideInspector();
          this.updateHUD();
        }
      });
    }

    if (this.insTargetModeEl) {
      this.addTrackedEventListener(this.insTargetModeEl, 'change', (e) => {
        if (this.towers.selectedTower) {
          this.towers.selectedTower.targetMode = e.target.value;
        }
      });
    }

    // Level selector modal
    if (this.mapSelectBtn) {
      this.addTrackedEventListener(this.mapSelectBtn, 'click', () => this.showLevelModal());
    }
    if (this.levelCloseBtn) {
      this.addTrackedEventListener(this.levelCloseBtn, 'click', () => this.hideLevelModal());
    }

    // Keyboard Shortcuts
    const onKeyDown = (e) => this.handleKeyDown(e);
    this.addTrackedEventListener(window, 'keydown', onKeyDown);
  }

  handleKeyDown(e) {
    const key = e.key.toLowerCase();
    if (key >= '1' && key <= '6') {
      const types = ['cannon', 'gatling', 'frost', 'rocket', 'laser', 'support'];
      this.selectPlacementType(types[parseInt(key) - 1]);
    } else if (key === 'h') {
      this.hero.isSelected = !this.hero.isSelected;
      this.towers.selectedTower = null;
      this.hideInspector();
    } else if (key === 'q') {
      this.activeTargetingSkill = 'hero_q';
      this.fx.addFloatingText('TARGET [Q] EMP BOMB', this.hero.x, this.hero.y - 20, '#eab308', 12);
    } else if (key === 'e') {
      this.hero.triggerSkill2(this.towers.towers);
    } else if (key === ' ' || key === 'space') {
      if (this.isBetweenWaves) {
        this.callNextWave(true);
      }
    } else if (key === 'escape') {
      this.towers.placementType = null;
      this.towers.selectedTower = null;
      this.hero.isSelected = false;
      this.activeTargetingSkill = null;
      this.hideInspector();
      this.updateTurretBarSelection();
    }
  }

  getCanvasCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  handlePointerDown(e) {
    const { x, y } = this.getCanvasCoords(e);
    const { tileX, tileY } = this.map.worldToTile(x, y);

    // Active targeting skill resolution (EMP bomb or barrier)
    if (this.activeTargetingSkill === 'hero_q') {
      this.hero.triggerSkill1(x, y);
      this.activeTargetingSkill = null;
      return;
    } else if (this.activeTargetingSkill === 'barrier') {
      this.abilities.triggerAbility('barrier', x, y, this.enemies.enemies, this.towers.towers);
      this.activeTargetingSkill = null;
      return;
    }

    // 1. Check if clicking on Hero unit
    const distToHero = Math.hypot(x - this.hero.x, y - this.hero.y);
    if (distToHero <= 20) {
      this.hero.isSelected = true;
      this.towers.selectedTower = null;
      this.towers.placementType = null;
      this.updateTurretBarSelection();
      this.hideInspector();
      return;
    }

    // 2. If Hero is currently selected and clicking elsewhere, command move!
    if (this.hero.isSelected) {
      this.hero.commandMove(x, y);
      return;
    }

    // 3. Check if placing a new turret
    if (this.towers.placementType) {
      const res = this.towers.buildTower(this.towers.placementType, tileX, tileY, this.gold);
      if (res.success) {
        this.gold -= res.cost;
        this.showInspector(res.tower);
        this.towers.placementType = null;
        this.updateTurretBarSelection();
        this.updateHUD();
      }
      return;
    }

    // 4. Check if clicking on an existing turret
    const clickedTower = this.towers.towers.find(t => t.tileX === tileX && t.tileY === tileY);
    if (clickedTower) {
      this.towers.selectedTower = clickedTower;
      this.showInspector(clickedTower);
    } else {
      this.towers.selectedTower = null;
      this.hideInspector();
    }
  }

  handleRightClick(e) {
    const { x, y } = this.getCanvasCoords(e);
    // Command Hero to move directly with right click
    this.hero.commandMove(x, y);
    this.towers.placementType = null;
    this.updateTurretBarSelection();
  }

  handlePointerMove(e) {
    const { x, y } = this.getCanvasCoords(e);
    const { tileX, tileY } = this.map.worldToTile(x, y);
    this.towers.hoverTile = { tileX, tileY };
  }

  showInspector(tower) {
    if (!this.inspectorEl) return;
    this.inspectorEl.style.display = 'block';

    const base = TOWER_TYPES[tower.type];
    const stats = tower.stats;

    this.insTitleEl.innerHTML = `${base.icon} ${stats.name}`;
    this.insTierEl.textContent = tower.tier === 4 ? `Tier 4 [Evolved: ${stats.name}]` : `Tier ${tower.tier} / 4`;

    const dps = Math.round(stats.damage * (stats.fireRate || 1));
    this.insStatsEl.innerHTML = `
      <div>Damage: <b style="color:#f8fafc;">${stats.damage}</b></div>
      <div>Rate: <b style="color:#f8fafc;">${stats.fireRate ? stats.fireRate.toFixed(1) + '/s' : 'Aura'}</b></div>
      <div>DPS: <b style="color:#38bdf8;">${dps > 0 ? dps : 'Buff'}</b></div>
      <div>Range: <b style="color:#f8fafc;">${stats.range}px</b></div>
      <div>Anti-Air: <b style="color:${stats.antiAir ? '#10b981' : '#94a3b8'}">${stats.antiAir ? 'YES' : 'NO'}</b></div>
    `;

    if (this.insTargetModeEl) {
      this.insTargetModeEl.value = tower.targetMode;
    }

    // Upgrade buttons
    if (tower.tier < 3) {
      const nextTierCost = stats.tiers[tower.tier].cost;
      this.insUpgradeBoxEl.style.display = 'block';
      this.insUpgradeBtn.textContent = `Upgrade to Tier ${tower.tier + 1} (${nextTierCost}G)`;
      this.insEvoBoxEl.style.display = 'none';
    } else if (tower.tier === 3) {
      this.insUpgradeBoxEl.style.display = 'none';
      this.insEvoBoxEl.style.display = 'flex';
      const evoKeys = Object.keys(base.evolutions);
      const evoA = base.evolutions[evoKeys[0]];
      const evoB = base.evolutions[evoKeys[1]];
      this.insEvoABtn.textContent = `Evo: ${evoA.name} (${evoA.cost}G)`;
      this.insEvoBBtn.textContent = `Evo: ${evoB.name} (${evoB.cost}G)`;
    } else {
      this.insUpgradeBoxEl.style.display = 'none';
      this.insEvoBoxEl.style.display = 'none';
    }

    const sellVal = calculateSellValue(tower.type, tower.tier, tower.evolutionKey);
    this.insSellBtn.textContent = `Sell (50% Refund: +${sellVal}G)`;
  }

  hideInspector() {
    if (this.inspectorEl) this.inspectorEl.style.display = 'none';
  }

  showLevelModal() {
    if (!this.levelModalEl || !this.levelListEl) return;
    this.levelModalEl.style.display = 'flex';
    this.levelListEl.innerHTML = '';

    MAPS.forEach((m, idx) => {
      const item = document.createElement('div');
      item.style.cssText = `
        background:${idx === this.currentLevelIndex ? 'rgba(6,182,212,0.2)' : '#1e293b'};
        border:1px solid ${idx === this.currentLevelIndex ? '#06b6d4' : 'rgba(255,255,255,0.1)'};
        border-radius:10px; padding:10px 14px; display:flex; justify-content:space-between; align-items:center;
        cursor:pointer; text-align:left;
      `;
      item.innerHTML = `
        <div>
          <div style="font-weight:700; color:#38bdf8;">Level ${m.levelNumber}: ${m.name}</div>
          <div style="font-size:0.75rem; color:#94a3b8;">${m.description}</div>
        </div>
        <div style="font-size:0.8rem; color:#f59e0b; font-weight:700;">${m.totalWaves} Waves</div>
      `;
      item.addEventListener('click', () => {
        this.setupEngine(idx);
        this.hideLevelModal();
      });
      this.levelListEl.appendChild(item);
    });
  }

  hideLevelModal() {
    if (this.levelModalEl) this.levelModalEl.style.display = 'none';
  }

  callNextWave(early = false) {
    if (!this.isBetweenWaves && this.enemies.isWaveActive) return;

    if (early && this.bonusCountdown > 0) {
      // Bonus gold for calling wave early!
      const bonus = Math.round(this.bonusCountdown * 4);
      this.gold += bonus;
      this.fx.addFloatingText(`EARLY CALL BONUS +${bonus}G!`, 400, 100, '#f59e0b', 14);
    }

    this.isBetweenWaves = false;
    this.enemies.startWave(this.wave);
    this.wave++;
    this.updateHUD();
  }

  updateHUD() {
    if (this.goldEl) this.goldEl.textContent = this.gold;
    if (this.livesEl) this.livesEl.textContent = this.lives;
    if (this.waveEl) this.waveEl.textContent = Math.min(this.wave, this.map.mapData.totalWaves);
    if (this.totalWavesEl) this.totalWavesEl.textContent = this.map.mapData.totalWaves;
    if (this.mapTitleEl) this.mapTitleEl.textContent = this.map.mapData.name;
    if (this.bonusTimerEl) this.bonusTimerEl.textContent = Math.ceil(this.bonusCountdown);
    if (this.heroLvlEl) this.heroLvlEl.textContent = this.hero.level;
    if (this.heroHpEl) this.heroHpEl.textContent = Math.max(0, Math.ceil(this.hero.hp));

    if (this.nextWaveBtn) {
      this.nextWaveBtn.style.opacity = this.isBetweenWaves ? '1.0' : '0.5';
      this.nextWaveBtn.style.pointerEvents = this.isBetweenWaves ? 'auto' : 'none';
    }
  }

  start() {
    super.start();
    this.setupEngine(this.currentLevelIndex || 0);
    this.startLoop(this.ctx);
  }

  update(dt) {
    const scaledDt = dt * this.gameSpeed;

    // Between waves countdown
    if (this.isBetweenWaves) {
      this.bonusCountdown -= scaledDt;
      if (this.bonusCountdown <= 0) {
        this.callNextWave(false);
      }
      if (this.bonusTimerEl) {
        this.bonusTimerEl.textContent = Math.max(0, Math.ceil(this.bonusCountdown));
      }
    }

    // Engine updates
    this.map.update(scaledDt);
    this.hero.update(scaledDt, this.enemies.enemies);
    this.towers.update(scaledDt, this.enemies.enemies);
    this.projectiles.update(scaledDt, this.enemies.enemies);
    this.enemies.update(scaledDt);
    this.abilities.update(scaledDt, this.enemies.enemies, this.towers.towers);
    this.fx.update(scaledDt);

    // Update Hero HUD display
    if (this.heroHpEl) this.heroHpEl.textContent = Math.max(0, Math.ceil(this.hero.hp));
  }

  render(ctx) {
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Camera shake offset
    ctx.translate(this.fx.shakeOffsetX, this.fx.shakeOffsetY);

    // Render layers
    this.map.render(ctx);
    this.abilities.render(ctx);
    this.towers.render(ctx);
    this.hero.render(ctx);
    this.enemies.render(ctx);
    this.projectiles.render(ctx);
    this.fx.render(ctx);

    ctx.restore();
  }

  destroy() {
    super.destroy();
    if (this.fx) this.fx.reset();
    if (this.projectiles) this.projectiles.reset();
    if (this.towers) this.towers.reset();
    if (this.enemies) this.enemies.reset();
  }
}
