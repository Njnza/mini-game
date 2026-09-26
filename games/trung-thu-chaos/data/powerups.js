/**
 * powerups.js
 * Power-up definitions and effects for Trung Thu Chaos.
 */

export const POWERUP_TYPES = {
  turbo_tree: {
    id: 'turbo_tree',
    name: 'Cây Đa Turbo',
    icon: '🌳⚡',
    color: '#10b981',
    duration: 4.5,
    description: 'Tăng tốc lướt gió, miễn nhiễm sát thương và hút toàn bộ bánh xung quanh!'
  },
  decoy_cake: {
    id: 'decoy_cake',
    name: 'Bánh Trăng Giả',
    icon: '🥮💫',
    color: '#f59e0b',
    duration: 5.0,
    description: 'Thả bánh giả nhử Thỏ Ngọc và quái vật đứng hình vì mê mẩn!'
  },
  lie_charm: {
    id: 'lie_charm',
    name: 'Bùa Nói Dối',
    icon: '👅✨',
    color: '#8b5cf6',
    duration: 4.0,
    description: 'Cuội tung tin vịt khiến toàn bộ kẻ địch hoang mang quay đầu bỏ chạy!'
  },
  giant_lantern: {
    id: 'giant_lantern',
    name: 'Lồng Đèn Hộ Thể',
    icon: '🏮👑',
    color: '#f43f5e',
    duration: 6.0,
    description: 'Lồng đèn sen vàng bọc quanh Cuội, đỡ đòn hiểm hóc từ chướng ngại!'
  },
  super_cake: {
    id: 'super_cake',
    name: 'Bánh Siêu Bổ',
    icon: '🥮❤️',
    color: '#ec4899',
    duration: 0, // Instant
    description: 'Hồi phục ngay lập tức 1 Bánh Mạng và xóa sạch 1 lỗi đánh rơi bánh!'
  }
};
