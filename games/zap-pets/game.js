import { BaseGame } from '../../src/core/BaseGame.js';
import * as THREE from '../../src/lib/three.module.js';

export const CHARACTERS = {
  fox: {
    id: 'fox',
    name: 'Spark Fox',
    role: 'Speed & Electric',
    icon: '🦊',
    color: '#f59e0b',
    bodyColor: 0xf59e0b,
    accentColor: 0xca8a04,
    maxHp: 100,
    speed: 16.0,
    attackRate: 0.32,
    bulletDamage: 24,
    bulletColor: 0x38bdf8,
    skill1: {
      name: 'Lightning Dash',
      key: 'SPACE',
      icon: '⚡',
      cd: 3.2,
      desc: 'Warp ahead leaving an electrified trail.'
    },
    skill2: {
      name: 'Thunder Nova',
      key: 'E',
      icon: '💥',
      cd: 7.5,
      desc: 'Release a 360° electromagnetic pulse pushing back enemies.'
    }
  },
  bear: {
    id: 'bear',
    name: 'Iron Bear',
    role: 'Heavy Tank & Defense',
    icon: '🐻',
    color: '#0284c7',
    bodyColor: 0x0284c7,
    accentColor: 0x0369a1,
    maxHp: 175,
    speed: 12.0,
    attackRate: 0.44,
    bulletDamage: 40,
    bulletColor: 0x0ea5e9,
    skill1: {
      name: 'Ground Slam',
      key: 'SPACE',
      icon: '💥',
      cd: 4.5,
      desc: 'Slam the ground causing an earthquake that stuns enemies.'
    },
    skill2: {
      name: 'Iron Fortress',
      key: 'E',
      icon: '🛡️',
      cd: 9.0,
      desc: 'Deploy a protective shield reducing 90% damage.'
    }
  },
  bunny: {
    id: 'bunny',
    name: 'Frost Bunny',
    role: 'Long Range & Frost',
    icon: '🐰',
    color: '#ec4899',
    bodyColor: 0xec4899,
    accentColor: 0xa855f7,
    maxHp: 85,
    speed: 15.0,
    attackRate: 0.35,
    bulletDamage: 28,
    bulletColor: 0xa855f7,
    skill1: {
      name: 'Frost Blink',
      key: 'SPACE',
      icon: '❄️',
      cd: 3.6,
      desc: 'Teleport forward leaving an icy decoy trap.'
    },
    skill2: {
      name: 'Blizzard Storm',
      key: 'E',
      icon: '🌪️',
      cd: 8.5,
      desc: 'Summon a blizzard vortex slowing and damaging enemies.'
    }
  }
};

