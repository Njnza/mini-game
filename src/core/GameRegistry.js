/**
 * GameRegistry.js
 * Central registry for all mini-games.
 * Implements the Registry Pattern and Factory Pattern.
 * Adding a new game only requires importing its metadata and class here!
 */

import targetHunterMeta from '../../games/target-hunter/meta.js';
import TargetHunterGame from '../../games/target-hunter/game.js';

import neonSnakeMeta from '../../games/neon-snake/meta.js';
import NeonSnakeGame from '../../games/neon-snake/game.js';

import cyberFlappyMeta from '../../games/cyber-flappy/meta.js';
import CyberFlappyGame from '../../games/cyber-flappy/game.js';

import brickBreakerMeta from '../../games/brick-breaker/meta.js';
import BrickBreakerGame from '../../games/brick-breaker/game.js';

import memoryMatrixMeta from '../../games/memory-matrix/meta.js';
import MemoryMatrixGame from '../../games/memory-matrix/game.js';

import zapPetsMeta from '../../games/zap-pets/meta.js';
import ZapPetsGame from '../../games/zap-pets/game.js';

import towerDefenseMeta from '../../games/tower-defense/meta.js';
import TowerDefenseGame from '../../games/tower-defense/game.js';

import hexaPuzzleMeta from '../../games/hexa-puzzle/meta.js';
import HexaPuzzleGame from '../../games/hexa-puzzle/game.js';

export class GameRegistry {
  constructor() {
    this.games = new Map();

    // Register initial games
    this.register(targetHunterMeta, TargetHunterGame);
    this.register(neonSnakeMeta, NeonSnakeGame);
    this.register(cyberFlappyMeta, CyberFlappyGame);
    this.register(brickBreakerMeta, BrickBreakerGame);
    this.register(memoryMatrixMeta, MemoryMatrixGame);
    this.register(zapPetsMeta, ZapPetsGame);
    this.register(towerDefenseMeta, TowerDefenseGame);
    this.register(hexaPuzzleMeta, HexaPuzzleGame);
  }

  /**
   * Register a game into the registry
   * @param {Object} meta 
   * @param {Function} gameClass 
   */
  register(meta, gameClass) {
    if (!meta || !meta.id) {
      throw new Error('Game metadata must include an id.');
    }
    this.games.set(meta.id, {
      meta,
      gameClass
    });
  }

  /**
   * Get metadata for all registered games
   * @returns {Array<Object>}
   */
  getAllMetas() {
    return Array.from(this.games.values()).map(item => item.meta);
  }

  /**
   * Get metadata by game ID
   * @param {string} id 
   */
  getMeta(id) {
    const item = this.games.get(id);
    return item ? item.meta : null;
  }

  /**
   * Factory method to create a game instance
   * @param {string} id 
   * @param {HTMLElement} container 
   * @param {import('./AudioManager.js').AudioManager} audio 
   * @param {import('./StorageManager.js').StorageManager} storage 
   * @param {Object} callbacks 
   * @returns {import('./BaseGame.js').BaseGame}
   */
  createInstance(id, container, audio, storage, callbacks) {
    const item = this.games.get(id);
    if (!item) {
      throw new Error(`Game with id '${id}' not found in registry.`);
    }
    return new item.gameClass(container, audio, storage, callbacks);
  }
}
