import { sounds } from '../components/SoundManager.js';

export class BoatScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.clientWidth || 800;
    this.height = canvas.clientHeight || 500;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.scrollVelocity = 0;
    this.lastScrollY = window.scrollY;
    this.oarAngle = 0; // -0.8 to +0.8 radians for rowing stroke
    this.boatY = this.height / 2;
    this.boatX = this.width / 2;

    this.wakeParticles = [];
    this.sparks = [];

    this.initEventListeners();
  }

  initEventListeners() {
    window.addEventListener('scroll', () => {
      const currentScroll = window.scrollY;
      const delta = currentScroll - this.lastScrollY;
      this.scrollVelocity = delta * 0.08;
      this.lastScrollY = currentScroll;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      // Spawn spark bursts on hover
      if (Math.random() > 0.6) {
        this.spawnSparks(mx, my);
        sounds.playSpark();
      }
    });
  }

  spawnSparks(x, y) {
    for (let i = 0; i < 6; i++) {
      this.sparks.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        size: 1.5 + Math.random() * 2,
        life: 1.0,
        color: Math.random() > 0.5 ? '#d4a574' : '#00f5ff'
      });
    }
  }

  onResize() {
    this.width = this.canvas.clientWidth || 800;
    this.height = this.canvas.clientHeight || 500;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.boatY = this.height / 2;
    this.boatX = this.width / 2;
  }

  update() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    // Damping scroll velocity
    this.scrollVelocity *= 0.92;

    // Oar rowing stroke calculation
    this.oarAngle += this.scrollVelocity;
    // Auto-return or natural idle drift
    this.oarAngle = Math.sin(Date.now() * 0.003) * 0.25 + Math.sin(this.oarAngle) * 0.6;

    // Spawn wake ripple particles from oar tips
    if (Math.abs(this.scrollVelocity) > 0.05) {
      this.wakeParticles.push({
        x: this.boatX - 60 + Math.cos(this.oarAngle - Math.PI / 2) * 55,
        y: this.boatY + Math.sin(this.oarAngle - Math.PI / 2) * 55,
        radius: 2,
        alpha: 0.6
      });
      this.wakeParticles.push({
        x: this.boatX + 60 + Math.cos(this.oarAngle + Math.PI / 2) * 55,
        y: this.boatY + Math.sin(this.oarAngle + Math.PI / 2) * 55,
        radius: 2,
        alpha: 0.6
      });
    }

    // 1. Draw Wake Ripples
    for (let i = this.wakeParticles.length - 1; i >= 0; i--) {
      const p = this.wakeParticles[i];
      p.radius += 0.8;
      p.alpha -= 0.015;
      if (p.alpha <= 0) {
        this.wakeParticles.splice(i, 1);
        continue;
      }
      ctx.strokeStyle = `rgba(0, 245, 255, ${p.alpha})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    const bx = this.boatX;
    const by = this.boatY;

    // 2. Draw Boat Hull (Sleek Canoe / Cyber Skiff)
    ctx.save();
    ctx.translate(bx, by);

    // Subtle boat float bobbing
    const bob = Math.sin(Date.now() * 0.002) * 3;
    ctx.translate(0, bob);

    // Boat Shadow / Water Glow
    ctx.fillStyle = 'rgba(0, 245, 255, 0.15)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 120, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wooden / Chrome Outer Hull
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#d4a574';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = 'rgba(212, 165, 116, 0.5)';
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.moveTo(0, -110); // bow
    ctx.bezierCurveTo(24, -40, 24, 40, 0, 110); // right hull
    ctx.bezierCurveTo(-24, 40, -24, -40, 0, -110); // left hull
    ctx.fill();
    ctx.stroke();

    // Inner Hull Cockpit
    ctx.fillStyle = '#090e1a';
    ctx.beginPath();
    ctx.moveTo(0, -90);
    ctx.bezierCurveTo(16, -30, 16, 30, 0, 90);
    ctx.bezierCurveTo(-16, 30, -16, -30, 0, -90);
    ctx.fill();

    // 3. Dual Navigating Oars / Sticks (Dynamic Rotation)
    ctx.shadowColor = '#00f5ff';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 3;

    // Left Oar
    ctx.save();
    ctx.translate(-12, 0);
    ctx.rotate(this.oarAngle - 0.2);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-75, 0);
    ctx.stroke();
    // Oar Blade
    ctx.fillStyle = '#d4a574';
    ctx.beginPath();
    ctx.ellipse(-85, 0, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Right Oar
    ctx.save();
    ctx.translate(12, 0);
    ctx.rotate(-this.oarAngle + 0.2);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(75, 0);
    ctx.stroke();
    // Oar Blade
    ctx.fillStyle = '#d4a574';
    ctx.beginPath();
    ctx.ellipse(85, 0, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 4. Silvery Liquid-Chrome Cyber Navigator Figure
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.shadowColor = 'rgba(0, 245, 255, 0.8)';
    ctx.shadowBlur = 12;

    // Shoulders / Torso
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head / Visor
    ctx.fillStyle = '#00f5ff';
    ctx.beginPath();
    ctx.arc(0, -14, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // 5. Draw Spark Particles (Firecracker microinteraction)
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.x += s.vx;
      s.y += s.vy;
      s.life -= 0.04;
      if (s.life <= 0) {
        this.sparks.splice(i, 1);
        continue;
      }
      ctx.fillStyle = s.color;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 6;
      ctx.globalAlpha = s.life;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }
  }
}