export default class ZapPets3DGame extends BaseGame {
  init() {
    this.selectedCharKey = 'fox';
    this.charConfig = CHARACTERS.fox;

    // Calculate reliable dimensions
    const rect = this.container.getBoundingClientRect();
    const stageWidth = Math.max(340, Math.min(rect.width > 200 ? rect.width - 20 : 880, 960));
    const stageHeight = Math.max(380, Math.min(rect.height > 200 ? rect.height - 30 : 580, 620));

    this.container.innerHTML = `
      <div class="zappets-wrapper" style="position:relative; width:${stageWidth}px; height:${stageHeight}px; display:flex; flex-direction:column; align-items:center; justify-content:center; overflow:hidden; user-select:none; border-radius:14px; box-shadow:0 12px 35px rgba(0,0,0,0.7); background:#070913;">
        
        <!-- Top HUD Bar -->
        <div class="zp-hud-top" style="position:absolute; top:8px; left:12px; right:12px; display:flex; justify-content:space-between; align-items:flex-start; pointer-events:none; z-index:15;">
          
          <!-- Left: Hero Switcher & EXP Bar -->
          <div style="display:flex; flex-direction:column; gap:4px; pointer-events:auto;">
            <!-- Hero Switcher Pills -->
            <div id="zp-hero-switcher" style="display:flex; gap:4px; background:rgba(15,23,42,0.85); backdrop-filter:blur(8px); padding:3px; border-radius:12px; border:1px solid rgba(255,255,255,0.15);">
              <button class="zp-hero-btn" data-hero="fox" style="border:none; background:#eab308; color:#0f172a; font-weight:800; font-size:0.75rem; padding:3px 8px; border-radius:8px; cursor:pointer; font-family:var(--font-display);">🦊 Fox</button>
              <button class="zp-hero-btn" data-hero="bear" style="border:none; background:rgba(255,255,255,0.08); color:#94a3b8; font-weight:800; font-size:0.75rem; padding:3px 8px; border-radius:8px; cursor:pointer; font-family:var(--font-display);">🐻 Bear</button>
              <button class="zp-hero-btn" data-hero="bunny" style="border:none; background:rgba(255,255,255,0.08); color:#94a3b8; font-weight:800; font-size:0.75rem; padding:3px 8px; border-radius:8px; cursor:pointer; font-family:var(--font-display);">🐰 Bunny</button>
            </div>
            
            <div style="display:flex; align-items:center; gap:6px; margin-top:2px;">
              <span id="zp-level-badge" style="background:#eab308; color:#0f172a; font-weight:800; font-size:0.7rem; padding:1px 6px; border-radius:8px;">LV 1</span>
              <span id="zp-coins-text" style="color:#fbbf24; font-weight:700; font-size:0.8rem;">🪙 0</span>
            </div>
            <div style="width:130px; height:6px; background:rgba(255,255,255,0.15); border-radius:3px; overflow:hidden; border:1px solid rgba(255,255,255,0.2);">
              <div id="zp-exp-fill" style="width:0%; height:100%; background:linear-gradient(90deg, #38bdf8, #06b6d4); transition:width 0.15s ease;"></div>
            </div>
          </div>

          <!-- Center: Wave & Boss Bar -->
          <div style="display:flex; flex-direction:column; align-items:center; gap:4px;">
            <div style="background:rgba(15,23,42,0.85); backdrop-filter:blur(8px); border:1px solid rgba(255,255,255,0.15); border-radius:20px; padding:3px 16px; font-family:var(--font-display); font-size:0.9rem; font-weight:800; color:#f8fafc; letter-spacing:0.5px;">
              WAVE <span id="zp-wave-num" style="color:#eab308;">1</span> • <span id="zp-wave-timer">30</span>s
            </div>
            <div id="zp-boss-bar" style="display:none; width:180px; flex-direction:column; align-items:center;">
              <span style="font-size:0.7rem; color:#ef4444; font-weight:700; margin-bottom:2px;">⚠️ GOLIATH BOSS ⚠️</span>
              <div style="width:100%; height:7px; background:rgba(0,0,0,0.6); border:1px solid #ef4444; border-radius:4px; overflow:hidden;">
                <div id="zp-boss-fill" style="width:100%; height:100%; background:#ef4444;"></div>
              </div>
            </div>
          </div>

          <!-- Right: Minimap Radar -->
          <div style="position:relative; width:75px; height:75px; background:rgba(15,23,42,0.85); border:1px solid rgba(56,189,248,0.3); border-radius:10px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.5);">
            <canvas id="zp-minimap" width="75" height="75" style="display:block;"></canvas>
          </div>
        </div>

        <!-- 3D Canvas Mounting Container -->
        <div id="zp-webgl-container" style="width:${stageWidth}px; height:${stageHeight}px; position:absolute; inset:0;"></div>

        <!-- Touch Controls Layer -->
        <div class="zp-touch-layer" style="position:absolute; inset:0; pointer-events:none; z-index:20;">
          <div id="zp-joystick-zone" style="position:absolute; bottom:16px; left:16px; width:110px; height:110px; border-radius:50%; background:rgba(255,255,255,0.06); border:2px dashed rgba(255,255,255,0.2); pointer-events:auto; display:none; align-items:center; justify-content:center;">
            <div id="zp-joystick-knob" style="width:44px; height:44px; border-radius:50%; background:#38bdf8; box-shadow:0 0 15px #38bdf8; transform:translate(0,0);"></div>
          </div>

          <!-- Skills Buttons -->
          <div class="zp-skills-container" style="position:absolute; bottom:20px; right:20px; display:flex; gap:12px; pointer-events:auto;">
            <button id="zp-btn-skill1" style="width:54px; height:54px; border-radius:50%; background:#1e1b4b; border:2px solid #38bdf8; color:#fff; font-size:1.3rem; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 4px 15px rgba(56,189,248,0.4); position:relative;">
              <span id="zp-s1-icon">⚡</span>
              <span style="font-size:0.55rem; font-weight:700; color:#38bdf8;">SPACE</span>
              <div id="zp-s1-cd" style="position:absolute; inset:0; border-radius:50%; background:rgba(0,0,0,0.7); display:none; align-items:center; justify-content:center; font-size:0.75rem; font-weight:800; color:#fff;"></div>
            </button>
            <button id="zp-btn-skill2" style="width:54px; height:54px; border-radius:50%; background:#3b0764; border:2px solid #ec4899; color:#fff; font-size:1.3rem; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 4px 15px rgba(236,72,153,0.4); position:relative;">
              <span id="zp-s2-icon">💥</span>
              <span style="font-size:0.55rem; font-weight:700; color:#ec4899;">E</span>
              <div id="zp-s2-cd" style="position:absolute; inset:0; border-radius:50%; background:rgba(0,0,0,0.7); display:none; align-items:center; justify-content:center; font-size:0.75rem; font-weight:800; color:#fff;"></div>
            </button>
          </div>
        </div>

        <!-- Level Up Modal Overlay -->
        <div id="zp-upgrade-modal" style="position:absolute; inset:0; background:rgba(5,7,15,0.88); backdrop-filter:blur(10px); z-index:50; display:none; flex-direction:column; align-items:center; justify-content:center; padding:16px;">
          <div style="font-family:var(--font-display); font-size:1.5rem; font-weight:900; color:#fbbf24; margin-bottom:4px; text-shadow:0 0 20px #eab308;">
            ⚡ LEVEL UP SURGE! ⚡
          </div>
          <div style="color:#94a3b8; font-size:0.85rem; margin-bottom:18px;">Choose 1 upgrade perk to boost your cyber pet:</div>
          <div id="zp-cards-container" style="display:flex; gap:12px; flex-wrap:wrap; justify-content:center; max-width:640px;"></div>
        </div>

      </div>
    `;

    this.webglContainer = this.container.querySelector('#zp-webgl-container');
    this.minimapCanvas = this.container.querySelector('#zp-minimap');
    this.minimapCtx = this.minimapCanvas.getContext('2d');

    // Cached elements
    this.levelBadge = this.container.querySelector('#zp-level-badge');
    this.coinsText = this.container.querySelector('#zp-coins-text');
    this.expFill = this.container.querySelector('#zp-exp-fill');
    this.waveNumEl = this.container.querySelector('#zp-wave-num');
    this.waveTimerEl = this.container.querySelector('#zp-wave-timer');
    this.bossBar = this.container.querySelector('#zp-boss-bar');
    this.bossFill = this.container.querySelector('#zp-boss-fill');
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

    // Check touch devices
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

    // Skill button clicks
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

    // IMMEDIATELY INITIALIZE 3D SCENE so nothing is blank!
    this.init3DScene(stageWidth, stageHeight);
  }

