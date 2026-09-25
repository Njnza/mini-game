# 🎮 Neo Arcade - Multi Mini-Games Portal & Modular Game Engine

A modern web-based Game Hub featuring high-performance (60FPS Canvas & Web Audio API) mini-games, engineered with an extensible, modular architecture.

---

## 🚀 Quick Start

Zero external dependencies required. Run directly with Node.js:

```bash
npm start
# Or: node server.js
```

Open your browser and navigate to: **`http://localhost:3000`**

---

## 🧪 Automated Testing & CI Quality Gate

The project comes with a built-in automated test suite covering Unit and Integration tests. Every code modification must pass all tests before being approved:

```bash
npm test
# Or: node tests/run-all-tests.js
```

### Test Coverage
- **Unit Tests (`tests/unit/`)**:
  - `BaseGame.test.js`: Lifecycle states (`init`, `start`, `pause`, `resume`, `restart`, `destroy`), event tracking, and memory leak cleanup validation.
  - `GameRegistry.test.js`: Registry integrity, metadata schema validation (ID, title, category, icon, description, controls), and factory instance generation.
  - `StorageManager.test.js`: High score recording, persistent local settings, and play session counters.
  - `AudioManager.test.js`: Synthesizer initialization, mute toggle state, and headless environment safety.
- **Integration Tests (`tests/integration/`)**:
  - `Syntax.test.js`: Complete node syntax verification across all source files.
  - `Endpoints.test.js`: Live HTTP server asset delivery (status 200 OK for all HTML, CSS, and JS modules).

---

## 🏛️ System Architecture & Design Patterns

The architecture is built on established software design patterns to ensure scalability, encapsulation, and 60FPS performance:

### 1. Template Method Pattern (`src/core/BaseGame.js`)
Abstract base class standardizing the lifecycle of every mini-game:
- `init()`: Canvas & DOM creation with tracked event listeners.
- `start()`: Reset score and initiate delta-time game loop.
- `pause()` / `resume()`: Suspend or resume loop execution.
- `restart()`: Cleanly restart active session.
- `update(dt)` & `render(ctx)`: Precision delta-time update and rendering ticks.
- `destroy()`: **Crucial memory management** — automatically unbinds 100% of event listeners, cancels `requestAnimationFrame`, and clears all active timers to prevent memory leaks when navigating between games.

### 2. Registry & Factory Pattern (`src/core/GameRegistry.js`)
- Central game catalog.
- Automatically supplies metadata for search filtering and category pills.
- Instantiates decoupled game instances on demand.

### 3. Web Audio Synthesizer (`src/core/AudioManager.js`)
- Real-time sound synthesis using the native Web Audio API (OscillatorNode, GainNode, AudioBuffer).
- Zero audio file downloads, 0ms latency, and no CORS or 404 file path issues.

---

## 📂 Project Directory Structure

```text
mini-game/
├── index.html                  # Portal Hub View + Game Stage + Game Over Modal
├── style.css                   # Cyber Arcade Theme (Glassmorphism, animations, responsive)
├── server.js                   # Lightweight static HTTP server (Native ESM)
├── package.json                # npm start, npm test scripts
├── README.md                   # Architecture & documentation
├── tests/                      # Automated test suite
│   ├── unit/
│   │   ├── BaseGame.test.js
│   │   ├── GameRegistry.test.js
│   │   ├── StorageManager.test.js
│   │   └── AudioManager.test.js
│   ├── integration/
│   │   ├── Syntax.test.js
│   │   └── Endpoints.test.js
│   └── run-all-tests.js        # Master Test Runner
├── src/
│   ├── main.js                 # Application bootstrap entry point
│   └── core/
│       ├── App.js              # Game Portal Controller & Hub Orchestrator
│       ├── BaseGame.js         # Abstract Base Class for all games
│       ├── GameRegistry.js     # Registry & Factory for mini-games
│       ├── AudioManager.js     # Web Audio API Synthesizer
│       └── StorageManager.js   # LocalStorage & High Scores manager
└── games/                      # Isolated mini-game directories
    ├── target-hunter/          # Game 1: Target Hunter (Reflex Arcade)
    │   ├── meta.js
    │   └── game.js
    ├── neon-snake/             # Game 2: Neon Snake (Classic Grid 60FPS)
    │   ├── meta.js
    │   └── game.js
    ├── cyber-flappy/           # Game 3: Cyber Flappy (Physics & Parallax)
    │   ├── meta.js
    │   └── game.js
    ├── brick-breaker/          # Game 4: Cyber Breaker (Arkanoid / Multiball)
    │   ├── meta.js
    │   └── game.js
    ├── memory-matrix/          # Game 5: Memory Matrix (3D Card Flip Puzzle)
    │   ├── meta.js
    │   └── game.js
    └── zap-pets/               # Game 6: Zap Pets: Arena (Open-World Roguelite Survival)
        ├── meta.js
        └── game.js
```

---

## ➕ How to Add a New Mini-Game in 2 Steps

### Step 1: Create the game directory in `games/<game-id>/`
- `games/<game-id>/meta.js`:
  ```javascript
  export default {
    id: 'dino-runner',
    title: 'Dino Runner',
    category: 'Action / Physics',
    difficulty: 'Medium',
    icon: '🦖',
    color: '#84cc16',
    description: 'Jump over cyber obstacles in a high-speed sprint.',
    controls: ['Spacebar or Tap screen to jump']
  };
  ```
- `games/<game-id>/game.js`:
  ```javascript
  import { BaseGame } from '../../src/core/BaseGame.js';

  export default class DinoRunnerGame extends BaseGame {
    init() {
      // Build DOM/Canvas in this.container
    }
    start() {
      super.start();
      // Start loop via this.startLoop(this.ctx);
    }
    update(dt) {
      // Physics and logic
    }
    render(ctx) {
      // Canvas rendering
    }
  }
  ```

### Step 2: Register in `src/core/GameRegistry.js`
```javascript
import dinoMeta from '../../games/dino-runner/meta.js';
import DinoGame from '../../games/dino-runner/game.js';

// Inside constructor():
this.register(dinoMeta, DinoGame);
```

Run `npm test` to verify your new game meets all schema and lifecycle requirements.
