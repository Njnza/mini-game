/**
 * elements.js
 * Elemental Rune definitions, visual styles, and tier hierarchies.
 */

export const ELEMENTS = {
  fire: {
    id: 'fire',
    name: 'Hỏa Cổ (Fire)',
    icon: '🔥',
    baseColor: '#ef4444',
    secondaryColor: '#f97316',
    glowColor: 'rgba(239, 68, 68, 0.45)',
    particleColor: '#fca5a5'
  },
  water: {
    id: 'water',
    name: 'Thủy Nguyên (Water)',
    icon: '💧',
    baseColor: '#06b6d4',
    secondaryColor: '#3b82f6',
    glowColor: 'rgba(6, 182, 212, 0.45)',
    particleColor: '#67e8f9'
  },
  nature: {
    id: 'nature',
    name: 'Mộc Thần (Nature)',
    icon: '🍃',
    baseColor: '#10b981',
    secondaryColor: '#059669',
    glowColor: 'rgba(16, 185, 129, 0.45)',
    particleColor: '#6ee7b7'
  },
  lightning: {
    id: 'lightning',
    name: 'Lôi Điện (Lightning)',
    icon: '⚡',
    baseColor: '#f59e0b',
    secondaryColor: '#eab308',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    particleColor: '#fde047'
  },
  arcane: {
    id: 'arcane',
    name: 'Bí Thuật (Arcane)',
    icon: '✨',
    baseColor: '#8b5cf6',
    secondaryColor: '#7c3aed',
    glowColor: 'rgba(139, 92, 246, 0.5)',
    particleColor: '#c4b5fd'
  },
  prism: {
    id: 'prism',
    name: 'Lõi Toàn Năng (Prism Star)',
    icon: '💎',
    baseColor: '#ec4899',
    secondaryColor: '#f43f5e',
    glowColor: 'rgba(236, 72, 153, 0.6)',
    particleColor: '#fbcfe8'
  }
};

export const TIERS = {
  1: { level: 1, label: 'I', dots: 1, scoreMultiplier: 10 },
  2: { level: 2, label: 'II', dots: 2, scoreMultiplier: 25 },
  3: { level: 3, label: 'III', dots: 3, scoreMultiplier: 60 },
  4: { level: 4, label: 'IV (Max)', dots: 4, scoreMultiplier: 150 }
};

export function getRuneScore(tier, comboCount = 1) {
  const base = (TIERS[tier] ? TIERS[tier].scoreMultiplier : 10) * 10;
  return base * comboCount;
}
