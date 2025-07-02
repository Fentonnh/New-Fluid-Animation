// js/app.js

// ── DOM refs ─────────────────────────────────────────────────────────
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

// ── State ─────────────────────────────────────────────────────────────
let textValue = '';
let gridSize  = +gridSlider.value;
let pixelType = 'ring';
let invert    = false;
let dynamic   = true;
let scale     = +scaleSel.value;
let time      = 0;

// ── Constants ─────────────────────────────────────────────────────────
const BASE_SIZE = 800;

// ── Draw one full halftone pass ───────────────────────────────────────
function drawHalftone(t) {
  const cell = BASE_SIZE / gridSize;
  ctx.lineWidth = cell * 0.05;

  // single shape pass across entire grid
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const cx = (x + 0.5) * cell;
      const cy = (y + 0.5) * cell;
      let size = cell * 0.6;
      if (dynamic) {
        size = cell * (0.2 + 0.6 * Math.abs(Math.sin((x + y) / 2 + t)));
      }

      // pick colors (you can tweak these)
      const fg = invert ? '#3b00ff' : '#ccc';   // light gray on black
      const bg = invert ? '#ccc'   : '#121212'; // black on light gray when inverted
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
}

// ── Main draw loop ────────────────────────────────────────────────────
function drawFrame() {
  // start with a solid background
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = invert ? '#fff' : '#000';
  ctx.fillRect(0, 0, BASE_SIZE, BASE_SIZE);

  // 1) draw the fluid halftone behind everything
  drawHalftone(time);

  // 2) if there's text, overlay a second halftone pass clipped inside your letters
  if (textValue.trim()) {
    ctx.save();
    // draw your text mask
    ctx.font = 'bold 200px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = invert ? '#000' : '#fff';
    ctx.fillText(textValue, BASE_SIZE / 2, BASE_SIZE / 2);

    // only draw halftone where the text was
    ctx.globalCompositeOperation = 'source-atop';
    drawHalftone(time);

    ctx.restore();
  }

  time += 0.02;
  requestAnimationFrame(drawFrame);
}

// ── Export function ──────────────────────────────────────────────────
function exportPNG() {
  const out = document.createElement('canvas');
  out.width  = BASE_SIZE * scale;
  out.height = BASE_SIZE * scale;
  const octx = out.getContext('2d');
  octx.drawImage(canvas, 0, 0, out.width, out.height);
  out.toBlob(blob => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'halftone-text.png';
    a.click();
  });
}

// ── Initialization ───────────────────────────────────────────────────
function setup() {
  canvas.width  = BASE_SIZE;
  canvas.height = BASE_SIZE;

  // wire up controls
  textInput.oninput  = e => textValue = e.target.value;
  gridSlider.oninput = () => gridSize = +gridSlider.value;
  invCheck.onchange  = () => invert   = invCheck.checked;
  dynCheck.onchange  = () => dynamic  = dynCheck.checked;
  scaleSel.onchange  = () => { scale = +scaleSel.value; resLabel.textContent = `${BASE_SIZE*scale} × ${BASE_SIZE*scale}px, PNG`; };
  expBtn.onclick     = exportPNG;

  pixelBtns.forEach(b => {
    if (b.classList.contains('active')) pixelType = b.dataset.type;
    b.onclick = () => {
      pixelBtns.forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      pixelType = b.dataset.type;
    };
  });

  // set initial resolution label
  resLabel.textContent = `${BASE_SIZE*scale} × ${BASE_SIZE*scale}px, PNG`;

  // kick off the loop
  requestAnimationFrame(drawFrame);
}

window.onload = setup;
