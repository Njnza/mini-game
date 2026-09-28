/**
 * weapons.js
 * Weapon, Tank, and Powerup specifications for Cyber Tank: Ricochet Protocol.
 */

export const TANK_TYPES = {
  player: {
    name: 'Neo Vanguard',
    maxHp: 3,
    speed: 180,
    turnSpeed: 4.2,
    radius: 18,
    color: '#06b6d4',
    turretColor: '#38bdf8',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    maxMines: 2,
    fireCooldown: 0.32,
    bulletSpeed: 380,
    maxBounces: 2
  },
  scout: {
    type: 'scout',
    name: 'Scout Drone',
    maxHp: 1,
    speed: 0,
    turnSpeed: 1.5,
    radius: 17,
    color: '#94a3b8',
    turretColor: '#cbd5e1',
    glowColor: 'rgba(148, 163, 184, 0.3)',
    score: 100,
    fireCooldown: 2.2,
    bulletSpeed: 240,
    maxBounces: 1
  },
  striker: {
    type: 'striker',
    name: 'Phantom Striker',
    maxHp: 1,
    speed: 130,
    turnSpeed: 3.0,
    radius: 17,
    color: '#3b82f6',
    turretColor: '#60a5fa',
    glowColor: 'rgba(59, 130, 246, 0.4)',
    score: 200,
    fireCooldown: 1.6,
    bulletSpeed: 290,
    maxBounces: 1
  },
  pyro: {
    type: 'pyro',
    name: 'Pyro Raider',
    maxHp: 1,
    speed: 190,
    turnSpeed: 3.8,
    radius: 17,
    color: '#f97316',
    turretColor: '#fb923c',
    glowColor: 'rgba(249, 115, 22, 0.45)',
    score: 250,
    fireCooldown: 1.1,
    bulletSpeed: 340,
    maxBounces: 1
  },
  sniper: {
    type: 'sniper',
    name: 'Rail Sniper',
    maxHp: 2,
    speed: 90,
    turnSpeed: 2.0,
    radius: 18,
    color: '#a855f7',
    turretColor: '#c084fc',
    glowColor: 'rgba(168, 85, 247, 0.5)',
    score: 350,
    fireCooldown: 2.8,
    bulletSpeed: 520,
    maxBounces: 2,
    hasLaserSight: true
  },
  mortar: {
    type: 'mortar',
    name: 'Heavy Mortar',
    maxHp: 2,
    speed: 80,
    turnSpeed: 1.8,
    radius: 19,
    color: '#eab308',
    turretColor: '#fde047',
    glowColor: 'rgba(234, 179, 8, 0.45)',
    score: 400,
    fireCooldown: 3.2,
    isMortar: true
  },
  stealth: {
    type: 'stealth',
    name: 'Ghost Stalker',
    maxHp: 2,
    speed: 140,
    turnSpeed: 3.2,
    radius: 17,
    color: '#64748b',
    turretColor: '#94a3b8',
    glowColor: 'rgba(100, 116, 139, 0.3)',
    score: 450,
    fireCooldown: 1.8,
    bulletSpeed: 300,
    maxBounces: 1,
    canCloak: true,
    laysMines: true
  },
  commander: {
    type: 'commander',
    name: 'Fortress Commander',
    maxHp: 6,
    speed: 100,
    turnSpeed: 2.2,
    radius: 24,
    color: '#ec4899',
    turretColor: '#f472b6',
    glowColor: 'rgba(236, 72, 153, 0.6)',
    score: 1000,
    fireCooldown: 1.2,
    bulletSpeed: 360,
    maxBounces: 2,
    hasShield: true
  },
  boss: {
    type: 'boss',
    name: 'APEX TITAN OVERLORD',
    maxHp: 25,
    speed: 75,
    turnSpeed: 1.4,
    radius: 34,
    color: '#ef4444',
    turretColor: '#f87171',
    glowColor: 'rgba(239, 68, 68, 0.7)',
    score: 5000,
    fireCooldown: 0.8,
    bulletSpeed: 420,
    maxBounces: 2
  }
};

export const POWERUPS = {
  shield: {
    id: 'shield',
    name: 'Lá Chắn Lực Trường',
    icon: '🛡️',
    color: '#38bdf8',
    duration: 12,
    description: 'Chặn 1 đòn sát thương chí mạng'
  },
  rapid: {
    id: 'rapid',
    name: 'Pháo Xung Kích Tốc Độ',
    icon: '⚡',
    color: '#facc15',
    duration: 7,
    fireCooldown: 0.12,
    description: 'Tốc độ xả đạn cực nhanh trong 7 giây'
  },
  scatter: {
    id: 'scatter',
    name: 'Đạn Phân Mảnh Tri-Shot',
    icon: '💥',
    color: '#f97316',
    duration: 8,
    description: 'Bắn 3 luồng đạn plasma hình nón cùng lúc'
  },
  emp: {
    id: 'emp',
    name: 'Xung Điện Tê Liệt EMP',
    icon: '⏱️',
    color: '#a855f7',
    instant: true,
    duration: 4.5,
    description: 'Tê liệt toàn bộ xe tăng địch trên sân trong 4.5 giây'
  },
  speed: {
    id: 'speed',
    name: 'Động Cơ Siêu Tốc Turbo',
    icon: '🏎️',
    color: '#10b981',
    duration: 8,
    speedMultiplier: 1.6,
    description: 'Gia tăng 60% tốc độ di chuyển và cơ động'
  }
};

export const MINE_CONFIG = {
  armDelay: 1.0, // seconds until active
  fuseTime: 12.0, // auto detonates after 12s
  triggerRadius: 36, // enemy proximity
  blastRadius: 90, // AOE damage
  damage: 3,
  cooldown: 3.5
};

export const DASH_CONFIG = {
  speed: 480,
  duration: 0.18,
  cooldown: 2.2
};
