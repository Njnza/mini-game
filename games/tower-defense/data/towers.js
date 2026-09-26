/**
 * towers.js
 * Definitions, stats, and evolution branches for all defensive turrets.
 */

export const TOWER_TYPES = {
  cannon: {
    id: 'cannon',
    name: 'Heavy Cannon',
    icon: '💣',
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    cost: 100,
    description: 'High kinetic damage with small blast radius. Effective against armored ground units.',
    range: 110,
    damage: 35,
    fireRate: 0.9, // shots per sec
    splashRadius: 36,
    antiAir: false,
    projectileType: 'cannon_shell',
    projectileSpeed: 380,
    tiers: [
      { tier: 1, cost: 0, damage: 35, range: 110, fireRate: 0.9, splashRadius: 36, name: 'Cannon Mk I' },
      { tier: 2, cost: 85, damage: 65, range: 125, fireRate: 1.0, splashRadius: 44, name: 'Cannon Mk II' },
      { tier: 3, cost: 160, damage: 115, range: 140, fireRate: 1.15, splashRadius: 52, name: 'Cannon Mk III' }
    ],
    evolutions: {
      mega_cannon: {
        id: 'mega_cannon',
        name: 'Mega Cataclysm',
        icon: '💥',
        cost: 260,
        description: 'Colossal explosive payloads dealing massive AOE shockwaves that annihilate enemy clusters.',
        damage: 240,
        range: 155,
        fireRate: 0.85,
        splashRadius: 85,
        antiAir: false,
        projectileType: 'mega_shell',
        projectileSpeed: 340
      },
      railgun: {
        id: 'railgun',
        name: 'Hyper Railgun',
        icon: '⚡',
        cost: 280,
        description: 'Superheated kinetic slug penetrates through all enemies in a straight line with armor piercing.',
        damage: 320,
        range: 190,
        fireRate: 0.65,
        splashRadius: 0,
        pierce: 6,
        antiAir: true,
        projectileType: 'railgun_beam',
        projectileSpeed: 1200
      }
    }
  },

  gatling: {
    id: 'gatling',
    name: 'Rotary Gatling',
    icon: '🔫',
    color: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    cost: 80,
    description: 'High-frequency ballistic rounds. Excellent against swarms, fast runners, and airborne units.',
    range: 105,
    damage: 9,
    fireRate: 3.5,
    splashRadius: 0,
    antiAir: true,
    projectileType: 'bullet',
    projectileSpeed: 520,
    tiers: [
      { tier: 1, cost: 0, damage: 9, range: 105, fireRate: 3.5, splashRadius: 0, name: 'Gatling Mk I' },
      { tier: 2, cost: 70, damage: 16, range: 120, fireRate: 4.2, splashRadius: 0, name: 'Gatling Mk II' },
      { tier: 3, cost: 135, damage: 26, range: 135, fireRate: 5.0, splashRadius: 0, name: 'Gatling Mk III' }
    ],
    evolutions: {
      minigun: {
        id: 'minigun',
        name: 'Vulcan Storm',
        icon: '🌪️',
        cost: 230,
        description: 'Insane 9 rounds/sec shredder that completely tears through high-speed units and bosses.',
        damage: 38,
        range: 150,
        fireRate: 8.8,
        splashRadius: 0,
        antiAir: true,
        projectileType: 'vulcan_bullet',
        projectileSpeed: 600
      },
      drone_hub: {
        id: 'drone_hub',
        name: 'Drone Carrier',
        icon: '🛸',
        cost: 250,
        description: 'Launches autonomous aerial drones that actively patrol the perimeter and strafe targets.',
        damage: 28,
        range: 160,
        fireRate: 4.8,
        droneCount: 2,
        antiAir: true,
        projectileType: 'drone_laser',
        projectileSpeed: 500
      }
    }
  },

  frost: {
    id: 'frost',
    name: 'Cryo Spire',
    icon: '❄️',
    color: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.4)',
    cost: 110,
    description: 'Emits freezing pulses that slow enemy movement speed and deal cryogenic frostbite damage.',
    range: 95,
    damage: 12,
    fireRate: 1.2,
    splashRadius: 40,
    slowFactor: 0.35, // 35% speed reduction
    slowDuration: 2.2, // seconds
    antiAir: false,
    projectileType: 'frost_shard',
    projectileSpeed: 360,
    tiers: [
      { tier: 1, cost: 0, damage: 12, range: 95, fireRate: 1.2, slowFactor: 0.35, slowDuration: 2.2, name: 'Cryo Mk I' },
      { tier: 2, cost: 90, damage: 24, range: 110, fireRate: 1.35, slowFactor: 0.45, slowDuration: 2.6, name: 'Cryo Mk II' },
      { tier: 3, cost: 165, damage: 42, range: 125, fireRate: 1.5, slowFactor: 0.55, slowDuration: 3.0, name: 'Cryo Mk III' }
    ],
    evolutions: {
      blizzard: {
        id: 'blizzard',
        name: 'Absolute Zero',
        icon: '🌨️',
        cost: 270,
        description: 'Sub-zero vortex slows all enemies by 65% in a massive radius and chills airborne units.',
        damage: 65,
        range: 145,
        fireRate: 1.6,
        slowFactor: 0.65,
        slowDuration: 3.8,
        antiAir: true,
        projectileType: 'blizzard_nova',
        projectileSpeed: 400
      },
      shatter: {
        id: 'shatter',
        name: 'Shatter Nova',
        icon: '💎',
        cost: 260,
        description: 'Brittle ice: targets afflicted by frost shatter upon receiving kinetic hits, dealing AOE shards.',
        damage: 90,
        range: 130,
        fireRate: 1.4,
        slowFactor: 0.50,
        slowDuration: 3.2,
        shatterDmg: 75,
        antiAir: false,
        projectileType: 'shatter_spike',
        projectileSpeed: 420
      }
    }
  },

  rocket: {
    id: 'rocket',
    name: 'Rocket Battery',
    icon: '🚀',
    color: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.4)',
    cost: 130,
    description: 'Long-range heat-seeking missiles with high blast damage. Targets ground and airborne enemies.',
    range: 145,
    damage: 70,
    fireRate: 0.65,
    splashRadius: 50,
    antiAir: true,
    projectileType: 'missile',
    projectileSpeed: 290,
    tiers: [
      { tier: 1, cost: 0, damage: 70, range: 145, fireRate: 0.65, splashRadius: 50, name: 'Rocket Mk I' },
      { tier: 2, cost: 110, damage: 120, range: 165, fireRate: 0.75, splashRadius: 60, name: 'Rocket Mk II' },
      { tier: 3, cost: 195, damage: 190, range: 185, fireRate: 0.85, splashRadius: 70, name: 'Rocket Mk III' }
    ],
    evolutions: {
      cluster_launcher: {
        id: 'cluster_launcher',
        name: 'Cluster Swarm',
        icon: '🎆',
        cost: 310,
        description: 'Fires cluster munitions that split mid-flight into 4 homing bomblets blanketing the lane.',
        damage: 260,
        range: 200,
        fireRate: 0.85,
        splashRadius: 85,
        bomblets: 4,
        antiAir: true,
        projectileType: 'cluster_missile',
        projectileSpeed: 310
      },
      emp_missile: {
        id: 'emp_missile',
        name: 'EMP Warhead',
        icon: '⚡',
        cost: 290,
        description: 'Electromagnetic warhead disables target systems, stunning all units in blast zone for 1.8s.',
        damage: 180,
        range: 190,
        fireRate: 0.7,
        splashRadius: 75,
        stunDuration: 1.8,
        antiAir: true,
        projectileType: 'emp_warhead',
        projectileSpeed: 320
      }
    }
  },

  laser: {
    id: 'laser',
    name: 'Photon Beam',
    icon: '🔦',
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    cost: 120,
    description: 'Continuous concentrated laser beam that steadily incinerates single targets without missing.',
    range: 120,
    damage: 32, // damage per tick (3 ticks per sec)
    fireRate: 3.0,
    splashRadius: 0,
    antiAir: true,
    projectileType: 'continuous_beam',
    projectileSpeed: 0,
    tiers: [
      { tier: 1, cost: 0, damage: 32, range: 120, fireRate: 3.0, name: 'Photon Mk I' },
      { tier: 2, cost: 95, damage: 55, range: 135, fireRate: 3.2, name: 'Photon Mk II' },
      { tier: 3, cost: 175, damage: 85, range: 150, fireRate: 3.5, name: 'Photon Mk III' }
    ],
    evolutions: {
      prism_laser: {
        id: 'prism_laser',
        name: 'Prism Overlord',
        icon: '🌈',
        cost: 290,
        description: 'Prismatic crystal refraction splits the beam to lock on and burn up to 3 enemies at once.',
        damage: 80,
        range: 165,
        fireRate: 3.5,
        maxTargets: 3,
        antiAir: true,
        projectileType: 'prism_beam',
        projectileSpeed: 0
      },
      melter_beam: {
        id: 'melter_beam',
        name: 'Infernal Melter',
        icon: '🔥',
        cost: 300,
        description: 'Thermal ramp-up: sustained lock on a single target increases damage by +20% each second (up to 300%).',
        damage: 110,
        range: 160,
        fireRate: 3.5,
        rampUpMultiplier: 3.0,
        antiAir: true,
        projectileType: 'melter_beam',
        projectileSpeed: 0
      }
    }
  },

  support: {
    id: 'support',
    name: 'Command Pylon',
    icon: '📡',
    color: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    cost: 115,
    description: 'Tactical aura generator that amplifies damage and tactical effectiveness of all nearby turrets.',
    range: 115,
    damage: 0,
    fireRate: 0,
    buffDamagePct: 0.18, // +18% damage
    buffSpeedPct: 0.12,  // +12% speed
    antiAir: false,
    projectileType: 'none',
    projectileSpeed: 0,
    tiers: [
      { tier: 1, cost: 0, range: 115, buffDamagePct: 0.18, buffSpeedPct: 0.12, name: 'Pylon Mk I' },
      { tier: 2, cost: 90, range: 130, buffDamagePct: 0.28, buffSpeedPct: 0.20, name: 'Pylon Mk II' },
      { tier: 3, cost: 160, range: 145, buffDamagePct: 0.38, buffSpeedPct: 0.28, name: 'Pylon Mk III' }
    ],
    evolutions: {
      amp_tower: {
        id: 'amp_tower',
        name: 'Resonance Matrix',
        icon: '🔋',
        cost: 260,
        description: 'High-yield power conduit granting massive +50% bonus kinetic & energy damage to nearby towers.',
        range: 160,
        buffDamagePct: 0.50,
        buffSpeedPct: 0.20,
        antiAir: false,
        projectileType: 'none',
        projectileSpeed: 0
      },
      overclock_pylon: {
        id: 'overclock_pylon',
        name: 'Overclock Relay',
        icon: '⚡',
        cost: 260,
        description: 'Supercharges weapon cycling mechanisms, boosting adjacent turrets attack speed by +50%.',
        range: 160,
        buffDamagePct: 0.20,
        buffSpeedPct: 0.50,
        antiAir: false,
        projectileType: 'none',
        projectileSpeed: 0
      }
    }
  }
};

