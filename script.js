const target = document.getElementById('target');
const scoreDisplay = document.getElementById('score');
const timeDisplay = document.getElementById('time');
const startBtn = document.getElementById('start-btn');
const playArea = document.getElementById('play-area');

let score = 0;
let timeLeft = 30;
let timer = null;

function moveTarget() {
  const maxX = playArea.clientWidth - target.clientWidth;
  const maxY = playArea.clientHeight - target.clientHeight;
  const randomX = Math.floor(Math.random() * maxX);
  const randomY = Math.floor(Math.random() * maxY);
  target.style.left = `${randomX}px`;
  target.style.top = `${randomY}px`;
}

target.addEventListener('click', () => {
  score++;
  scoreDisplay.textContent = score;
  moveTarget();
});

startBtn.addEventListener('click', () => {
  score = 0;
  timeLeft = 30;
  scoreDisplay.textContent = score;
  timeDisplay.textContent = timeLeft;
  startBtn.disabled = true;
  target.style.display = 'block';
  moveTarget();

  timer = setInterval(() => {
    timeLeft--;
    timeDisplay.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timer);
      target.style.display = 'none';
      startBtn.disabled = false;
      alert(`Hết giờ! Điểm của bạn là: ${score}`);
    }
  }, 1000);
});
