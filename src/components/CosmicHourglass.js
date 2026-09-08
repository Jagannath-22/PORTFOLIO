/**
 * CosmicHourglass — Ultra-Premium Studio-Grade Cosmic Chronometer
 * 
 * Design Standards:
 * - Architectural double-wall refractive glass with Fresnel caustics and specular sheen.
 * - Solid milled obsidian and brushed titanium hardware caps.
 * - Multi-layer galactic particle system color-graded with cosmic amber, electric cyan, 
 *   diamond white starlight, and deep void blue (matching the 3D globe).
 * - Gravitational vortex funnel physics feeding into an energized neck beam.
 * - Transmutation of cosmic stardust into glowing binary '0' and '1' code streams.
 * - Accumulation into an organic 3D luminous dune with floating stellar embers.
 * - Interactive trigger: Clicking flips to the SOC Log Analysis Console.
 */
export class CosmicHourglass {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.clientWidth || 320;
    this.height = canvas.clientHeight || 480;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.time = 0;
    this.sandLevelTop = 0.85;
    this.sandLevelBottom = 0.15;
    this.isHovered = false;

    // Cosmic particles in upper chamber
    this.stars = [];
    // Stream particles through the neck
    this.stream = [];
    // Falling binary particles in lower chamber
    this.binaryParticles = [];
    // Accumulating 3D dune heap
    this.dunePoints = [];
    // Ambient rising stellar embers
    this.ambientEmbers = [];