/**
 * Calculate full current stats for a tower given its base type, tier, and evolution.
 */
export function getTowerStats(typeId, tier = 1, evolutionKey = null) {
  const base = TOWER_TYPES[typeId];
  if (!base) return null;

  if (tier === 4 && evolutionKey && base.evolutions && base.evolutions[evolutionKey]) {
    const evo = base.evolutions[evolutionKey];
    return {
      ...base,
      ...evo,
      tier: 4,
      isEvolved: true,
      evolutionKey
    };
  }

  const tierIndex = Math.min(Math.max(tier - 1, 0), base.tiers.length - 1);
  const tierData = base.tiers[tierIndex];

  return {
    ...base,
    ...tierData,
    tier,
    isEvolved: false,
    evolutionKey: null
  };
}

/**
 * Calculate total gold invested in a tower (base + all upgrades so far)
 */
export function calculateInvestedGold(typeId, tier = 1, evolutionKey = null) {
  const base = TOWER_TYPES[typeId];
  if (!base) return 0;

  let total = base.cost;
  for (let t = 2; t <= Math.min(tier, 3); t++) {
    total += base.tiers[t - 1].cost;
  }
  if (tier === 4 && evolutionKey && base.evolutions[evolutionKey]) {
    total += base.evolutions[evolutionKey].cost;
  }
  return total;
}

/**
 * 50% refund on sale
 */
export function calculateSellValue(typeId, tier = 1, evolutionKey = null) {
  const invested = calculateInvestedGold(typeId, tier, evolutionKey);
  return Math.floor(invested * 0.5);
}
