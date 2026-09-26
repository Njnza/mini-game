/**
 * maps.js
 * 5 Handcrafted tactical maps with distinct themes, multi-path routing, and wave setups.
 */

export const MAPS = [
  {
    id: 'level-1',
    levelNumber: 1,
    name: 'Neon Outpost',
    theme: {
      name: 'Cyber Outpost',
      bgGradient: ['#090d16', '#0f172a'],
      gridColor: 'rgba(56, 189, 248, 0.07)',
      pathColor: '#1e293b',
      pathBorderColor: 'rgba(56, 189, 248, 0.35)',
      pathPulseColor: '#06b6d4',
      coreColor: '#38bdf8',
      spawnColor: '#f43f5e',
      obstacleColor: '#1e2235'
    },
    description: 'Single winding access corridor. Ideal for learning defensive positioning and turret synergies.',
    cols: 20,
    rows: 13,
    startingGold: 260,
    startingLives: 20,
    totalWaves: 10,
    spawns: [{ x: 0, y: 3, id: 'spawn-1' }],
    base: { x: 19, y: 9 },
    // Waypoints in grid tile coords [x, y]
    paths: [
      [
        { x: 0, y: 3 },
        { x: 5, y: 3 },
        { x: 5, y: 8 },
        { x: 10, y: 8 },
        { x: 10, y: 3 },
        { x: 15, y: 3 },
        { x: 15, y: 9 },
        { x: 19, y: 9 }
      ]
    ],
    obstacles: [
      { x: 2, y: 6 }, { x: 3, y: 6 }, { x: 12, y: 6 }, { x: 13, y: 6 }, { x: 7, y: 1 }, { x: 8, y: 1 }
    ],
    waveConfigs: [
      { wave: 1, enemies: [{ type: 'scout', count: 8, interval: 1.2 }] },
      { wave: 2, enemies: [{ type: 'scout', count: 6, interval: 1.0 }, { type: 'trooper', count: 6, interval: 1.4 }] },
      { wave: 3, enemies: [{ type: 'trooper', count: 12, interval: 1.2 }] },
      { wave: 4, enemies: [{ type: 'scout', count: 10, interval: 0.8 }, { type: 'tank', count: 2, interval: 2.5 }] },
      { wave: 5, enemies: [{ type: 'trooper', count: 10, interval: 1.0 }, { type: 'tank', count: 3, interval: 2.0 }] },
      { wave: 6, enemies: [{ type: 'scout', count: 14, interval: 0.7 }, { type: 'vanguard', count: 5, interval: 1.5 }] },
      { wave: 7, enemies: [{ type: 'tank', count: 5, interval: 2.0 }, { type: 'trooper', count: 10, interval: 1.0 }] },
      { wave: 8, enemies: [{ type: 'vanguard', count: 8, interval: 1.2 }, { type: 'scout', count: 12, interval: 0.8 }] },
      { wave: 9, enemies: [{ type: 'tank', count: 6, interval: 1.8 }, { type: 'vanguard', count: 8, interval: 1.2 }] },
      { wave: 10, enemies: [{ type: 'tank', count: 4, interval: 2.0 }, { type: 'boss', count: 1, interval: 3.0 }] }
    ]
  },

  {
    id: 'level-2',
    levelNumber: 2,
    name: 'Digital Forest',
    theme: {
      name: 'Emerald Circuit',
      bgGradient: ['#061511', '#0b241c'],
      gridColor: 'rgba(16, 185, 129, 0.08)',
      pathColor: '#0f2e24',
      pathBorderColor: 'rgba(16, 185, 129, 0.4)',
      pathPulseColor: '#10b981',
      coreColor: '#34d399',
      spawnColor: '#fb7185',
      obstacleColor: '#13392c'
    },
    description: 'Dense S-shaped circuit pathways. Vanguards immune to Cryo turrets begin penetrating your defenses.',
    cols: 20,
    rows: 13,
    startingGold: 280,
    startingLives: 20,
    totalWaves: 12,
    spawns: [{ x: 0, y: 1, id: 'spawn-1' }],
    base: { x: 19, y: 11 },
    paths: [
      [
        { x: 0, y: 1 },
        { x: 16, y: 1 },
        { x: 16, y: 4 },
        { x: 3, y: 4 },
        { x: 3, y: 8 },
        { x: 16, y: 8 },
        { x: 16, y: 11 },
        { x: 19, y: 11 }
      ]
    ],
    obstacles: [
      { x: 8, y: 2 }, { x: 9, y: 2 }, { x: 10, y: 2 },
      { x: 9, y: 6 }, { x: 10, y: 6 }, { x: 11, y: 6 },
      { x: 7, y: 10 }, { x: 8, y: 10 }
    ],
    waveConfigs: [
      { wave: 1, enemies: [{ type: 'scout', count: 10, interval: 1.1 }] },
      { wave: 2, enemies: [{ type: 'trooper', count: 10, interval: 1.2 }, { type: 'scout', count: 6, interval: 0.9 }] },
      { wave: 3, enemies: [{ type: 'vanguard', count: 6, interval: 1.4 }, { type: 'scout', count: 8, interval: 0.9 }] },
      { wave: 4, enemies: [{ type: 'tank', count: 3, interval: 2.2 }, { type: 'trooper', count: 8, interval: 1.1 }] },
      { wave: 5, enemies: [{ type: 'vanguard', count: 8, interval: 1.3 }, { type: 'tank', count: 3, interval: 2.0 }] },
      { wave: 6, enemies: [{ type: 'scout', count: 18, interval: 0.6 }] },
      { wave: 7, enemies: [{ type: 'splitter', count: 5, interval: 2.0 }, { type: 'trooper', count: 10, interval: 1.0 }] },
      { wave: 8, enemies: [{ type: 'vanguard', count: 10, interval: 1.2 }, { type: 'splitter', count: 6, interval: 1.8 }] },
      { wave: 9, enemies: [{ type: 'tank', count: 6, interval: 1.8 }, { type: 'scout', count: 14, interval: 0.7 }] },
      { wave: 10, enemies: [{ type: 'splitter', count: 8, interval: 1.6 }, { type: 'tank', count: 4, interval: 2.0 }] },
      { wave: 11, enemies: [{ type: 'vanguard', count: 12, interval: 1.0 }, { type: 'tank', count: 6, interval: 1.8 }] },
      { wave: 12, enemies: [{ type: 'boss', count: 1, interval: 3.0 }, { type: 'vanguard', count: 8, interval: 1.2 }] }
    ]
  },

  {
    id: 'level-3',
    levelNumber: 3,
    name: 'Silicon Dunes',
    theme: {
      name: 'Amber Wasteland',
      bgGradient: ['#1c1306', '#2a1d0b'],
      gridColor: 'rgba(245, 158, 11, 0.08)',
      pathColor: '#36240d',
      pathBorderColor: 'rgba(245, 158, 11, 0.4)',
      pathPulseColor: '#f59e0b',
      coreColor: '#fbbf24',
      spawnColor: '#f87171',
      obstacleColor: '#452e12'
    },
    description: 'Dual entry assault! Enemy legions approach from North and South wings before converging at the choke canyon.',
    cols: 20,
    rows: 13,
    startingGold: 320,
    startingLives: 20,
    totalWaves: 14,
    spawns: [
      { x: 0, y: 2, id: 'spawn-north' },
      { x: 0, y: 10, id: 'spawn-south' }
    ],
    base: { x: 19, y: 6 },
    // 2 Distinct paths converging in the middle!
    paths: [
      // Path 0: North entry
      [
        { x: 0, y: 2 },
        { x: 7, y: 2 },
        { x: 7, y: 5 },
        { x: 12, y: 5 },
        { x: 12, y: 6 },
        { x: 19, y: 6 }
      ],
      // Path 1: South entry
      [
        { x: 0, y: 10 },
        { x: 7, y: 10 },
        { x: 7, y: 7 },
        { x: 12, y: 7 },
        { x: 12, y: 6 },
        { x: 19, y: 6 }
      ]
    ],
    obstacles: [
      { x: 3, y: 5 }, { x: 3, y: 6 }, { x: 3, y: 7 },
      { x: 9, y: 2 }, { x: 9, y: 3 },
      { x: 9, y: 9 }, { x: 9, y: 10 },
      { x: 15, y: 3 }, { x: 15, y: 9 }
    ],
    waveConfigs: [
      { wave: 1, enemies: [{ type: 'scout', count: 10, interval: 1.1, pathIndex: 0 }, { type: 'scout', count: 10, interval: 1.1, pathIndex: 1 }] },
      { wave: 2, enemies: [{ type: 'trooper', count: 8, interval: 1.2, pathIndex: 0 }, { type: 'trooper', count: 8, interval: 1.2, pathIndex: 1 }] },
      { wave: 3, enemies: [{ type: 'scout', count: 8, interval: 0.9, pathIndex: 0 }, { type: 'tank', count: 2, interval: 2.2, pathIndex: 1 }] },
      { wave: 4, enemies: [{ type: 'vanguard', count: 6, interval: 1.3, pathIndex: 0 }, { type: 'splitter', count: 4, interval: 2.0, pathIndex: 1 }] },
      { wave: 5, enemies: [{ type: 'splitter', count: 6, interval: 1.8, pathIndex: 0 }, { type: 'tank', count: 4, interval: 2.0, pathIndex: 1 }] },
      { wave: 6, enemies: [{ type: 'scout', count: 14, interval: 0.7, pathIndex: 0 }, { type: 'scout', count: 14, interval: 0.7, pathIndex: 1 }] },
      { wave: 7, enemies: [{ type: 'airborne', count: 8, interval: 1.5, pathIndex: 0 }, { type: 'trooper', count: 10, interval: 1.0, pathIndex: 1 }] },
      { wave: 8, enemies: [{ type: 'vanguard', count: 8, interval: 1.2, pathIndex: 0 }, { type: 'vanguard', count: 8, interval: 1.2, pathIndex: 1 }] },
      { wave: 9, enemies: [{ type: 'airborne', count: 10, interval: 1.3, pathIndex: 1 }, { type: 'tank', count: 5, interval: 2.0, pathIndex: 0 }] },
      { wave: 10, enemies: [{ type: 'splitter', count: 8, interval: 1.6, pathIndex: 0 }, { type: 'splitter', count: 8, interval: 1.6, pathIndex: 1 }] },
      { wave: 11, enemies: [{ type: 'tank', count: 6, interval: 1.8, pathIndex: 0 }, { type: 'tank', count: 6, interval: 1.8, pathIndex: 1 }] },
      { wave: 12, enemies: [{ type: 'airborne', count: 12, interval: 1.1, pathIndex: 0 }, { type: 'vanguard', count: 10, interval: 1.1, pathIndex: 1 }] },
      { wave: 13, enemies: [{ type: 'tank', count: 8, interval: 1.6, pathIndex: 0 }, { type: 'splitter', count: 10, interval: 1.4, pathIndex: 1 }] },
      { wave: 14, enemies: [{ type: 'boss', count: 1, interval: 3.0, pathIndex: 0 }, { type: 'boss', count: 1, interval: 3.0, pathIndex: 1 }] }
    ]
  },

  {
    id: 'level-4',
    levelNumber: 4,
    name: 'Cryo Tundra',
    theme: {
      name: 'Arctic Nexus',
      bgGradient: ['#081726', '#0f2742'],
      gridColor: 'rgba(56, 189, 248, 0.08)',
      pathColor: '#173659',
      pathBorderColor: 'rgba(56, 189, 248, 0.45)',
      pathPulseColor: '#38bdf8',
      coreColor: '#7dd3fc',
      spawnColor: '#fb7185',
      obstacleColor: '#1a436e'
    },
    description: 'Intersecting double paths crossing at a frozen nexus. Frequent Aero Drone incursions fly directly over terrain!',
    cols: 20,
    rows: 13,
    startingGold: 360,
    startingLives: 20,
    totalWaves: 16,
    spawns: [
      { x: 0, y: 1, id: 'spawn-upper' },
      { x: 0, y: 11, id: 'spawn-lower' }
    ],
    base: { x: 19, y: 6 },
    paths: [
      // Path 0: Upper weaves down through center nexus to base
      [
        { x: 0, y: 1 },
        { x: 6, y: 1 },
        { x: 6, y: 6 },
        { x: 13, y: 6 },
        { x: 13, y: 2 },
        { x: 17, y: 2 },
        { x: 17, y: 6 },
        { x: 19, y: 6 }
      ],
      // Path 1: Lower weaves up through center nexus to base
      [
        { x: 0, y: 11 },
        { x: 6, y: 11 },
        { x: 6, y: 6 },
        { x: 13, y: 6 },
        { x: 13, y: 10 },
        { x: 17, y: 10 },
        { x: 17, y: 6 },
        { x: 19, y: 6 }
      ]
    ],
    obstacles: [
      { x: 3, y: 3 }, { x: 3, y: 4 }, { x: 3, y: 8 }, { x: 3, y: 9 },
      { x: 9, y: 3 }, { x: 10, y: 3 }, { x: 9, y: 9 }, { x: 10, y: 9 },
      { x: 15, y: 5 }, { x: 15, y: 7 }
    ],
    waveConfigs: [
      { wave: 1, enemies: [{ type: 'scout', count: 12, interval: 1.0, pathIndex: 0 }] },
      { wave: 2, enemies: [{ type: 'trooper', count: 10, interval: 1.1, pathIndex: 1 }, { type: 'scout', count: 8, interval: 0.9, pathIndex: 0 }] },
      { wave: 3, enemies: [{ type: 'airborne', count: 6, interval: 1.5, pathIndex: 0 }, { type: 'trooper', count: 8, interval: 1.2, pathIndex: 1 }] },
      { wave: 4, enemies: [{ type: 'vanguard', count: 8, interval: 1.2, pathIndex: 0 }, { type: 'tank', count: 3, interval: 2.0, pathIndex: 1 }] },
      { wave: 5, enemies: [{ type: 'airborne', count: 8, interval: 1.4, pathIndex: 1 }, { type: 'splitter', count: 6, interval: 1.8, pathIndex: 0 }] },
      { wave: 6, enemies: [{ type: 'scout', count: 16, interval: 0.6, pathIndex: 0 }, { type: 'scout', count: 16, interval: 0.6, pathIndex: 1 }] },
      { wave: 7, enemies: [{ type: 'tank', count: 5, interval: 2.0, pathIndex: 0 }, { type: 'vanguard', count: 8, interval: 1.2, pathIndex: 1 }] },
      { wave: 8, enemies: [{ type: 'airborne', count: 12, interval: 1.2, pathIndex: 0 }, { type: 'splitter', count: 6, interval: 1.6, pathIndex: 1 }] },
      { wave: 9, enemies: [{ type: 'vanguard', count: 10, interval: 1.1, pathIndex: 0 }, { type: 'tank', count: 6, interval: 1.8, pathIndex: 1 }] },
      { wave: 10, enemies: [{ type: 'splitter', count: 10, interval: 1.5, pathIndex: 0 }, { type: 'airborne', count: 10, interval: 1.2, pathIndex: 1 }] },
      { wave: 11, enemies: [{ type: 'tank', count: 7, interval: 1.8, pathIndex: 0 }, { type: 'tank', count: 7, interval: 1.8, pathIndex: 1 }] },
      { wave: 12, enemies: [{ type: 'airborne', count: 15, interval: 1.0, pathIndex: 0 }, { type: 'vanguard', count: 12, interval: 1.0, pathIndex: 1 }] },
      { wave: 13, enemies: [{ type: 'splitter', count: 12, interval: 1.3, pathIndex: 0 }, { type: 'tank', count: 8, interval: 1.7, pathIndex: 1 }] },
      { wave: 14, enemies: [{ type: 'airborne', count: 16, interval: 0.9, pathIndex: 1 }, { type: 'vanguard', count: 14, interval: 0.9, pathIndex: 0 }] },
      { wave: 15, enemies: [{ type: 'tank', count: 10, interval: 1.5, pathIndex: 0 }, { type: 'splitter', count: 12, interval: 1.3, pathIndex: 1 }] },
      { wave: 16, enemies: [{ type: 'boss', count: 1, interval: 3.0, pathIndex: 0 }, { type: 'tank', count: 6, interval: 2.0, pathIndex: 1 }, { type: 'airborne', count: 8, interval: 1.5, pathIndex: 0 }] }
    ]
  },

  {
    id: 'level-5',
    levelNumber: 5,
    name: 'Neo Metropolis',
    theme: {
      name: 'Cyberpunk Citadel',
      bgGradient: ['#120824', '#210e3d'],
      gridColor: 'rgba(236, 72, 153, 0.08)',
      pathColor: '#361552',
      pathBorderColor: 'rgba(236, 72, 153, 0.45)',
      pathPulseColor: '#ec4899',
      coreColor: '#f43f5e',
      spawnColor: '#06b6d4',
      obstacleColor: '#451b69'
    },
    description: 'Triple-entry siege on the central Citadel! Swarms converge from North, Center, and South while the Omega Behemoth approaches!',
    cols: 20,
    rows: 13,
    startingGold: 420,
    startingLives: 20,
    totalWaves: 18,
    spawns: [
      { x: 0, y: 1, id: 'spawn-top' },
      { x: 0, y: 6, id: 'spawn-mid' },
      { x: 0, y: 11, id: 'spawn-bot' }
    ],
    base: { x: 19, y: 6 },
    paths: [
      // Path 0: Top flank
      [
        { x: 0, y: 1 },
        { x: 8, y: 1 },
        { x: 8, y: 3 },
        { x: 14, y: 3 },
        { x: 14, y: 5 },
        { x: 19, y: 6 }
      ],
      // Path 1: Straight middle lane
      [
        { x: 0, y: 6 },
        { x: 5, y: 6 },
        { x: 5, y: 8 },
        { x: 11, y: 8 },
        { x: 11, y: 6 },
        { x: 19, y: 6 }
      ],
      // Path 2: Bottom flank
      [
        { x: 0, y: 11 },
        { x: 8, y: 11 },
        { x: 8, y: 9 },
        { x: 14, y: 9 },
        { x: 14, y: 7 },
        { x: 19, y: 6 }
      ]
    ],
    obstacles: [
      { x: 4, y: 2 }, { x: 4, y: 3 }, { x: 4, y: 4 },
      { x: 4, y: 9 }, { x: 4, y: 10 },
      { x: 10, y: 1 }, { x: 10, y: 2 },
      { x: 10, y: 10 }, { x: 10, y: 11 },
      { x: 16, y: 2 }, { x: 16, y: 10 }
    ],
    waveConfigs: [
      { wave: 1, enemies: [{ type: 'scout', count: 6, interval: 1.0, pathIndex: 0 }, { type: 'scout', count: 6, interval: 1.0, pathIndex: 1 }, { type: 'scout', count: 6, interval: 1.0, pathIndex: 2 }] },
      { wave: 2, enemies: [{ type: 'trooper', count: 6, interval: 1.2, pathIndex: 0 }, { type: 'trooper', count: 6, interval: 1.2, pathIndex: 1 }, { type: 'trooper', count: 6, interval: 1.2, pathIndex: 2 }] },
      { wave: 3, enemies: [{ type: 'vanguard', count: 5, interval: 1.3, pathIndex: 0 }, { type: 'scout', count: 8, interval: 0.8, pathIndex: 1 }, { type: 'trooper', count: 6, interval: 1.1, pathIndex: 2 }] },
      { wave: 4, enemies: [{ type: 'airborne', count: 6, interval: 1.4, pathIndex: 1 }, { type: 'tank', count: 3, interval: 2.0, pathIndex: 0 }, { type: 'tank', count: 3, interval: 2.0, pathIndex: 2 }] },
      { wave: 5, enemies: [{ type: 'splitter', count: 5, interval: 1.8, pathIndex: 0 }, { type: 'splitter', count: 5, interval: 1.8, pathIndex: 2 }, { type: 'vanguard', count: 6, interval: 1.2, pathIndex: 1 }] },
      { wave: 6, enemies: [{ type: 'scout', count: 12, interval: 0.6, pathIndex: 0 }, { type: 'scout', count: 12, interval: 0.6, pathIndex: 1 }, { type: 'scout', count: 12, interval: 0.6, pathIndex: 2 }] },
      { wave: 7, enemies: [{ type: 'tank', count: 4, interval: 2.0, pathIndex: 0 }, { type: 'airborne', count: 8, interval: 1.2, pathIndex: 1 }, { type: 'tank', count: 4, interval: 2.0, pathIndex: 2 }] },
      { wave: 8, enemies: [{ type: 'vanguard', count: 8, interval: 1.1, pathIndex: 0 }, { type: 'splitter', count: 6, interval: 1.6, pathIndex: 1 }, { type: 'vanguard', count: 8, interval: 1.1, pathIndex: 2 }] },
      { wave: 9, enemies: [{ type: 'airborne', count: 10, interval: 1.1, pathIndex: 0 }, { type: 'tank', count: 5, interval: 1.8, pathIndex: 1 }, { type: 'airborne', count: 10, interval: 1.1, pathIndex: 2 }] },
      { wave: 10, enemies: [{ type: 'splitter', count: 8, interval: 1.5, pathIndex: 0 }, { type: 'splitter', count: 8, interval: 1.5, pathIndex: 2 }, { type: 'tank', count: 6, interval: 1.8, pathIndex: 1 }] },
      { wave: 11, enemies: [{ type: 'vanguard', count: 10, interval: 1.0, pathIndex: 0 }, { type: 'vanguard', count: 10, interval: 1.0, pathIndex: 1 }, { type: 'vanguard', count: 10, interval: 1.0, pathIndex: 2 }] },
      { wave: 12, enemies: [{ type: 'tank', count: 6, interval: 1.7, pathIndex: 0 }, { type: 'airborne', count: 12, interval: 1.0, pathIndex: 1 }, { type: 'tank', count: 6, interval: 1.7, pathIndex: 2 }] },
      { wave: 13, enemies: [{ type: 'splitter', count: 10, interval: 1.3, pathIndex: 0 }, { type: 'splitter', count: 10, interval: 1.3, pathIndex: 2 }, { type: 'vanguard', count: 12, interval: 0.9, pathIndex: 1 }] },
      { wave: 14, enemies: [{ type: 'airborne', count: 15, interval: 0.9, pathIndex: 0 }, { type: 'tank', count: 8, interval: 1.6, pathIndex: 1 }, { type: 'airborne', count: 15, interval: 0.9, pathIndex: 2 }] },
      { wave: 15, enemies: [{ type: 'tank', count: 8, interval: 1.5, pathIndex: 0 }, { type: 'tank', count: 8, interval: 1.5, pathIndex: 2 }, { type: 'splitter', count: 12, interval: 1.2, pathIndex: 1 }] },
      { wave: 16, enemies: [{ type: 'vanguard', count: 15, interval: 0.8, pathIndex: 0 }, { type: 'vanguard', count: 15, interval: 0.8, pathIndex: 1 }, { type: 'vanguard', count: 15, interval: 0.8, pathIndex: 2 }] },
      { wave: 17, enemies: [{ type: 'airborne', count: 18, interval: 0.8, pathIndex: 1 }, { type: 'tank', count: 10, interval: 1.4, pathIndex: 0 }, { type: 'tank', count: 10, interval: 1.4, pathIndex: 2 }] },
      { wave: 18, enemies: [{ type: 'boss', count: 1, interval: 3.0, pathIndex: 1 }, { type: 'tank', count: 6, interval: 1.8, pathIndex: 0 }, { type: 'tank', count: 6, interval: 1.8, pathIndex: 2 }, { type: 'airborne', count: 10, interval: 1.2, pathIndex: 1 }] }
    ]
  }
];

export function getMapById(id) {
  return MAPS.find(m => m.id === id) || MAPS[0];
}
