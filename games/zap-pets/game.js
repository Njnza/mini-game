import { BaseGame } from '../../src/core/BaseGame.js';
import * as THREE from '../../src/lib/three.module.js';

export const CHARACTERS = {
  fox: {
    id: 'fox',
    name: 'Spark Fox',
    role: 'Speed & Electric',
    icon: '🦊',
    color: '#f97316',
    bodyColor: 0xf97316,
    accentColor: 0x7c2d12,
    earTipColor: 0x1e293b,
    bellyColor: 0xffedd5,
    maxHp: 100,
    speed: 15.5,
    attackRate: 0.30,
    bulletDamage: 25,
    bulletColor: 0x38bdf8,
    skill1: {
      name: 'Lightning Dash',
      key: 'SPACE',
      icon: '⚡',
      cd: 3.0,
      desc: 'Dash forward with lightning speed, shocking and damaging all ghosts in your trail.'
    },
    skill2: {
      name: 'Thunder Nova',
      key: 'E',
      icon: '💥',
      cd: 7.0,
      desc: 'Emit a 360° electromagnetic pulse that blasts all nearby ghosts backward.'
    }
  },
  bear: {
    id: 'bear',
    name: 'Iron Bear',
    role: 'Heavy Tank & Defense',
    icon: '🐻',
    color: '#0284c7',
    bodyColor: 0x0284c7,
    accentColor: 0x075985,
    earTipColor: 0x0c4a6e,
    bellyColor: 0xe0f2fe,
    maxHp: 180,
    speed: 11.5,
    attackRate: 0.42,
    bulletDamage: 45,
    bulletColor: 0x0ea5e9,
    skill1: {
      name: 'Ground Slam',
      key: 'SPACE',
      icon: '💥',
      cd: 4.2,
      desc: 'Slam the ground causing an earthquake that stuns all ghosts in a large radius.'
    },
    skill2: {
      name: 'Iron Fortress',
      key: 'E',
      icon: '🛡️',
      cd: 8.5,
      desc: 'Deploy a protective kinetic barrier that reduces incoming damage by 90%.'
    }
  },
  bunny: {
    id: 'bunny',
    name: 'Frost Bunny',
    role: 'Long Range & Frost',
    icon: '🐰',
    color: '#ec4899',
    bodyColor: 0xec4899,
    accentColor: 0x9d174d,
    earTipColor: 0xfbcfe8,
    bellyColor: 0xfdf2f8,
    maxHp: 90,
    speed: 14.5,
    attackRate: 0.32,
    bulletDamage: 30,
    bulletColor: 0xa855f7,
    skill1: {
      name: 'Frost Blink',
      key: 'SPACE',
      icon: '❄️',
      cd: 3.4,
      desc: 'Teleport forward instantly leaving an icy decoy trap that freezes enemies.'
    },
    skill2: {
      name: 'Blizzard Storm',
      key: 'E',
      icon: '🌪️',
      cd: 8.0,
      desc: 'Summon a swirling ice vortex that slows and damages all ghosts in a wide area.'
    }
  }
};

