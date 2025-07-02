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

// Draw one pass of the fluid‐halftone shapes
function drawHalftone(t) {
  const cell = BASE_SIZE / gridSize;
  ctx.lineWidth = cell * 0.05;

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const cx = (x + 0.5) * cell;
      const cy = (y + 0.5) * cell;
      let size = cell * 0.6;
      if (dynamic) {
        size = cell * (0.2 + 0.6 * Math.abs(Math.sin((x + y) / 2 + t)));
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
}

// Main draw loop
function drawFrame(t) {
  // 1) Background fill
  ctx.fillStyle = invert ? '#fff' : '#3b00ff';
  ctx.fillRect(0, 0, BASE_SIZE, BASE_SIZE);

  // 2) Draw the static ring grid
  const cell = BASE_SIZE / gridSize;
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

  // 3) Always draw the fluid‐halftone background
  ctx.globalCompositeOperation = 'source-over';
  drawHalftone(t);

  // 4) If there's text, overlay a **second pass** of your halftone 
  //    but only inside the white text you draw.
  if (textValue.trim()) {
    ctx.save();
    // draw the text in white
    ctx.font = 'bold 200px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(textValue, BASE_SIZE/2, BASE_SIZE/2);

    // now draw halftone only where that text was
    ctx.globalCompositeOperation = 'source-atop';
    drawHalftone(t);
    ctx.restore();
  }
}

// Export logic
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

// Animation & setup
function setup() {
  canvas.width  = BASE_SIZE;
  canvas.height = BASE_SIZE;

  // text input
  textInput.oninput = e => textValue = e.target.value;

  // pixel‐type buttons
  pixelBtns.forEach(btn => {
    if (btn.classList.contains('active')) pixelType = btn.dataset.type;
    btn.onclick = () => {
      pixelBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      pixelType = btn.dataset.type;
    };
  });

  // other controls
  gridSlider.oninput = () => gridSize = +gridSlider.value;
  invCheck.onchange   = () => invert   = invCheck.checked;
  dynCheck.onchange   = () => dynamic  = dynCheck.checked;
  scaleSel.onchange   = () => { scale = +scaleSel.value; updateRes(); };
  expBtn.onclick      = exportPNG;

  updateRes();
  requestAnimationFrame(function frame(ts){ drawFrame(time); time+=0.02; requestAnimationFrame(frame); });
}

function updateRes() {
  resLabel.textContent = `${BASE_SIZE * scale} × ${BASE_SIZE * scale}px, PNG`;
}

window.onload = setup;
