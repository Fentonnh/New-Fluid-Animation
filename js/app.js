// DOM refs
const canvas     = document.getElementById('pixelCanvas');
const ctx        = canvas.getContext('2d');
const textInput  = document.getElementById('textInput');
const gridSlider = document.getElementById('gridSize');
const invCheck   = document.getElementById('invert');
const dynCheck   = document.getElementById('dynamic');
const scaleSel   = document.getElementById('scaleSelect');
const expBtn     = document.getElementById('exportBtn');
const resLabel   = document.getElementById('resolution');
const pixelBtns  = document.querySelectorAll('.pixel-btn');

// State
let textValue = '';
let gridSize  = +gridSlider.value;
let pixelType = 'ring';
let invert    = false;
let dynamic   = true;
let scale     = +scaleSel.value;
let time      = 0;

// Constants
const BASE_SIZE = 800;

// Setup (runs after DOM is loaded)
function setup() {
  canvas.width  = BASE_SIZE;
  canvas.height = BASE_SIZE;

  // Text input → state
  textInput.oninput = e => textValue = e.target.value;

  // Pixel‐type buttons
  pixelBtns.forEach(btn => {
    if (btn.classList.contains('active')) pixelType = btn.dataset.type;
    btn.onclick = () => {
      pixelBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      pixelType = btn.dataset.type;
    };
  });

  // Other controls
  gridSlider.oninput = () => gridSize = +gridSlider.value;
  invCheck.onchange   = () => invert   = invCheck.checked;
  dynCheck.onchange   = () => dynamic  = dynCheck.checked;
  scaleSel.onchange   = () => { scale = +scaleSel.value; updateRes(); };
  expBtn.onclick      = exportPNG;

  updateRes();
  requestAnimationFrame(animate);
}

// Update resolution label
function updateRes() {
  resLabel.textContent = `${BASE_SIZE * scale} × ${BASE_SIZE * scale}px, PNG`;
}

// Animation loop
function animate() {
  drawFrame(time);
  time += 0.02;
  requestAnimationFrame(animate);
}

// Draw one frame
function drawFrame(t) {
  const cell = BASE_SIZE / gridSize;

  // 1) Draw background rings
  ctx.fillStyle = invert ? '#fff' : '#3b00ff';
  ctx.fillRect(0, 0, BASE_SIZE, BASE_SIZE);
  ctx.lineWidth   = cell * 0.1;
  ctx.strokeStyle = invert ? '#3b00ff' : '#000';
  ctx.fillStyle   = invert ? '#3b00ff' : '#3b00ff';

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const cx = (x + 0.5) * cell;
      const cy = (y + 0.5) * cell;
      ctx.beginPath();
      ctx.arc(cx, cy, cell * 0.4, 0, Math.PI*2);
      ctx.fill();
      ctx.stroke();
    }
  }

  // 2) If text is present, mask halftone into text
  if (textValue.trim()) {
    ctx.save();
    ctx.font = 'bold 200px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(textValue, BASE_SIZE/2, BASE_SIZE/2);

    ctx.globalCompositeOperation = 'source-atop';
    ctx.lineWidth = cell * 0.05;

    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const cx = (x + 0.5) * cell;
        const cy = (y + 0.5) * cell;
        let size = cell * 0.6;
        if (dynamic) {
          size = cell * (0.2 + 0.6 * Math.abs(Math.sin((x+y)/2 + t)));
        }

        const fg = invert ? '#3b00ff' : '#e0606a';
        const bg = invert ? '#e0606a' : '#ccc';
        ctx.fillStyle   = fg;
        ctx.strokeStyle = fg;

        switch (pixelType) {
          case 'square':
            ctx.fillRect(cx - size/2, cy - size/2, size, size);
            break;
          case 'circle':
            ctx.beginPath();
            ctx.arc(cx, cy, size/2, 0, Math.PI*2);
            ctx.fill();
            break;
          case 'dot':
            ctx.beginPath();
            ctx.arc(cx, cy, size/2, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = bg;
            ctx.beginPath();
            ctx.arc(cx, cy, size/4, 0, Math.PI*2);
            ctx.fill();
            break;
          case 'ring':
            ctx.beginPath();
            ctx.arc(cx, cy, size/2, 0, Math.PI*2);
            ctx.stroke();
            break;
        }
      }
    }

    ctx.restore();
  }
}

// Export PNG
function exportPNG() {
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width  = BASE_SIZE * scale;
  exportCanvas.height = BASE_SIZE * scale;
  const ec = exportCanvas.getContext('2d');
  ec.drawImage(canvas, 0, 0,
               exportCanvas.width, exportCanvas.height);
  exportCanvas.toBlob(blob => {
    const link = document.createElement('a');
    link.download = 'halftone-text.png';
    link.href = URL.createObjectURL(blob);
    link.click();
  });
}

// Kick off after DOM is ready
window.onload = setup;
