/**
 * levels.js
 * 12 Handcrafted, fair, and calculated puzzle levels with generous move budgets and achievable objectives.
 */

export const LEVELS = [
  {
    id: 1,
    title: 'Lửa Đầu Tiên',
    subtitle: 'Làm quen với cơ chế hợp nhất 3 khối Hỏa',
    radius: 2, // 19 hexes
    moves: 20,
    allowedElements: ['fire', 'water'],
    objective: {
      type: 'merge_tier',
      element: 'fire',
      targetTier: 2,
      count: 2,
      description: 'Hợp nhất tạo ra 2 Khối Hỏa cấp II'
    },
    obstacles: [],
    starScores: [400, 700, 1100],
    starMovesLeft: [3, 8, 13]
  },
  {
    id: 2,
    title: 'Dòng Thủy Triều',
    subtitle: 'Nâng cấp lên Lõi Thủy Nguyên cấp III',
    radius: 2,
    moves: 22,
    allowedElements: ['water', 'fire', 'nature'],
    objective: {
      type: 'merge_tier',
      element: 'water',
      targetTier: 3,
      count: 1,
      description: 'Tạo ra 1 Lõi Thủy Nguyên cấp III'
    },
    obstacles: [],
    starScores: [600, 1000, 1500],
    starMovesLeft: [3, 8, 13]
  },
  {
    id: 3,
    title: 'Băng Tuyết Phong Ấn',
    subtitle: 'Hợp nhất khối cạnh ô băng để phá vỡ chúng',
    radius: 2,
    moves: 24,
    allowedElements: ['fire', 'water', 'nature'],
    objective: {
      type: 'clear_ice',
      totalIce: 4,
      description: 'Phá hủy toàn bộ 4 ô Băng Tuyết phong ấn'
    },
    obstacles: [
      { q: 0, r: -1, type: 'ice', hp: 1 },
      { q: 1, r: -1, type: 'ice', hp: 1 },
      { q: -1, r: 1, type: 'ice', hp: 1 },
      { q: 0, r: 1, type: 'ice', hp: 1 }
    ],
    starScores: [800, 1300, 1900],
    starMovesLeft: [4, 9, 14]
  },
  {
    id: 4,
    title: 'Sấm Sét Rền Vang',
    subtitle: 'Khai mở nguyên tố Lôi Điện vàng kim',
    radius: 2,
    moves: 24,
    allowedElements: ['lightning', 'fire', 'nature'],
    objective: {
      type: 'merge_tier',
      element: 'lightning',
      targetTier: 3,
      count: 2,
      description: 'Tạo ra 2 Lõi Lôi Điện cấp III'
    },
    obstacles: [],
    starScores: [1000, 1600, 2400],
    starMovesLeft: [4, 9, 14]
  },
  {
    id: 5,
    title: 'Thung Lũng Cổ Thạch',
    subtitle: 'Vượt qua chướng ngại đá tảng không thể phá',
    radius: 2,
    moves: 26,
    allowedElements: ['fire', 'water', 'nature', 'lightning'],
    objective: {
      type: 'score',
      targetScore: 2200,
      description: 'Đạt 2,200 điểm trên địa hình hiểm trở'
    },
    obstacles: [
      { q: -1, r: 0, type: 'stone' },
      { q: 1, r: 0, type: 'stone' }
    ],
    starScores: [1500, 2200, 3000],
    starMovesLeft: [4, 9, 15]
  },
  {
    id: 6,
    title: 'Bí Thuật Huyền Không',
    subtitle: 'Khai mở nguyên tố Bí Thuật tím dạ quang',
    radius: 2,
    moves: 26,
    allowedElements: ['arcane', 'water', 'fire'],
    objective: {
      type: 'merge_tier',
      element: 'arcane',
      targetTier: 3,
      count: 2,
      description: 'Tạo ra 2 Lõi Bí Thuật Arcane cấp III'
    },
    obstacles: [],
    starScores: [1200, 2000, 3000],
    starMovesLeft: [4, 9, 15]
  },
  {
    id: 7,
    title: 'Khởi Sinh Lõi Toàn Năng',
    subtitle: 'Hợp nhất 3 Lõi cấp III tạo Prism Star',
    radius: 2,
    moves: 28,
    allowedElements: ['arcane', 'lightning', 'nature'],
    objective: {
      type: 'prism',
      count: 1,
      description: 'Hợp nhất thành công 1 Viên Ngọc Cầu Vồng (Prism)'
    },
    obstacles: [],
    starScores: [2000, 3200, 4500],
    starMovesLeft: [4, 10, 16]
  },
  {
    id: 8,
    title: 'Băng Dày Ngàn Năm',
    subtitle: 'Phá các ô băng dày cần 2 lần hợp nhất kề cạnh',
    radius: 2,
    moves: 28,
    allowedElements: ['fire', 'water', 'lightning'],
    objective: {
      type: 'clear_ice',
      totalIce: 5,
      description: 'Phá hủy 5 khối Băng Cổ Đại'
    },
    obstacles: [
      { q: 0, r: 0, type: 'ice', hp: 2 },
      { q: 1, r: -1, type: 'ice', hp: 2 },
      { q: -1, r: 1, type: 'ice', hp: 2 },
      { q: 1, r: 0, type: 'ice', hp: 1 },
      { q: -1, r: 0, type: 'ice', hp: 1 }
    ],
    starScores: [1800, 2800, 3800],
    starMovesLeft: [4, 10, 16]
  },
  {
    id: 9,
    title: 'Đại Trận Đồ Lục Giác',
    subtitle: 'Bàn cờ mở rộng với nhiều nguyên tố đồng quy',
    radius: 3, // 37 hexes
    moves: 30,
    allowedElements: ['fire', 'water', 'nature', 'lightning', 'arcane'],
    objective: {
      type: 'score_and_tier',
      element: 'fire',
      targetTier: 3,
      count: 2,
      targetScore: 3200,
      description: 'Tạo 2 Lõi Hỏa cấp III & đạt 3,200 điểm'
    },
    obstacles: [],
    starScores: [2500, 3500, 5000],
    starMovesLeft: [5, 11, 18]
  },
  {
    id: 10,
    title: 'Hòa Hợp Âm Dương',
    subtitle: 'Cân bằng song song Hỏa và Thủy trên cùng bàn cờ',
    radius: 3,
    moves: 30,
    allowedElements: ['fire', 'water', 'arcane'],
    objective: {
      type: 'dual_merge',
      elemA: 'fire',
      tierA: 3,
      elemB: 'water',
      tierB: 3,
      description: 'Tạo thành công 1 Lõi Hỏa cấp III VÀ 1 Lõi Thủy cấp III'
    },
    obstacles: [
      { q: 0, r: 0, type: 'stone' }
    ],
    starScores: [2800, 4000, 5500],
    starMovesLeft: [5, 11, 18]
  },
  {
    id: 11,
    title: 'Phong Ấn Bát Quái',
    subtitle: '6 khối băng độc bao vây tâm trận pháp',
    radius: 3,
    moves: 32,
    allowedElements: ['nature', 'lightning', 'arcane', 'water'],
    objective: {
      type: 'clear_ice',
      totalIce: 6,
      description: 'Giải phóng toàn bộ 6 khối Băng Độc bao vây tâm trận'
    },
    obstacles: [
      { q: 1, r: -1, type: 'ice', hp: 2 },
      { q: -1, r: 1, type: 'ice', hp: 2 },
      { q: 1, r: 0, type: 'ice', hp: 2 },
      { q: -1, r: 0, type: 'ice', hp: 2 },
      { q: 0, r: 1, type: 'ice', hp: 2 },
      { q: 0, r: -1, type: 'ice', hp: 2 }
    ],
    starScores: [3000, 4500, 6200],
    starMovesLeft: [5, 12, 19]
  },
  {
    id: 12,
    title: 'Đại Sư Giả Kim Tối Thượng',
    subtitle: 'Màn chơi đỉnh cao thử thách tư duy chiến thuật',
    radius: 3,
    moves: 35,
    allowedElements: ['fire', 'water', 'nature', 'lightning', 'arcane'],
    objective: {
      type: 'prism',
      count: 2,
      description: 'Hợp nhất thành công 2 Viên Ngọc Cầu Vồng (Prism Stars)'
    },
    obstacles: [
      { q: 0, r: -2, type: 'stone' },
      { q: 0, r: 2, type: 'stone' },
      { q: -2, r: 1, type: 'ice', hp: 2 },
      { q: 2, r: -1, type: 'ice', hp: 2 }
    ],
    starScores: [3800, 5500, 7500],
    starMovesLeft: [6, 13, 21]
  }
];

export function getLevelById(id) {
  return LEVELS.find(lvl => lvl.id === id) || LEVELS[0];
}