  switchHero(heroKey) {
    if (!CHARACTERS[heroKey]) return;
    this.selectedCharKey = heroKey;
    this.charConfig = CHARACTERS[heroKey];

    // Update buttons UI
    this.heroBtns.forEach(b => {
      if (b.dataset.hero === heroKey) {
        b.style.background = this.charConfig.color;
        b.style.color = '#0f172a';
      } else {
        b.style.background = 'rgba(255,255,255,0.08)';
        b.style.color = '#94a3b8';
      }
    });

    // Update skill buttons icons
    this.s1Icon.textContent = this.charConfig.skill1.icon;
    this.s2Icon.textContent = this.charConfig.skill2.icon;

    // Update player parameters
    if (this.player) {
      this.player.baseSpeed = this.charConfig.speed;
      this.player.maxHp = this.charConfig.maxHp;
      this.player.hp = Math.min(this.player.hp, this.charConfig.maxHp);
      this.player.bulletDamage = this.charConfig.bulletDamage;
      this.player.attackRate = this.charConfig.attackRate;
      this.player.s1MaxCd = this.charConfig.skill1.cd;
      this.player.s2MaxCd = this.charConfig.skill2.cd;
    }

    // Rebuild 3D Model with new hero visual
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
          const maxDist = 40;
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
    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0d1a);

