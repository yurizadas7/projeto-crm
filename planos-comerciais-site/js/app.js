const canvas = document.getElementById("waterCanvas");
const ctx = canvas.getContext("2d", { alpha: false });

let width = 0;
let height = 0;
let waveBands = [];
let shimmer = [];
let pointerTargetX = 0.72;
let pointerTargetY = 0.34;
let pointerX = pointerTargetX;
let pointerY = pointerTargetY;

function resize() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  waveBands = Array.from({ length: 9 }, (_, index) => ({
    baseY: height * (0.08 + index * 0.115),
    amplitude: 22 + (index % 4) * 11,
    speed: 0.11 + index * 0.014,
    phase: index * 0.86,
    thickness: 0.8 + (index % 3) * 0.55,
    alpha: 0.035 + index * 0.006
  }));

  shimmer = Array.from({ length: Math.max(24, Math.floor(width / 46)) }, (_, index) => ({
    x: (index * 97) % width,
    y: (index * 157) % height,
    length: 90 + (index % 7) * 38,
    drift: 0.12 + (index % 6) * 0.028,
    phase: index * 0.51,
    alpha: 0.035 + (index % 5) * 0.018
  }));
}

function drawSoftBand(y, t, band, index) {
  const startX = -width * 0.12;
  const endX = width * 1.12;
  const controlGap = width / 4;
  const pulse = Math.sin(t * band.speed + band.phase);
  const y1 = y + pulse * band.amplitude;
  const y2 = y + Math.sin(t * band.speed * 1.35 + band.phase + 1.4) * band.amplitude * 0.72;

  const stroke = ctx.createLinearGradient(0, y - 60, width, y + 60);
  stroke.addColorStop(0, "rgba(216, 173, 85, 0)");
  stroke.addColorStop(0.24, `rgba(120, 96, 48, ${band.alpha})`);
  stroke.addColorStop(0.54, `rgba(255, 220, 145, ${band.alpha + 0.045})`);
  stroke.addColorStop(0.88, `rgba(216, 173, 85, ${band.alpha * 0.72})`);
  stroke.addColorStop(1, "rgba(216, 173, 85, 0)");

  ctx.strokeStyle = stroke;
  ctx.lineWidth = band.thickness;
  ctx.beginPath();
  ctx.moveTo(startX, y1);
  ctx.bezierCurveTo(
    startX + controlGap,
    y1 - band.amplitude * 1.35,
    startX + controlGap * 2,
    y2 + band.amplitude * 1.2,
    startX + controlGap * 3,
    y2
  );
  ctx.bezierCurveTo(
    startX + controlGap * 3.8,
    y2 - band.amplitude,
    endX - controlGap * 0.7,
    y1 + band.amplitude * 0.9,
    endX,
    y1 + Math.sin(t * band.speed + index) * 10
  );
  ctx.stroke();
}

function draw(time) {
  const t = time * 0.001;
  pointerX += (pointerTargetX - pointerX) * 0.035;
  pointerY += (pointerTargetY - pointerY) * 0.035;

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#030303");
  gradient.addColorStop(0.38, "#090806");
  gradient.addColorStop(0.74, "#050505");
  gradient.addColorStop(1, "#010101");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(pointerX * width, pointerY * height, 0, pointerX * width, pointerY * height, Math.max(width, height) * 0.62);
  glow.addColorStop(0, "rgba(241, 213, 144, 0.14)");
  glow.addColorStop(0.32, "rgba(216, 173, 85, 0.055)");
  glow.addColorStop(0.66, "rgba(95, 70, 29, 0.025)");
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  ctx.globalCompositeOperation = "screen";
  ctx.lineCap = "round";

  waveBands.forEach((band, index) => {
    drawSoftBand(band.baseY, t, band, index);
    drawSoftBand(band.baseY + height * 0.018, t + 2.8, { ...band, alpha: band.alpha * 0.48, thickness: band.thickness * 1.8 }, index);
  });

  shimmer.forEach((ripple, index) => {
    const x = (ripple.x + t * 34 * ripple.drift + Math.sin(t * 0.55 + ripple.phase) * 42) % (width + 240) - 120;
    const y = ripple.y + Math.sin(t * 0.36 + ripple.phase) * 54 + Math.cos(t * 0.2 + index) * 18;
    const wave = Math.sin(t * 0.72 + ripple.phase) * 16;

    const stroke = ctx.createLinearGradient(x, y, x + ripple.length, y + wave);
    stroke.addColorStop(0, `rgba(216, 173, 85, 0)`);
    stroke.addColorStop(0.28, `rgba(216, 173, 85, ${ripple.alpha})`);
    stroke.addColorStop(0.58, `rgba(255, 231, 166, ${ripple.alpha + 0.055})`);
    stroke.addColorStop(0.78, `rgba(187, 137, 55, ${ripple.alpha * 0.7})`);
    stroke.addColorStop(1, `rgba(216, 173, 85, 0)`);

    ctx.strokeStyle = stroke;
    ctx.lineWidth = 0.7 + (index % 4) * 0.48;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let step = 0; step <= 8; step += 1) {
      const progress = step / 8;
      const px = x + ripple.length * progress;
      const py = y + Math.sin(progress * Math.PI * 2 + t * 0.9 + ripple.phase) * (5 + (index % 4) * 1.8) + wave * progress;
      ctx.lineTo(px, py);
    }
    ctx.stroke();
  });

  ctx.globalCompositeOperation = "source-over";
  requestAnimationFrame(draw);
}

window.addEventListener("resize", resize);
window.addEventListener("pointermove", event => {
  pointerTargetX = event.clientX / Math.max(width, 1);
  pointerTargetY = event.clientY / Math.max(height, 1);
});

resize();
requestAnimationFrame(draw);
