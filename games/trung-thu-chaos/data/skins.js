/**
 * skins.js
 * Character skins and customization for Chú Cuội.
 */

export const SKINS = {
  classic: {
    id: 'classic',
    name: 'Cuội Cổ Trang',
    title: 'Chú Cuội Truyền Thống',
    cost: 0,
    icon: '🎋',
    robeColor: '#b45309',
    robeSecondary: '#d97706',
    hatColor: '#ca8a04',
    branchColor: '#15803d',
    auraColor: 'rgba(251, 191, 36, 0.4)',
    unlocked: true,
    description: 'Trang phục cổ trang mộc mạc vá chằng vá đụp, nón lá truyền thống và cành đa quen thuộc.'
  },
  genz: {
    id: 'genz',
    name: 'Cuội Gen Z',
    title: 'Dân Chơi Cung Trăng',
    cost: 300,
    icon: '🕶️',
    robeColor: '#ea580c',
    robeSecondary: '#06b6d4',
    hatColor: '#3b82f6',
    branchColor: '#0ea5e9',
    auraColor: 'rgba(6, 182, 212, 0.5)',
    unlocked: false,
    description: 'Áo hoodie cam neon, kính râm đen cực ngầu, lướt cành đa công nghệ phản trọng lực!'
  },
  bunny: {
    id: 'bunny',
    name: 'Cuội Giả Thỏ',
    title: 'Thỏ Ngọc Gián Điệp',
    cost: 600,
    icon: '🐰',
    robeColor: '#ec4899',
    robeSecondary: '#f472b6',
    hatColor: '#fbcfe8',
    branchColor: '#f97316',
    auraColor: 'rgba(236, 72, 153, 0.5)',
    unlocked: false,
    description: 'Đội tai thỏ bông giả mạo Thỏ Ngọc để ăn vụng bánh mà không bị Chị Hằng phát hiện!'
  }
};

export function getSkinList() {
  return Object.values(SKINS);
}