    // 2. Camera (Isometric Top-Down 3D Perspective)
    this.camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 1000);
    this.camera.position.set(0, 24, 18);
    this.camera.lookAt(0, 0.5, 0);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.webglContainer.innerHTML = '';
    this.webglContainer.appendChild(this.renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.3);
    dirLight.position.set(30, 50, 25);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    this.scene.add(dirLight);

    // 5. Arena Floor
    this.arenaSize = 160;
    const floorGeo = new THREE.PlaneGeometry(this.arenaSize, this.arenaSize);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.7,
      metalness: 0.2
    });
    this.floor = new THREE.Mesh(floorGeo, floorMat);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.receiveShadow = true;
    this.scene.add(this.floor);

    // Grid Overlay
    const grid = new THREE.GridHelper(this.arenaSize, 40, 0x06b6d4, 0x1e293b);
    grid.position.y = 0.05;
    this.scene.add(grid);

    // Perimeter walls
    this.buildArenaFences();

    // 6. Build Player Model
    this.buildPlayer3D();
  }

  buildArenaFences() {
    const half = this.arenaSize / 2;
    const fenceMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true });
    const wallGeo = new THREE.BoxGeometry(this.arenaSize, 3, 0.4);

    const wallN = new THREE.Mesh(wallGeo, fenceMat);
    wallN.position.set(0, 1.5, -half);
    this.scene.add(wallN);

    const wallS = new THREE.Mesh(wallGeo, fenceMat);
    wallS.position.set(0, 1.5, half);
    this.scene.add(wallS);

    const wallGeoSide = new THREE.BoxGeometry(0.4, 3, this.arenaSize);
    const wallW = new THREE.Mesh(wallGeoSide, fenceMat);
    wallW.position.set(-half, 1.5, 0);
    this.scene.add(wallW);

    const wallE = new THREE.Mesh(wallGeoSide, fenceMat);
    wallE.position.set(half, 1.5, 0);
    this.scene.add(wallE);
  }

  buildPlayer3D() {
    if (this.playerGroup) {
      this.scene.remove(this.playerGroup);
      this.playerGroup.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
    }

    this.playerGroup = new THREE.Group();
    const char = this.charConfig;

    // Body
    const bodyGeo = new THREE.BoxGeometry(1.6, 1.6, 1.6);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: char.bodyColor,
      roughness: 0.35,
      metalness: 0.1,
      flatShading: true
    });

    // Auto-load PixAssets custom pixel-art texture (games/zap-pets/assets/{char.id}.png)
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
    this.playerGroup.add(this.playerBody);

    // Eyes
    const eyeGeo = new THREE.BoxGeometry(0.3, 0.3, 0.1);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.4, 1.2, 0.82);
    this.playerGroup.add(eyeL);

    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.4, 1.2, 0.82);
    this.playerGroup.add(eyeR);

    // Ears
    if (char.id === 'fox') {
      const earGeo = new THREE.ConeGeometry(0.4, 0.9, 4);
      const earMat = new THREE.MeshStandardMaterial({ color: char.accentColor, flatShading: true });
      const earL = new THREE.Mesh(earGeo, earMat);
      earL.position.set(-0.6, 2.0, 0.1);
      earL.rotation.z = 0.2;
      this.playerGroup.add(earL);

      const earR = new THREE.Mesh(earGeo, earMat);
      earR.position.set(0.6, 2.0, 0.1);
      earR.rotation.z = -0.2;
      this.playerGroup.add(earR);
    } else if (char.id === 'bear') {
      const earGeo = new THREE.SphereGeometry(0.35, 6, 6);
      const earMat = new THREE.MeshStandardMaterial({ color: char.accentColor, flatShading: true });
      const earL = new THREE.Mesh(earGeo, earMat);
      earL.position.set(-0.7, 1.8, 0);
      this.playerGroup.add(earL);

      const earR = new THREE.Mesh(earGeo, earMat);
      earR.position.set(0.7, 1.8, 0);
      this.playerGroup.add(earR);
    } else if (char.id === 'bunny') {
      const earGeo = new THREE.BoxGeometry(0.25, 1.4, 0.25);
      const earMat = new THREE.MeshStandardMaterial({ color: char.accentColor, flatShading: true });
      const earL = new THREE.Mesh(earGeo, earMat);
      earL.position.set(-0.4, 2.2, 0);
      earL.rotation.z = 0.1;
      this.playerGroup.add(earL);

      const earR = new THREE.Mesh(earGeo, earMat);
      earR.position.set(0.4, 2.2, 0);
      earR.rotation.z = -0.1;
      this.playerGroup.add(earR);
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

    // Player logical state
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

      // Skills cooldowns
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
      bulletRange: 28,
      critChance: 0.12,
      orbitingOrbs: 0,
      speedMultiplier: 1.0,
      magnetRadius: 14
    };

    // Waves
    this.wave = 1;
    this.waveTimeLeft = 30;
    this.spawnTimer = 0;
    this.spawnInterval = 1.0;

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
          e.hp -= 60;
          e.speed = Math.max(2, e.speed * 0.4);
          if (e.hp <= 0 && !e.dead) this.handleEnemyDefeated(e);
        }
      });
      this.spawnShockwaveEffect(slamRadius, 0x0284c7);
    } else if (char.id === 'bunny') {
      const blinkDist = 12;
      this.player.x += Math.sin(this.player.facingAngle) * blinkDist;
      this.player.z += Math.cos(this.player.facingAngle) * blinkDist;
      this.clampPlayerPosition();
      this.audio.playJump();

      const freezeRadius = 10;
      this.enemies.forEach(e => {
        const d = Math.hypot(e.x - this.player.x, e.z - this.player.z);
        if (d <= freezeRadius) {
          e.hp -= 35;
          e.frozenTimer = 2.0;
        }
      });
      this.spawnShockwaveEffect(freezeRadius, 0xa855f7);
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
          const angle = Math.atan2(e.z - this.player.z, e.x - this.player.x);
          e.hp -= 75;
          e.x += Math.cos(angle) * 6;
          e.z += Math.sin(angle) * 6;
          if (e.hp <= 0 && !e.dead) this.handleEnemyDefeated(e);
        }
      });
      this.spawnShockwaveEffect(novaRadius, 0xfbbf24);
    } else if (char.id === 'bear') {
      this.player.shieldActive = true;
      this.player.shieldDuration = 3.5;
      this.audio.playVictory();
    } else if (char.id === 'bunny') {
      this.audio.playExplosion();
      const stormRadius = 22;
      this.enemies.forEach(e => {
        const d = Math.hypot(e.x - this.player.x, e.z - this.player.z);
        if (d <= stormRadius) {
          e.hp -= 80;
          e.speed = Math.max(1, e.speed * 0.3);
          if (e.hp <= 0 && !e.dead) this.handleEnemyDefeated(e);
        }
      });
      this.spawnShockwaveEffect(stormRadius, 0xec4899);
    }
  }

  spawnShockwaveEffect(radius, colorHex) {
    const ringGeo = new THREE.RingGeometry(0.5, radius, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: colorHex, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(this.player.x, 0.2, this.player.z);
    this.scene.add(ring);

    this.particles.push({
      mesh: ring,
      life: 0.4,
      maxLife: 0.4,
      scaleSpeed: 1.5
    });
  }

  spawn3DShockTrail() {
    for (let i = 0; i < 8; i++) {
      const geo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
      const mat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const p = new THREE.Mesh(geo, mat);
      p.position.set(this.player.x + (Math.random() - 0.5) * 2, 0.6, this.player.z + (Math.random() - 0.5) * 2);
      this.scene.add(p);
      this.particles.push({
        mesh: p,
        life: 0.35,
        maxLife: 0.35
      });
    }
  }

  spawnEnemy() {
    const angle = Math.random() * Math.PI * 2;
    const distance = 35 + Math.random() * 15;
    const x = Math.max(-this.arenaSize / 2 + 5, Math.min(this.arenaSize / 2 - 5, this.player.x + Math.sin(angle) * distance));
    const z = Math.max(-this.arenaSize / 2 + 5, Math.min(this.arenaSize / 2 - 5, this.player.z + Math.cos(angle) * distance));

    const rand = Math.random();
    let type = 'minion';
    let hp = 30 + this.wave * 10;
    let speed = 7.5 + Math.random() * 2;
    let colorHex = 0xf43f5e;
    let radius = 1.0;
    let points = 10;

    if (rand < 0.25) {
      type = 'stalker';
      hp = 20 + this.wave * 5;
      speed = 13.0;
      colorHex = 0xa855f7;
      radius = 0.8;
      points = 15;
    } else if (rand < 0.45 && this.wave >= 2) {
      type = 'shooter';
      hp = 50 + this.wave * 12;
      speed = 5.5;
      colorHex = 0xeab308;
      radius = 1.1;
      points = 20;
    }

    const enemyGeo = type === 'stalker' ? new THREE.ConeGeometry(radius, 1.8, 5) : new THREE.BoxGeometry(radius * 1.8, radius * 1.8, radius * 1.8);
    const enemyMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.5, flatShading: true });
    const mesh = new THREE.Mesh(enemyGeo, enemyMat);
    mesh.position.set(x, 1.0, z);
    mesh.castShadow = true;
    this.scene.add(mesh);

    this.enemies.push({
      mesh,
      x,
      z,
      type,
      radius,
      hp,
      maxHp: hp,
      speed,
      points,
      shootTimer: 1.8 + Math.random()
    });
  }

  spawnBoss() {
    const angle = Math.random() * Math.PI * 2;
    const x = this.player.x + Math.sin(angle) * 35;
    const z = this.player.z + Math.cos(angle) * 35;

    const hp = 700 + this.wave * 250;
    const radius = 2.8;

    const bossGeo = new THREE.BoxGeometry(radius * 2, radius * 2.5, radius * 2);
    const bossMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3, metalness: 0.4, flatShading: true });
    const mesh = new THREE.Mesh(bossGeo, bossMat);
    mesh.position.set(x, radius * 1.25, z);
    mesh.castShadow = true;
    this.scene.add(mesh);

    this.currentBoss = {
      mesh,
      x,
      z,
      type: 'boss',
      radius,
      hp,
      maxHp: hp,
      speed: 5.5,
      points: 250,
      shootTimer: 2.0
    };
    this.enemies.push(this.currentBoss);
    this.audio.playExplosion();
  }

  handleEnemyDefeated(enemy) {
    enemy.dead = true;
    this.emitScore(this.score + enemy.points);

    if (enemy.mesh) {
      this.scene.remove(enemy.mesh);
      enemy.mesh.geometry.dispose();
      enemy.mesh.material.dispose();
    }

    for (let i = 0; i < 6; i++) {
      const pGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
      const pMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.position.set(enemy.x, 1.0, enemy.z);
      this.scene.add(pMesh);

      const pAngle = Math.random() * Math.PI * 2;
      this.particles.push({
        mesh: pMesh,
        vx: Math.cos(pAngle) * 8,
        vy: 6 + Math.random() * 6,
        vz: Math.sin(pAngle) * 8,
        life: 0.45,
        maxLife: 0.45
      });
    }

    const gemGeo = new THREE.OctahedronGeometry(0.45, 0);
    const gemMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const gemMesh = new THREE.Mesh(gemGeo, gemMat);
    gemMesh.position.set(enemy.x, 0.6, enemy.z);
    this.scene.add(gemMesh);

    this.items.push({
      mesh: gemMesh,
      x: enemy.x,
      z: enemy.z,
      type: 'exp',
      val: enemy.type === 'boss' ? 120 : (enemy.type === 'shooter' ? 30 : 15),
      radius: 1.0
    });
  }

  showLevelUpModal() {
    this.pause();

    const perks = [
      { id: 'multishot', title: 'Multishot Zap', icon: '🎯', desc: 'Add +1 plasma bolt per volley' },
      { id: 'attackspeed', title: 'Overclock Drive', icon: '⚡', desc: '+25% faster attack firing rate' },
      { id: 'damage', title: 'Heavy Plasma', icon: '💥', desc: '+35% projectile impact damage' },
      { id: 'speed', title: 'Cyber Agility', icon: '👟', desc: '+20% faster movement speed' },
      { id: 'shield', title: 'Thunder Orbs', icon: '🌀', desc: 'Add/Upgrade 3D orbiting barrier orbs' },
      { id: 'crit', title: 'Critical Matrix', icon: '✨', desc: '+15% critical hit rate for 2x damage' },
      { id: 'heal', title: 'Nano Medkit', icon: '❤️', desc: 'Instantly restore +50% of max health' }
    ];

    const selected = [...perks].sort(() => Math.random() - 0.5).slice(0, 3);
    this.cardsContainer.innerHTML = '';
    selected.forEach(perk => {
      const card = document.createElement('div');
      card.style.cssText = `
        background: linear-gradient(145deg, #1e1b4b, #0f172a);
        border: 2px solid rgba(56,189,248,0.4);
        border-radius: 14px;
        padding: 16px 14px;
        width: 180px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        cursor: pointer;
        transition: transform 0.2s, border-color 0.2s;
        box-shadow: 0 8px 20px rgba(0,0,0,0.5);
      `;
      card.innerHTML = `
        <div style="font-size:2rem; margin-bottom:6px;">${perk.icon}</div>
        <div style="font-family:var(--font-display); font-weight:800; font-size:0.95rem; color:#f8fafc; margin-bottom:4px;">${perk.title}</div>
        <div style="font-size:0.75rem; color:#94a3b8; line-height:1.4;">${perk.desc}</div>
      `;

      card.onmouseenter = () => { card.style.transform = 'translateY(-6px)'; card.style.borderColor = '#38bdf8'; };
      card.onmouseleave = () => { card.style.transform = 'none'; card.style.borderColor = 'rgba(56,189,248,0.4)'; };

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
        this.rebuildOrbitingOrbs3D();
        break;
      case 'crit':
        this.player.critChance = Math.min(this.player.critChance + 0.15, 0.6);
        break;
      case 'heal':
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + this.player.maxHp * 0.5);
        break;
    }
  }

  rebuildOrbitingOrbs3D() {
    this.orbitingMeshList.forEach(m => {
      this.scene.remove(m);
      m.geometry.dispose();
      m.material.dispose();
    });
    this.orbitingMeshList = [];

    const orbGeo = new THREE.SphereGeometry(0.4, 8, 8);
    const orbMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    for (let i = 0; i < this.player.orbitingOrbs; i++) {
      const mesh = new THREE.Mesh(orbGeo, orbMat);
      this.scene.add(mesh);
      this.orbitingMeshList.push(mesh);
    }
  }

  clampPlayerPosition() {
    const half = this.arenaSize / 2 - 2;
    this.player.x = Math.max(-half, Math.min(half, this.player.x));
    this.player.z = Math.max(-half, Math.min(half, this.player.z));
  }

  update(dt) {
    if (!this.playerGroup || !this.player) return;

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

    // Movement Input
    let mx = 0, mz = 0;
    if (this.keys['w'] || this.keys['arrowup']) mz -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) mz += 1;
    if (this.keys['a'] || this.keys['arrowleft']) mx -= 1;
    if (this.keys['d'] || this.keys['arrowright']) mx += 1;

    if (this.touchDir && (this.touchDir.x !== 0 || this.touchDir.y !== 0)) {
      mx = this.touchDir.x;
      mz = this.touchDir.y;
    }

    const moveLen = Math.hypot(mx, mz);
    if (moveLen > 0) {
      const normX = mx / moveLen;
      const normZ = mz / moveLen;
      const curSpeed = (this.player.isDashing ? this.player.baseSpeed * 2.2 : this.player.baseSpeed) * this.player.speedMultiplier;
      this.player.x += normX * curSpeed * dt;
      this.player.z += normZ * curSpeed * dt;

      this.player.facingAngle = Math.atan2(normX, normZ);
      this.clampPlayerPosition();

      // Bobbing animation 3D
      this.playerGroup.position.y = Math.abs(Math.sin(Date.now() / 90)) * 0.35;
    } else {
      this.playerGroup.position.y = 0;
    }

    // Update 3D Player position and rotation
    this.playerGroup.position.x = this.player.x;
    this.playerGroup.position.z = this.player.z;
    this.playerGroup.rotation.y = this.player.facingAngle;

    // Camera follow (Smooth Lerp)
    const targetCamX = this.player.x;
    const targetCamY = 24;
    const targetCamZ = this.player.z + 18;
    this.camera.position.x += (targetCamX - this.camera.position.x) * 6 * dt;
    this.camera.position.y += (targetCamY - this.camera.position.y) * 6 * dt;
    this.camera.position.z += (targetCamZ - this.camera.position.z) * 6 * dt;
    this.camera.lookAt(this.player.x, 0.5, this.player.z);

    // Orbiting Orbs 3D
    if (this.player.orbitingOrbs > 0) {
      const orbAngleSpeed = Date.now() / 350;
      const orbDist = 3.6;
      this.orbitingMeshList.forEach((mesh, idx) => {
        const a = orbAngleSpeed + (idx * Math.PI * 2) / this.player.orbitingOrbs;
        const ox = this.player.x + Math.sin(a) * orbDist;
        const oz = this.player.z + Math.cos(a) * orbDist;
        mesh.position.set(ox, 1.2, oz);

        this.enemies.forEach(e => {
          if (Math.hypot(e.x - ox, e.z - oz) <= e.radius + 0.6) {
            e.hp -= 40 * dt;
            if (e.hp <= 0 && !e.dead) this.handleEnemyDefeated(e);
          }
        });
      });
    }

    // Auto-Targeting & Shooting
    this.player.shootTimer += dt;
    if (this.player.shootTimer >= this.player.attackRate) {
      let nearest = null;
      let minDist = this.player.bulletRange;
      for (const e of this.enemies) {
        const d = Math.hypot(e.x - this.player.x, e.z - this.player.z);
        if (d < minDist) {
          minDist = d;
          nearest = e;
        }
      }
      if (nearest) {
        this.player.shootTimer = 0;
        this.fireProjectiles3D(nearest);
      }
    }

    // Update Projectiles 3D
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.z += p.vz * dt;
      p.dist += p.speed * dt;
      p.mesh.position.set(p.x, 1.0, p.z);

      let hit = false;
      for (const e of this.enemies) {
        if (Math.hypot(p.x - e.x, p.z - e.z) <= e.radius + 0.4) {
          hit = true;
          const isCrit = Math.random() < this.player.critChance;
          const finalDmg = isCrit ? p.damage * 2 : p.damage;
          e.hp -= finalDmg;
          this.audio.playHit();
          if (e.hp <= 0 && !e.dead) this.handleEnemyDefeated(e);
          break;
        }
      }

      if (hit || p.dist >= p.maxRange) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.projectiles.splice(i, 1);
      }
    }

    // Update Enemies 3D
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.dead) {
        this.enemies.splice(i, 1);
        continue;
      }

      if (e.frozenTimer > 0) {
        e.frozenTimer -= dt;
        continue;
      }

      const dx = this.player.x - e.x;
      const dz = this.player.z - e.z;
      const dist = Math.hypot(dx, dz);

      if (dist > 0) {
        const nx = dx / dist;
        const nz = dz / dist;
        e.x += nx * e.speed * dt;
        e.z += nz * e.speed * dt;
        e.mesh.position.set(e.x, e.type === 'boss' ? 3.0 : 1.0, e.z);
        e.mesh.rotation.y = Math.atan2(nx, nz);
      }

      if (dist <= this.player.radius + e.radius) {
        if (this.player.invulnerableTimer <= 0) {
          let dmg = e.type === 'boss' ? 30 : 12;
          if (this.player.shieldActive) dmg = Math.round(dmg * 0.1);

          this.player.hp -= dmg;
          this.player.invulnerableTimer = 0.5;
          this.audio.playHit();

          if (this.player.hp <= 0) {
            this.emitGameOver();
            return;
          }
        }
      }
    }

    // Items Vacuum and Pickup
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      const d = Math.hypot(it.x - this.player.x, it.z - this.player.z);

      if (d < this.player.magnetRadius) {
        const pull = 22 * dt;
        it.x += ((this.player.x - it.x) / d) * pull;
        it.z += ((this.player.z - it.z) / d) * pull;
        it.mesh.position.set(it.x, 0.6, it.z);
      }

      if (d <= this.player.radius + it.radius) {
        this.player.xp += it.val;
        this.audio.playScore();
        this.scene.remove(it.mesh);
        it.mesh.geometry.dispose();
        it.mesh.material.dispose();
        this.items.splice(i, 1);

        if (this.player.xp >= this.player.xpNeeded) {
          this.player.xp -= this.player.xpNeeded;
          this.player.level++;
          this.player.xpNeeded = Math.round(this.player.xpNeeded * 1.35);
          this.showLevelUpModal();
        }
      }
    }

    // Particles 3D Update
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.mesh && p.mesh.material && p.mesh.material.opacity) {
        p.mesh.material.opacity = Math.max(0, p.life / p.maxLife);
      }
      if (p.vy) {
        p.vy -= 18 * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.z += p.vz * dt;
      }
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.particles.splice(i, 1);
      }
    }

    // Waves Spawning
    this.waveTimeLeft -= dt;
    if (this.waveTimeLeft <= 0) {
      this.wave++;
      this.waveTimeLeft = 30;
      this.spawnInterval = Math.max(0.4, 1.0 - this.wave * 0.08);
      this.audio.playVictory();

      if (this.wave === 3 || this.wave % 5 === 0) {
        this.spawnBoss();
      }
    }

    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      if (this.enemies.length < 45) {
        this.spawnEnemy();
      }
    }

    this.updateHUD();

    // Render 3D Frame
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }

    this.renderMinimap();
  }

  fireProjectiles3D(target) {
    const angle = Math.atan2(target.x - this.player.x, target.z - this.player.z);
    const count = this.player.multishot;
    const spread = 0.16;
    const startAngle = angle - ((count - 1) * spread) / 2;

    const boltGeo = new THREE.SphereGeometry(0.35, 6, 6);
    const boltMat = new THREE.MeshBasicMaterial({ color: this.charConfig.bulletColor });

    for (let i = 0; i < count; i++) {
      const bAngle = startAngle + i * spread;
      const mesh = new THREE.Mesh(boltGeo, boltMat);
      mesh.position.set(this.player.x, 1.0, this.player.z);
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

  renderMinimap() {
    this.minimapCtx.clearRect(0, 0, 75, 75);
    const scale = 75 / this.arenaSize;
    const offset = 37.5;

    this.minimapCtx.strokeStyle = 'rgba(255,255,255,0.2)';
    this.minimapCtx.strokeRect(0, 0, 75, 75);

    this.minimapCtx.fillStyle = '#ef4444';
    this.enemies.forEach(e => {
      this.minimapCtx.fillRect(offset + e.x * scale - 1, offset + e.z * scale - 1, e.type === 'boss' ? 4 : 2, e.type === 'boss' ? 4 : 2);
    });

    this.minimapCtx.fillStyle = '#eab308';
    this.minimapCtx.beginPath();
    this.minimapCtx.arc(offset + this.player.x * scale, offset + this.player.z * scale, 2.5, 0, Math.PI * 2);
    this.minimapCtx.fill();
  }

  updateHUD() {
    if (this.levelBadge && this.player) this.levelBadge.textContent = `LV ${this.player.level}`;
    if (this.coinsText && this.player) this.coinsText.textContent = `🪙 ${this.player.coins}`;
    if (this.waveNumEl) this.waveNumEl.textContent = this.wave;
    if (this.waveTimerEl) this.waveTimerEl.textContent = Math.ceil(this.waveTimeLeft);

    if (this.player) {
      const expPercent = Math.min(100, (this.player.xp / this.player.xpNeeded) * 100);
      if (this.expFill) this.expFill.style.width = `${expPercent}%`;

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

    if (this.currentBoss && this.currentBoss.hp > 0) {
      this.bossBar.style.display = 'flex';
      const pct = Math.max(0, (this.currentBoss.hp / this.currentBoss.maxHp) * 100);
      this.bossFill.style.width = `${pct}%`;
    } else {
      this.bossBar.style.display = 'none';
    }
  }

  handleResize() {
    if (!this.renderer || !this.camera || !this.webglContainer) return;
    const rect = this.container.getBoundingClientRect();
    const stageWidth = Math.max(340, Math.min(rect.width > 200 ? rect.width - 20 : 880, 960));
    const stageHeight = Math.max(380, Math.min(rect.height > 200 ? rect.height - 30 : 580, 620));

    const wrapper = this.container.querySelector('.zappets-wrapper');
    if (wrapper) {
      wrapper.style.width = `${stageWidth}px`;
      wrapper.style.height = `${stageHeight}px`;
    }
    this.webglContainer.style.width = `${stageWidth}px`;
    this.webglContainer.style.height = `${stageHeight}px`;

    this.camera.aspect = stageWidth / stageHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(stageWidth, stageHeight);
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
  }
}
