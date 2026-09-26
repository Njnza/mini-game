/**
 * enemies.js
 * Obstacle and hazard definitions for Trung Thu Chaos.
 */

export const OBSTACLE_TYPES = {
  lantern: {
    type: 'lantern',
    name: 'Lồng Đèn Điên',
    width: 38,
    height: 48,
    speedFactor: 1.0,
    scoreValue: 5,
    damage: 1,
    color: '#ef4444',
    secondaryColor: '#f59e0b',
    hasWaveMotion: true
  },
  rabbit: {
    type: 'rabbit',
    name: 'Thỏ Ngọc Đình Công',
    width: 44,
    height: 46,
    speedFactor: 1.15,
    scoreValue: 15,
    damage: 1,
    color: '#f8fafc',
    signText: 'STRIKE!',
    hasHopMotion: true
  },
  mini_moon: {
    type: 'mini_moon',
    name: 'Vầng Trăng Phạt',
    width: 40,
    height: 40,
    speedFactor: 1.5,
    scoreValue: 20,
    damage: 1,
    color: '#fef08a',
    glowColor: '#eab308',
    isFalling: true
  },
  fox: {
    type: 'fox',
    name: 'Cáo Hồ Ly Giả Dạng',
    width: 52,
    height: 38,
    speedFactor: 1.8,
    scoreValue: 25,
    damage: 1,
    color: '#ea580c',
    isFastDasher: true
  },
  firework: {
    type: 'firework',
    name: 'Pháo Hoa Lạc Lối',
    width: 32,
    height: 32,
    speedFactor: 0.9,
    scoreValue: 15,
    damage: 1,
    color: '#a855f7',
    explodes: true
  }
};
