/**
 * levels.js
 * 12 Handcrafted Campaign Levels with increasing difficulty and progressive mechanics.
 * Grid coordinates are based on a 20x14 tile grid (each tile = 40x40px, total canvas 800x560).
 * Tile types:
 * 0: Empty ground
 * 1: Indestructible Neon Wall
 * 2: Destructible Barricade (breaks on bullet/mine hit)
 * 3: Explosive Fuel Barrel (chain reaction AOE explosion)
 * 4: Alternating Laser Forcefield (toggles every 3.5s)
 * 5: Teleporter Alpha
 * 6: Teleporter Beta
 */

export const LEVEL_GRID_COLS = 20;
export const LEVEL_GRID_ROWS = 14;
export const TILE_SIZE = 40;

export const CAMPAIGN_LEVELS = [
  // LEVEL 1: Calibration Grid
  {
    id: 1,
    name: 'Sân Tập Tân Binh',
    titleEn: 'Calibration Grid',
    briefing: 'Làm quen góc đạn nảy! Bắn vào tường neon để viên đạn dội góc tiêu diệt 2 chòi canh.',
    playerSpawn: { col: 2, row: 7, angle: 0 },
    enemies: [
      { type: 'scout', col: 17, row: 3, angle: Math.PI },
      { type: 'scout', col: 17, row: 10, angle: Math.PI }
    ],
    // Custom wall placements: [col, row, type]
    tiles: [
      // Central bounce pillars
      [7, 3, 1], [7, 4, 1], [7, 9, 1], [7, 10, 1],
      [12, 5, 1], [12, 6, 1], [12, 7, 1], [12, 8, 1]
    ],
    starTime: 25,
    starDamage: 0
  },

  // LEVEL 2: Ricochet Corridor
  {
    id: 2,
    name: 'Hẻm Đạn Bắn Nảy',
    titleEn: 'Ricochet Corridor',
    briefing: 'Kẻ địch tuần tra sau góc khuất 90 độ. Ngắm đường đạn laser phản xạ để hạ gục chúng.',
    playerSpawn: { col: 2, row: 2, angle: 0 },
    enemies: [
      { type: 'striker', col: 17, row: 2, angle: Math.PI },
      { type: 'striker', col: 17, row: 11, angle: Math.PI },
      { type: 'scout', col: 9, row: 7, angle: 0 }
    ],
    tiles: [
      // Zig-zag corridors
      [5, 1, 1], [5, 2, 1], [5, 3, 1], [5, 4, 1],
      [5, 9, 1], [5, 10, 1], [5, 11, 1], [5, 12, 1],
      [10, 3, 1], [10, 4, 1], [10, 5, 1], [10, 8, 1], [10, 9, 1], [10, 10, 1],
      [14, 1, 1], [14, 2, 1], [14, 3, 1], [14, 10, 1], [14, 11, 1], [14, 12, 1]
    ],
    starTime: 30,
    starDamage: 0
  },

  // LEVEL 3: Fuel Depot
  {
    id: 3,
    name: 'Kho Nhiên Liệu Nổ',
    titleEn: 'Fuel Depot Explosions',
    briefing: 'Bắn trúng các thùng nhiên liệu đỏ để kích hoạt chuỗi vụ nổ lan rộng quét sạch quân địch!',
    playerSpawn: { col: 2, row: 7, angle: 0 },
    enemies: [
      { type: 'striker', col: 17, row: 3, angle: Math.PI },
      { type: 'striker', col: 17, row: 10, angle: Math.PI },
      { type: 'pyro', col: 13, row: 6, angle: Math.PI },
      { type: 'scout', col: 13, row: 7, angle: Math.PI }
    ],
    tiles: [
      // Barriers and explosive barrels (type 3)
      [6, 3, 1], [6, 4, 1], [6, 9, 1], [6, 10, 1],
      [10, 3, 3], [10, 10, 3], // Explosive barrels!
      [14, 4, 3], [14, 9, 3],
      [10, 6, 1], [10, 7, 1],
      [16, 6, 3], [16, 7, 3]
    ],
    starTime: 28,
    starDamage: 1
  },

  // LEVEL 4: Breakable Barricades
  {
    id: 4,
    name: 'Phá Vỡ Phòng Tuyến',
    titleEn: 'Breakable Barricades',
    briefing: 'Tường vàng có thể bắn phá hủy! Phá vỡ để mở đường ngắm bắn hoặc nhặt vật phẩm siêu cấp.',
    playerSpawn: { col: 2, row: 7, angle: 0 },
    enemies: [
      { type: 'pyro', col: 17, row: 2, angle: Math.PI },
      { type: 'pyro', col: 17, row: 11, angle: Math.PI },
      { type: 'striker', col: 14, row: 4, angle: Math.PI },
      { type: 'striker', col: 14, row: 9, angle: Math.PI }
    ],
    tiles: [
      // Solid walls & Destructible barricades (type 2)
      [6, 2, 2], [6, 3, 2], [6, 4, 1], [6, 9, 1], [6, 10, 2], [6, 11, 2],
      [10, 2, 1], [10, 3, 2], [10, 4, 2], [10, 9, 2], [10, 10, 2], [10, 11, 1],
      [10, 6, 2], [10, 7, 2],
      [13, 6, 3], [13, 7, 3] // Barrels
    ],
    starTime: 35,
    starDamage: 1
  },

  // LEVEL 5: Rail Sniper Outpost
  {
    id: 5,
    name: 'Tổ Bắn Tỉa Tầm Xa',
    titleEn: 'Rail Sniper Outpost',
    briefing: 'Cẩn thận tia ngắm laser đỏ từ xe tăng bắn tỉa tím! Đạn của chúng cực nhanh và nảy 2 lần.',
    playerSpawn: { col: 2, row: 6, angle: 0 },
    enemies: [
      { type: 'sniper', col: 17, row: 2, angle: Math.PI },
      { type: 'sniper', col: 17, row: 11, angle: Math.PI },
      { type: 'striker', col: 12, row: 4, angle: Math.PI },
      { type: 'striker', col: 12, row: 9, angle: Math.PI }
    ],
    tiles: [
      // Cover columns for tactical peeking
      [6, 3, 1], [6, 4, 1], [6, 9, 1], [6, 10, 1],
      [9, 6, 1], [9, 7, 1], [10, 6, 1], [10, 7, 1],
      [14, 3, 1], [14, 4, 1], [14, 9, 1], [14, 10, 1],
      [14, 6, 3], [14, 7, 3]
    ],
    starTime: 38,
    starDamage: 1
  },

  // LEVEL 6: Demolition Mortar
  {
    id: 6,
    name: 'Trận Địa Pháo Cối',
    titleEn: 'Demolition Mortar',
    briefing: 'Xe tăng vàng bắn đạn pháo cối vòng cung qua tường. Luôn di chuyển để không bị dính bom nổ!',
    playerSpawn: { col: 2, row: 2, angle: 0 },
    enemies: [
      { type: 'mortar', col: 17, row: 2, angle: Math.PI },
      { type: 'mortar', col: 17, row: 11, angle: Math.PI },
      { type: 'pyro', col: 10, row: 6, angle: Math.PI },
      { type: 'striker', col: 14, row: 6, angle: Math.PI }
    ],
    tiles: [
      // High defensive parapets
      [4, 5, 1], [4, 6, 1], [4, 7, 1], [4, 8, 1],
      [8, 2, 1], [8, 3, 1], [8, 10, 1], [8, 11, 1],
      [12, 4, 2], [12, 5, 2], [12, 8, 2], [12, 9, 2],
      [15, 2, 1], [15, 3, 1], [15, 10, 1], [15, 11, 1],
      [10, 6, 3], [10, 7, 3]
    ],
    starTime: 40,
    starDamage: 1
  },

  // LEVEL 7: Fortress Commander (Mini-Boss)
  {
    id: 7,
    name: 'Tử Chiến Chỉ Huy Pháo Đài',
    titleEn: 'Fortress Commander (Mini-Boss)',
    briefing: 'Xe tăng Chỉ Huy Hồng có lớp giáp dày và lá chắn năng lượng! Dùng mìn EMP và đạn nảy phá vỡ.',
    playerSpawn: { col: 2, row: 7, angle: 0 },
    enemies: [
      { type: 'commander', col: 16, row: 6, angle: Math.PI },
      { type: 'striker', col: 15, row: 2, angle: Math.PI },
      { type: 'striker', col: 15, row: 11, angle: Math.PI },
      { type: 'pyro', col: 9, row: 3, angle: Math.PI },
      { type: 'pyro', col: 9, row: 10, angle: Math.PI }
    ],
    tiles: [
      // Commander throne room fortified layout
      [5, 4, 1], [5, 5, 1], [5, 8, 1], [5, 9, 1],
      [10, 2, 2], [10, 3, 2], [10, 10, 2], [10, 11, 2],
      [12, 4, 1], [12, 5, 1], [12, 8, 1], [12, 9, 1],
      [14, 5, 3], [14, 8, 3],
      [18, 4, 1], [18, 9, 1]
    ],
    starTime: 45,
    starDamage: 2
  },

  // LEVEL 8: Laser Forcefield Matrix
  {
    id: 8,
    name: 'Lưới Laser Bảo Vệ',
    titleEn: 'Laser Forcefield Matrix',
    briefing: 'Cổng laser đỏ tự động bật tắt chu kỳ. Canh thời gian để vượt qua hoặc ép địch vào bẫy laser!',
    playerSpawn: { col: 2, row: 2, angle: 0 },
    enemies: [
      { type: 'sniper', col: 17, row: 2, angle: Math.PI },
      { type: 'sniper', col: 17, row: 11, angle: Math.PI },
      { type: 'striker', col: 13, row: 6, angle: Math.PI },
      { type: 'pyro', col: 8, row: 4, angle: Math.PI },
      { type: 'pyro', col: 8, row: 9, angle: Math.PI }
    ],
    tiles: [
      // Laser gates (type 4) across central choke points
      [6, 3, 1], [6, 4, 4], [6, 5, 4], [6, 6, 1],
      [6, 7, 1], [6, 8, 4], [6, 9, 4], [6, 10, 1],
      [11, 2, 1], [11, 3, 1], [11, 10, 1], [11, 11, 1],
      [15, 4, 4], [15, 5, 1], [15, 8, 1], [15, 9, 4]
    ],
    starTime: 42,
    starDamage: 1
  },

  // LEVEL 9: Warp Conduits
  {
    id: 9,
    name: 'Hành Lang Dịch Chuyển',
    titleEn: 'Warp Conduits',
    briefing: 'Cổng dịch chuyển màu tím chuyển tức thời cả xe tăng lẫn viên đạn sang phía bên kia võ đài!',
    playerSpawn: { col: 2, row: 7, angle: 0 },
    enemies: [
      { type: 'mortar', col: 17, row: 2, angle: Math.PI },
      { type: 'mortar', col: 17, row: 11, angle: Math.PI },
      { type: 'striker', col: 14, row: 6, angle: Math.PI },
      { type: 'pyro', col: 8, row: 2, angle: Math.PI },
      { type: 'pyro', col: 8, row: 11, angle: Math.PI }
    ],
    tiles: [
      // Teleporter Alpha (5) and Beta (6)
      [4, 3, 5], // Warp Alpha top-left
      [16, 10, 6], // Warp Beta bottom-right
      [4, 10, 6], // Warp Beta bottom-left
      [16, 3, 5], // Warp Alpha top-right
      // Dividing walls
      [10, 1, 1], [10, 2, 1], [10, 3, 1], [10, 4, 1],
      [10, 9, 1], [10, 10, 1], [10, 11, 1], [10, 12, 1],
      [7, 6, 2], [7, 7, 2], [13, 6, 2], [13, 7, 2]
    ],
    starTime: 45,
    starDamage: 1
  },

  // LEVEL 10: Minefield Gauntlet
  {
    id: 10,
    name: 'Bãi Mìn Tử Thần',
    titleEn: 'Minefield Gauntlet',
    briefing: 'Xe tàng hình xám ngầm rải mìn nổ! Nhắm bắn kích nổ từ xa và dùng đạn nảy tiêu diệt chúng.',
    playerSpawn: { col: 2, row: 2, angle: 0 },
    enemies: [
      { type: 'stealth', col: 17, row: 2, angle: Math.PI },
      { type: 'stealth', col: 17, row: 11, angle: Math.PI },
      { type: 'sniper', col: 11, row: 6, angle: Math.PI },
      { type: 'mortar', col: 15, row: 6, angle: Math.PI },
      { type: 'pyro', col: 8, row: 7, angle: Math.PI },
      { type: 'striker', col: 6, row: 11, angle: 0 }
    ],
    tiles: [
      // Intricate labyrinth layout
      [4, 2, 1], [4, 3, 1], [4, 4, 1], [4, 8, 1], [4, 9, 1], [4, 10, 1],
      [8, 4, 1], [8, 5, 2], [8, 8, 2], [8, 9, 1],
      [12, 2, 1], [12, 3, 1], [12, 10, 1], [12, 11, 1],
      [14, 5, 3], [14, 8, 3] // Fuel barrels
    ],
    starTime: 50,
    starDamage: 2
  },

  // LEVEL 11: Cyber Citadel
  {
    id: 11,
    name: 'Đại Quân Đột Kích',
    titleEn: 'Cyber Citadel Assault',
    briefing: 'Căn cứ đầu não với quân đoàn phòng thủ tinh nhuệ. Tận dụng tối đa siêu vũ khí và mìn EMP.',
    playerSpawn: { col: 2, row: 7, angle: 0 },
    enemies: [
      { type: 'commander', col: 16, row: 6, angle: Math.PI },
      { type: 'sniper', col: 17, row: 2, angle: Math.PI },
      { type: 'sniper', col: 17, row: 11, angle: Math.PI },
      { type: 'mortar', col: 12, row: 2, angle: Math.PI },
      { type: 'mortar', col: 12, row: 11, angle: Math.PI },
      { type: 'stealth', col: 10, row: 6, angle: Math.PI },
      { type: 'pyro', col: 6, row: 3, angle: Math.PI },
      { type: 'pyro', col: 6, row: 10, angle: Math.PI }
    ],
    tiles: [
      // Multi-layer stronghold
      [5, 2, 1], [5, 4, 2], [5, 9, 2], [5, 11, 1],
      [9, 3, 1], [9, 5, 4], [9, 8, 4], [9, 10, 1],
      [13, 2, 2], [13, 4, 1], [13, 9, 1], [13, 11, 2],
      [15, 6, 3], [15, 7, 3]
    ],
    starTime: 65,
    starDamage: 2
  },

  // LEVEL 12: APEX TITAN OVERLORD (Grand Boss Stage)
  {
    id: 12,
    name: 'Đại Chiến APEX TITAN MECH',
    titleEn: 'APEX TITAN OVERLORD',
    briefing: 'TRẬN CHIẾN TỐI HẬU! Siêu cơ giáp Titan với 3 giai đoạn: Khiên xoay, Mưa tên lửa, và Tia laser hủy diệt!',
    playerSpawn: { col: 3, row: 7, angle: 0 },
    enemies: [
      { type: 'boss', col: 15, row: 6, angle: Math.PI }
    ],
    tiles: [
      // Grand arena layout with 4 corner pillars and 2 central covers
      [6, 3, 1], [6, 4, 1], [6, 9, 1], [6, 10, 1],
      [14, 3, 1], [14, 4, 1], [14, 9, 1], [14, 10, 1],
      [10, 3, 3], [10, 10, 3], // Fuel barrels
      [2, 2, 2], [2, 11, 2], [17, 2, 2], [17, 11, 2]
    ],
    starTime: 80,
    starDamage: 3
  }
];
