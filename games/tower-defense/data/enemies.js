/**
 * enemies.js
 * Enemy archetypes, visual profiles, behaviors, and wave balancing curves.
 */

export const ENEMY_TYPES = {
  scout: {
    id: 'scout',
    name: 'Cyber Scout',
    icon: '⚡',
    color: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.6)',
    size: 11,
    baseHp: 65,
    baseSpeed: 105, // pixels per sec
    bounty: 12,
    scoreValue: 40,
    isAirborne: false,
    isImmuneToSlow: false,
    description: 'Ultra-fast recon unit designed to outrun heavy artillery.'
  },

  trooper: {
    id: 'trooper',
    name: 'Assault Trooper',
    icon: '🤖',
    color: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.6)',
    size: 13,
    baseHp: 120,
    baseSpeed: 70,
    bounty: 15,
    scoreValue: 50,
    isAirborne: false,
    isImmuneToSlow: false,
    description: 'Frontline infantry unit with balanced armor and steady movement.'
  },

  tank: {
    id: 'tank',
    name: 'Goliath Tank',
    icon: '🛡️',
    color: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.6)',
    size: 18,
    baseHp: 380,
    baseSpeed: 42,
    bounty: 38,
    scoreValue: 120,
    isAirborne: false,
    isImmuneToSlow: false,
    description: 'Armored juggernaut built to absorb heavy kinetic fire.'
  },

  vanguard: {
    id: 'vanguard',
    name: 'Vanguard Knight',
    icon: '⚔️',
    color: '#eab308',
    glowColor: 'rgba(234, 179, 8, 0.6)',
    size: 14,
    baseHp: 190,
    baseSpeed: 68,
    bounty: 24,
    scoreValue: 75,
    isAirborne: false,
    isImmuneToSlow: true, // Immune to Cryo / Frost slow!
    description: 'Shield-bearing vanguard immune to cryogenic slowing effects.'
  },

  airborne: {
    id: 'airborne',
    name: 'Aero Drone',
    icon: '🛸',
    color: '#c084fc',
    glowColor: 'rgba(192, 132, 252, 0.7)',
    size: 12,
    baseHp: 110,
    baseSpeed: 82,
    bounty: 28,
    scoreValue: 90,
    isAirborne: true, // Can only be shot by Anti-Air towers & Hero
    isImmuneToSlow: false,
    description: 'Hovering air unit. Flies across the map; immune to ground-only cannons.'
  },

  splitter: {
    id: 'splitter',
    name: 'Hydra Core',
    icon: '🦠',
    color: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.6)',
    size: 16,
    baseHp: 240,
    baseSpeed: 58,
    bounty: 32,
    scoreValue: 100,
    isAirborne: false,
    isImmuneToSlow: false,
    splitsInto: 'splitter_minion',
    splitCount: 2,
    description: 'Bio-synthetic unit that fragments into 2 agile minions when destroyed.'
  },

  splitter_minion: {
    id: 'splitter_minion',
    name: 'Hydra Spawn',
    icon: '🔹',
    color: '#34d399',
    glowColor: 'rgba(52, 211, 153, 0.6)',
    size: 9,
    baseHp: 65,
    baseSpeed: 95,
    bounty: 8,
    scoreValue: 25,
    isAirborne: false,
    isImmuneToSlow: false,
    description: 'Fragment spawned from a defeated Hydra Core.'
  },

  boss: {
    id: 'boss',
    name: 'Omega Behemoth',
    icon: '👑',
    color: '#f43f5e',
    glowColor: 'rgba(244, 63, 94, 0.8)',
    size: 24,
    baseHp: 1600,
    baseSpeed: 34,
    bounty: 180,
    scoreValue: 500,
    isAirborne: false,
    isImmuneToSlow: false,
    hasShield: true,
    baseShield: 600,
    livesTaken: 5, // Reaching core takes 5 lives
    description: 'Colossal military fortress with heavy regenerative energy shielding.'
  }
};

/**
 * Generate scaled stats for an enemy based on wave number and map difficulty multiplier.
 */
export function createEnemyInstance(typeId, waveNum, mapMultiplier = 1.0) {
  const base = ENEMY_TYPES[typeId] || ENEMY_TYPES.trooper;
  // Exponential / linear hybrid wave scaling
  const waveScale = 1.0 + (waveNum - 1) * 0.14 + Math.pow(Math.max(waveNum - 5, 0), 1.35) * 0.05;
  const hp = Math.round(base.baseHp * waveScale * mapMultiplier);
  const speed = base.baseSpeed * (1 + Math.min((waveNum - 1) * 0.015, 0.35));
  const bounty = Math.max(Math.round(base.bounty * (1 + (waveNum - 1) * 0.03)), 5);
  const score = Math.round(base.scoreValue * (1 + (waveNum - 1) * 0.08));

  const hasShield = base.hasShield || false;
  const maxShield = hasShield ? Math.round(base.baseShield * waveScale * mapMultiplier) : 0;

  return {
    id: `${typeId}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    type: typeId,
    name: base.name,
    icon: base.icon,
    color: base.color,
    glowColor: base.glowColor,
    size: base.size,
    maxHp: hp,
    hp: hp,
    hasShield: hasShield,
    maxShield: maxShield,
    shield: maxShield,
    baseSpeed: speed,
    speed: speed,
    bounty: bounty,
    scoreValue: score,
    isAirborne: base.isAirborne,
    isImmuneToSlow: base.isImmuneToSlow,
    splitsInto: base.splitsInto || null,
    splitCount: base.splitCount || 0,
    livesTaken: base.livesTaken || 1,

    // Runtime state
    x: 0,
    y: 0,
    pathIndex: 0,
    pathProgress: 0,
    currentWaypointIndex: 0,
    slowTimer: 0,
    slowFactor: 0,
    stunTimer: 0,
    melterTicks: 0,
    activeBuffs: [],
    dead: false,
    reachedBase: false,
    alpha: 1.0
  };
}
