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

// draw a full halftone pass
function drawHalftone(t) {
  const cell = BASE_SIZE / gridSize;
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
          ctx.fillRect(cx-size/2, cy-size/2, size, size);
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

// main draw loop
function drawFrame() {
  // reset composite
  ctx.globalCompositeOperation = 'source-over';

  // 1) clear & fill background
  ctx.fillStyle = invert ? '#fff' : '#3b00ff';
  ctx.fillRect(0, 0, BASE_SIZE, BASE_SIZE);

  // 2) static ring grid
  const cell = BASE_SIZE / gridSize;
  ctx.lineWidth   = cell * 0.1;
  ctx.strokeStyle = invert ? '#3b00ff' : '#000';
  ctx.fillStyle   = invert ? '#3b00ff' : '#3b00ff';
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const cx = (x+0.5)*cell, cy=(y+0.5)*cell;
      ctx.beginPath();
      ctx.arc(cx, cy, cell*0.4, 0, Math.PI*2);
      ctx.fill();
      ctx.stroke();
    }
  }

  // 3) always draw background halftone shapes
  drawHalftone(time);

  // 4) if text, overlay a second halftone pass clipped to your letters
  if (textValue.trim()) {
    ctx.save();
    // draw text in white to define the mask
    ctx.font = 'bold 200px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(textValue, BASE_SIZE/2, BASE_SIZE/2);

    // clip to text
    ctx.globalCompositeOperation = 'source-atop';
    drawHalftone(time);
    ctx.restore();
  }

  time += 0.02;
  requestAnimationFrame(drawFrame);
}

// export function
function exportPNG() {
  const out = document.createElement('canvas');
  out.width  = BASE_SIZE*scale;
  out.height = BASE_SIZE*scale;
  const otc = out.getContext('2d');
  otc.drawImage(canvas,0,0,out.width,out.height);
  out.toBlob(b=>{
    const a=document.createElement('a');
    a.href=URL.createObjectURL(b);
    a.download='halftone-text.png';
    a.click();
  });
}

// init
function setup() {
  canvas.width  = BASE_SIZE;
  canvas.height = BASE_SIZE;

  textInput.oninput  = e => textValue = e.target.value;
  gridSlider.oninput = () => gridSize = +gridSlider.value;
  invCheck.onchange  = () => invert   = invCheck.checked;
  dynCheck.onchange  = () => dynamic  = dynCheck.checked;
  scaleSel.onchange  = () => { scale=+scaleSel.value; resLabel.textContent=`${BASE_SIZE*scale}×${BASE_SIZE*scale}px, PNG`; };
  expBtn.onclick     = exportPNG;

  pixelBtns.forEach(b=>{
    if(b.classList.contains('active')) pixelType=b.dataset.type;
    b.onclick=()=>{
      pixelBtns.forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      pixelType=b.dataset.type;
    };
  });

  resLabel.textContent = `${BASE_SIZE*scale} × ${BASE_SIZE*scale}px, PNG`;
  requestAnimationFrame(drawFrame);
}

window.onload = setup;
