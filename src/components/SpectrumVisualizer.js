/**
 * SpectrumVisualizer — Cyber Telemetry & Waveform Spectrum Display
 * 
 * Sits in the right-hand rounded screen of the Neumorphic Watch Device
 * (matching the track/audio visualizer in the reference design).
 */
export class SpectrumVisualizer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.clientWidth || 190;
    this.height = this.canvas.clientHeight || 110;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.isPlaying = true;
    this.time = 0;
    this.barsCount = 28;
    this.barHeights = new Float32Array(this.barsCount);

    this.initControls();
  }

  initControls() {
    const playBtn = document.getElementById('spectrum-play-btn');
    if (playBtn) {
      playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.isPlaying = !this.isPlaying;
        playBtn.textContent = this.isPlaying ? '❚❚' : '▶';
      });
    }
  }

  onResize() {
    if (!this.canvas) return;
    this.width = this.canvas.clientWidth || 190;
    this.height = this.canvas.clientHeight || 110;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  update() {
    if (!this.canvas) return;
    if (this.isPlaying) {
      this.time += 0.035;
    }
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    // Deep dark obsidian interior with subtle cyber glow
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#020408');
    bgGrad.addColorStop(1, '#050a14');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Fine background grid lines
    ctx.strokeStyle = 'rgba(116, 231, 255, 0.05)';
    ctx.lineWidth = 0.8;
    for (let x = 0; x < w; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 15) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Dynamic wave / spectrum bars
    const barWidth = (w - 24) / this.barsCount;
    const centerY = h * 0.55;

    for (let i = 0; i < this.barsCount; i++) {
      const freq1 = Math.sin(this.time * 2.2 + i * 0.45);
      const freq2 = Math.cos(this.time * 1.5 + i * 0.28);
      const freq3 = Math.sin(this.time * 3.8 + i * 0.8);
      
      const targetHeight = this.isPlaying 
        ? Math.abs(freq1 * 0.5 + freq2 * 0.35 + freq3 * 0.25) * (h * 0.4) + 4
        : 3;

      // Smooth bar lerping
      this.barHeights[i] += (targetHeight - this.barHeights[i]) * 0.2;
      const bHeight = this.barHeights[i];
      const x = 12 + i * barWidth;

      // Gradient from cyan to warm amber
      const barGrad = ctx.createLinearGradient(0, centerY - bHeight, 0, centerY + bHeight);
      barGrad.addColorStop(0, 'rgba(116, 231, 255, 0.95)');
      barGrad.addColorStop(0.5, 'rgba(201, 154, 85, 0.85)');
      barGrad.addColorStop(1, 'rgba(116, 231, 255, 0.3)');

      ctx.fillStyle = barGrad;
      ctx.fillRect(x, centerY - bHeight, barWidth - 2.5, bHeight * 2);
    }

    // Dynamic frequency curve across the top of bars
    ctx.strokeStyle = '#74e7ff';
    ctx.lineWidth = 1.2;
    ctx.shadowColor = '#74e7ff';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    for (let i = 0; i < this.barsCount; i++) {
      const x = 12 + i * barWidth + (barWidth - 2.5) / 2;
      const y = centerY - this.barHeights[i];
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Subtle audio wave scan line
    const scanX = ((this.time * 45) % (w - 24)) + 12;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(scanX, 8);
    ctx.lineTo(scanX, h - 8);
    ctx.stroke();
  }
}
