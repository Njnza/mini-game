/**
 * dialogues.js
 * Humorous dialogue system for Chị Hằng & Chú Cuội.
 */

export const CHI_HANG_REACTIONS = {
  strike: [
    'Cuội! Ngươi lại để rơi bánh của ta rồi à?!',
    'Một cái bánh nữa rơi rồi! Tiền lương tháng này trừ sạch!',
    'Mắt để đâu đấy hả Cuội?! Bánh có chân nó chạy mất kìa!',
    'Ta mà xuống đấy là cành đa của ngươi gãy đôi đó nha!'
  ],
  combo: [
    'Ồ, tay chân bữa nay cũng nhanh nhẹn gớm!',
    'Không tệ! Gom hết bánh về đây thưởng cho củ cà rốt!',
    'Tiếp tục đi Cuội! Đừng có vừa bắt vừa ăn vụng đấy!',
    'Chuỗi combo đỉnh quá! Chắc hôm nay ăn nhầm bùa chăm chỉ à?!'
  ],
  boss_enter: [
    'Thỏ Ngọc đình công quậy phá kìa! Mau giã nó giùm ta Cuội ơi!',
    'Đánh bại Thỏ Ngọc ta cho ngươi ngủ trưa thêm 15 phút!',
    'Thỏ Ngọc to đùng thế kia mà ngươi đánh hụt là ta giáng trần phạt luôn!'
  ],
  boss_defeat: [
    'Hay lắm Cuội! Đưa con thỏ béo đó về đây giã bánh tiếp!',
    'Không ngờ ngươi cũng có ngày làm được việc ra hồn thế này!'
  ]
};

export function getEndGameRating(mooncakesCaught, bossDefeated = false) {
  if (bossDefeated || mooncakesCaught >= 150) {
    return {
      grade: 'S',
      title: 'Huyền Thoại Cung Trăng 🌟',
      badge: 'Thánh Cuội Vô Song',
      quote: 'Cuội... ngươi khiến ta nghi ngờ nhân sinh quan! Xuất sắc ngoài sức tưởng tượng!',
      reactionIcon: '👸✨'
    };
  } else if (mooncakesCaught >= 100) {
    return {
      grade: 'A',
      title: 'Hiệp Sĩ Bánh Nướng 🥮',
      badge: 'Thợ Bắt Bánh Lành Nghề',
      quote: 'Rất khá! Ta quyết định hoãn việc ném ngươi xuống biển Đông thêm một mùa trăng nữa.',
      reactionIcon: '👸🎉'
    };
  } else if (mooncakesCaught >= 50) {
    return {
      grade: 'B',
      title: 'Tập Sự Cành Đa 🎋',
      badge: 'Bắt Bánh Đủ Chỉ Tiêu',
      quote: 'Tạm được. Nhưng ta thấy ngươi giấu ít nhất 3 cái bánh nhân thập cẩm trong tay áo rồi đấy!',
      reactionIcon: '👸🤔'
    };
  } else if (mooncakesCaught >= 20) {
    return {
      grade: 'C',
      title: 'Kẻ Ăn Vụng Cung Quảng 🥮',
      badge: 'Cuội Vụng Về',
      quote: 'Bắt được có tí bánh mà thở như trâu! Mau quét sạch lá đa quanh cung trăng ngay!',
      reactionIcon: '👸😤'
    };
  } else {
    return {
      grade: 'D',
      title: 'Nỗi Thất Vọng Toàn Vũ Trụ 💥',
      badge: 'Báo Thủ Cung Trăng',
      quote: 'Trời ơi Cuội! Ngươi là nỗi thất vọng lớn nhất trong lịch sử Cung Trăng từ thời lập địa!',
      reactionIcon: '👸🤦'
    };
  }
}
