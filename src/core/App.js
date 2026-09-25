import { AudioManager } from './AudioManager.js';
import { StorageManager } from './StorageManager.js';
import { GameRegistry } from './GameRegistry.js';

export class App {
  constructor() {
    this.audio = new AudioManager();
    this.registry = new GameRegistry();
    this.currentGame = null;
    this.currentGameMeta = null;
    this.currentScore = 0;
    this.selectedCategory = 'all';
    this.searchQuery = '';

    // Restore audio mute setting
    const savedMute = StorageManager.getSetting('muted', false);
    this.audio.setMuted(savedMute);
  }

  init() {
    this.cacheDOM();
    this.bindEvents();
    this.renderCategoryFilters();
    this.renderGameCards();
    this.updateAudioButtons();
    this.handleRouting();
  }

  handleRouting() {
    window.addEventListener('hashchange', () => this.onHashChange());
    this.onHashChange();
  }

  onHashChange() {
    const raw = (window.location.hash || '').replace(/^#\/?/, '').trim();
    if (!raw || raw === 'hub') {
      if (this.gameView && this.gameView.classList.contains('active')) {
        this.exitToHub(false);
      }
      return;
    }

    const match = raw.match(/^(?:game\/)?([a-z0-9-]+)$/i);
    if (match) {
      const gameId = match[1];
      if (this.registry.getMeta(gameId)) {
        if (!this.currentGame || !this.currentGameMeta || this.currentGameMeta.id !== gameId) {
          this.launchGame(gameId, false);
        }
      }
    }
  }

  cacheDOM() {
    this.hubView = document.getElementById('hub-view');
    this.gameView = document.getElementById('game-view');
    this.gamesGrid = document.getElementById('games-grid');
    this.searchInput = document.getElementById('search-input');
    this.categoryFilters = document.getElementById('category-filters');
    this.gameContainer = document.getElementById('game-container');

    // Game Top Bar Elements
    this.gameTitleEl = document.getElementById('active-game-title');
    this.gameScoreEl = document.getElementById('active-game-score');
    this.gameHighscoreEl = document.getElementById('active-game-highscore');
    this.btnBackHub = document.getElementById('btn-back-hub');
    this.btnPause = document.getElementById('btn-pause-game');
    this.btnRestart = document.getElementById('btn-restart-game');
    this.btnAudioToggle = document.getElementById('btn-audio-toggle');
    this.btnHubAudioToggle = document.getElementById('btn-hub-audio-toggle');
    this.btnFullscreen = document.getElementById('btn-fullscreen');

    // Game Over Modal Elements
    this.gameOverModal = document.getElementById('game-over-modal');
    this.modalFinalScore = document.getElementById('modal-final-score');
    this.modalHighScore = document.getElementById('modal-high-score');
    this.modalNewRecordBadge = document.getElementById('modal-new-record');
    this.modalBtnRestart = document.getElementById('modal-btn-restart');
    this.modalBtnHub = document.getElementById('modal-btn-hub');
  }

  bindEvents() {
    // Search game
    this.searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.renderGameCards();
    });

    // Sound toggle buttons
    this.btnHubAudioToggle.addEventListener('click', () => this.toggleAudio());
    this.btnAudioToggle.addEventListener('click', () => this.toggleAudio());

    // Game controls
    this.btnBackHub.addEventListener('click', () => this.exitToHub());
    this.btnRestart.addEventListener('click', () => this.restartGame());
    this.btnPause.addEventListener('click', () => this.togglePause());

    // Fullscreen toggle
    this.btnFullscreen.addEventListener('click', () => this.toggleFullscreen());

    // Modal Game Over actions
    this.modalBtnRestart.addEventListener('click', () => {
      this.hideGameOverModal();
      this.restartGame();
    });
    this.modalBtnHub.addEventListener('click', () => {
      this.hideGameOverModal();
      this.exitToHub();
    });

