import { BaseGame } from '../../src/core/BaseGame.js';

export default class MemoryMatrixGame extends BaseGame {
  init() {
    this.container.innerHTML = `
      <div class="memory-wrapper" style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:16px;">
        <div style="display:flex; justify-content:space-between; width:100%; max-width:440px; margin-bottom:16px; font-weight:700;">
          <div style="background:rgba(15,23,42,0.8); backdrop-filter:blur(8px); padding:8px 16px; border-radius:12px; border:1px solid rgba(255,255,255,0.1); color:#ec4899;">
            🃏 Moves: <span id="mm-moves">0</span>
          </div>
          <div style="background:rgba(15,23,42,0.8); backdrop-filter:blur(8px); padding:8px 16px; border-radius:12px; border:1px solid rgba(255,255,255,0.1); color:#38bdf8;">
            ⏱ Time: <span id="mm-time">0</span>s
          </div>
        </div>

        <div id="cards-grid" style="display:grid; grid-template-columns:repeat(4, 1fr); gap:12px; width:100%; max-width:440px; aspect-ratio:1/1;"></div>
      </div>
    `;

    this.gridEl = this.container.querySelector('#cards-grid');
    this.movesEl = this.container.querySelector('#mm-moves');
    this.timeEl = this.container.querySelector('#mm-time');

    this.icons = ['⚡', '💎', '🚀', '🔮', '🎮', '👾', '🪐', '🛡️'];
  }

  start() {
    super.start();
    this.moves = 0;
    this.seconds = 0;
    this.matches = 0;
    this.combo = 0;
    this.flippedCards = [];
    this.isLocked = false;

    this.updateHUD();

    // 1-second interval timer
    this.addTrackedInterval(() => {
      if (!this.isRunning || this.isPaused || this.isGameOver) return;
      this.seconds++;
      this.updateHUD();
    }, 1000);

    this.setupGrid();
  }

  updateHUD() {
    if (this.movesEl) this.movesEl.textContent = this.moves;
    if (this.timeEl) this.timeEl.textContent = this.seconds;
  }

  setupGrid() {
    this.gridEl.innerHTML = '';
    // Create 8 pairs (16 cards) and shuffle
    const deck = [...this.icons, ...this.icons].sort(() => Math.random() - 0.5);

    deck.forEach((icon, index) => {
      const card = document.createElement('div');
      card.className = 'memory-card';
      card.dataset.icon = icon;
      card.dataset.index = index.toString();
      card.style.cssText = `
        position: relative;
        cursor: pointer;
        perspective: 1000px;
        user-select: none;
        height: 100%;
      `;

      card.innerHTML = `
        <div class="card-inner" style="
          width: 100%;
          height: 100%;
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          transform-style: preserve-3d;
          position: relative;
        ">
          <!-- Back Face (Face Down) -->
          <div class="card-back" style="
            position: absolute;
            width: 100%;
            height: 100%;
            backface-visibility: hidden;
            background: linear-gradient(135deg, #1e1b4b, #312e81);
            border: 2px solid rgba(236, 72, 153, 0.4);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            color: #ec4899;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          ">?</div>
          <!-- Front Face (Face Up) -->
          <div class="card-front" style="
            position: absolute;
            width: 100%;
            height: 100%;
            backface-visibility: hidden;
            transform: rotateY(180deg);
            background: linear-gradient(135deg, #18181b, #27272a);
            border: 2px solid #ec4899;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.2rem;
            box-shadow: 0 0 15px rgba(236, 72, 153, 0.5);
          ">${icon}</div>
        </div>
      `;

      const onClick = () => this.handleCardClick(card);
      this.addTrackedEventListener(card, 'click', onClick);

      this.gridEl.appendChild(card);
    });
  }

  handleCardClick(card) {
    if (this.isLocked || !this.isRunning || this.isPaused || this.isGameOver) return;
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;

    // Flip card
    card.classList.add('flipped');
    card.querySelector('.card-inner').style.transform = 'rotateY(180deg)';
    this.audio.playClick();
    this.flippedCards.push(card);

    if (this.flippedCards.length === 2) {
      this.moves++;
      this.updateHUD();
      this.checkMatch();
    }
  }

  checkMatch() {
    const [card1, card2] = this.flippedCards;
    const isMatch = card1.dataset.icon === card2.dataset.icon;

    if (isMatch) {
      this.isLocked = true;
      this.combo++;
      const bonus = this.combo * 50;
      this.emitScore(this.score + 100 + bonus);
      this.audio.playCombo(this.combo);

      this.addTrackedTimeout(() => {
        card1.classList.add('matched');
        card2.classList.add('matched');
        card1.querySelector('.card-front').style.borderColor = '#10b981';
        card2.querySelector('.card-front').style.borderColor = '#10b981';
        card1.querySelector('.card-front').style.boxShadow = '0 0 20px #10b981';
        card2.querySelector('.card-front').style.boxShadow = '0 0 20px #10b981';

        this.flippedCards = [];
        this.matches++;
        this.isLocked = false;

        // Victory: all 8 pairs matched
        if (this.matches === this.icons.length) {
          const timeBonus = Math.max(0, 500 - this.seconds * 10);
          const finalScore = this.score + timeBonus;
          this.emitScore(finalScore);
          this.audio.playVictory();
          this.emitGameOver();
        }
      }, 500);
    } else {
      this.isLocked = true;
      this.combo = 0;
      this.audio.playHit();

      this.addTrackedTimeout(() => {
        card1.classList.remove('flipped');
        card2.classList.remove('flipped');
        card1.querySelector('.card-inner').style.transform = 'rotateY(0deg)';
        card2.querySelector('.card-inner').style.transform = 'rotateY(0deg)';
        this.flippedCards = [];
        this.isLocked = false;
      }, 900);
    }
  }
}
