// High-Fidelity Realistic Glass Hourglass with Granular Sand Simulation (Image 2 Reference)

export class RealisticHourglass {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.clientWidth || 320;
    this.height = canvas.clientHeight || 460;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.sandLevelTop = 1.0; // 1.0 = full, drains to 0.0
    this.sandLevelBottom = 0.0; // 0.0 = empty, fills to 1.0
    this.fallingGrains = [];
    this.streamParticles = [];
    this.binaryGlows = [];

    this.time = 0;
    this.initSimulation();
  }

  initSimulation() {
    this.sandLevelTop = 0.85;
    this.sandLevelBottom = 0.15;
    this.fallingGrains = [];
    this.streamParticles = [];
    this.binaryGlows = [];

    // Pre-seed stream particles
    for (let i = 0; i < 40; i++) {
      this.streamParticles.push({
        x: this.width / 2 + (Math.random() - 0.5) * 4,
        y: this.height / 2 - 20 + Math.random() * (this.height / 2 - 40),
        vy: 3.5 + Math.random() * 2.0,
        size: 1.2 + Math.random() * 1.0,
        color: Math.random() > 0.3 ? '#d4a574' : '#f0cf98'
      });
    }
  }

  onResize() {
    this.width = this.canvas.clientWidth || 320;
    this.height = this.canvas.clientHeight || 460;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  update() {
    this.time += 0.016;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    // Draining rate
    if (this.sandLevelTop > 0.05) {
      this.sandLevelTop -= 0.00015;
      this.sandLevelBottom += 0.00015;
    } else {
      // Loop simulation
      this.sandLevelTop = 0.85;
      this.sandLevelBottom = 0.15;
    }

    // ==========================================
    // 1. DRAW BRASS / BRONZE MOUNTING CAPS
    // ==========================================
    const drawBrassPlate = (y, isTop) => {
      ctx.save();
      // Outer brass shadow
      ctx.fillStyle = '#8a6538';
      ctx.beginPath();
      ctx.ellipse(cx, y + (isTop ? -2 : 4), 78, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Metallic gradient plate
      const grad = ctx.createLinearGradient(cx - 75, y, cx + 75, y);
      grad.addColorStop(0, '#594022');
      grad.addColorStop(0.3, '#c99f67');
      grad.addColorStop(0.5, '#ffd89b');
      grad.addColorStop(0.7, '#a87948');
      grad.addColorStop(1, '#422c15');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(cx, y, 75, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 230, 180, 0.6)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Concentric metallic ring detail
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx, y, 50, 8, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    };

    drawBrassPlate(35, true);   // Top brass plate
    drawBrassPlate(h - 35, false); // Bottom brass plate

    // ==========================================
    // 2. GLASS BULB INNER CLIP & SAND MASS
    // ==========================================
    ctx.save();

    // Define Glass Outer Boundary Path
    ctx.beginPath();
    ctx.moveTo(cx - 68, 45);
    // Upper bulb curve down to neck
    ctx.bezierCurveTo(cx - 72, 110, cx - 18, cy - 25, cx - 8, cy);
    // Lower bulb curve down to bottom
    ctx.bezierCurveTo(cx - 18, cy + 25, cx - 72, h - 110, cx - 68, h - 45);
    ctx.lineTo(cx + 68, h - 45);
    // Right bulb curve back up
    ctx.bezierCurveTo(cx + 72, h - 110, cx + 18, cy + 25, cx + 8, cy);
    ctx.bezierCurveTo(cx + 18, cy - 25, cx + 72, 110, cx + 68, 45);
    ctx.closePath();

    // Fill glass background (deep obsidian with ambient depth)
    ctx.fillStyle = 'rgba(7, 13, 26, 0.4)';
    ctx.fill();

    // ==========================================
    // 3. UPPER BULB SAND MASS (Diminishing level)
    // ==========================================
    const topSandHeight = 55 + (1 - this.sandLevelTop) * 110;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - 68, 45);
    ctx.bezierCurveTo(cx - 72, 110, cx - 18, cy - 25, cx - 8, cy);
    ctx.lineTo(cx + 8, cy);
    ctx.bezierCurveTo(cx + 18, cy - 25, cx + 72, 110, cx + 68, 45);
    ctx.closePath();
    ctx.clip(); // Clip within upper bulb

    // Draw Sand Body
    const sandGrad = ctx.createLinearGradient(cx, topSandHeight, cx, cy);
    sandGrad.addColorStop(0, '#e5be8a');
    sandGrad.addColorStop(0.5, '#c99b5d');
    sandGrad.addColorStop(1, '#a6783d');

    ctx.fillStyle = sandGrad;
    ctx.beginPath();
    // Funnel shape on top surface
    ctx.moveTo(cx - 65, topSandHeight);
    ctx.quadraticCurveTo(cx, topSandHeight + 25, cx + 65, topSandHeight);
    ctx.lineTo(cx + 15, cy);
    ctx.lineTo(cx - 15, cy);
    ctx.closePath();
    ctx.fill();

    // Fine Sand Texture Grains (Noise texture overlay)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    for (let i = 0; i < 90; i++) {
      const gx = cx - 50 + Math.random() * 100;
      const gy = topSandHeight + 10 + Math.random() * (cy - topSandHeight - 15);
      ctx.fillRect(gx, gy, 1.2, 1.2);
    }
    ctx.restore();

    // ==========================================
    // 4. LOWER BULB CONICAL SAND PILE (Building cone)
    // ==========================================
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - 68, h - 45);
    ctx.bezierCurveTo(cx - 72, h - 110, cx - 18, cy + 25, cx - 8, cy);
    ctx.lineTo(cx + 8, cy);
    ctx.bezierCurveTo(cx + 18, cy + 25, cx + 72, h - 110, cx + 68, h - 45);
    ctx.closePath();
    ctx.clip(); // Clip within lower bulb

    const coneHeight = (h - 50) - this.sandLevelBottom * 110;
    const coneRadius = 25 + this.sandLevelBottom * 40;

    const botSandGrad = ctx.createLinearGradient(cx, coneHeight, cx, h - 45);
    botSandGrad.addColorStop(0, '#f3d4a4');
    botSandGrad.addColorStop(0.4, '#c99b5d');
    botSandGrad.addColorStop(1, '#8c5f28');

    ctx.fillStyle = botSandGrad;
    ctx.beginPath();
    // Conical pile with physical angle of repose
    ctx.moveTo(cx - coneRadius, h - 45);
    ctx.quadraticCurveTo(cx - coneRadius * 0.4, coneHeight + 15, cx, coneHeight);
    ctx.quadraticCurveTo(cx + coneRadius * 0.4, coneHeight + 15, cx + coneRadius, h - 45);
    ctx.closePath();
    ctx.fill();

    // Sand grain texture in bottom pile
    ctx.fillStyle = 'rgba(255, 235, 190, 0.2)';
    for (let i = 0; i < 110; i++) {
      const gx = cx - coneRadius * 0.8 + Math.random() * (coneRadius * 1.6);
      const gy = coneHeight + 15 + Math.random() * (h - 55 - coneHeight);
      ctx.fillRect(gx, gy, 1.2, 1.2);
    }
    ctx.restore();

    // ==========================================
    // 5. CONTINUOUS FALLING SAND STREAM & BEAM
    // ==========================================
    // Solid streaming beam
    ctx.save();
    const beamGrad = ctx.createLinearGradient(cx - 2, cy, cx + 2, coneHeight);
    beamGrad.addColorStop(0, 'rgba(240, 207, 152, 0.95)');
    beamGrad.addColorStop(1, 'rgba(212, 165, 116, 0.85)');

    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(cx - 2.5, cy);
    ctx.lineTo(cx + 2.5, cy);
    ctx.lineTo(cx + 4.5, coneHeight);
    ctx.lineTo(cx - 4.5, coneHeight);
    ctx.closePath();
    ctx.fill();

    // Individual falling particles in stream
    for (let i = 0; i < this.streamParticles.length; i++) {
      const p = this.streamParticles[i];
      p.y += p.vy;
      p.x = cx + Math.sin(this.time * 5 + i) * 1.8;

      if (p.y > coneHeight) {
        p.y = cy + Math.random() * 5;
        p.x = cx + (Math.random() - 0.5) * 3;

        // Chance to spawn binary pulse
        if (Math.random() > 0.85) {
          this.binaryGlows.push({
            x: cx + (Math.random() - 0.5) * 20,
            y: coneHeight - 5,
            vy: -0.8 - Math.random() * 0.8,
            char: Math.random() > 0.5 ? '1' : '0',
            alpha: 1.0
          });
        }
      }

      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }

    // Binary pulses rising gently from the pile
    for (let i = this.binaryGlows.length - 1; i >= 0; i--) {
      const b = this.binaryGlows[i];
      b.y += b.vy;
      b.alpha -= 0.02;

      if (b.alpha <= 0) {
        this.binaryGlows.splice(i, 1);
        continue;
      }

      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = `rgba(0, 245, 255, ${b.alpha * 0.9})`;
      ctx.shadowColor = '#00f5ff';
      ctx.shadowBlur = 6;
      ctx.fillText(b.char, b.x, b.y);
      ctx.shadowBlur = 0;
    }
    ctx.restore();

    // ==========================================
    // 6. GLASS SHEEN & SPECULAR HIGHLIGHTS
    // ==========================================
    ctx.save();
    // Left glass edge highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx - 58, 65);
    ctx.bezierCurveTo(cx - 65, 110, cx - 25, cy - 35, cx - 12, cy - 10);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - 12, cy + 10);
    ctx.bezierCurveTo(cx - 25, cy + 35, cx - 65, h - 110, cx - 58, h - 65);
    ctx.stroke();

    // Right glass subtle reflection
    ctx.strokeStyle = 'rgba(0, 245, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx + 60, 75);
    ctx.bezierCurveTo(cx + 65, 120, cx + 25, cy - 25, cx + 14, cy - 8);
    ctx.stroke();

    // Outer Glass Outline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx - 68, 45);
    ctx.bezierCurveTo(cx - 72, 110, cx - 18, cy - 25, cx - 8, cy);
    ctx.bezierCurveTo(cx - 18, cy + 25, cx - 72, h - 110, cx - 68, h - 45);
    ctx.lineTo(cx + 68, h - 45);
    ctx.bezierCurveTo(cx + 72, h - 110, cx + 18, cy + 25, cx + 8, cy);
    ctx.bezierCurveTo(cx + 18, cy - 25, cx + 72, 110, cx + 68, 45);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  }
}