    // Global keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (this.currentGame) {
        if (e.key === 'p' || e.key === 'P') {
          if (document.activeElement.tagName !== 'INPUT') {
            this.togglePause();
          }
        } else if (e.key === 'Escape') {
          if (this.gameOverModal.classList.contains('active')) {
            this.hideGameOverModal();
            this.exitToHub();
          } else {
            this.togglePause();
          }
        }
      }
    });
  }

  toggleAudio() {
    const isMuted = this.audio.toggleMute();
    StorageManager.saveSetting('muted', isMuted);
    this.updateAudioButtons();
    if (!isMuted) {
      this.audio.playClick();
    }
  }

  updateAudioButtons() {
    const isMuted = this.audio.isMuted;
    const text = isMuted ? '🔇 Muted' : '🔊 Sound';
    if (this.btnHubAudioToggle) this.btnHubAudioToggle.innerHTML = text;
    if (this.btnAudioToggle) this.btnAudioToggle.innerHTML = isMuted ? '🔇' : '🔊';
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  renderCategoryFilters() {
    const metas = this.registry.getAllMetas();
    const categories = ['all', ...new Set(metas.map(m => m.category))];

    this.categoryFilters.innerHTML = '';
    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = `filter-pill ${this.selectedCategory === cat ? 'active' : ''}`;
      btn.textContent = cat === 'all' ? 'All Games' : cat;
      btn.addEventListener('click', () => {
        this.audio.playClick();
        this.selectedCategory = cat;
        this.categoryFilters.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderGameCards();
      });
      this.categoryFilters.appendChild(btn);
    });
  }

  renderGameCards() {
    const metas = this.registry.getAllMetas();
    const filtered = metas.filter(meta => {
      const matchCat = this.selectedCategory === 'all' || meta.category === this.selectedCategory;
      const matchSearch = meta.title.toLowerCase().includes(this.searchQuery) ||
                          meta.description.toLowerCase().includes(this.searchQuery);
      return matchCat && matchSearch;
    });

    if (filtered.length === 0) {
      this.gamesGrid.innerHTML = `
        <div class="no-results" style="grid-column:1/-1; text-align:center; padding:60px 20px; color:#94a3b8;">
          <div style="font-size:3rem; margin-bottom:12px;">🔍</div>
          <h3>No mini-games found!</h3>
          <p>Try searching for a different keyword or select another category.</p>
        </div>
      `;
      return;
    }

    this.gamesGrid.innerHTML = '';
    filtered.forEach(meta => {
      const highScore = StorageManager.getHighScore(meta.id);
      const card = document.createElement('div');
      card.className = 'game-card';
      card.style.setProperty('--theme-color', meta.color);

      card.innerHTML = `
        <div class="card-glow"></div>
        <div class="card-header">
          <div class="card-icon" style="background:${meta.color}20; color:${meta.color}; border:1px solid ${meta.color}50;">
            ${meta.icon}
          </div>
          <span class="card-badge">${meta.category}</span>
        </div>
        <div class="card-body">
          <h3 class="card-title">${meta.title}</h3>
          <div class="card-difficulty" style="font-size:0.8rem; color:${meta.color}; margin-bottom:8px; font-weight:600;">${meta.difficulty || 'Normal'}</div>
          <p class="card-desc">${meta.description}</p>
        </div>
        <div class="card-footer">
          <div class="card-highscore">
            <span class="label">Best:</span>
            <span class="value" style="color:${meta.color}">${highScore.toLocaleString()}</span>
          </div>
          <button class="btn-play-game" data-id="${meta.id}">
            Play Now <span>▶</span>
          </button>
        </div>
      `;

      const playBtn = card.querySelector('.btn-play-game');
      playBtn.addEventListener('click', () => {
        this.audio.playClick();
        this.launchGame(meta.id);
      });

      this.gamesGrid.appendChild(card);
    });
  }

  launchGame(gameId, updateHash = true) {
    this.currentGameMeta = this.registry.getMeta(gameId);
    if (!this.currentGameMeta) return;

    if (updateHash && window.location.hash !== `#/game/${gameId}`) {
      window.location.hash = `#/game/${gameId}`;
    }

    // Track play count
    StorageManager.incrementPlayCount(gameId);

    // Switch view
    this.hubView.classList.remove('active');
    this.gameView.classList.add('active');

    // Update Header
    this.gameTitleEl.textContent = `${this.currentGameMeta.icon} ${this.currentGameMeta.title}`;
    this.gameScoreEl.textContent = '0';
    const highScore = StorageManager.getHighScore(gameId);
    this.gameHighscoreEl.textContent = highScore.toLocaleString();
    this.btnPause.innerHTML = '⏸ Pause';

    // Destroy existing game if any
    if (this.currentGame) {
      this.currentGame.destroy();
      this.currentGame = null;
    }

    // Create new instance from Factory Registry
    this.currentGame = this.registry.createInstance(
      gameId,
      this.gameContainer,
      this.audio,
      StorageManager,
      {
        onScore: (score) => this.handleScoreUpdate(score),
        onGameOver: (finalScore) => this.handleGameOver(finalScore)
      }
    );

    // Initialize and start
    this.currentGame.init();
    this.currentGame.start();
  }

  handleScoreUpdate(score) {
    this.currentScore = score;
    this.gameScoreEl.textContent = score.toLocaleString();
  }

  handleGameOver(finalScore) {
    const gameId = this.currentGameMeta.id;
    const saveResult = StorageManager.saveHighScore(gameId, finalScore);

    this.modalFinalScore.textContent = finalScore.toLocaleString();
    this.modalHighScore.textContent = saveResult.current.toLocaleString();

    if (saveResult.isNewRecord && finalScore > 0) {
      this.modalNewRecordBadge.style.display = 'inline-block';
      this.audio.playVictory();
    } else {
      this.modalNewRecordBadge.style.display = 'none';
    }

    this.showGameOverModal();
  }

  showGameOverModal() {
    this.gameOverModal.classList.add('active');
  }

  hideGameOverModal() {
    this.gameOverModal.classList.remove('active');
  }

  togglePause() {
    if (!this.currentGame || this.currentGame.isGameOver) return;
    this.audio.playClick();

    if (this.currentGame.isPaused) {
      this.currentGame.resume();
      this.btnPause.innerHTML = '⏸ Pause';
    } else {
      this.currentGame.pause();
      this.btnPause.innerHTML = '▶ Resume';
    }
  }

  restartGame() {
    if (!this.currentGame) return;
    this.audio.playClick();
    this.hideGameOverModal();
    this.gameScoreEl.textContent = '0';
    this.btnPause.innerHTML = '⏸ Pause';
    this.currentGame.restart();
  }

  exitToHub(updateHash = true) {
    if (updateHash && window.location.hash && window.location.hash !== '#/hub') {
      window.location.hash = '#/hub';
    }
    this.audio.playClick();
    this.hideGameOverModal();

    // Clean up all resources cleanly to prevent memory leak
    if (this.currentGame) {
      this.currentGame.destroy();
      this.currentGame = null;
    }

    // Switch view back to Hub
    this.gameView.classList.remove('active');
    this.hubView.classList.add('active');

    // Refresh game cards (to update best scores)
    this.renderGameCards();
  }
}