export default class ZapPets3DGame extends BaseGame {
  init() {
    this.selectedCharKey = 'fox';
    this.charConfig = CHARACTERS.fox;
    this.time = 0;

    // Calculate reliable dimensions
    const rect = this.container.getBoundingClientRect();
    this.stageWidth = Math.max(340, Math.min(rect.width > 200 ? rect.width - 20 : 880, 960));
    this.stageHeight = Math.max(380, Math.min(rect.height > 200 ? rect.height - 30 : 580, 620));
    const stageWidth = this.stageWidth;
    const stageHeight = this.stageHeight;

    this.container.innerHTML = `
      <div class="zappets-wrapper" style="position:relative; width:${stageWidth}px; height:${stageHeight}px; display:flex; flex-direction:column; align-items:center; justify-content:center; overflow:hidden; user-select:none; border-radius:16px; box-shadow:0 14px 40px rgba(0,0,0,0.6); background:#cfe69f;">
        
        <!-- Top HUD Bar: Exact Zappets Cartoon Style -->
        <div class="zp-hud-top" style="position:absolute; top:10px; left:14px; right:14px; display:flex; justify-content:space-between; align-items:flex-start; pointer-events:none; z-index:25;">
          
          <!-- Left Pill: Exit + Coins -->
          <div style="display:flex; align-items:center; gap:8px; pointer-events:auto;">
            <div id="zp-coin-pill" style="display:flex; align-items:center; gap:8px; background:#231b3e; border:2px solid rgba(255,255,255,0.18); border-radius:24px; padding:4px 14px; box-shadow:0 4px 12px rgba(0,0,0,0.4);">
              <span id="zp-btn-leave" style="font-size:1.1rem; cursor:pointer;" title="Exit to Hub">🚪</span>
              <span style="font-size:1.1rem;">🟡</span>
              <span id="zp-coins-text" style="color:#ffffff; font-family:var(--font-display); font-weight:800; font-size:1rem; min-width:18px;">0</span>
            </div>
            
            <!-- Quick Hero Switcher Pills -->
            <div id="zp-hero-switcher" style="display:flex; gap:4px; background:rgba(35,27,62,0.85); backdrop-filter:blur(6px); padding:3px; border-radius:18px; border:1px solid rgba(255,255,255,0.15);">
              <button class="zp-hero-btn" data-hero="fox" style="border:none; background:#f97316; color:#ffffff; font-weight:800; font-size:0.75rem; padding:4px 9px; border-radius:14px; cursor:pointer; font-family:var(--font-display);">🦊 Fox</button>
              <button class="zp-hero-btn" data-hero="bear" style="border:none; background:transparent; color:#94a3b8; font-weight:800; font-size:0.75rem; padding:4px 9px; border-radius:14px; cursor:pointer; font-family:var(--font-display);">🐻 Bear</button>
              <button class="zp-hero-btn" data-hero="bunny" style="border:none; background:transparent; color:#94a3b8; font-weight:800; font-size:0.75rem; padding:4px 9px; border-radius:14px; cursor:pointer; font-family:var(--font-display);">🐰 Bunny</button>
            </div>
          </div>

          <!-- Center Banner: Purple Shield + Golden Segmented Progress Bar -->
          <div style="display:flex; align-items:center; filter:drop-shadow(0 4px 10px rgba(0,0,0,0.35)); pointer-events:auto;">
            <!-- Wave Shield Badge -->
            <div style="background:#2b204e; border:2px solid #1a1332; border-radius:10px 0 0 10px; padding:4px 12px; display:flex; flex-direction:column; align-items:center; z-index:2; box-shadow:inset 0 1px 0 rgba(255,255,255,0.25);">
              <span style="font-size:0.55rem; color:#a5b4fc; font-weight:800; letter-spacing:0.5px; text-transform:uppercase;">WAVE</span>
              <span id="zp-wave-num" style="font-family:var(--font-display); font-size:1.15rem; font-weight:900; color:#ffffff; line-height:1;">1</span>
            </div>
            <!-- Segmented Yellow Wave Bar -->
            <div style="position:relative; width:140px; height:24px; background:#1b1530; border:2px solid #1a1332; border-left:none; border-radius:0 8px 8px 0; overflow:hidden; display:flex; align-items:center; padding:2px;">
              <div id="zp-wave-progress-fill" style="width:0%; height:100%; background:linear-gradient(180deg, #fde047 0%, #eab308 100%); border-radius:0 4px 4px 0; transition:width 0.25s ease;"></div>
              <!-- Segment notch overlay -->
              <div style="position:absolute; inset:0; display:flex; justify-content:space-between; padding:0 12px; pointer-events:none; opacity:0.35;">
                <span style="border-right:1px solid #000; height:100%;"></span>
                <span style="border-right:1px solid #000; height:100%;"></span>
                <span style="border-right:1px solid #000; height:100%;"></span>
              </div>
              <span id="zp-wave-target-text" style="position:absolute; right:8px; font-family:var(--font-display); font-weight:900; font-size:0.75rem; color:#ffffff; text-shadow:0 1px 3px #000;">8</span>
            </div>
          </div>

          <!-- Right Pill: Star Level -->
          <div style="display:flex; align-items:center; gap:8px; pointer-events:auto;">
            <div style="display:flex; align-items:center; gap:6px; background:#231b3e; border:2px solid rgba(255,255,255,0.18); border-radius:24px; padding:4px 14px; box-shadow:0 4px 12px rgba(0,0,0,0.4);">
              <span style="font-size:1.15rem;">⭐</span>
              <span id="zp-level-badge" style="color:#ffffff; font-family:var(--font-display); font-weight:900; font-size:1rem;">1</span>
            </div>
          </div>
        </div>

        <!-- 3D Overhead Health Bar tracking Player Position -->
        <div id="zp-player-floating-hud" style="position:absolute; pointer-events:none; z-index:20; transform:translate(-50%, -100%); display:flex; flex-direction:column; align-items:center;">
          <div style="width:68px; height:10px; background:#1e1b2e; border:1.5px solid #000; border-radius:6px; overflow:hidden; position:relative; box-shadow:0 2px 6px rgba(0,0,0,0.5);">
            <div id="zp-floating-hp-fill" style="width:100%; height:100%; background:linear-gradient(90deg, #22c55e, #4ade80); transition:width 0.12s ease;"></div>
            <span id="zp-floating-hp-text" style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-family:var(--font-display); font-weight:900; font-size:0.55rem; color:#ffffff; text-shadow:0 1px 2px #000;">100</span>
          </div>
        </div>

        <!-- 3D Canvas Mounting Container -->
        <div id="zp-webgl-container" style="width:${stageWidth}px; height:${stageHeight}px; position:absolute; inset:0;"></div>

        <!-- Touch Controls Layer -->
        <div class="zp-touch-layer" style="position:absolute; inset:0; pointer-events:none; z-index:20;">
          <div id="zp-joystick-zone" style="position:absolute; bottom:18px; left:18px; width:110px; height:110px; border-radius:50%; background:rgba(35,27,62,0.3); border:2px dashed rgba(255,255,255,0.35); pointer-events:auto; display:none; align-items:center; justify-content:center;">
            <div id="zp-joystick-knob" style="width:44px; height:44px; border-radius:50%; background:#f97316; box-shadow:0 0 15px rgba(249,115,22,0.7); transform:translate(0,0);"></div>
          </div>

          <!-- Skills Buttons: Stylized Purple/Gold Circles -->
          <div class="zp-skills-container" style="position:absolute; bottom:20px; right:20px; display:flex; gap:12px; pointer-events:auto;">
            <button id="zp-btn-skill1" style="width:58px; height:58px; border-radius:50%; background:#241b3e; border:3px solid #fde047; color:#fff; font-size:1.4rem; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 6px 16px rgba(0,0,0,0.5); position:relative;">
              <span id="zp-s1-icon">⚡</span>
              <span style="font-size:0.55rem; font-weight:800; color:#fde047;">SPACE</span>
              <div id="zp-s1-cd" style="position:absolute; inset:0; border-radius:50%; background:rgba(0,0,0,0.75); display:none; align-items:center; justify-content:center; font-size:0.8rem; font-weight:900; color:#fff;"></div>
            </button>
            <button id="zp-btn-skill2" style="width:58px; height:58px; border-radius:50%; background:#37225c; border:3px solid #f472b6; color:#fff; font-size:1.4rem; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 6px 16px rgba(0,0,0,0.5); position:relative;">
              <span id="zp-s2-icon">💥</span>
              <span style="font-size:0.55rem; font-weight:800; color:#f472b6;">E</span>
              <div id="zp-s2-cd" style="position:absolute; inset:0; border-radius:50%; background:rgba(0,0,0,0.75); display:none; align-items:center; justify-content:center; font-size:0.8rem; font-weight:900; color:#fff;"></div>
            </button>
          </div>
        </div>

        <!-- Level Up Perk Surge Modal -->
        <div id="zp-upgrade-modal" style="position:absolute; inset:0; background:rgba(18,14,35,0.88); backdrop-filter:blur(10px); z-index:50; display:none; flex-direction:column; align-items:center; justify-content:center; padding:16px; pointer-events:auto;">
          <div style="font-family:var(--font-display); font-size:1.6rem; font-weight:900; color:#fde047; margin-bottom:4px; text-shadow:0 0 20px #eab308; letter-spacing:0.5px;">
            ⭐ WAVE SURGE! CHOOSE A PERK ⭐
          </div>
          <div style="color:#e0e7ff; font-size:0.85rem; margin-bottom:18px;">Boost your pet's combat power to survive the graveyard!</div>
          <div id="zp-cards-container" style="display:flex; gap:14px; flex-wrap:wrap; justify-content:center; max-width:680px;"></div>
        </div>

      </div>
    `;

    this.webglContainer = this.container.querySelector('#zp-webgl-container');
    this.floatingHud = this.container.querySelector('#zp-player-floating-hud');
    this.floatingHpFill = this.container.querySelector('#zp-floating-hp-fill');
    this.floatingHpText = this.container.querySelector('#zp-floating-hp-text');

    this.coinsText = this.container.querySelector('#zp-coins-text');
    this.levelBadge = this.container.querySelector('#zp-level-badge');
    this.waveNumEl = this.container.querySelector('#zp-wave-num');
    this.waveProgressFill = this.container.querySelector('#zp-wave-progress-fill');
    this.waveTargetText = this.container.querySelector('#zp-wave-target-text');

    this.btnLeave = this.container.querySelector('#zp-btn-leave');
    this.upgradeModal = this.container.querySelector('#zp-upgrade-modal');
    this.cardsContainer = this.container.querySelector('#zp-cards-container');

    this.btnSkill1 = this.container.querySelector('#zp-btn-skill1');
    this.s1Icon = this.container.querySelector('#zp-s1-icon');
    this.s1CdEl = this.container.querySelector('#zp-s1-cd');
    this.btnSkill2 = this.container.querySelector('#zp-btn-skill2');
    this.s2Icon = this.container.querySelector('#zp-s2-icon');
    this.s2CdEl = this.container.querySelector('#zp-s2-cd');

    this.joystickZone = this.container.querySelector('#zp-joystick-zone');
    this.joystickKnob = this.container.querySelector('#zp-joystick-knob');

    // Hero Switcher Event Bindings
    this.heroBtns = this.container.querySelectorAll('.zp-hero-btn');
    this.heroBtns.forEach(btn => {
      this.addTrackedEventListener(btn, 'click', (e) => {
        e.stopPropagation();
        const heroKey = btn.dataset.hero;
        this.switchHero(heroKey);
      });
    });

    if (this.btnLeave) {
      this.addTrackedEventListener(this.btnLeave, 'click', () => {
        window.location.hash = '#/hub';
      });
    }

    // Touch device support
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
        this.triggerSkill1();
      } else if (e.key === 'e' || e.key === 'E') {
        this.triggerSkill2();
      }
    };
    const onKeyUp = (e) => {
      this.keys[e.key.toLowerCase()] = false;
    };

    this.addTrackedEventListener(window, 'keydown', onKeyDown);
    this.addTrackedEventListener(window, 'keyup', onKeyUp);

    this.addTrackedEventListener(this.btnSkill1, 'pointerdown', (e) => {
      e.stopPropagation();
      this.triggerSkill1();
    });
    this.addTrackedEventListener(this.btnSkill2, 'pointerdown', (e) => {
      e.stopPropagation();
      this.triggerSkill2();
    });

    const onResize = () => this.handleResize();
    this.addTrackedEventListener(window, 'resize', onResize);

    // Initialize 3D Scene Immediately with Cartoon Style
    this.init3DScene(stageWidth, stageHeight);
  }

  switchHero(heroKey) {
    if (!CHARACTERS[heroKey]) return;
    this.selectedCharKey = heroKey;
    this.charConfig = CHARACTERS[heroKey];

    this.heroBtns.forEach(b => {
      if (b.dataset.hero === heroKey) {
        b.style.background = this.charConfig.color;
        b.style.color = '#ffffff';
      } else {
        b.style.background = 'transparent';
        b.style.color = '#94a3b8';
      }
    });

    this.s1Icon.textContent = this.charConfig.skill1.icon;
    this.s2Icon.textContent = this.charConfig.skill2.icon;

    if (this.sharedBoltMat) {
      this.sharedBoltMat.color.set(this.charConfig.bulletColor);
    }

    if (this.player) {
      this.player.baseSpeed = this.charConfig.speed;
      this.player.maxHp = this.charConfig.maxHp;
      this.player.hp = Math.min(this.player.hp, this.charConfig.maxHp);
      this.player.bulletDamage = this.charConfig.bulletDamage;
      this.player.attackRate = this.charConfig.attackRate;
      this.player.s1MaxCd = this.charConfig.skill1.cd;
      this.player.s2MaxCd = this.charConfig.skill2.cd;
    }

    this.buildPlayer3D();
    this.audio.playVictory();
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
          const maxDist = 38;
          const angle = Math.atan2(dy, dx);
          const clampedDist = Math.min(dist, maxDist);

          const knobX = Math.cos(angle) * clampedDist;
          const knobY = Math.sin(angle) * clampedDist;
          this.joystickKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;

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

  init3DScene(width, height) {
    // 1. Scene & Pastel Sunny Background
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xd7edab);
    this.scene.fog = new THREE.FogExp2(0xd7edab, 0.007);

    // 2. Camera (Low FOV Isometric Cartoon Perspective)
    this.camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 500);
    this.camera.position.set(0, 36, 26);
    this.camera.lookAt(0, 0, 0);

    // 3. Renderer with PCFSoftShadowMap
    try {
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      this.webglContainer.innerHTML = '';
      this.webglContainer.appendChild(this.renderer.domElement);
    } catch (e) {
      // Graceful fallback for headless environments or unsupported WebGL
      this.renderer = {
        setSize: () => {},
        setPixelRatio: () => {},
        render: () => {},
        dispose: () => {},
        forceContextLoss: () => {},
        shadowMap: {},
        domElement: document.createElement('canvas')
      };
    }

    // 4. Sunny Daylight Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xfff7e6, 0.9);
    this.scene.add(ambientLight);

    // Directional Sun Light angled to cast distinct diagonal cartoon shadows
    this.sunLight = new THREE.DirectionalLight(0xfffcf0, 1.45);
    this.sunLight.position.set(30, 52, -26);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 130;
    this.sunLight.shadow.camera.left = -50;
    this.sunLight.shadow.camera.right = 50;
    this.sunLight.shadow.camera.top = 50;
    this.sunLight.shadow.camera.bottom = -50;
    this.sunLight.shadow.bias = -0.0004;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    // 5. Build Graveyard Garden Map
    this.arenaSize = 160;
    this.buildGraveyardMap();

    // 6. Preload Ghost Face Texture & Shared Pooled Resources
    this.ghostFaceTexture = this.createGhostFaceTexture();
    this.initSharedResources();

    // 7. Build Player Model
    this.buildPlayer3D();
  }

  createGhostFaceTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext ? canvas.getContext('2d') : null;
    if (!ctx) return new THREE.Texture();

    if (ctx.clearRect) ctx.clearRect(0, 0, 128, 128);

    // Black expressive cartoon eyes
    ctx.fillStyle = '#1e1b2e';
    if (ctx.ellipse) {
      ctx.beginPath();
      ctx.ellipse(45, 52, 7, 13, -0.08, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(83, 52, 7, 13, 0.08, 0, Math.PI * 2);
      ctx.fill();
    } else if (ctx.arc) {
      ctx.beginPath();
      ctx.arc(45, 52, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(83, 52, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cute white eye shines
    ctx.fillStyle = '#ffffff';
    if (ctx.arc) {
      ctx.beginPath();
      ctx.arc(47, 48, 3.5, 0, Math.PI * 2);
      ctx.arc(85, 48, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cute open cartoon mouth
    ctx.fillStyle = '#1e1b2e';
    if (ctx.ellipse) {
      ctx.beginPath();
      ctx.ellipse(64, 76, 5, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (ctx.arc) {
      ctx.beginPath();
      ctx.arc(64, 76, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  initSharedResources() {
    this.sharedBoltGeo = new THREE.SphereGeometry(0.35, 8, 8);
    this.sharedBoltMat = new THREE.MeshBasicMaterial({ color: this.charConfig.bulletColor });

    this.sharedGhostGeo = new THREE.CapsuleGeometry(0.75, 0.8, 8, 12);
    this.sharedGhostMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    this.sharedBossMat = new THREE.MeshLambertMaterial({ color: 0xffe4e6 });

    this.sharedGhostFaceGeo = new THREE.PlaneGeometry(0.9, 0.9);
    this.sharedGhostFaceMat = new THREE.MeshBasicMaterial({
      map: this.ghostFaceTexture,
      transparent: true
    });

    this.sharedGhostArmGeo = new THREE.SphereGeometry(0.22, 8, 8);
    this.sharedGhostShadowGeo = new THREE.CircleGeometry(0.7, 16);
    this.sharedGhostShadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.25
    });

    this.sharedGemGeo = new THREE.OctahedronGeometry(0.42, 0);
    this.sharedGemMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });

    this.sharedParticleGeo = new THREE.OctahedronGeometry(0.32, 0);
    this.sharedParticleMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
  }

  buildGraveyardMap() {
    // A. Main Grass Floor
    const floorGeo = new THREE.PlaneGeometry(this.arenaSize, this.arenaSize);
    const floorMat = new THREE.MeshLambertMaterial({ color: 0xcfe69f });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // B. Scattered Soft Lighter Lawn Circles
    const patchMat1 = new THREE.MeshBasicMaterial({ color: 0xdbf0a8 });
    const patchMat2 = new THREE.MeshBasicMaterial({ color: 0xc3df8e });
    for (let i = 0; i < 35; i++) {
      const radius = 2.5 + (i % 5) * 1.2;
      const patchGeo = new THREE.CircleGeometry(radius, 16);
      const patchMesh = new THREE.Mesh(patchGeo, i % 2 === 0 ? patchMat1 : patchMat2);
      patchMesh.rotation.x = -Math.PI / 2;
      const angle = (i * 1.37) % (Math.PI * 2);
      const dist = 8 + ((i * 19) % 65);
      patchMesh.position.set(Math.cos(angle) * dist, 0.015, Math.sin(angle) * dist);
      patchMesh.receiveShadow = true;
      this.scene.add(patchMesh);
    }

    // C. Cobblestone Crossroads Paths (North, South, East, West)
    const paverMat1 = new THREE.MeshStandardMaterial({ color: 0xe8e8f2, roughness: 0.85 });
    const paverMat2 = new THREE.MeshStandardMaterial({ color: 0xdcdce8, roughness: 0.85 });

    // Center Plaza Ring
    const plazaRings = 3;
    for (let r = 1; r <= plazaRings; r++) {
      const count = r * 8;
      const radius = r * 3.2;
      for (let i = 0; i < count; i++) {
        const ang = (i / count) * Math.PI * 2;
        const pGeo = new THREE.BoxGeometry(2.2, 0.12, 1.8);
        const pMesh = new THREE.Mesh(pGeo, (i + r) % 2 === 0 ? paverMat1 : paverMat2);
        pMesh.position.set(Math.cos(ang) * radius, 0.06, Math.sin(ang) * radius);
        pMesh.rotation.y = -ang + ((i % 3) - 1) * 0.1;
        pMesh.receiveShadow = true;
        this.scene.add(pMesh);
      }
    }

    // 4 Avenues
    const pathHalfLen = 70;
    for (let d = 0; d < 4; d++) {
      const isVertical = d % 2 === 0;
      const sign = d < 2 ? 1 : -1;

      for (let step = 11; step < pathHalfLen; step += 3.2) {
        // Paver rows
        for (let col = -1; col <= 1; col++) {
          const pGeo = new THREE.BoxGeometry(2.3, 0.12, 2.7);
          const pMesh = new THREE.Mesh(pGeo, (step + col) % 2 === 0 ? paverMat1 : paverMat2);

          const px = isVertical ? col * 2.5 + ((step % 2) ? 0.3 : -0.2) : step * sign;
          const pz = isVertical ? step * sign : col * 2.5 + ((step % 2) ? 0.3 : -0.2);

          pMesh.position.set(px, 0.06, pz);
          pMesh.rotation.y = ((col + step) % 5) * 0.04;
          pMesh.receiveShadow = true;
          this.scene.add(pMesh);
        }
      }
    }

    // D. Center Obelisk Monument
    const obeliskGroup = new THREE.Group();
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.7 });
    const darkStoneMat = new THREE.MeshStandardMaterial({ color: 0x71717a, roughness: 0.8 });

    // Dais Tier 1 & 2
    const base1 = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.6, 4.2), darkStoneMat);
    base1.position.y = 0.3;
    base1.castShadow = true;
    base1.receiveShadow = true;
    obeliskGroup.add(base1);

    const base2 = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.5, 3.0), stoneMat);
    base2.position.y = 0.8;
    base2.castShadow = true;
    base2.receiveShadow = true;
    obeliskGroup.add(base2);

    // Tapered 4-sided Obelisk Pillar
    const shaftGeo = new THREE.CylinderGeometry(0.8, 1.35, 8.5, 4);
    const shaft = new THREE.Mesh(shaftGeo, stoneMat);
    shaft.position.y = 5.2;
    shaft.rotation.y = Math.PI / 4;
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    obeliskGroup.add(shaft);

    // Pointed Cap
    const capGeo = new THREE.ConeGeometry(1.15, 1.6, 4);
    const cap = new THREE.Mesh(capGeo, darkStoneMat);
    cap.position.y = 10.2;
    cap.rotation.y = Math.PI / 4;
    cap.castShadow = true;
    obeliskGroup.add(cap);

    this.scene.add(obeliskGroup);

    // E. Scattered Graveyard Props (Tombstones, Pillars, Pumpkins)
    this.buildProps();
  }

  buildProps() {
    const tombstoneMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 });
    const dirtMat = new THREE.MeshLambertMaterial({ color: 0xb09576 });
    const pumpkinMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.6 });
    const stalkMat = new THREE.MeshStandardMaterial({ color: 0x65a30d });
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.75 });
    const brickRingMat = new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.8 });

    // 12 Tombstones with Soil Mounds
    const tombCoords = [
      { x: -16, z: -14 }, { x: -22, z: -14 }, { x: -28, z: -14 },
      { x: -18, z: 18 }, { x: -24, z: 22 }, { x: -30, z: 18 },
      { x: 18, z: -18 }, { x: 25, z: -22 }, { x: 31, z: -16 },
      { x: 16, z: 18 }, { x: 22, z: 22 }, { x: 28, z: 18 }
    ];

    tombCoords.forEach(pos => {
      const g = new THREE.Group();
      // Soil Mound
      const dirt = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.15, 3.6), dirtMat);
      dirt.position.set(0, 0.08, 0);
      dirt.receiveShadow = true;
      g.add(dirt);

      // Stone Headstone
      const stoneBody = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.4, 0.35), tombstoneMat);
      stoneBody.position.set(0, 0.8, -1.3);
      stoneBody.castShadow = true;
      stoneBody.receiveShadow = true;
      g.add(stoneBody);

      const topArch = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.35, 12), tombstoneMat);
      topArch.rotation.z = Math.PI / 2;
      topArch.position.set(0, 1.5, -1.3);
      topArch.castShadow = true;
      g.add(topArch);

      g.position.set(pos.x, 0, pos.z);
      this.scene.add(g);
    });

    // 8 Ruined Classical Pillars
    const pillarCoords = [
      { x: -14, z: -32, broken: false },
      { x: -34, z: -14, broken: true },
      { x: 32, z: -14, broken: false },
      { x: 14, z: -34, broken: true },
      { x: 34, z: 16, broken: true },
      { x: 16, z: 32, broken: false },
      { x: -32, z: 16, broken: false },
      { x: -16, z: 34, broken: true }
    ];

    pillarCoords.forEach(p => {
      const colG = new THREE.Group();
      const h = p.broken ? 3.0 : 5.4;

      const base = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 2.4), pillarMat);
      base.position.y = 0.25;
      base.castShadow = true;
      colG.add(base);

      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, h, 12), pillarMat);
      shaft.position.y = 0.5 + h / 2;
      shaft.castShadow = true;
      shaft.receiveShadow = true;
      colG.add(shaft);

      // Terracotta ring
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.92, 0.4, 12), brickRingMat);
      ring.position.y = 1.2;
      colG.add(ring);

      if (!p.broken) {
        const capital = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.6, 2.3), pillarMat);
        capital.position.y = 0.5 + h + 0.3;
        capital.castShadow = true;
        colG.add(capital);
      }

      colG.position.set(p.x, 0, p.z);
      this.scene.add(colG);
    });

    // 25 Cute Little Pumpkins
    for (let i = 0; i < 25; i++) {
      const pumpG = new THREE.Group();
      const pBody = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), pumpkinMat);
      pBody.scale.set(1, 0.72, 1);
      pBody.position.y = 0.36;
      pBody.castShadow = true;
      pumpG.add(pBody);

      const pStalk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.28, 6), stalkMat);
      pStalk.position.set(0.04, 0.76, 0);
      pStalk.rotation.z = 0.25;
      pumpG.add(pStalk);

      const ang = (i * 1.7) % (Math.PI * 2);
      const rad = 7 + ((i * 13) % 45);
      pumpG.position.set(Math.cos(ang) * rad + ((i % 3) - 1) * 1.5, 0, Math.sin(ang) * rad);
      this.scene.add(pumpG);
    }
  }

  buildPlayer3D() {
    if (this.playerGroup) {
      this.scene.remove(this.playerGroup);
      this.playerGroup.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach(m => m.dispose());
          else o.material.dispose();
        }
      });
    }

    this.playerGroup = new THREE.Group();
    const char = this.charConfig;

    // Body Capsule / Box
    const bodyGeo = new THREE.BoxGeometry(1.6, 1.4, 1.7);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: char.bodyColor,
      roughness: 0.45,
      metalness: 0.05
    });

    // Auto-load PixAssets custom PNG if present
    if (THREE.TextureLoader) {
      const loader = new THREE.TextureLoader();
      loader.load(`games/zap-pets/assets/${char.id}.png`, (tex) => {
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
        bodyMat.map = tex;
        bodyMat.needsUpdate = true;
      });
    }

    this.playerBody = new THREE.Mesh(bodyGeo, bodyMat);
    this.playerBody.position.y = 1.0;
    this.playerBody.castShadow = true;
    this.playerBody.receiveShadow = true;
    this.playerGroup.add(this.playerBody);

    // Cute Cheeks / Belly
    const bellyGeo = new THREE.BoxGeometry(1.2, 0.9, 0.4);
    const bellyMat = new THREE.MeshLambertMaterial({ color: char.bellyColor });
    const belly = new THREE.Mesh(bellyGeo, bellyMat);
    belly.position.set(0, 0.85, 0.82);
    this.playerGroup.add(belly);

    // Cartoon Eyes
    const eyeGeo = new THREE.BoxGeometry(0.24, 0.28, 0.12);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1e1b2e });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.4, 1.15, 0.9);
    this.playerGroup.add(eyeL);

    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.4, 1.15, 0.9);
    this.playerGroup.add(eyeR);

    // Character-Specific Ears and Tail
    if (char.id === 'fox') {
      // Fox Pointed Ears
      const earGeo = new THREE.ConeGeometry(0.38, 0.95, 4);
      const earMat = new THREE.MeshStandardMaterial({ color: char.accentColor });
      const earL = new THREE.Mesh(earGeo, earMat);
      earL.position.set(-0.55, 1.95, 0.2);
      earL.rotation.z = 0.22;
      this.playerGroup.add(earL);

      const earR = new THREE.Mesh(earGeo, earMat);
      earR.position.set(0.55, 1.95, 0.2);
      earR.rotation.z = -0.22;
      this.playerGroup.add(earR);

      // Fluffy Tail
      const tailGeo = new THREE.ConeGeometry(0.45, 1.4, 6);
      const tail = new THREE.Mesh(tailGeo, earMat);
      tail.position.set(0, 1.0, -1.3);
      tail.rotation.x = -Math.PI / 3;
      tail.castShadow = true;
      this.playerGroup.add(tail);

    } else if (char.id === 'bear') {
      // Bear Round Ears
      const earGeo = new THREE.SphereGeometry(0.38, 8, 8);
      const earMat = new THREE.MeshStandardMaterial({ color: char.accentColor });
      const earL = new THREE.Mesh(earGeo, earMat);
      earL.position.set(-0.7, 1.7, 0.1);
      this.playerGroup.add(earL);

      const earR = new THREE.Mesh(earGeo, earMat);
      earR.position.set(0.7, 1.7, 0.1);
      this.playerGroup.add(earR);

      // Cute Bear Snout
      const snout = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.45, 0.4), new THREE.MeshLambertMaterial({ color: 0x93c5fd }));
      snout.position.set(0, 0.95, 0.95);
      this.playerGroup.add(snout);

    } else if (char.id === 'bunny') {
      // Long Bunny Ears
      const earGeo = new THREE.BoxGeometry(0.24, 1.5, 0.24);
      const earMat = new THREE.MeshStandardMaterial({ color: char.accentColor });
      const earL = new THREE.Mesh(earGeo, earMat);
      earL.position.set(-0.38, 2.2, 0.1);
      earL.rotation.z = 0.12;
      this.playerGroup.add(earL);

      const earR = new THREE.Mesh(earGeo, earMat);
      earR.position.set(0.38, 2.2, 0.1);
      earR.rotation.z = -0.12;
      this.playerGroup.add(earR);

      // Bunny Fluffy Tail
      const tail = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), new THREE.MeshLambertMaterial({ color: 0xffffff }));
      tail.position.set(0, 0.8, -1.05);
      this.playerGroup.add(tail);
    }

    if (this.player) {
      this.playerGroup.position.set(this.player.x, 0, this.player.z);
    } else {
      this.playerGroup.position.set(0, 0, 0);
    }
    this.scene.add(this.playerGroup);
  }

  start() {
    super.start();

    this.player = {
      x: 0,
      z: 0,
      radius: 1.2,
      baseSpeed: this.charConfig.speed,
      maxHp: this.charConfig.maxHp,
      hp: this.charConfig.maxHp,
      facingAngle: 0,
      invulnerableTimer: 0,

      level: 1,
      xp: 0,
      xpNeeded: 70,
      coins: 0,

      s1Cd: 0,
      s1MaxCd: this.charConfig.skill1.cd,
      s2Cd: 0,
      s2MaxCd: this.charConfig.skill2.cd,

      isDashing: false,
      dashDuration: 0,
      shieldActive: false,
      shieldDuration: 0,

      // Roguelite Upgrade stats
      attackRate: this.charConfig.attackRate,
      shootTimer: 0,
      multishot: 1,
      bulletDamage: this.charConfig.bulletDamage,
      bulletSpeed: 38,
      bulletRange: 32,
      critChance: 0.14,
      orbitingOrbs: 0,
      speedMultiplier: 1.0,
      magnetRadius: 16
    };

    // Wave Progression
    this.wave = 1;
    this.waveDefeated = 0;
    this.waveTarget = 8;
    this.spawnTimer = 0;
    this.spawnInterval = 0.95;

    // Collections
    this.enemies = [];
    this.projectiles = [];
    this.enemyProjectiles = [];
    this.items = [];
    this.particles = [];
    this.orbitingMeshList = [];

    this.currentBoss = null;

    if (this.playerGroup) {
      this.playerGroup.position.set(0, 0, 0);
    }

    this.updateHUD();
    this.startLoop();
  }

  triggerSkill1() {
    if (!this.isRunning || this.isPaused || this.isGameOver) return;
    if (this.player.s1Cd > 0) return;

    this.player.s1Cd = this.player.s1MaxCd;
    const char = this.charConfig;

    if (char.id === 'fox') {
      this.player.isDashing = true;
      this.player.dashDuration = 0.35;
      this.player.invulnerableTimer = 0.4;
      this.audio.playJump();
      this.spawn3DShockTrail();
    } else if (char.id === 'bear') {
      this.audio.playExplosion();
      const slamRadius = 14;
      this.enemies.forEach(e => {
        const d = Math.hypot(e.x - this.player.x, e.z - this.player.z);
        if (d <= slamRadius) {
          e.hp -= 65;
          e.speed = Math.max(2, e.speed * 0.35);
          if (e.hp <= 0 && !e.dead) this.handleEnemyDefeated(e);
        }
      });
      this.spawnShockwaveEffect(slamRadius, 0x0284c7);
    } else if (char.id === 'bunny') {
      const blinkDist = 12;
      this.player.x += Math.sin(this.player.facingAngle) * blinkDist;
      this.player.z += Math.cos(this.player.facingAngle) * blinkDist;
      this.clampPlayerPosition();
      this.audio.playPowerup();
      this.spawnIceDecoyTrap();
    }
  }

  triggerSkill2() {
    if (!this.isRunning || this.isPaused || this.isGameOver) return;
    if (this.player.s2Cd > 0) return;

    this.player.s2Cd = this.player.s2MaxCd;
    const char = this.charConfig;

    if (char.id === 'fox') {
      this.audio.playExplosion();
      const novaRadius = 18;
      this.enemies.forEach(e => {
        const d = Math.hypot(e.x - this.player.x, e.z - this.player.z);
        if (d <= novaRadius) {
          e.hp -= 90;
          const pushAngle = Math.atan2(e.x - this.player.x, e.z - this.player.z);
          e.x += Math.sin(pushAngle) * 6;
          e.z += Math.cos(pushAngle) * 6;
          if (e.hp <= 0 && !e.dead) this.handleEnemyDefeated(e);
        }
      });
      this.spawnShockwaveEffect(novaRadius, 0xfbbf24);
    } else if (char.id === 'bear') {
      this.player.shieldActive = true;
      this.player.shieldDuration = 4.0;
      this.audio.playVictory();
    } else if (char.id === 'bunny') {
      this.audio.playExplosion();
      const stormRadius = 22;
      this.enemies.forEach(e => {
        const d = Math.hypot(e.x - this.player.x, e.z - this.player.z);
        if (d <= stormRadius) {
          e.hp -= 85;
          e.speed = Math.max(1, e.speed * 0.3);
          if (e.hp <= 0 && !e.dead) this.handleEnemyDefeated(e);
        }
      });
      this.spawnShockwaveEffect(stormRadius, 0xec4899);
    }
  }

  spawn3DShockTrail() {
    for (let i = 0; i < 8; i++) {
      const g = new THREE.Mesh(this.sharedBoltGeo, this.sharedParticleMat);
      g.position.set(
        this.player.x + (Math.random() - 0.5) * 2,
        0.5,
        this.player.z + (Math.random() - 0.5) * 2
      );
      this.scene.add(g);
      this.particles.push({ mesh: g, life: 0.6, maxLife: 0.6 });
    }
  }

  spawnShockwaveEffect(radius, colorHex) {
    const ringGeo = new THREE.RingGeometry(0.5, 1.2, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: colorHex, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(this.player.x, 0.2, this.player.z);
    this.scene.add(ring);

    this.particles.push({
      mesh: ring,
      life: 0.5,
      maxLife: 0.5,
      update: (dt, p) => {
        const scale = ((p.maxLife - p.life) / p.maxLife) * radius;
        p.mesh.scale.set(scale, scale, 1);
      }
    });
  }

  spawnIceDecoyTrap() {
    const trapGeo = new THREE.CylinderGeometry(0.8, 1.1, 1.6, 6);
    const trapMat = new THREE.MeshStandardMaterial({
      color: 0x93c5fd,
      roughness: 0.2,
      metalness: 0.8
    });
    const trapMesh = new THREE.Mesh(trapGeo, trapMat);
    trapMesh.position.set(this.player.x, 0.8, this.player.z);
    this.scene.add(trapMesh);

    this.particles.push({
      mesh: trapMesh,
      life: 3.5,
      maxLife: 3.5,
      update: (dt, p) => {
        this.enemies.forEach(e => {
          if (Math.hypot(e.x - p.mesh.position.x, e.z - p.mesh.position.z) <= 6.0) {
            e.speed = Math.max(1, e.speed * 0.4);
            e.hp -= 30 * dt;
            if (e.hp <= 0 && !e.dead) this.handleEnemyDefeated(e);
          }
        });
      }
    });
  }

  spawnEnemy() {
    const angle = Math.random() * Math.PI * 2;
    const spawnDist = 32 + Math.random() * 8;
    const ex = this.player.x + Math.cos(angle) * spawnDist;
    const ez = this.player.z + Math.sin(angle) * spawnDist;

    const isBoss = (this.wave % 5 === 0) && (this.waveDefeated === 0) && !this.currentBoss;
    const isFast = !isBoss && Math.random() < 0.28;
    const isTank = !isBoss && !isFast && Math.random() < 0.22;

    const enemy = {
      x: ex,
      z: ez,
      type: isBoss ? 'boss' : (isFast ? 'fast' : (isTank ? 'tank' : 'normal')),
      radius: isBoss ? 2.8 : (isTank ? 1.5 : (isFast ? 0.8 : 1.1)),
      hp: isBoss ? (350 + this.wave * 120) : (isTank ? 85 : (isFast ? 32 : 50)),
      maxHp: isBoss ? (350 + this.wave * 120) : (isTank ? 85 : (isFast ? 32 : 50)),
      speed: isBoss ? 5.5 : (isFast ? 10.5 : (isTank ? 5.8 : 7.2)),
      points: isBoss ? 500 : (isTank ? 60 : 35),
      coins: isBoss ? 20 : (isTank ? 3 : 1),
      bobOffset: Math.random() * Math.PI * 2,
      dead: false
    };

    // Build Cute Floating Ghost 3D Mesh
    const ghostGroup = new THREE.Group();
    const ghostScale = isBoss ? 2.8 : (isTank ? 1.4 : (isFast ? 0.85 : 1.05));

    // Dome / Capsule Body (Smooth cartoon white)
    const ghostBody = new THREE.Mesh(this.sharedGhostGeo, isBoss ? this.sharedBossMat : this.sharedGhostMat);
    ghostBody.position.y = 1.0 * ghostScale;
    ghostBody.scale.set(ghostScale, ghostScale, ghostScale);
    ghostBody.castShadow = true;
    ghostGroup.add(ghostBody);

    // Cute Ghost Face Plane
    const faceMesh = new THREE.Mesh(this.sharedGhostFaceGeo, this.sharedGhostFaceMat);
    faceMesh.position.set(0, 1.05 * ghostScale, 0.78 * ghostScale);
    faceMesh.scale.set(ghostScale, ghostScale, 1);
    ghostGroup.add(faceMesh);

    // Two Cute Forward Ghost Arms
    const handL = new THREE.Mesh(this.sharedGhostArmGeo, isBoss ? this.sharedBossMat : this.sharedGhostMat);
    handL.position.set(-0.65 * ghostScale, 0.8 * ghostScale, 0.35 * ghostScale);
    handL.scale.set(ghostScale, ghostScale, ghostScale);
    ghostGroup.add(handL);

    const handR = new THREE.Mesh(this.sharedGhostArmGeo, isBoss ? this.sharedBossMat : this.sharedGhostMat);
    handR.position.set(0.65 * ghostScale, 0.8 * ghostScale, 0.35 * ghostScale);
    handR.scale.set(ghostScale, ghostScale, ghostScale);
    ghostGroup.add(handR);

    // Cute Soft Ground Drop Shadow
    const shadowMesh = new THREE.Mesh(this.sharedGhostShadowGeo, this.sharedGhostShadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.04;
    shadowMesh.scale.set(ghostScale, ghostScale, 1);
    ghostGroup.add(shadowMesh);

    ghostGroup.position.set(ex, 0, ez);
    this.scene.add(ghostGroup);

    enemy.mesh = ghostGroup;
    enemy.shadowMesh = shadowMesh;
    this.enemies.push(enemy);

    if (isBoss) {
      this.currentBoss = enemy;
      this.audio.playExplosion();
    }
  }

  handleEnemyDefeated(enemy) {
    if (enemy.dead) return;
    enemy.dead = true;
    this.emitScore(this.score + enemy.points);

    this.player.coins += enemy.coins;
    this.waveDefeated++;

    // Remove 3D Mesh
    if (enemy.mesh) {
      this.scene.remove(enemy.mesh);
    }

    // Cute Cartoon Pop Effect (Golden stars & white puff)
    for (let i = 0; i < 6; i++) {
      const pMesh = new THREE.Mesh(this.sharedParticleGeo, this.sharedParticleMat);
      pMesh.position.set(enemy.x, 1.2, enemy.z);
      this.scene.add(pMesh);

      const pAng = Math.random() * Math.PI * 2;
      const pSpd = 3.5 + Math.random() * 4.5;
      this.particles.push({
        mesh: pMesh,
        life: 0.5,
        maxLife: 0.5,
        vx: Math.cos(pAng) * pSpd,
        vy: 4 + Math.random() * 4,
        vz: Math.sin(pAng) * pSpd
      });
    }

    // Drop Glowing Star Gem
    const gemMesh = new THREE.Mesh(this.sharedGemGeo, this.sharedGemMat);
    gemMesh.position.set(enemy.x, 0.45, enemy.z);
    this.scene.add(gemMesh);

    this.items.push({
      mesh: gemMesh,
      x: enemy.x,
      z: enemy.z,
      xp: 22,
      collected: false
    });

    // Check Wave Target
    if (this.waveDefeated >= this.waveTarget) {
      this.advanceWave();
    }
  }

  advanceWave() {
    this.wave++;
    this.waveDefeated = 0;
    this.waveTarget = 8 + (this.wave - 1) * 4;
    this.currentBoss = null;
    this.audio.playVictory();
    this.triggerLevelUpSurge();
  }

  triggerLevelUpSurge() {
    if (this.isGameOver || !this.isRunning) return;
    if (this.upgradeModal && this.upgradeModal.style.display === 'flex') return;

    this.player.level++;
    this.isPaused = true;
    this.upgradeModal.style.display = 'flex';
    this.audio.playPowerup();

    // Render one freeze-frame backdrop behind the modal
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }

    const perks = [
      { id: 'multishot', title: 'Multishot Surge', icon: '⚡', desc: 'Adds +1 piercing projectile per attack burst.' },
      { id: 'magnet', title: 'Mega Magnet', icon: '🧲', desc: 'Pulls stars and gems from across the graveyard.' },
      { id: 'speed', title: 'Swift Paws', icon: '🐾', desc: 'Increases hero run speed by +18%.' },
      { id: 'damage', title: 'Spirit Fang', icon: '⚔️', desc: 'Increases projectile damage by +35%.' },
      { id: 'orbs', title: 'Orbiting Orbs', icon: '🔮', desc: 'Summons protective magic orbs that crush ghosts.' },
      { id: 'heal', title: 'Full Feast', icon: '🍗', desc: 'Restores 100% of maximum HP instantly.' }
    ];

    const shuffled = [...perks].sort(() => 0.5 - Math.random()).slice(0, 3);
    this.cardsContainer.innerHTML = '';

    shuffled.forEach(perk => {
      const card = document.createElement('div');
      card.style.cssText = `
        background: #231b3e;
        border: 2px solid rgba(253,224,71,0.5);
        border-radius: 14px;
        padding: 18px 16px;
        width: 190px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        cursor: pointer;
        pointer-events: auto;
        user-select: none;
        touch-action: manipulation;
        transition: transform 0.2s, border-color 0.2s;
        box-shadow: 0 8px 22px rgba(0,0,0,0.6);
      `;
      card.innerHTML = `
        <div style="font-size:2.2rem; margin-bottom:8px; pointer-events:none;">${perk.icon}</div>
        <div style="font-family:var(--font-display); font-weight:800; font-size:1rem; color:#fde047; margin-bottom:6px; pointer-events:none;">${perk.title}</div>
        <div style="font-size:0.75rem; color:#e0e7ff; line-height:1.4; pointer-events:none;">${perk.desc}</div>
      `;

      card.onmouseenter = () => {
        card.style.transform = 'translateY(-6px) scale(1.04)';
        card.style.borderColor = '#fde047';
      };
      card.onmouseleave = () => {
        card.style.transform = 'translateY(0) scale(1)';
        card.style.borderColor = 'rgba(253,224,71,0.5)';
      };

      let selected = false;
      const selectPerk = (e) => {
        if (selected) return;
        selected = true;
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        this.applyPerk(perk.id);
        this.upgradeModal.style.display = 'none';
        this.resume();
        this.audio.playPowerup();
      };

      card.addEventListener('click', selectPerk);

      this.cardsContainer.appendChild(card);
    });
  }

  applyPerk(perkId) {
    if (perkId === 'multishot') {
      this.player.multishot = Math.min(5, this.player.multishot + 1);
    } else if (perkId === 'magnet') {
      this.player.magnetRadius += 16;
    } else if (perkId === 'speed') {
      this.player.speedMultiplier *= 1.18;
    } else if (perkId === 'damage') {
      this.player.bulletDamage = Math.round(this.player.bulletDamage * 1.35);
    } else if (perkId === 'orbs') {
      this.player.orbitingOrbs++;
      this.rebuildOrbitingOrbs();
    } else if (perkId === 'heal') {
      this.player.hp = this.player.maxHp;
    }
    this.updateHUD();
  }

  rebuildOrbitingOrbs() {
    this.orbitingMeshList.forEach(m => {
      this.scene.remove(m);
      m.geometry.dispose();
      m.material.dispose();
    });
    this.orbitingMeshList = [];

    const orbGeo = new THREE.SphereGeometry(0.4, 8, 8);
    const orbMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });

    for (let i = 0; i < this.player.orbitingOrbs; i++) {
      const mesh = new THREE.Mesh(orbGeo, orbMat);
      this.scene.add(mesh);
      this.orbitingMeshList.push(mesh);
    }
  }

  update(dt) {
    if (!this.playerGroup || !this.player || !this.isRunning || this.isGameOver) return;
    this.time += dt;

    // Cooldown timers
    if (this.player.s1Cd > 0) this.player.s1Cd = Math.max(0, this.player.s1Cd - dt);
    if (this.player.s2Cd > 0) this.player.s2Cd = Math.max(0, this.player.s2Cd - dt);
    if (this.player.invulnerableTimer > 0) this.player.invulnerableTimer = Math.max(0, this.player.invulnerableTimer - dt);

    if (this.player.isDashing) {
      this.player.dashDuration -= dt;
      if (this.player.dashDuration <= 0) this.player.isDashing = false;
    }

    if (this.player.shieldActive) {
      this.player.shieldDuration -= dt;
      if (this.player.shieldDuration <= 0) this.player.shieldActive = false;
    }

    // 1. Movement Handling
    let mx = 0, mz = 0;
    if (this.keys['w'] || this.keys['arrowup']) mz -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) mz += 1;
    if (this.keys['a'] || this.keys['arrowleft']) mx -= 1;
    if (this.keys['d'] || this.keys['arrowright']) mx += 1;

    if (this.touchDir && (this.touchDir.x || this.touchDir.y)) {
      mx = this.touchDir.x;
      mz = this.touchDir.y;
    }

    const moveLen = Math.hypot(mx, mz);
    const isMoving = moveLen > 0.05;

    if (isMoving) {
      const normX = mx / moveLen;
      const normZ = mz / moveLen;
      const speed = this.player.baseSpeed * this.player.speedMultiplier * (this.player.isDashing ? 2.4 : 1.0);

      this.player.x += normX * speed * dt;
      this.player.z += normZ * speed * dt;
      this.player.facingAngle = Math.atan2(normX, normZ);

      this.clampPlayerPosition();

      // Running Bob Animation
      this.playerGroup.rotation.y = this.player.facingAngle;
      this.playerGroup.position.set(this.player.x, Math.sin(this.time * 14) * 0.12, this.player.z);
    } else {
      this.playerGroup.position.set(this.player.x, 0, this.player.z);
    }

    // Defensive check against NaN coordinates
    if (!Number.isFinite(this.player.x)) this.player.x = 0;
    if (!Number.isFinite(this.player.z)) this.player.z = 0;

    // 2. Camera Smooth Follow (Isometric)
    const targetCamX = this.player.x;
    const targetCamZ = this.player.z + 26;
    this.camera.position.x += (targetCamX - this.camera.position.x) * 0.1;
    this.camera.position.z += (targetCamZ - this.camera.position.z) * 0.1;
    this.camera.lookAt(this.player.x, 0, this.player.z);

    // Keep sunlight tracking player position for smooth, persistent shadows
    if (this.sunLight) {
      this.sunLight.position.set(this.player.x + 28, 48, this.player.z - 24);
      if (this.sunLight.target) {
        this.sunLight.target.position.set(this.player.x, 0, this.player.z);
      }
    }

    // 3. Orbiting Orbs
    if (this.orbitingMeshList.length > 0) {
      const orbDist = 3.2;
      this.orbitingMeshList.forEach((mesh, idx) => {
        const a = this.time * 3 + (idx * Math.PI * 2) / this.orbitingMeshList.length;
        const ox = this.player.x + Math.sin(a) * orbDist;
        const oz = this.player.z + Math.cos(a) * orbDist;
        mesh.position.set(ox, 1.2, oz);

        this.enemies.forEach(e => {
          if (Math.hypot(e.x - ox, e.z - oz) <= e.radius + 0.6) {
            e.hp -= 45 * dt;
            if (e.hp <= 0 && !e.dead) this.handleEnemyDefeated(e);
          }
        });
      });
    }

    // 4. Auto-Shoot Projectiles toward Nearest Ghost
    this.player.shootTimer += dt;
    if (this.player.shootTimer >= this.player.attackRate) {
      this.player.shootTimer = 0;
      let nearest = null;
      let minD = this.player.bulletRange;

      this.enemies.forEach(e => {
        const d = Math.hypot(e.x - this.player.x, e.z - this.player.z);
        if (d < minD) {
          minD = d;
          nearest = e;
        }
      });

      if (nearest) {
        this.fireProjectiles3D(nearest);
      }
    }

    // 5. Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.z += p.vz * dt;
      p.dist += p.speed * dt;
      p.mesh.position.set(p.x, 1.1, p.z);

      let hit = false;
      for (const e of this.enemies) {
        if (!e.dead && Math.hypot(e.x - p.x, e.z - p.z) <= e.radius + 0.5) {
          hit = true;
          let isCrit = Math.random() < this.player.critChance;
          let dmg = isCrit ? Math.round(p.damage * 2.2) : p.damage;
          e.hp -= dmg;
          this.audio.playExplosion();

          if (e.hp <= 0) {
            this.handleEnemyDefeated(e);
          }
          break;
        }
      }

      if (hit || p.dist >= p.maxRange) {
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
      }
    }

    // 6. Update Ghosts
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.dead) continue;
      const dx = this.player.x - e.x;
      const dz = this.player.z - e.z;
      const dist = Math.hypot(dx, dz);

      if (dist > 0.05) {
        const nx = dx / dist;
        const nz = dz / dist;
        e.x += nx * e.speed * dt;
        e.z += nz * e.speed * dt;

        // Floating Bobbing Animation
        const bob = Math.sin(this.time * 3.5 + e.bobOffset) * 0.18;
        e.mesh.position.set(e.x, 0.4 + bob, e.z);
        e.mesh.rotation.y = Math.atan2(nx, nz);

        // Adjust shadow scale with height
        if (e.shadowMesh) {
          const s = 1.0 - bob * 0.4;
          e.shadowMesh.scale.set(s, s, 1);
        }
      }

      // Damage player on contact
      if (dist <= this.player.radius + e.radius) {
        if (this.player.invulnerableTimer <= 0) {
          let dmg = e.type === 'boss' ? 32 : 14;
          if (this.player.shieldActive) dmg *= 0.1;

          this.player.hp -= dmg;
          this.player.invulnerableTimer = 0.55;
          this.audio.playHit();

          if (this.player.hp <= 0) {
            this.player.hp = 0;
            this.updateHUD();
            this.emitGameOver();
            return;
          }
        }
      }
    }

    // Clean up dead enemies from array
    this.enemies = this.enemies.filter(e => !e.dead);

    // 7. Magnet & Collect Items
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      const d = Math.hypot(it.x - this.player.x, it.z - this.player.z);

      if (d > 0.05 && d <= this.player.magnetRadius) {
        const pullSpd = 20 * dt;
        it.x += ((this.player.x - it.x) / d) * pullSpd;
        it.z += ((this.player.z - it.z) / d) * pullSpd;
        it.mesh.position.set(it.x, 0.45, it.z);
      }

      if (d <= this.player.radius + 0.8) {
        this.scene.remove(it.mesh);
        this.items.splice(i, 1);

        this.player.xp += it.xp;
        this.emitScore(this.score + 15);
        this.audio.playPowerup();

        if (this.player.xp >= this.player.xpNeeded) {
          this.player.xp -= this.player.xpNeeded;
          this.player.xpNeeded = Math.round(this.player.xpNeeded * 1.35);
          this.triggerLevelUpSurge();
        }
      }
    }

    // 8. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.update) p.update(dt, p);

      if (p.vy) {
        p.vy -= 16 * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.z += p.vz * dt;
      }

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }

    // 9. Spawn Timer
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      if (this.enemies.length < 40) {
        this.spawnEnemy();
      }
    }

    this.updateHUD();

    // Render 3D Frame
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  fireProjectiles3D(target) {
    const angle = Math.atan2(target.x - this.player.x, target.z - this.player.z);
    const count = this.player.multishot;
    const spread = 0.16;
    const startAngle = angle - ((count - 1) * spread) / 2;

    for (let i = 0; i < count; i++) {
      const bAngle = startAngle + i * spread;
      const mesh = new THREE.Mesh(this.sharedBoltGeo, this.sharedBoltMat);
      mesh.position.set(this.player.x, 1.1, this.player.z);
      this.scene.add(mesh);

      this.projectiles.push({
        mesh,
        x: this.player.x,
        z: this.player.z,
        vx: Math.sin(bAngle) * this.player.bulletSpeed,
        vz: Math.cos(bAngle) * this.player.bulletSpeed,
        speed: this.player.bulletSpeed,
        maxRange: this.player.bulletRange,
        dist: 0,
        damage: this.player.bulletDamage
      });
    }
    this.audio.playJump();
  }

  clampPlayerPosition() {
    const limit = this.arenaSize / 2 - 2;
    this.player.x = Math.max(-limit, Math.min(limit, this.player.x));
    this.player.z = Math.max(-limit, Math.min(limit, this.player.z));
  }

  updateHUD() {
    if (!this.player) return;

    if (this.coinsText && this.lastCoins !== this.player.coins) {
      this.lastCoins = this.player.coins;
      this.coinsText.textContent = this.player.coins;
    }
    if (this.levelBadge && this.lastLevel !== this.player.level) {
      this.lastLevel = this.player.level;
      this.levelBadge.textContent = this.player.level;
    }
    if (this.waveNumEl && this.lastWave !== this.wave) {
      this.lastWave = this.wave;
      this.waveNumEl.textContent = this.wave;
    }

    if (this.waveProgressFill) {
      const pct = Math.min(100, (this.waveDefeated / this.waveTarget) * 100);
      this.waveProgressFill.style.width = `${pct}%`;
    }
    if (this.waveTargetText) {
      this.waveTargetText.textContent = `${this.waveDefeated}/${this.waveTarget}`;
    }

    // 3D Floating Player HP Bar
    if (this.floatingHud && this.camera && this.renderer) {
      this.camera.updateMatrixWorld();
      const pos = new THREE.Vector3(this.player.x, 2.4, this.player.z);
      pos.project(this.camera);

      // Hide if behind camera
      if (pos.z > 1.0) {
        this.floatingHud.style.display = 'none';
      } else {
        this.floatingHud.style.display = 'flex';
        const sx = (pos.x * 0.5 + 0.5) * this.stageWidth;
        const sy = (-(pos.y * 0.5) + 0.5) * this.stageHeight;

        this.floatingHud.style.left = `${sx}px`;
        this.floatingHud.style.top = `${sy}px`;

        const hpPercent = Math.max(0, (this.player.hp / this.player.maxHp) * 100);
        this.floatingHpFill.style.width = `${hpPercent}%`;
        this.floatingHpText.textContent = Math.ceil(this.player.hp);
      }
    }

    // Skill cooldown overlays
    if (this.s1CdEl) {
      if (this.player.s1Cd > 0) {
        this.s1CdEl.style.display = 'flex';
        this.s1CdEl.textContent = this.player.s1Cd.toFixed(1);
      } else {
        this.s1CdEl.style.display = 'none';
      }
    }

    if (this.s2CdEl) {
      if (this.player.s2Cd > 0) {
        this.s2CdEl.style.display = 'flex';
        this.s2CdEl.textContent = this.player.s2Cd.toFixed(1);
      } else {
        this.s2CdEl.style.display = 'none';
      }
    }
  }

  handleResize() {
    if (!this.renderer || !this.camera || !this.webglContainer) return;
    const rect = this.container.getBoundingClientRect();
    this.stageWidth = Math.max(340, Math.min(rect.width > 200 ? rect.width - 20 : 880, 960));
    this.stageHeight = Math.max(380, Math.min(rect.height > 200 ? rect.height - 30 : 580, 620));

    const wrapper = this.container.querySelector('.zappets-wrapper');
    if (wrapper) {
      wrapper.style.width = `${this.stageWidth}px`;
      wrapper.style.height = `${this.stageHeight}px`;
    }
    this.webglContainer.style.width = `${this.stageWidth}px`;
    this.webglContainer.style.height = `${this.stageHeight}px`;

    this.camera.aspect = this.stageWidth / this.stageHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.stageWidth, this.stageHeight);
  }

  destroy() {
    super.destroy();

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
      this.renderer = null;
    }

    if (this.sharedBoltGeo) this.sharedBoltGeo.dispose();
    if (this.sharedBoltMat) this.sharedBoltMat.dispose();
    if (this.sharedGhostGeo) this.sharedGhostGeo.dispose();
    if (this.sharedGhostMat) this.sharedGhostMat.dispose();
    if (this.sharedBossMat) this.sharedBossMat.dispose();
    if (this.sharedGhostFaceGeo) this.sharedGhostFaceGeo.dispose();
    if (this.sharedGhostFaceMat) this.sharedGhostFaceMat.dispose();
    if (this.sharedGhostArmGeo) this.sharedGhostArmGeo.dispose();
    if (this.sharedGhostShadowGeo) this.sharedGhostShadowGeo.dispose();
    if (this.sharedGhostShadowMat) this.sharedGhostShadowMat.dispose();
    if (this.sharedGemGeo) this.sharedGemGeo.dispose();
    if (this.sharedGemMat) this.sharedGemMat.dispose();
    if (this.sharedParticleGeo) this.sharedParticleGeo.dispose();
    if (this.sharedParticleMat) this.sharedParticleMat.dispose();

    if (this.scene) {
      this.scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      });
      this.scene = null;
    }

    this.camera = null;
    this.playerGroup = null;
    this.ghostFaceTexture = null;
    this.sunLight = null;
  }
}
