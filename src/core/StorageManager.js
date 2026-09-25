/**
 * StorageManager.js
 * Manages player states, high scores, and persistent local settings safely via localStorage.
 */
export class StorageManager {
  static PREFIX = 'minigame_hub_';

  static getHighScore(gameId) {
    try {
      const val = localStorage.getItem(`${this.PREFIX}highscore_${gameId}`);
      return val ? parseInt(val, 10) : 0;
    } catch (e) {
      return 0;
    }
  }

  static saveHighScore(gameId, score) {
    try {
      const current = this.getHighScore(gameId);
      if (score > current) {
        localStorage.setItem(`${this.PREFIX}highscore_${gameId}`, score.toString());
        return { isNewRecord: true, previous: current, current: score };
      }
      return { isNewRecord: false, previous: current, current };
    } catch (e) {
      return { isNewRecord: false, previous: 0, current: score };
    }
  }

  static getSetting(key, defaultValue = null) {
    try {
      const val = localStorage.getItem(`${this.PREFIX}setting_${key}`);
      return val !== null ? JSON.parse(val) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }

  static saveSetting(key, value) {
    try {
      localStorage.setItem(`${this.PREFIX}setting_${key}`, JSON.stringify(value));
    } catch (e) {
      console.warn('Could not save setting to localStorage', e);
    }
  }

  static incrementPlayCount(gameId) {
    try {
      const key = `${this.PREFIX}plays_${gameId}`;
      const count = parseInt(localStorage.getItem(key) || '0', 10) + 1;
      localStorage.setItem(key, count.toString());
      return count;
    } catch (e) {
      return 1;
    }
  }
}
