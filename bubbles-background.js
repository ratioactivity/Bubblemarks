const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);
canvas.style.position = 'fixed';
canvas.style.top = 0;
canvas.style.left = 0;
canvas.style.width = '100%';
canvas.style.height = '100%';
canvas.style.zIndex = '-1';
canvas.style.pointerEvents = 'none';

let width, height;
function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Define colors and bubble properties
const colors = ['#fce4ec', '#e1f5fe', '#fff9c4', '#e0f7fa', '#f3e5f5'];
const bubbles = Array.from({ length: 80 }, () => ({
  x: Math.random() * width,
  y: Math.random() * height,
  r: Math.random() * 8 + 4,
  dx: (Math.random() - 0.5) * 0.5,
  dy: Math.random() * -0.5 - 0.1,
  color: colors[Math.floor(Math.random() * colors.length)],
  opacity: Math.random() * 0.6 + 0.3,
}));

function draw() {
  ctx.clearRect(0, 0, width, height);

  // Bubbles
  for (let bubble of bubbles) {
    ctx.beginPath();
    ctx.arc(bubble.x, bubble.y, bubble.r, 0, Math.PI * 2);
    ctx.fillStyle = bubble.color;
    ctx.globalAlpha = bubble.opacity;
    ctx.fill();
    ctx.globalAlpha = 1;

    bubble.x += bubble.dx;
    bubble.y += bubble.dy;

    // Wrap bubbles around the screen
    if (bubble.y + bubble.r < 0) bubble.y = height + bubble.r;
    if (bubble.x - bubble.r > width) bubble.x = -bubble.r;
    if (bubble.x + bubble.r < 0) bubble.x = width + bubble.r;
  }

  requestAnimationFrame(draw);
}
draw();
