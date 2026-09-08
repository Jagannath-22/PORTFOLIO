/**
 * NeumorphicClock — Dual-Mode Rotatable Cyber Analog & Cosmic Dial
 * 
 * Side A: Minimalist Swiss / Editorial Cyber Analog Watch
 *   - Real local time with precision hour, minute, and smooth sweeping second hands ("manual nails")
 *   - Luminous indices, date aperture, cyber crosshair
 * 
 * Side B: Cosmic Astronomical / Orbital Dial
 *   - Planetary orbital rings, sidereal zodiac coordinate markers, constellation compass,
 *     and BGP routing angle telemetry
 * 
 * Interactivity:
 *   - Clicking the dial triggers a 3D spin/flip rotation between Real-Time and Cosmic modes.
 */
export class NeumorphicClock {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.size = canvas.clientWidth || 210;
    this.canvas.width = this.size;
    this.canvas.height = this.size;

    this.mode = 'REALTIME'; // 'REALTIME' or 'COSMIC'
    this.rotationY = 0;
    this.targetRotationY = 0;
    this.isFlipping = false;
    this.time = 0;

    this.initEventListeners();
  }

  initEventListeners() {
    this.canvas.style.cursor = 'pointer';
    this.canvas.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleMode();
    });
  }

  toggleMode() {
    this.isFlipping = true;
    this.targetRotationY += Math.PI; // Flip 180 degrees
  }

  onResize() {
    this.size = this.canvas.clientWidth || 210;
    this.canvas.width = this.size;
    this.canvas.height = this.size;
  }

  update() {
    this.time += 0.016;
    const ctx = this.ctx;
    const s = this.size;
    const cx = s / 2;
    const cy = s / 2;
    const r = s * 0.44;

    // Smooth rotation flip easing
    this.rotationY += (this.targetRotationY - this.rotationY) * 0.12;
    const cosTheta = Math.cos(this.rotationY);
    const absScaleX = Math.max(0.01, Math.abs(cosTheta));
    const isFaceA = cosTheta >= 0;

    ctx.clearRect(0, 0, s, s);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(absScaleX, 1);

    // =========================================================================
    // 1. NEUMORPHIC BEZEL & DEEP INSET DIAL
    // =========================================================================
    // Outer dial shadow ring
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    const dialBg = ctx.createRadialGradient(0, 0, 5, 0, 0, r);
    dialBg.addColorStop(0, '#04070d');
    dialBg.addColorStop(0.75, '#070c17');
    dialBg.addColorStop(1, '#020408');
    ctx.fillStyle = dialBg;
    ctx.fill();

    // Inset beveled bezel
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(116, 231, 255, 0.18)';
    ctx.stroke();

    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.94, 0, Math.PI * 2);
    ctx.stroke();

    if (isFaceA) {
      this.renderRealTimeFace(ctx, r);
    } else {
      this.renderCosmicFace(ctx, r);
    }

    ctx.restore();
  }

  // ===========================================================================
  // FACE A: REAL-TIME SWISS CYBER CHRONOMETER
  // ===========================================================================
  renderRealTimeFace(ctx, r) {
    const now = new Date();
    const hrs = now.getHours();
    const mins = now.getMinutes();
    const secs = now.getSeconds();
    const millis = now.getMilliseconds();

    // Tick indices
    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * Math.PI * 2 - Math.PI / 2;
      const isMajor = i % 5 === 0;
      const innerR = isMajor ? r * 0.76 : r * 0.84;
      const outerR = r * 0.88;

      ctx.strokeStyle = isMajor ? 'rgba(242, 244, 247, 0.75)' : 'rgba(137, 147, 164, 0.25)';
      ctx.lineWidth = isMajor ? 1.8 : 0.8;

      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR);
      ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
      ctx.stroke();
    }

    // Micro dial label
    ctx.font = '500 7px "Space Mono", monospace';
    ctx.fillStyle = '#74e7ff';
    ctx.textAlign = 'center';
    ctx.fillText('SYS / TIME', 0, -r * 0.42);

    ctx.font = '400 6.5px "Space Mono", monospace';
    ctx.fillStyle = '#8993a4';
    ctx.fillText('CHRONO', 0, r * 0.46);

    // Precise angles
    const hrAngle = ((hrs % 12) + mins / 60) * (Math.PI / 6) - Math.PI / 2;
    const minAngle = (mins + secs / 60) * (Math.PI / 30) - Math.PI / 2;
    const secAngle = (secs + millis / 1000) * (Math.PI / 30) - Math.PI / 2; // Smooth 60fps sweep

    // 1. Hour Hand (Chunky, authoritative)
    ctx.save();
    ctx.strokeStyle = '#f2f4f7';
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-Math.cos(hrAngle) * 8, -Math.sin(hrAngle) * 8);
    ctx.lineTo(Math.cos(hrAngle) * (r * 0.48), Math.sin(hrAngle) * (r * 0.48));
    ctx.stroke();
    ctx.restore();

    // 2. Minute Hand (Crisp, luminescent)
    ctx.save();
    ctx.strokeStyle = '#d7dce2';
    ctx.lineWidth = 2.0;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-Math.cos(minAngle) * 10, -Math.sin(minAngle) * 10);
    ctx.lineTo(Math.cos(minAngle) * (r * 0.72), Math.sin(minAngle) * (r * 0.72));
    ctx.stroke();
    ctx.restore();

    // 3. Second Hand (Technical cyan with counterweight)
    ctx.save();
    ctx.strokeStyle = '#74e7ff';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-Math.cos(secAngle) * 16, -Math.sin(secAngle) * 16);
    ctx.lineTo(Math.cos(secAngle) * (r * 0.82), Math.sin(secAngle) * (r * 0.82));
    ctx.stroke();

    // Orange/cyan tip
    ctx.fillStyle = '#74e7ff';
    ctx.beginPath();
    ctx.arc(Math.cos(secAngle) * (r * 0.82), Math.sin(secAngle) * (r * 0.82), 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Center jewel cap
    ctx.fillStyle = '#03050a';
    ctx.beginPath();
    ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#74e7ff';
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }

  // ===========================================================================
  // FACE B: COSMIC ASTROLABE & ORBITAL TELEMETRY
  // ===========================================================================
  renderCosmicFace(ctx, r) {
    const t = this.time;

    // Concentric celestial orbit rings
    [0.35, 0.58, 0.78].forEach((scale, idx) => {
      ctx.strokeStyle = idx === 1 ? 'rgba(201, 154, 85, 0.4)' : 'rgba(116, 231, 255, 0.25)';
      ctx.lineWidth = 0.8;
      ctx.setLineDash(idx === 1 ? [3, 4] : [1, 2]);
      ctx.beginPath();
      ctx.arc(0, 0, r * scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Orbiting planetary nodes
    const p1Angle = t * 0.8;
    const p2Angle = -t * 0.45 + 1.8;
    const p3Angle = t * 0.25 + 3.4;

    // Node 1 (Inner Cyan)
    ctx.fillStyle = '#74e7ff';
    ctx.beginPath();
    ctx.arc(Math.cos(p1Angle) * (r * 0.35), Math.sin(p1Angle) * (r * 0.35), 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Node 2 (Mid Amber Star)
    ctx.fillStyle = '#c99a55';
    ctx.beginPath();
    ctx.arc(Math.cos(p2Angle) * (r * 0.58), Math.sin(p2Angle) * (r * 0.58), 3.2, 0, Math.PI * 2);
    ctx.fill();

    // Node 3 (Outer White Stasis)
    ctx.fillStyle = '#f2f4f7';
    ctx.beginPath();
    ctx.arc(Math.cos(p3Angle) * (r * 0.78), Math.sin(p3Angle) * (r * 0.78), 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Astrolabe crosshair reticle
    ctx.strokeStyle = 'rgba(116, 231, 255, 0.2)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.88);
    ctx.lineTo(0, r * 0.88);
    ctx.moveTo(-r * 0.88, 0);
    ctx.lineTo(r * 0.88, 0);
    ctx.stroke();

    // Cosmic coordinate labels
    ctx.font = '500 6.5px "Space Mono", monospace';
    ctx.fillStyle = '#c99a55';
    ctx.textAlign = 'center';
    ctx.fillText('COSMIC ORBIT', 0, -r * 0.45);

    ctx.font = '400 6px "Space Mono", monospace';
    ctx.fillStyle = '#74e7ff';
    const angleDeg = Math.floor((t * 18) % 360);
    ctx.fillText(`RA ${angleDeg}° 42' 18"`, 0, r * 0.48);

    // Center star core
    ctx.fillStyle = '#74e7ff';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}
