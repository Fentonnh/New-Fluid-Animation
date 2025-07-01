// grab DOM
const canvas     = document.getElementById('pixelCanvas');
const ctx        = canvas.getContext('2d');
const gridSlider = document.getElementById('gridSize');
const invCheck   = document.getElementById('invert');
const dynCheck   = document.getElementById('dynamic');
const scaleSel   = document.getElementById('scaleSelect');
const expBtn     = document.getElementById('exportBtn');
const resLabel   = document.getElementById('resolution');
const pixelBtns  = document.querySelectorAll('.pixel-btn');

// state
let gridSize  = +gridSlider.value;
let pixelType = 'circle';
let invert    = false;
let dynamic   = true;
let scale     = +scaleSel.value;
let time      = 0;

// constants
const BASE_SIZE = 800;

// --- setup & listeners ---
function setup() {
  canvas.width  = BASE_SIZE;
  canvas.height = BASE_SIZE;

  // initial button state
  pixelBtns.forEach(btn => {
    if (btn.dataset.type === pixelType) btn.classList.add('active');
  });

  // UI listeners
  gridSlider.oninput = () => gridSize = +gridSlider.value;
  invCheck.onchange   = () => invert   = invCheck.checked;
  dynCheck.onchange   = () => dynamic  = dynCheck.checked;
  scaleSel.onchange   = () => { scale = +scaleSel.value; updateResLabel(); };

  pixelBtns.forEach(btn => btn.onclick = () => {
    pixelBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    pixelType = btn.dataset.type;
  });

  expBtn.onclick = exportPNG;

  updateResLabel();
  requestAnimationFrame(animate);
}

function updateResLabel() {
  resLabel.textContent = `${BASE_SIZE * scale} × ${BASE_SIZE * scale}px, PNG`;
}

// --- animation loop ---
function animate() {
  drawFrame(time);
  time += 0.02;
  requestAnimationFrame(animate);
}

// --- draw one frame ---
function drawFrame(t) {
  const cell = BASE_SIZE / gridSize;

  // 1) background
  ctx.fillStyle = invert ? '#fff' : '#3b00ff';
  ctx.fillRect(0, 0, BASE_SIZE, BASE_SIZE);

  // 2) static ring grid
  ctx.lineWidth   = cell * 0.1;
  ctx.strokeStyle = invert ? '#3b00ff' : '#000';
  ctx.fillStyle   = invert ? '#3b00ff' : '#3b00ff';
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const cx = (x + 0.5) * cell;
      const cy = (y + 0.5) * cell;
      ctx.beginPath();
      ctx.arc(cx, cy, cell * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  // 3) fluid halftone shapes
  ctx.lineWidth = cell * 0.05;
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const cx = (x + 0.5) * cell;
      const cy = (y + 0.5) * cell;
      // base size + animated “fluid” offset
      let size = cell * 0.6;
      if (dynamic) {
        size = cell * (0.2 + 0.6 * Math.abs(Math.sin((x + y) / 2 + t)));
      }

      // pick color
      const fg = invert ? '#3b00ff' : '#e0606a';
      const bg = invert ? '#e0606a' : '#ccc';
      ctx.fillStyle   = fg;
      ctx.strokeStyle = fg;

      switch (pixelType) {
        case 'square':
          ctx.fillRect(cx - size / 2, cy - size / 2, size, size);
          break;

        case 'circle':
          ctx.beginPath();
          ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'dot':
          ctx.beginPath();
          ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
          ctx.fill();
          // inner contrasting dot
          ctx.fillStyle = bg;
          ctx.beginPath();
          ctx.arc(cx, cy, size / 4, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'ring':
          ctx.beginPath();
          ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
          ctx.stroke();
          break;
      }
    }
  }

  // (the “ruri pixel” text is overlaid in CSS)
}

// --- export current frame as PNG ---
function exportPNG() {
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width  = BASE_SIZE * scale;
  exportCanvas.height = BASE_SIZE * scale;
  const ec = exportCanvas.getContext('2d');
  ec.drawImage(canvas, 0, 0, exportCanvas.width, exportCanvas.height);
  exportCanvas.toBlob(blob => {
    const link = document.createElement('a');
    link.download = 'ruri-pixel-halftone.png';
    link.href = URL.createObjectURL(blob);
    link.click();
  });
}

// start it up
window.onload = setup;