    this.initParticles();
    this.initEventListeners();
  }

  initEventListeners() {
    this.canvas.style.cursor = 'pointer';
    this.canvas.addEventListener('mouseenter', () => { this.isHovered = true; });
    this.canvas.addEventListener('mouseleave', () => { this.isHovered = false; });
  }

  initParticles() {
    this.stars = [];
    this.stream = [];
    this.binaryParticles = [];
    this.ambientEmbers = [];

    const cx = this.width / 2;
    const cy = this.height / 2;

    // 220 cosmic star particles in upper bulb
    for (let i = 0; i < 220; i++) {
      const radius = Math.random() * 68;
      const angle = Math.random() * Math.PI * 2;
      this.stars.push({
        x: cx + Math.cos(angle) * radius * 0.9,
        y: 65 + Math.random() * (cy - 80),
        vx: (Math.random() - 0.5) * 0.35,
        vy: 0.2 + Math.random() * 0.45,
        size: 0.75 + Math.random() * 2.2,
        color: this.getCosmicColor(),
        pulseSpeed: 1.8 + Math.random() * 3.5,
        twinkle: Math.random() * Math.PI * 2,
        spiralPhase: Math.random() * Math.PI * 2
      });
    }

    // 40 continuous neck stream particles
    for (let i = 0; i < 40; i++) {
      this.stream.push({
        x: cx + (Math.random() - 0.5) * 4,
        y: cy - 14 + Math.random() * 32,
        vy: 4.5 + Math.random() * 3.5,
        size: 1.2 + Math.random() * 1.6,
        color: Math.random() > 0.4 ? '#74e7ff' : '#c99a55'
      });
    }

    // 60 resting dune heap nodes
    this.dunePoints = [];
    for (let i = 0; i < 70; i++) {
      this.dunePoints.push({
        x: cx + (Math.random() - 0.5) * (70 + Math.random() * 40),
        y: this.height - 50 - Math.random() * 35,
        char: Math.random() > 0.5 ? '1' : '0',
        alpha: 0.3 + Math.random() * 0.65,
        color: Math.random() > 0.4 ? '#74e7ff' : (Math.random() > 0.3 ? '#c99a55' : '#ffffff')
      });
    }

    // 25 floating ambient embers
    for (let i = 0; i < 25; i++) {
      this.ambientEmbers.push({
        x: cx + (Math.random() - 0.5) * 80,
        y: cy + 40 + Math.random() * (this.height * 0.4),
        vx: (Math.random() - 0.5) * 0.4,
        vy: -(0.15 + Math.random() * 0.35),
        alpha: 0.2 + Math.random() * 0.6,
        color: Math.random() > 0.5 ? '#74e7ff' : '#c99a55',
        size: 0.8 + Math.random() * 1.5
      });
    }
  }

  getCosmicColor() {
    const r = Math.random();
    if (r > 0.68) return '#74e7ff'; // Electric Cyan
    if (r > 0.42) return '#ffffff'; // Diamond Starlight
    if (r > 0.18) return '#c99a55'; // Cosmic Warm Amber / Gold
    if (r > 0.08) return '#ffa834'; // Solar Orange
    return '#315d91'; // Deep Interstellar Cobalt
  }

  onResize() {
    this.width = this.canvas.clientWidth || 320;
    this.height = this.canvas.clientHeight || 480;
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

    // Continuous smooth draining
    this.sandLevelTop -= 0.00010;
    this.sandLevelBottom += 0.00010;
    if (this.sandLevelTop <= 0.12) {
      this.sandLevelTop = 0.88;
      this.sandLevelBottom = 0.12;
    }

    // =========================================================================
    // 1. HARDWARE CAPS (MILLED OBSIDIAN & BRUSHED TITANIUM)
    // =========================================================================
    const drawHardwareCap = (y, isTop) => {
      ctx.save();

      // Outer soft cast shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.beginPath();
      ctx.ellipse(cx, y + (isTop ? -4 : 6), 94, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      // Base tier (deep obsidian graphite)
      const baseGrad = ctx.createLinearGradient(cx - 90, y, cx + 90, y);
      baseGrad.addColorStop(0, '#04070d');
      baseGrad.addColorStop(0.2, '#0d1627');
      baseGrad.addColorStop(0.5, '#192b4a');
      baseGrad.addColorStop(0.8, '#0d1627');
      baseGrad.addColorStop(1, '#04070d');

      ctx.fillStyle = baseGrad;
      ctx.beginPath();
      ctx.ellipse(cx, y + (isTop ? -4 : 4), 90, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Inner beveled tier
      const innerGrad = ctx.createLinearGradient(cx - 75, y, cx + 75, y);
      innerGrad.addColorStop(0, '#0a101f');
      innerGrad.addColorStop(0.5, '#1e3357');
      innerGrad.addColorStop(1, '#0a101f');
      ctx.fillStyle = innerGrad;
      ctx.beginPath();
      ctx.ellipse(cx, y, 78, 11, 0, 0, Math.PI * 2);
      ctx.fill();

      // Titanium chamfer rim highlight
      ctx.strokeStyle = this.isHovered ? 'rgba(116, 231, 255, 0.75)' : 'rgba(116, 231, 255, 0.38)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Precision engraved alignment hash marks
      ctx.strokeStyle = 'rgba(201, 154, 85, 0.65)';
      ctx.lineWidth = 1.0;
      [-45, -20, 0, 20, 45].forEach((offset) => {
        ctx.beginPath();
        ctx.moveTo(cx + offset, y - 3);
        ctx.lineTo(cx + offset, y + 3);
        ctx.stroke();
      });

      ctx.restore();
    };

    drawHardwareCap(32, true);
    drawHardwareCap(h - 32, false);

    // =========================================================================
    // 2. GLASS BULB OUTER BODY & AMBIENT DEPTH
    // =========================================================================
    ctx.save();
    // Glass interior contour
    ctx.beginPath();
    ctx.moveTo(cx - 75, 40);
    // Upper bulb curve down to narrow neck
    ctx.bezierCurveTo(cx - 86, cy * 0.48, cx - 22, cy - 26, cx - 8, cy);
    // Lower bulb curve down to bottom
    ctx.bezierCurveTo(cx - 22, cy + 26, cx - 86, h - cy * 0.48, cx - 75, h - 40);
    ctx.lineTo(cx + 75, h - 40);
    // Right bulb curve back up
    ctx.bezierCurveTo(cx + 86, h - cy * 0.48, cx + 22, cy + 26, cx + 8, cy);
    ctx.bezierCurveTo(cx + 22, cy - 26, cx + 86, cy * 0.48, cx + 75, 40);
    ctx.closePath();

    // Deep interstellar ambient glass background
    const glassBg = ctx.createRadialGradient(cx, cy, 15, cx, cy, 180);
    glassBg.addColorStop(0, 'rgba(4, 9, 20, 0.4)');
    glassBg.addColorStop(0.65, 'rgba(3, 6, 14, 0.7)');
    glassBg.addColorStop(1, 'rgba(2, 4, 8, 0.95)');
    ctx.fillStyle = glassBg;
    ctx.fill();

    // =========================================================================
    // 3. UPPER CHAMBER: COSMIC SWIRL & GALACTIC NEBULA
    // =========================================================================
    const topSandY = 46 + (1 - this.sandLevelTop) * (cy - 68);

    ctx.save();
    // Clip to upper bulb
    ctx.beginPath();
    ctx.moveTo(cx - 75, 40);
    ctx.bezierCurveTo(cx - 86, cy * 0.48, cx - 22, cy - 26, cx - 8, cy);
    ctx.lineTo(cx + 8, cy);
    ctx.bezierCurveTo(cx + 22, cy - 26, cx + 86, cy * 0.48, cx + 75, 40);
    ctx.closePath();
    ctx.clip();

    // Cosmic nebula cloud glow
    const nebula = ctx.createRadialGradient(cx, cy * 0.55, 6, cx, cy * 0.55, 90);
    nebula.addColorStop(0, 'rgba(116, 231, 255, 0.22)');
    nebula.addColorStop(0.4, 'rgba(201, 154, 85, 0.16)');
    nebula.addColorStop(0.75, 'rgba(49, 93, 145, 0.12)');
    nebula.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = nebula;
    ctx.fillRect(cx - 90, topSandY, 180, cy - topSandY);

    // Swirling starry particles in upper chamber
    for (let i = 0; i < this.stars.length; i++) {
      const s = this.stars[i];
      // Gravitational acceleration towards neck + subtle vortex swirl
      s.y += s.vy;
      s.spiralPhase += 0.02;
      s.x += s.vx + Math.sin(this.time * 2.2 + s.spiralPhase) * 0.35;

      // Wrap inside upper sand level
      if (s.y < topSandY) {
        s.y = topSandY + Math.random() * 10;
      }
      if (s.y > cy - 8) {
        // Recycle back to top of cosmic mass
        s.y = topSandY + Math.random() * 14;
        s.x = cx + (Math.random() - 0.5) * 65;
      }

      // Constrain inside funnel contours
      const neckProgress = Math.max(0, (s.y - topSandY) / (cy - topSandY));
      const maxDistX = (1 - neckProgress * 0.85) * 68;
      if (Math.abs(s.x - cx) > maxDistX) {
        s.x = cx + Math.sign(s.x - cx) * maxDistX * 0.94;
        s.vx *= -0.4;
      }

      // Render glowing star particle with twinkle pulse
      const pulse = 0.5 + 0.5 * Math.sin(this.time * s.pulseSpeed + s.twinkle);
      ctx.fillStyle = s.color;
      ctx.globalAlpha = 0.45 + pulse * 0.55;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * (0.8 + pulse * 0.4), 0, Math.PI * 2);
      ctx.fill();

      // Atmospheric starlight aura
      if (s.size > 1.6) {
        ctx.fillStyle = s.color === '#c99a55' ? 'rgba(201, 154, 85, 0.3)' : 'rgba(116, 231, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // =========================================================================
    // 4. GRAVITATIONAL EVENT HORIZON STREAM (NECK ACCELERATOR)
    // =========================================================================
    ctx.save();
    // Central radiant high-energy laser stream
    const beamGrad = ctx.createLinearGradient(cx, cy - 18, cx, h - 55);
    beamGrad.addColorStop(0, 'rgba(116, 231, 255, 0.95)');
    beamGrad.addColorStop(0.25, 'rgba(255, 255, 255, 0.95)');
    beamGrad.addColorStop(0.5, 'rgba(201, 154, 85, 0.85)');
    beamGrad.addColorStop(0.85, 'rgba(116, 231, 255, 0.65)');
    beamGrad.addColorStop(1, 'rgba(49, 93, 145, 0.2)');

    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(cx - 2.5, cy - 12);
    ctx.lineTo(cx + 2.5, cy - 12);
    ctx.lineTo(cx + 4.0, h - 55);
    ctx.lineTo(cx - 4.0, h - 55);
    ctx.closePath();
    ctx.fill();

    // Fast stream particles
    for (let i = 0; i < this.stream.length; i++) {
      const sp = this.stream[i];
      sp.y += sp.vy;
      sp.x = cx + Math.sin(this.time * 9 + i * 2.5) * 1.5;

      // Spawn falling binary 0 or 1 below neck
      if (sp.y > cy + 22 && Math.random() > 0.68) {
        this.binaryParticles.push({
          x: cx + (Math.random() - 0.5) * 12,
          y: cy + 24,
          vy: 2.5 + Math.random() * 2.4,
          vx: (Math.random() - 0.5) * 1.1,
          char: Math.random() > 0.5 ? '1' : '0',
          alpha: 1.0,
          color: Math.random() > 0.4 ? '#74e7ff' : (Math.random() > 0.3 ? '#c99a55' : '#ffffff')
        });
      }

      if (sp.y > h - 55) {
        sp.y = cy - 12 + Math.random() * 6;
        sp.x = cx + (Math.random() - 0.5) * 3;
      }

      ctx.fillStyle = sp.color;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // =========================================================================
    // 5. LOWER CHAMBER: FALLING BINARY TRANSMUTATION & 3D DUNE HEAP
    // =========================================================================
    ctx.save();
    // Clip to lower bulb
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy);
    ctx.bezierCurveTo(cx - 22, cy + 26, cx - 86, h - cy * 0.48, cx - 75, h - 40);
    ctx.lineTo(cx + 75, h - 40);
    ctx.bezierCurveTo(cx + 86, h - cy * 0.48, cx + 22, cy + 26, cx + 8, cy);
    ctx.closePath();
    ctx.clip();

    // Parabolic glowing dune mound at the base
    const duneY = (h - 45) - this.sandLevelBottom * 75;
    const duneGrad = ctx.createRadialGradient(cx, h - 50, 10, cx, h - 50, 85);
    duneGrad.addColorStop(0, 'rgba(116, 231, 255, 0.35)');
    duneGrad.addColorStop(0.4, 'rgba(201, 154, 85, 0.25)');
    duneGrad.addColorStop(0.8, 'rgba(49, 93, 145, 0.15)');
    duneGrad.addColorStop(1, 'rgba(2, 4, 8, 0.95)');
    ctx.fillStyle = duneGrad;
    ctx.beginPath();
    ctx.ellipse(cx, h - 50, 72, 32, 0, 0, Math.PI * 2);
    ctx.fill();

    // Render falling binary code
    ctx.font = '700 11px "Space Mono", monospace';
    ctx.textAlign = 'center';

    for (let i = this.binaryParticles.length - 1; i >= 0; i--) {
      const bp = this.binaryParticles[i];
      bp.y += bp.vy;
      bp.x += bp.vx;

      if (bp.y >= duneY + Math.random() * 14) {
        if (this.dunePoints.length < 130) {
          this.dunePoints.push({
            x: bp.x,
            y: bp.y,
            char: bp.char,
            alpha: 0.4 + Math.random() * 0.6,
            color: bp.color
          });
        }
        this.binaryParticles.splice(i, 1);
        continue;
      }

      ctx.fillStyle = bp.color;
      ctx.globalAlpha = bp.alpha;
      ctx.shadowColor = bp.color;
      ctx.shadowBlur = 5;
      ctx.fillText(bp.char, bp.x, bp.y);
      ctx.shadowBlur = 0;
    }

    // Render accumulated dune characters
    for (let i = 0; i < this.dunePoints.length; i++) {
      const dp = this.dunePoints[i];
      const shimmer = 0.4 + 0.35 * Math.sin(this.time * 2.5 + i * 0.6);
      ctx.fillStyle = dp.color;
      ctx.globalAlpha = dp.alpha * shimmer;
      ctx.fillText(dp.char, dp.x, dp.y);
    }

    // Ambient floating embers rising gently in zero-G
    for (let i = 0; i < this.ambientEmbers.length; i++) {
      const emb = this.ambientEmbers[i];
      emb.y += emb.vy;
      emb.x += emb.vx + Math.sin(this.time * 1.5 + i) * 0.2;

      if (emb.y < cy + 15) {
        emb.y = h - 55 - Math.random() * 20;
        emb.x = cx + (Math.random() - 0.5) * 75;
      }

      ctx.fillStyle = emb.color;
      ctx.globalAlpha = emb.alpha * (0.5 + 0.5 * Math.sin(this.time * 3 + i));
      ctx.beginPath();
      ctx.arc(emb.x, emb.y, emb.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // =========================================================================
    // 6. STUDIO-GRADE FRESNEL GLASS OPTICS & CAUSTIC SHEEN
    // =========================================================================
    ctx.save();
    // Primary curved glass reflection highlight (left edge)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(cx - 68, 58);
    ctx.bezierCurveTo(cx - 76, cy * 0.5, cx - 24, cy - 30, cx - 11, cy - 8);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - 11, cy + 8);
    ctx.bezierCurveTo(cx - 24, cy + 30, cx - 76, h - cy * 0.5, cx - 68, h - 58);
    ctx.stroke();

    // Secondary cyan ambient rim highlight (right edge)
    ctx.strokeStyle = this.isHovered ? 'rgba(116, 231, 255, 0.55)' : 'rgba(116, 231, 255, 0.28)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(cx + 70, 68);
    ctx.bezierCurveTo(cx + 78, cy * 0.52, cx + 26, cy - 24, cx + 13, cy - 8);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + 13, cy + 8);
    ctx.bezierCurveTo(cx + 26, cy + 24, cx + 78, h - cy * 0.52, cx + 70, h - 68);
    ctx.stroke();

    // Precision outer glass contour fine bevel
    ctx.strokeStyle = 'rgba(242, 244, 247, 0.16)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx - 75, 40);
    ctx.bezierCurveTo(cx - 86, cy * 0.48, cx - 22, cy - 26, cx - 8, cy);
    ctx.bezierCurveTo(cx - 22, cy + 26, cx - 86, h - cy * 0.48, cx - 75, h - 40);
    ctx.lineTo(cx + 75, h - 40);
    ctx.bezierCurveTo(cx + 86, h - cy * 0.48, cx + 22, cy + 26, cx + 8, cy);
    ctx.bezierCurveTo(cx + 22, cy - 26, cx + 86, cy * 0.48, cx + 75, 40);
    ctx.closePath();
    ctx.stroke();

    // Hover interactive glow halo
    if (this.isHovered) {
      ctx.strokeStyle = 'rgba(116, 231, 255, 0.35)';
      ctx.lineWidth = 3.0;
      ctx.stroke();
    }

    ctx.restore();
  }
}
