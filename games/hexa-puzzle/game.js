/**
 * game.js
 * Hexa Rune: Alchemy Fusion (Hexagonal Block & Chain Fusion Puzzle)
 * Main Game Controller extending BaseGame.
 */

import { BaseGame } from '../../src/core/BaseGame.js';
import { HexGrid } from './engine/HexGrid.js';
import { PieceGenerator, Piece } from './engine/PieceGenerator.js';
import { FXManager } from './engine/FXManager.js';
import { SynthAudio } from './audio/SynthAudio.js';
import { LEVELS, getLevelById } from './data/levels.js';
import { ELEMENTS, TIERS } from './data/elements.js';

export default class HexaPuzzleGame extends BaseGame {
  init() {
    this.canvasWidth = 800;
    this.canvasHeight = 520;

    this.currentLevelId = 1;
    this.level = getLevelById(1);
    this.movesLeft = this.level.moves;
    this.score = 0;
    this.unlockedLevels = 1;
    this.levelStars = {}; // { 1: 3, 2: 2, ... }
    this.hammerCount = 2;
    this.isHammerMode = false;

    this.selectedSlotIndex = null;
    this.hoverAxial = null;
    this.moveHistory = []; // For Undo functionality

    // Load persistent progress
    this._loadSavedProgress();

    // DOM Setup
    this.container.innerHTML = `
      <div class="hp-wrapper" style="position:relative; width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:flex-start; overflow:hidden; user-select:none; font-family:'Outfit',sans-serif; color:#f8fafc; background:#0a071b;">
        
        <!-- Top HUD -->
        <div class="hp-top-hud" style="width:100%; max-width:840px; display:flex; justify-content:space-between; align-items:center; padding:8px 16px; background:rgba(18,12,38,0.9); backdrop-filter:blur(10px); border-bottom:1px solid rgba(139,92,246,0.3); z-index:20;">
          <div style="display:flex; align-items:center; gap:12px;">
            <button id="hp-btn-levels" style="background:#1e1442; border:1px solid rgba(139,92,246,0.5); color:#c4b5fd; border-radius:8px; padding:5px 12px; font-weight:700; font-size:0.85rem; cursor:pointer; display:flex; align-items:center; gap:6px;">
              🗺️ Màn <span id="hp-lvl-num">1</span>
            </button>
            <div style="font-weight:800; font-size:1.0rem; color:#f8fafc;" id="hp-lvl-title">
              Lửa Đầu Tiên
            </div>
            <div style="font-weight:700; font-size:0.95rem; color:#fbbf24; display:flex; align-items:center; gap:4px;">
              ✨ <span id="hp-score">0</span>
            </div>
          </div>

          <div style="display:flex; align-items:center; gap:12px;">
            <!-- Moves Left Badge -->
            <div style="background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.4); border-radius:8px; padding:4px 10px; font-weight:800; font-size:0.95rem; color:#f87171;" id="hp-moves-badge">
              ⏳ Lượt đi: <span id="hp-moves-left">14</span>
            </div>

            <!-- Stars Progress -->
            <div id="hp-stars-hud" style="font-size:1.1rem; letter-spacing:2px; color:#475569;">
              <span id="hp-star-1">★</span><span id="hp-star-2">★</span><span id="hp-star-3">★</span>
            </div>
          </div>
        </div>

        <!-- Objective Tracker Bar -->
        <div style="width:100%; max-width:840px; display:flex; justify-content:space-between; align-items:center; padding:5px 16px; background:rgba(26,18,54,0.7); border-bottom:1px solid rgba(255,255,255,0.06); font-size:0.85rem; z-index:15;">
          <div style="color:#cbd5e1; display:flex; align-items:center; gap:8px;">
            <b style="color:#c4b5fd;">🎯 Mục Tiêu:</b>
            <span id="hp-objective-text">Hợp nhất tạo ra 2 Khối Hỏa cấp II</span>
          </div>
          <div id="hp-objective-progress" style="font-weight:700; color:#34d399;">
            0 / 2
          </div>
        </div>

        <!-- Viewport & Canvas -->
        <div class="hp-viewport" style="position:relative; width:100%; flex:1; display:flex; align-items:center; justify-content:center; padding:4px;">
          <canvas id="hp-canvas" width="800" height="420" style="display:block; max-width:100%; max-height:100%; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.8); cursor:pointer; background:#0d0924;"></canvas>

          <!-- Level Select Modal (Overlay) -->
          <div id="hp-levels-modal" style="display:none; position:absolute; width:92%; max-width:560px; background:rgba(18,12,38,0.96); backdrop-filter:blur(14px); border:1px solid rgba(139,92,246,0.5); border-radius:18px; padding:20px; box-shadow:0 14px 45px rgba(0,0,0,0.9); z-index:40;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
              <div style="font-weight:800; font-size:1.2rem; color:#c4b5fd;">
                🗺️ Chọn Màn Chơi (Levels)
              </div>
              <button id="hp-levels-close" style="background:transparent; border:none; color:#94a3b8; font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <div id="hp-levels-grid" style="display:grid; grid-template-columns:repeat(4, 1fr); gap:10px; max-height:340px; overflow-y:auto; padding:4px;">
              <!-- Generated dynamically -->
            </div>
          </div>

          <!-- Victory Modal (Overlay) -->
          <div id="hp-victory-modal" style="display:none; position:absolute; width:90%; max-width:440px; background:rgba(18,12,38,0.97); backdrop-filter:blur(16px); border:2px solid #10b981; border-radius:18px; padding:24px; box-shadow:0 14px 45px rgba(0,0,0,0.9); text-align:center; z-index:45;">
            <div style="font-size:2.8rem; margin-bottom:4px;">🎉</div>
            <div style="font-weight:900; font-size:1.4rem; color:#34d399; margin-bottom:4px;">HOÀN THÀNH MÀN CHƠI!</div>
            <div id="hp-vic-stars" style="font-size:2.0rem; color:#fbbf24; margin-bottom:10px; letter-spacing:4px;">★★★</div>
            <div style="font-size:0.95rem; color:#cbd5e1; margin-bottom:14px;" id="hp-vic-msg">
              Xuất sắc! Bạn đã giải mã thành công trận pháp cổ thuật!
            </div>
            <div style="background:rgba(255,255,255,0.06); border-radius:10px; padding:10px; font-size:0.9rem; margin-bottom:16px;">
              <div>Điểm số: <b id="hp-vic-score" style="color:#fbbf24;">0</b></div>
              <div>Lượt đi còn dư: <b id="hp-vic-moves" style="color:#38bdf8;">0</b></div>
            </div>
            <div style="display:flex; gap:10px; justify-content:center;">
              <button id="hp-btn-next-lvl" style="background:linear-gradient(135deg, #10b981, #059669); color:#fff; border:none; border-radius:10px; padding:10px 22px; font-weight:800; font-size:0.95rem; cursor:pointer; box-shadow:0 0 14px rgba(16,185,129,0.4);">
                Tiếp Tục ▶
              </button>
              <button id="hp-btn-replay-vic" style="background:#1e1442; border:1px solid rgba(255,255,255,0.2); color:#cbd5e1; border-radius:10px; padding:10px 16px; font-weight:700; font-size:0.9rem; cursor:pointer;">
                Chơi Lại 🔄
              </button>
            </div>
          </div>

          <!-- Game Over Modal (Overlay) -->
          <div id="hp-defeat-modal" style="display:none; position:absolute; width:90%; max-width:440px; background:rgba(18,12,38,0.97); backdrop-filter:blur(16px); border:2px solid #ef4444; border-radius:18px; padding:24px; box-shadow:0 14px 45px rgba(0,0,0,0.9); text-align:center; z-index:45;">
            <div style="font-size:2.8rem; margin-bottom:4px;">⏳</div>
            <div style="font-weight:900; font-size:1.4rem; color:#f87171; margin-bottom:6px;">HẾT LƯỢT ĐI!</div>
            <div style="font-size:0.9rem; color:#cbd5e1; margin-bottom:16px;">
              Bạn đã sử dụng hết lượt đi mà chưa hoàn thành mục tiêu. Hãy tính toán lại các phản ứng chuỗi!
            </div>
            <div style="display:flex; gap:10px; justify-content:center;">
              <button id="hp-btn-retry-def" style="background:linear-gradient(135deg, #ef4444, #dc2626); color:#fff; border:none; border-radius:10px; padding:10px 20px; font-weight:800; font-size:0.95rem; cursor:pointer; box-shadow:0 0 14px rgba(239,68,68,0.4);">
                Thử Lại 🔄
              </button>
              <button id="hp-btn-undo-def" style="background:#1e1442; border:1px solid rgba(139,92,246,0.5); color:#c4b5fd; border-radius:10px; padding:10px 16px; font-weight:700; font-size:0.9rem; cursor:pointer;">
                Hoàn Tác ↩️
              </button>
            </div>
          </div>

        </div>

        <!-- Bottom Controls & Waiting Pieces Area -->
        <div style="width:100%; max-width:840px; display:flex; justify-content:space-between; align-items:center; padding:8px 16px; background:rgba(18,12,38,0.9); border-top:1px solid rgba(139,92,246,0.3); z-index:20;">
          <!-- Tools: Undo, Hammer, Rotate -->
          <div style="display:flex; align-items:center; gap:8px;">
            <button id="hp-btn-undo" title="Hoàn tác lượt đi vừa rồi" style="background:#1e1442; border:1px solid rgba(255,255,255,0.15); color:#cbd5e1; border-radius:8px; padding:6px 12px; font-weight:700; font-size:0.8rem; cursor:pointer;">
              ↩️ Hoàn Tác
            </button>
            <button id="hp-btn-hammer" title="Búa ma thuật: Đập vỡ 1 ô bất kỳ" style="background:#78350f; border:1px solid #f59e0b; color:#fbbf24; border-radius:8px; padding:6px 12px; font-weight:700; font-size:0.8rem; cursor:pointer;">
              🔨 Búa (<span id="hp-hammer-count">2</span>)
            </button>
            <button id="hp-btn-rotate" title="Xoay khối đôi đang chọn (Space)" style="background:#311b92; border:1px solid #7c3aed; color:#c4b5fd; border-radius:8px; padding:6px 12px; font-weight:700; font-size:0.8rem; cursor:pointer;">
              🔄 Xoay
            </button>
          </div>

          <!-- Waiting Pieces Slots Indicator -->
          <div id="hp-piece-slots" style="display:flex; align-items:center; gap:14px;">
            <!-- Rendered onto canvas or interactive buttons -->
            <div style="font-size:0.8rem; color:#94a3b8; font-style:italic;">
              Click ô để chọn khối | Nhấn Space để xoay
            </div>
          </div>
        </div>

      </div>
    `;

    // Elements
    this.canvas = this.container.querySelector('#hp-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.lvlNumEl = this.container.querySelector('#hp-lvl-num');
    this.lvlTitleEl = this.container.querySelector('#hp-lvl-title');
    this.scoreEl = this.container.querySelector('#hp-score');
    this.movesEl = this.container.querySelector('#hp-moves-left');
    this.objTextEl = this.container.querySelector('#hp-objective-text');
    this.objProgEl = this.container.querySelector('#hp-objective-progress');
    this.hammerCountEl = this.container.querySelector('#hp-hammer-count');
    this.levelsModal = this.container.querySelector('#hp-levels-modal');
    this.victoryModal = this.container.querySelector('#hp-victory-modal');
    this.defeatModal = this.container.querySelector('#hp-defeat-modal');

    // Engine Systems
    this.synthAudio = new SynthAudio();
    this.fx = new FXManager();
    this.pieceGen = new PieceGenerator();
    this.grid = new HexGrid(this.level.radius, 32, 400, 185);

    // Bind Controls & Initialize Level
    this._bindControls();
    this.loadLevel(this.currentLevelId);
  }

  _loadSavedProgress() {
    try {
      if (this.storage && typeof this.storage.getItem === 'function') {
        const savedUnlocks = this.storage.getItem('hex_unlocked_levels');
        if (savedUnlocks) this.unlockedLevels = parseInt(savedUnlocks, 10) || 1;

        const savedStars = this.storage.getItem('hex_level_stars');
        if (savedStars) this.levelStars = JSON.parse(savedStars);
      }
    } catch (_) {}
  }

  _saveProgress() {
    try {
      if (this.storage && typeof this.storage.setItem === 'function') {
        this.storage.setItem('hex_unlocked_levels', this.unlockedLevels.toString());
        this.storage.setItem('hex_level_stars', JSON.stringify(this.levelStars));
      }
    } catch (_) {}
  }

  loadLevel(levelId) {
    this.currentLevelId = levelId;
    this.level = getLevelById(levelId);
    this.movesLeft = this.level.moves;
    this.score = 0;
    this.moveHistory = [];
    this.isHammerMode = false;
    this.selectedSlotIndex = null;
    this.hoverAxial = null;

    // Reset grid with level radius & obstacles
    const hexSize = this.level.radius === 3 ? 27 : 33;
    const centerY = this.level.radius === 3 ? 180 : 185;
    this.grid = new HexGrid(this.level.radius, hexSize, 400, centerY);

    // Populate level obstacles
    if (Array.isArray(this.level.obstacles)) {
      for (const obs of this.level.obstacles) {
        const cell = this.grid.getCell(obs.q, obs.r);
        if (cell) {
          cell.obstacle = { type: obs.type, hp: obs.hp || 1 };
        }
      }
    }

    // Generate new piece slots
    this.pieceGen.reset();
    this.pieceGen.generateSlotPieces(this.level.allowedElements);
    this.selectedSlotIndex = 0; // Auto-select first piece

    // Close modals
    if (this.levelsModal) this.levelsModal.style.display = 'none';
    if (this.victoryModal) this.victoryModal.style.display = 'none';
    if (this.defeatModal) this.defeatModal.style.display = 'none';

    this.updateHUD();
  }

  _bindControls() {
    // 1. Mouse move on canvas (Hex Hover & Waiting Pieces Hover)
    const onPointerMove = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const px = (e.clientX - rect.left) * scaleX;
      const py = (e.clientY - rect.top) * scaleY;

      // Check if mouse is over board area
      if (py < 340) {
        this.hoverAxial = this.grid.pixelToAxial(px, py);
      } else {
        this.hoverAxial = null;
      }
    };

    // 2. Mouse click on canvas (Place Piece or Select Slot or Use Hammer)
    const onPointerDown = (e) => {
      this.synthAudio.ensureContext();
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const px = (e.clientX - rect.left) * scaleX;
      const py = (e.clientY - rect.top) * scaleY;

      // If clicked on bottom waiting piece slots area (py >= 340)
      if (py >= 340) {
        const slotWidth = 140;
        const startX = (this.canvasWidth - slotWidth * 3) / 2;
        for (let i = 0; i < 3; i++) {
          const sx = startX + i * slotWidth;
          if (px >= sx && px <= sx + slotWidth && py >= 345 && py <= 415) {
            if (this.selectedSlotIndex === i) {
              // Clicked same slot again -> Rotate piece if duo!
              const currentPiece = this.pieceGen.slots[i];
              if (currentPiece && currentPiece.isDuo) {
                currentPiece.rotate();
                this.synthAudio.playPlace();
                this.fx.addFloatingText('XOAY 60° 🔄', px, py - 20, '#c4b5fd', 15);
              }
            } else if (this.pieceGen.slots[i]) {
              this.selectedSlotIndex = i;
              this.synthAudio.playPlace();
            }
            return;
          }
        }
      }

      // If clicked on board
      if (py < 340) {
        const axial = this.grid.pixelToAxial(px, py);

        // Hammer Mode
        if (this.isHammerMode) {
          const cell = this.grid.getCell(axial.q, axial.r);
          if (cell && (cell.rune || cell.obstacle)) {
            cell.rune = null;
            cell.obstacle = null;
            this.hammerCount--;
            this.isHammerMode = false;
            this.synthAudio.playHammer();
            this.fx.createIceBreakSparks(cell.x, cell.y);
            this.fx.addFloatingText('ĐẬP VỠ! 🔨', cell.x, cell.y - 20, '#f59e0b', 20);
            this.fx.triggerScreenShake(7, 0.3);
            this.updateHUD();
          }
          return;
        }

        // Standard Placement
        if (this.selectedSlotIndex !== null) {
          const piece = this.pieceGen.slots[this.selectedSlotIndex];
          if (piece) {
            this.attemptPlacePiece(piece, axial.q, axial.r, this.selectedSlotIndex);
          }
        }
      }
    };

    this.addTrackedEventListener(this.canvas, 'pointermove', onPointerMove);
    this.addTrackedEventListener(this.canvas, 'pointerdown', onPointerDown);

    // 3. Keyboard (Space to rotate, U to undo, H for hammer)
    const onKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.rotateSelectedPiece();
      } else if (e.key === 'u' || e.key === 'U') {
        this.undoMove();
      } else if (e.key === 'h' || e.key === 'H') {
        this.toggleHammerMode();
      }
    };
    this.addTrackedEventListener(window, 'keydown', onKeyDown);

    // 4. Buttons
    const btnLevels = this.container.querySelector('#hp-btn-levels');
    if (btnLevels) this.addTrackedEventListener(btnLevels, 'click', () => this.toggleLevelsModal(true));

    const btnLevelsClose = this.container.querySelector('#hp-levels-close');
    if (btnLevelsClose) this.addTrackedEventListener(btnLevelsClose, 'click', () => this.toggleLevelsModal(false));

    const btnUndo = this.container.querySelector('#hp-btn-undo');
    if (btnUndo) this.addTrackedEventListener(btnUndo, 'click', () => this.undoMove());

    const btnHammer = this.container.querySelector('#hp-btn-hammer');
    if (btnHammer) this.addTrackedEventListener(btnHammer, 'click', () => this.toggleHammerMode());

    const btnRotate = this.container.querySelector('#hp-btn-rotate');
    if (btnRotate) this.addTrackedEventListener(btnRotate, 'click', () => this.rotateSelectedPiece());

    const btnNextLvl = this.container.querySelector('#hp-btn-next-lvl');
    if (btnNextLvl) this.addTrackedEventListener(btnNextLvl, 'click', () => {
      const nextId = Math.min(LEVELS.length, this.currentLevelId + 1);
      this.loadLevel(nextId);
    });

    const btnReplayVic = this.container.querySelector('#hp-btn-replay-vic');
    if (btnReplayVic) this.addTrackedEventListener(btnReplayVic, 'click', () => this.loadLevel(this.currentLevelId));

    const btnRetryDef = this.container.querySelector('#hp-btn-retry-def');
    if (btnRetryDef) this.addTrackedEventListener(btnRetryDef, 'click', () => this.loadLevel(this.currentLevelId));

    const btnUndoDef = this.container.querySelector('#hp-btn-undo-def');
    if (btnUndoDef) this.addTrackedEventListener(btnUndoDef, 'click', () => {
      if (this.defeatModal) this.defeatModal.style.display = 'none';
      this.undoMove();
    });
  }

  rotateSelectedPiece() {
    if (this.selectedSlotIndex !== null) {
      const piece = this.pieceGen.slots[this.selectedSlotIndex];
      if (piece && piece.isDuo) {
        piece.rotate();
        this.synthAudio.playPlace();
      }
    }
  }

  toggleHammerMode() {
    if (this.hammerCount <= 0) {
      this.fx.addFloatingText('HẾT BÚA MA THUẬT!', 400, 300, '#ef4444', 18);
      return;
    }
    this.isHammerMode = !this.isHammerMode;
    const msg = this.isHammerMode ? 'CHỌN 1 Ô ĐỂ PHÁ HỦY! 🔨' : 'ĐÃ TẮT BÚA';
    this.fx.addFloatingText(msg, 400, 280, '#f59e0b', 18);
    this.updateHUD();
  }

  toggleLevelsModal(show) {
    if (this.levelsModal) {
      this.levelsModal.style.display = show ? 'block' : 'none';
      if (show) this._renderLevelsGrid();
    }
  }

  _renderLevelsGrid() {
    const gridEl = this.container.querySelector('#hp-levels-grid');
    if (!gridEl) return;

    gridEl.innerHTML = LEVELS.map(lvl => {
      const isUnlocked = lvl.id <= this.unlockedLevels;
      const isCurrent = lvl.id === this.currentLevelId;
      const stars = this.levelStars[lvl.id] || 0;
      let starStr = '';
      for (let s = 1; s <= 3; s++) starStr += s <= stars ? '★' : '☆';

      const bg = isCurrent ? '#311b92' : (isUnlocked ? '#1e1442' : '#0f0a21');
      const border = isCurrent ? '2px solid #8b5cf6' : '1px solid rgba(255,255,255,0.1)';
      const opacity = isUnlocked ? '1' : '0.45';

      return `
        <div class="hp-lvl-card" data-lvl="${lvl.id}" style="background:${bg}; border:${border}; opacity:${opacity}; border-radius:12px; padding:10px; text-align:center; cursor:${isUnlocked ? 'pointer' : 'not-allowed'}; transition:all 0.2s ease;">
          <div style="font-weight:800; font-size:1.0rem; color:${isCurrent ? '#c4b5fd' : '#f8fafc'};">
            ${isUnlocked ? `Màn ${lvl.id}` : '🔒'}
          </div>
          <div style="font-size:0.75rem; color:#94a3b8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
            ${lvl.title}
          </div>
          <div style="font-size:0.85rem; color:#fbbf24; margin-top:4px;">
            ${starStr}
          </div>
        </div>
      `;
    }).join('');

    if (typeof gridEl.querySelectorAll === 'function') {
      gridEl.querySelectorAll('.hp-lvl-card').forEach(card => {
        card.addEventListener('click', () => {
          const lvlId = parseInt(card.dataset.lvl, 10);
          if (lvlId <= this.unlockedLevels) {
            this.loadLevel(lvlId);
          }
        });
      });
    }
  }

  attemptPlacePiece(piece, q, r, slotIndex) {
    const coords = piece.getPlacementCoords(q, r);
    const canPlaceAll = coords.every(c => this.grid.canPlace(c.q, c.r));

    if (!canPlaceAll) {
      this.synthAudio.playDefeat();
      this.fx.addFloatingText('VỊ TRÍ KHÔNG HỢP LỆ!', 400, 200, '#ef4444', 16);
      return false;
    }

    // Save state for UNDO before modifying
    this.saveUndoState();

    // Place all runes of the piece
    coords.forEach((c, idx) => {
      this.grid.placeRune(c.q, c.r, piece.runes[idx]);
      this.synthAudio.playPlace();
    });

    this.pieceGen.consumeSlot(slotIndex);
    this.movesLeft--;

    // Process merges starting from placed coordinates
    let mergeScore = 0;
    coords.forEach(c => {
      const res = this.grid.processMerges(c.q, c.r, this.fx, this.synthAudio);
      if (res.merged) {
        mergeScore += res.totalScore;
      }
    });

    this.score += mergeScore + 10;
    this.emitScore(this.score);

    // If all 3 slots empty, deal next set of 3 pieces!
    if (this.pieceGen.hasEmptySlots()) {
      this.pieceGen.generateSlotPieces(this.level.allowedElements);
    }

    // Auto select next available piece
    this.selectedSlotIndex = this.pieceGen.slots.findIndex(s => s !== null);

    this.updateHUD();

    // Check Victory & Defeat Conditions
    this.checkGameConditions();

    return true;
  }

  saveUndoState() {
    const cellsCopy = new Map();
    for (const [k, v] of this.grid.cells.entries()) {
      cellsCopy.set(k, {
        q: v.q,
        r: v.r,
        x: v.x,
        y: v.y,
        rune: v.rune ? { ...v.rune } : null,
        obstacle: v.obstacle ? { ...v.obstacle } : null
      });
    }

    this.moveHistory.push({
      cells: cellsCopy,
      movesLeft: this.movesLeft,
      score: this.score,
      slots: this.pieceGen.slots.map(s => s ? new Piece(s.id, [...s.runes], s.isDuo) : null),
      selectedSlotIndex: this.selectedSlotIndex
    });

    if (this.moveHistory.length > 5) this.moveHistory.shift();
  }

  undoMove() {
    if (this.moveHistory.length === 0) {
      this.fx.addFloatingText('KHÔNG CÓ LƯỢT ĐỂ HOÀN TÁC!', 400, 260, '#ef4444', 16);
      return;
    }

    const prev = this.moveHistory.pop();
    this.grid.cells = prev.cells;
    this.movesLeft = prev.movesLeft;
    this.score = prev.score;
    this.pieceGen.slots = prev.slots;
    this.selectedSlotIndex = prev.selectedSlotIndex;

    this.synthAudio.playPlace();
    this.fx.addFloatingText('ĐÃ HOÀN TÁC! ↩️', 400, 240, '#c4b5fd', 18);
    this.updateHUD();
  }

  checkGameConditions() {
    const obj = this.level.objective;
    let isWon = false;

    if (obj.type === 'merge_tier') {
      // Count runes matching element & targetTier
      let count = 0;
      for (const cell of this.grid.cells.values()) {
        if (cell.rune && cell.rune.element === obj.element && cell.rune.tier >= obj.targetTier) {
          count++;
        }
      }
      if (count >= obj.count) isWon = true;
    } else if (obj.type === 'clear_ice') {
      const remainingIce = this.grid.countIce();
      if (remainingIce === 0) isWon = true;
    } else if (obj.type === 'score') {
      if (this.score >= obj.targetScore) isWon = true;
    } else if (obj.type === 'prism') {
      let count = 0;
      for (const cell of this.grid.cells.values()) {
        if (cell.rune && cell.rune.element === 'prism') count++;
      }
      if (count >= obj.count) isWon = true;
    } else if (obj.type === 'score_and_tier') {
      let tierCount = 0;
      for (const cell of this.grid.cells.values()) {
        if (cell.rune && cell.rune.element === obj.element && cell.rune.tier >= obj.targetTier) tierCount++;
      }
      if (tierCount >= obj.count && this.score >= obj.targetScore) isWon = true;
    } else if (obj.type === 'dual_merge') {
      let hasA = false;
      let hasB = false;
      for (const cell of this.grid.cells.values()) {
        if (cell.rune && cell.rune.element === obj.elemA && cell.rune.tier >= obj.tierA) hasA = true;
        if (cell.rune && cell.rune.element === obj.elemB && cell.rune.tier >= obj.tierB) hasB = true;
      }
      if (hasA && hasB) isWon = true;
    }

    if (isWon) {
      this.handleVictory();
      return;
    }

    // Check Defeat (Out of moves)
    if (this.movesLeft <= 0) {
      this.handleDefeat();
    }
  }

  handleVictory() {
    this.synthAudio.playVictory();
    this.fx.spawnVictoryConfetti(this.canvasWidth, this.canvasHeight);

    // Calculate stars earned based on moves left
    let stars = 1;
    if (this.movesLeft >= this.level.starMovesLeft[2]) stars = 3;
    else if (this.movesLeft >= this.level.starMovesLeft[1]) stars = 2;

    const currentBestStars = this.levelStars[this.currentLevelId] || 0;
    if (stars > currentBestStars) {
      this.levelStars[this.currentLevelId] = stars;
    }

    // Unlock next level
    if (this.currentLevelId === this.unlockedLevels && this.unlockedLevels < LEVELS.length) {
      this.unlockedLevels++;
    }
    this._saveProgress();

    if (this.victoryModal) {
      const starStr = '★'.repeat(stars) + '☆'.repeat(3 - stars);
      const starsEl = this.container.querySelector('#hp-vic-stars');
      const scoreEl = this.container.querySelector('#hp-vic-score');
      const movesEl = this.container.querySelector('#hp-vic-moves');

      if (starsEl) starsEl.textContent = starStr;
      if (scoreEl) scoreEl.textContent = this.score;
      if (movesEl) movesEl.textContent = this.movesLeft;

      this.victoryModal.style.display = 'block';
    }
  }

  handleDefeat() {
    this.synthAudio.playDefeat();
    if (this.defeatModal) {
      this.defeatModal.style.display = 'block';
    }

    // MANDATORY STATIC METHOD: Must call emitGameOver()!
    this.emitGameOver(this.score);
  }

  updateHUD() {
    if (this.lvlNumEl) this.lvlNumEl.textContent = this.currentLevelId;
    if (this.lvlTitleEl) this.lvlTitleEl.textContent = this.level.title;
    if (this.scoreEl) this.scoreEl.textContent = this.score;
    if (this.movesEl) this.movesEl.textContent = this.movesLeft;
    if (this.hammerCountEl) this.hammerCountEl.textContent = this.hammerCount;

    if (this.objTextEl) this.objTextEl.textContent = this.level.objective.description;

    // Update objective progress text
    if (this.objProgEl) {
      const obj = this.level.objective;
      if (obj.type === 'merge_tier') {
        let count = 0;
        for (const cell of this.grid.cells.values()) {
          if (cell.rune && cell.rune.element === obj.element && cell.rune.tier >= obj.targetTier) count++;
        }
        this.objProgEl.textContent = `${count} / ${obj.count}`;
      } else if (obj.type === 'clear_ice') {
        const remainingIce = this.grid.countIce();
        this.objProgEl.textContent = `Còn lại: ${remainingIce}`;
      } else if (obj.type === 'score') {
        this.objProgEl.textContent = `${this.score} / ${obj.targetScore}`;
      } else if (obj.type === 'prism') {
        let count = 0;
        for (const cell of this.grid.cells.values()) {
          if (cell.rune && cell.rune.element === 'prism') count++;
        }
        this.objProgEl.textContent = `${count} / ${obj.count}`;
      }
    }

    // Update Stars in HUD
    for (let s = 1; s <= 3; s++) {
      const starSpan = this.container.querySelector(`#hp-star-${s}`);
      if (starSpan) {
        const threshold = this.level.starMovesLeft[s - 1];
        starSpan.style.color = this.movesLeft >= threshold ? '#fbbf24' : '#475569';
      }
    }
  }

  start() {
    super.start();
    this.loadLevel(this.currentLevelId);
    this.startLoop(this.ctx);
  }

  restart() {
    this.loadLevel(this.currentLevelId);
  }

  update(dt) {
    if (this.isPaused) return;
    this.fx.update(dt);
  }

  render(ctx) {
    if (!ctx) return;

    ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    // Apply Screen Shake
    const shake = this.fx.getShakeOffset();
    ctx.save();
    ctx.translate(shake.x, shake.y);

    // 1. Draw Hexagonal Grid & Hover Preview
    const selectedPiece = this.selectedSlotIndex !== null ? this.pieceGen.slots[this.selectedSlotIndex] : null;
    this.grid.render(ctx, selectedPiece, this.hoverAxial);

    // 2. Draw Bottom Waiting Pieces Area
    this.renderWaitingSlots(ctx);

    // 3. Render Particles & Floating Texts
    this.fx.render(ctx);

    ctx.restore();
  }

  renderWaitingSlots(ctx) {
    const slotWidth = 140;
    const startX = (this.canvasWidth - slotWidth * 3) / 2;
    const slotY = 350;
    const slotHeight = 60;

    for (let i = 0; i < 3; i++) {
      const sx = startX + i * slotWidth;
      const isSelected = this.selectedSlotIndex === i;
      const piece = this.pieceGen.slots[i];

      ctx.save();
      // Slot Plate
      ctx.fillStyle = isSelected ? 'rgba(139, 92, 246, 0.28)' : 'rgba(255, 255, 255, 0.04)';
      ctx.strokeStyle = isSelected ? '#8b5cf6' : 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.beginPath();
      ctx.roundRect(sx + 4, slotY, slotWidth - 8, slotHeight, 10);
      ctx.fill();
      ctx.stroke();

      // Draw Piece in slot
      if (piece) {
        const centerX = sx + slotWidth / 2;
        const centerY = slotY + slotHeight / 2;

        if (!piece.isDuo) {
          // Single Hex
          this.grid.drawRune(ctx, centerX, centerY, 20, piece.runes[0]);
        } else {
          // Duo Hex with rotation offset
          const offsets = [
            { x: 18, y: 0 },
            { x: 9, y: -16 },
            { x: -9, y: -16 },
            { x: -18, y: 0 },
            { x: -9, y: 16 },
            { x: 9, y: 16 }
          ];
          const off = offsets[piece.rotationIndex];

          this.grid.drawRune(ctx, centerX - off.x / 2, centerY - off.y / 2, 17, piece.runes[0]);
          this.grid.drawRune(ctx, centerX + off.x / 2, centerY + off.y / 2, 17, piece.runes[1]);
        }
      }
      ctx.restore();
    }
  }

  destroy() {
    super.destroy();
    this._saveProgress();
    if (this.synthAudio) {
      this.synthAudio.setMuted(true);
    }
  }
}
