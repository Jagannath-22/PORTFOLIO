// Interactive Sand-to-Binary Hourglass Particle Engine & Draggable Holographic Cyber Operator

export class HourglassScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.clientWidth || 340;
    this.height = canvas.clientHeight || 420;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.particles = [];
    this.numParticles = 160;
    this.time = 0;

    this.initParticles();
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < this.numParticles; i++) {
      this.particles.push({
        x: this.width / 2 + (Math.random() - 0.5) * 60,
        y: 60 + Math.random() * 80,
        vx: (Math.random() - 0.5) * 0.4,
        vy: 1.2 + Math.random() * 1.8,
        isBinary: false,
        char: Math.random() > 0.5 ? '1' : '0',
        size: 2.5 + Math.random() * 1.5,
        alpha: 0.8 + Math.random() * 0.2
      });
    }
  }

  onResize() {
    this.width = this.canvas.clientWidth || 340;
    this.height = this.canvas.clientHeight || 420;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  update() {
    this.time += 0.02;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    // 1. Draw Hourglass Glass Shell
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 245, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(0, 245, 255, 0.6)';
    ctx.shadowBlur = 12;

    ctx.beginPath();
    // Top rim
    ctx.ellipse(cx, 40, 65, 12, 0, 0, Math.PI * 2);
    // Upper bulb curve down to neck
    ctx.moveTo(cx - 65, 40);
    ctx.bezierCurveTo(cx - 60, 120, cx - 12, cy - 20, cx - 8, cy);
    // Lower bulb curve down to bottom
    ctx.bezierCurveTo(cx - 12, cy + 20, cx - 60, h - 80, cx - 65, h - 40);
    // Bottom rim
    ctx.ellipse(cx, h - 40, 65, 12, 0, 0, Math.PI * 2);
    // Right side back up
    ctx.moveTo(cx + 65, h - 40);
    ctx.bezierCurveTo(cx + 60, h - 80, cx + 12, cy + 20, cx + 8, cy);
    ctx.bezierCurveTo(cx + 12, cy - 20, cx + 60, 120, cx + 65, 40);
    ctx.stroke();

    // Glass Refraction Sheen
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 45, 60);
    ctx.bezierCurveTo(cx - 40, 110, cx - 20, cy - 30, cx - 12, cy - 10);
    ctx.stroke();
    ctx.restore();

    // 2. Update & Render Particles (Top: Amber Sand -> Passing Neck -> Glowing Binary 0/1)
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      p.y += p.vy;
      p.x += p.vx;

      // When passing the neck (cy), it becomes binary!
      if (p.y > cy && !p.isBinary) {
        p.isBinary = true;
        p.char = Math.random() > 0.5 ? '1' : '0';
        p.vx = (Math.random() - 0.5) * 1.2; // spreads out in bottom bulb
      }

      // Funnel physics into the narrow neck
      if (p.y < cy) {
        const distFromCenter = p.x - cx;
        const funnelRatio = (p.y - 40) / (cy - 40);
        const maxDist = (1 - funnelRatio) * 50 + 6;
        if (Math.abs(distFromCenter) > maxDist) {
          p.x = cx + Math.sign(distFromCenter) * maxDist;
        }
      }

      // Reset when reaching bottom pile
      if (p.y > h - 45) {
        p.y = 45 + Math.random() * 60;
        p.x = cx + (Math.random() - 0.5) * 50;
        p.isBinary = false;
      }

      // Render Particle
      if (!p.isBinary) {
        // Upper Sand Grain (Warm Amber / Gold)
        ctx.fillStyle = '#d4a574';
        ctx.shadowColor = 'rgba(212, 165, 116, 0.8)';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Lower Binary Digit (Electric Cyan / Hacker Green)
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.fillStyle = i % 3 === 0 ? '#00ff88' : '#00f5ff';
        ctx.shadowColor = i % 3 === 0 ? 'rgba(0, 255, 136, 0.9)' : 'rgba(0, 245, 255, 0.9)';
        ctx.shadowBlur = 8;
        ctx.fillText(p.char, p.x - 4, p.y);
      }
    }

    // 3. Bottom Binary Accumulation Glow
    ctx.fillStyle = 'rgba(0, 245, 255, 0.08)';
    ctx.beginPath();
    ctx.ellipse(cx, h - 45, 50, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}
