import * as THREE from 'three';

/**
 * ChronoParticleMorphScene (Real-Time 3D Precision Clock)
 * 
 * Features:
 * - 3 Real-Time Optic Fiber Pointers / Hands:
 *     - Hour Pointer: Short and thick luminous optic fiber rod in golden saffron (#ffb829)
 *     - Minute Pointer: Long, sleek medium-gauge optic fiber rod in bone white (#ffffff)
 *     - Second Pointer: Long, ultra-fine needle optic fiber thread in electric cyan (#74e7ff)
 *     - Optic emitter lens tips with additive glowing halo
 *     - Central mechanical jewel hub
 * - 3,200+ Chromatic particles forming dial ring, 12 hour ticks, 60 minute ticks, and orbital stardust
 * - Floating 3D wireframe tetrahedrons tumbling in the dark void
 * - Gyroscopic mouse parallax tilt
 */
export class ChronoParticleMorphScene {
  constructor(canvas) {
    this.canvas = canvas;
    if (!this.canvas) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();

    // Container groups
    this.stageGroup = null;
    this.handsGroup = null;

    // 3 Optic Fiber Hands
    this.hourHandGroup = null;
    this.minHandGroup = null;
    this.secHandGroup = null;

    // Particle system state
    this.particleCount = 3000;
    this.particlesMesh = null;
    this.particlesGeo = null;

    // Position & attribute buffers
    this.positions = new Float32Array(this.particleCount * 3);
    this.colors = new Float32Array(this.particleCount * 3);
    this.sizes = new Float32Array(this.particleCount);

    // Mouse parallax
    this.mouse = { x: 0, y: 0 };
    this.targetRotation = { x: 0, y: 0 };

    this.init();
  }

  init() {
    const width = this.canvas.clientWidth || 700;
    const height = this.canvas.clientHeight || 700;

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 7.5);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    this.stageGroup = new THREE.Group();
    this.scene.add(this.stageGroup);

    // Hands container group
    this.handsGroup = new THREE.Group();
    this.stageGroup.add(this.handsGroup);

    // 1. Build the 3 Optic Fiber Pointers
    this.createOpticFiberHands();

    // 2. Build Clock Dial Particles
    this.initClockParticles();
    this.createParticleSystem();

    // 3. Build Floating 3D Wireframe Tetrahedrons
    this.createAmbientTetrahedrons();

    // Mouse tilt listener
    window.addEventListener('mousemove', (e) => {
      const halfW = window.innerWidth / 2;
      const halfH = window.innerHeight / 2;
      this.mouse.x = (e.clientX - halfW) / halfH;
      this.mouse.y = (e.clientY - halfH) / halfH;
      this.targetRotation.y = this.mouse.x * 0.25;
      this.targetRotation.x = -this.mouse.y * 0.20;
    }, { passive: true });
  }

  /**
   * Helper: Build a realistic 3D Optic Fiber Pointer
   * 
   * @param {number} length Pointer length
   * @param {number} radius Fiber core radius
   * @param {number} coreColor Hex color of luminous core
   * @param {number} sheathColor Hex color of outer translucent glass sheath
   * @param {number} tipColor Hex color of laser tip lens
   * @param {number} tailLen Counterbalance tail length
   * @param {number} zOffset Z-depth layer
   */
  /**
   * Helper: Build a realistic ultra-thin 3D Optic Fiber Pointer
   * 
   * @param {Object} config
   * @param {number} config.length Pointer length from pivot to tip
   * @param {number} config.rootRadius Base fiber radius at pivot
   * @param {number} config.tipRadius Tip fiber radius at laser emitter
   * @param {number} config.coreColor Hex color of inner laser core
   * @param {number} config.sheathColor Hex color of outer translucent glass sheath
   * @param {number} config.tipColor Hex color of laser emitter focal bead
   * @param {number} config.tailLen Counterbalance tail length
   * @param {boolean} config.hasSkeletonRing Whether to add a luxury skeleton counterweight ring
   * @param {number} config.zOffset Z-depth layer
   */
  createOpticFiberPointer({
    length,
    rootRadius,
    tipRadius,
    coreColor,
    sheathColor,
    tipColor,
    tailLen = 0.24,
    hasSkeletonRing = false,
    zOffset = 0.08
  }) {
    const group = new THREE.Group();
    group.position.z = zOffset;

    // 1. Inner Laser Core (Dense, intense light path)
    // CylinderGeometry(radiusTop, radiusBottom, height, radialSegments)
    // In Three.js, radiusTop is at +height/2 (tip) and radiusBottom is at -height/2 (root)
    const coreGeo = new THREE.CylinderGeometry(tipRadius * 0.75, rootRadius * 0.75, length, 16);
    coreGeo.translate(0, length / 2, 0);
    const coreMat = new THREE.MeshBasicMaterial({
      color: coreColor,
      transparent: true,
      opacity: 0.96
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    group.add(coreMesh);

    // 2. Translucent Glass Cladding / Fiber Sheath (Silica glass envelope with internal refraction)
    const sheathGeo = new THREE.CylinderGeometry(tipRadius * 1.5, rootRadius * 1.4, length * 1.005, 16);
    sheathGeo.translate(0, length / 2, 0);
    const sheathMat = new THREE.MeshBasicMaterial({
      color: sheathColor,
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending
    });
    const sheathMesh = new THREE.Mesh(sheathGeo, sheathMat);
    group.add(sheathMesh);

    // 3. Micro Laser Beam Hairline (Centerline radiance that prevents aliasing)
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, length, 0)
    ]);
    const lineMesh = new THREE.Line(lineGeo, lineMat);
    group.add(lineMesh);

    // 4. Optic Emitter Lens Tip (High-intensity focal bead at tip)
    const tipGeo = new THREE.SphereGeometry(tipRadius * 1.4, 12, 12);
    tipGeo.translate(0, length, 0);
    const tipMat = new THREE.MeshBasicMaterial({
      color: tipColor,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending
    });
    const tipMesh = new THREE.Mesh(tipGeo, tipMat);
    group.add(tipMesh);

    // Outer soft aura around tip
    const auraGeo = new THREE.SphereGeometry(tipRadius * 2.8, 10, 10);
    auraGeo.translate(0, length, 0);
    const auraMat = new THREE.MeshBasicMaterial({
      color: sheathColor,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending
    });
    const auraMesh = new THREE.Mesh(auraGeo, auraMat);
    group.add(auraMesh);

    // 5. Pivot Mounting Collar (Precision titanium sleeve where fiber meets the movement)
    const collarGeo = new THREE.CylinderGeometry(rootRadius * 1.6, rootRadius * 1.8, 0.035, 16);
    collarGeo.rotateX(Math.PI / 2);
    const collarMat = new THREE.MeshBasicMaterial({
      color: 0x222230,
      transparent: true,
      opacity: 0.95
    });
    const collarMesh = new THREE.Mesh(collarGeo, collarMat);
    group.add(collarMesh);

    // 6. Sleek Tapered Counterbalance Tail
    if (tailLen > 0) {
      const tailGeo = new THREE.CylinderGeometry(rootRadius * 0.9, rootRadius * 0.35, tailLen, 12);
      tailGeo.translate(0, -tailLen / 2, 0);
      const tailMat = new THREE.MeshBasicMaterial({
        color: coreColor,
        transparent: true,
        opacity: 0.65
      });
      const tailMesh = new THREE.Mesh(tailGeo, tailMat);
      group.add(tailMesh);

      // Skeleton Counterweight Ring (Horological hallmark on second hand)
      if (hasSkeletonRing) {
        const ringGeo = new THREE.TorusGeometry(0.038, 0.0035, 8, 24);
        ringGeo.translate(0, -tailLen * 0.55, 0);
        const ringMat = new THREE.MeshBasicMaterial({
          color: sheathColor,
          transparent: true,
          opacity: 0.9,
          blending: THREE.AdditiveBlending
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        group.add(ringMesh);
      }
    }

    // Reference for dynamic micro-pulsing in update loop
    group.userData = {
      coreMat,
      sheathMat,
      tipMat,
      baseSheathOpacity: 0.38,
      baseTipOpacity: 1.0
    };

    return group;
  }

  /**
   * Build the 3 Optic Fiber Pointers (Hour, Minute, Second)
   * Colors directly extracted from reference:
   * - Sector 1 (Sunset Orange/Amber): Hour Pointer
   * - Sector 2 (Orchid Purple/Magenta): Minute Pointer
   * - Sector 3 (Electric Sky/Azure Blue): Second Pointer
   */
  createOpticFiberHands() {
    // 1. Hour Pointer: Short & Sleek (Warm Tangerine Sunset Orange #f97316 / Amber #fb923c)
    // Length: 1.30, Root: 0.015, Tip: 0.009 (Thinner, tapered optic rod)
    this.hourHandGroup = this.createOpticFiberPointer({
      length: 1.30,
      rootRadius: 0.015,
      tipRadius: 0.009,
      coreColor: 0xf97316,   // Tangerine Sunset Core
      sheathColor: 0xfb923c, // Radiant Amber Sheath
      tipColor: 0xffedd5,    // Laser Emitter Tip
      tailLen: 0.28,
      hasSkeletonRing: false,
      zOffset: 0.07
    });
    this.handsGroup.add(this.hourHandGroup);

    // 2. Minute Pointer: Long & Sleek Medium Gauge (Vivid Orchid Purple #c084fc / Magenta-Violet #9333ea)
    // Length: 1.90, Root: 0.010, Tip: 0.006 (Razor-precision optic filament)
    this.minHandGroup = this.createOpticFiberPointer({
      length: 1.90,
      rootRadius: 0.010,
      tipRadius: 0.006,
      coreColor: 0xc084fc,   // Electric Orchid Purple Core
      sheathColor: 0x9333ea, // Deep Magenta-Violet Sheath
      tipColor: 0xfae8ff,    // Lavender-White Laser Tip
      tailLen: 0.34,
      hasSkeletonRing: false,
      zOffset: 0.11
    });
    this.handsGroup.add(this.minHandGroup);

    // 3. Second Pointer: Whisper-Thin Needle (Electric Sky Blue #38bdf8 / Azure #60a5fa)
    // Length: 2.22, Root: 0.0048, Tip: 0.0018 (Ultra razor hairline thread)
    this.secHandGroup = this.createOpticFiberPointer({
      length: 2.22,
      rootRadius: 0.0048,
      tipRadius: 0.0018,
      coreColor: 0x38bdf8,   // Electric Sky Blue Core
      sheathColor: 0x60a5fa, // Azure Blue Sheath
      tipColor: 0xffffff,    // Diamond Laser Tip
      tailLen: 0.46,
      hasSkeletonRing: true, // Haute Horlogerie skeleton counterweight ring
      zOffset: 0.15
    });
    this.handsGroup.add(this.secHandGroup);

    // 4. Miniature Haute Horlogerie Jewel Hub (Inspired by silver arc & blue jewel in reference image)
    const hubGroup = new THREE.Group();
    hubGroup.position.z = 0.16;

    // A. Outer Dark Titanium Bezel
    const bezelGeo = new THREE.CylinderGeometry(0.044, 0.046, 0.016, 32);
    bezelGeo.rotateX(Math.PI / 2);
    const bezelMat = new THREE.MeshBasicMaterial({
      color: 0x121218,
      transparent: true,
      opacity: 0.95
    });
    const bezelMesh = new THREE.Mesh(bezelGeo, bezelMat);
    hubGroup.add(bezelMesh);

    // B. Inner Platinum Silver Retaining Ring (Echoing silver arc in user reference)
    const colletGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.02, 24);
    colletGeo.rotateX(Math.PI / 2);
    const colletMat = new THREE.MeshBasicMaterial({
      color: 0xe2e8f0,
      transparent: true,
      opacity: 0.92
    });
    const colletMesh = new THREE.Mesh(colletGeo, colletMat);
    hubGroup.add(colletMesh);

    // C. Center Glowing Cyan/Blue Synthetic Jewel (Echoing blue circular dot in user reference)
    const jewelGeo = new THREE.SphereGeometry(0.015, 16, 16);
    jewelGeo.translate(0, 0, 0.012);
    const jewelMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending
    });
    const jewelMesh = new THREE.Mesh(jewelGeo, jewelMat);
    hubGroup.add(jewelMesh);

    // D. Soft Jewel Radiance Aura
    const jewelHaloGeo = new THREE.SphereGeometry(0.028, 12, 12);
    jewelHaloGeo.translate(0, 0, 0.012);
    const jewelHaloMat = new THREE.MeshBasicMaterial({
      color: 0x74e7ff,
      transparent: true,
      opacity: 0.40,
      blending: THREE.AdditiveBlending
    });
    const jewelHaloMesh = new THREE.Mesh(jewelHaloGeo, jewelHaloMat);
    hubGroup.add(jewelHaloMesh);

    this.handsGroup.add(hubGroup);
  }

  /**
   * Particle texture with sharp diamond/crystal radiance
   * Neutral pure white gradient so vertexColors dictate exact particle hues
   */
  createParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    ctx.beginPath();
    ctx.moveTo(32, 2);
    ctx.lineTo(62, 32);
    ctx.lineTo(32, 62);
    ctx.lineTo(2, 32);
    ctx.closePath();

    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 28);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.35, 'rgba(255, 255, 255, 0.95)');
    grad.addColorStop(0.70, 'rgba(255, 255, 255, 0.45)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = grad;
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Initialize Clock Dial Particles (Strictly bounded to the clock face)
   * All particles outside the clock removed to prevent clashing with the cosmic background.
   * Keeps:
   * 1. Outer dial circular ring (with pure white + chromatic particles)
   * 2. 12 Major Hour Markers
   * 3. 60 Minute Ticks
   */
  initClockParticles() {
    const cOrange = new THREE.Color(0xf97316);   // Sunset Orange (Reference Middle Sector)
    const cAmber = new THREE.Color(0xfbbf24);    // Golden Amber
    const cPurple = new THREE.Color(0xa855f7);   // Orchid Purple (Reference Right Sector)
    const cBlue = new THREE.Color(0x38bdf8);     // Electric Sky Blue (Reference Left Sector)
    const cSilver = new THREE.Color(0xe2e8f0);   // Platinum Silver Rim
    const cWhite = new THREE.Color(0xffffff);    // Pure Brilliant Diamond White
 
    const clockRadius = 2.45;
 
    for (let i = 0; i < this.particleCount; i++) {
      const idx = i * 3;
      const progress = i / this.particleCount;
 
      let x, y, z;
      let col;
      let isWhite = false;
 
      if (progress < 0.60) {
        // 1. Outer dial circular ring (tightly focused on the clock perimeter, zero particles outside)
        const angle = (progress / 0.60) * Math.PI * 2;
        const r = clockRadius * (0.985 + (Math.random() - 0.5) * 0.03);
        x = Math.cos(angle) * r;
        y = Math.sin(angle) * r;
        z = (Math.random() - 0.5) * 0.08;

        // Intersperse pure diamond white particles among the colored cosmic particles
        const rand = Math.random();
        if (rand < 0.35) {
          col = cWhite;
          isWhite = true;
        } else if (rand < 0.57) {
          col = cBlue;
        } else if (rand < 0.79) {
          col = cPurple;
        } else {
          col = cOrange;
        }
      } else if (progress < 0.80) {
        // 2. 12 Major Hour Markers (radial ticks strictly inside clock)
        const hourIdx = Math.floor(Math.random() * 12);
        const angle = (hourIdx / 12) * Math.PI * 2;
        const radialOffset = clockRadius * (0.84 + Math.random() * 0.12);
        const jitter = (Math.random() - 0.5) * 0.04;
        x = Math.cos(angle) * radialOffset + jitter;
        y = Math.sin(angle) * radialOffset + jitter;
        z = (Math.random() - 0.5) * 0.08;

        const rand = Math.random();
        if (rand < 0.30) {
          col = cWhite;
          isWhite = true;
        } else if (rand < 0.65) {
          col = cOrange;
        } else {
          col = cAmber;
        }
      } else {
        // 3. 60 Minute Ticks (fine radial ticks strictly inside clock)
        const minIdx = Math.floor(Math.random() * 60);
        const angle = (minIdx / 60) * Math.PI * 2;
        const radialOffset = clockRadius * (0.91 + Math.random() * 0.05);
        x = Math.cos(angle) * radialOffset;
        y = Math.sin(angle) * radialOffset;
        z = (Math.random() - 0.5) * 0.06;

        const rand = Math.random();
        if (rand < 0.40) {
          col = cWhite;
          isWhite = true;
        } else if (rand < 0.70) {
          col = cSilver;
        } else {
          col = cBlue;
        }
      }

      this.positions[idx + 0] = x;
      this.positions[idx + 1] = y;
      this.positions[idx + 2] = z;

      this.colors[idx + 0] = col.r;
      this.colors[idx + 1] = col.g;
      this.colors[idx + 2] = col.b;

      // Pure white particles sparkle with extra brightness and scale
      this.sizes[i] = isWhite ? (0.058 + Math.random() * 0.038) : (0.040 + Math.random() * 0.032);
    }
  }

  /**
   * Three.js Particle Mesh Setup
   */
  createParticleSystem() {
    this.particlesGeo = new THREE.BufferGeometry();
    this.particlesGeo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.particlesGeo.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    const particleTexture = this.createParticleTexture();

    const mat = new THREE.PointsMaterial({
      size: 0.055,
      vertexColors: true,
      map: particleTexture,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.particlesMesh = new THREE.Points(this.particlesGeo, mat);
    this.stageGroup.add(this.particlesMesh);
  }

  /**
   * Floating 3D Wireframe Tetrahedrons in Ambient Void (Dala Style)
   */
  createAmbientTetrahedrons() {
    this.ambientTetrahedrons = new THREE.Group();
    const count = 28;
    const colors = [0xffb829, 0x8052ff, 0x74e7ff, 0xffd15c, 0xffffff];

    for (let i = 0; i < count; i++) {
      const radius = 0.10 + Math.random() * 0.16;
      const tetGeo = new THREE.TetrahedronGeometry(radius, 0);
      const wireGeo = new THREE.WireframeGeometry(tetGeo);

      const col = colors[Math.floor(Math.random() * colors.length)];
      const lineMat = new THREE.LineBasicMaterial({
        color: col,
        transparent: true,
        opacity: 0.35 + Math.random() * 0.45,
        blending: THREE.AdditiveBlending
      });

      const line = new THREE.LineSegments(wireGeo, lineMat);

      // Distribute in 3D space surrounding the clock
      const rad = 2.8 + Math.random() * 3.6;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      line.position.set(
        Math.cos(theta) * Math.cos(phi) * rad,
        Math.sin(phi) * rad,
        Math.sin(theta) * Math.cos(phi) * rad
      );

      line.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      line.userData = {
        rotSpeedX: (Math.random() - 0.5) * 0.018,
        rotSpeedY: (Math.random() - 0.5) * 0.018,
        rotSpeedZ: (Math.random() - 0.5) * 0.012,
        baseY: line.position.y
      };

      this.ambientTetrahedrons.add(line);
    }

    this.stageGroup.add(this.ambientTetrahedrons);
  }

  /**
   * Compatibility method for scroll progress
   */
  setScrollProgress() {
    // No-op: Pure precision clock
  }

  /**
   * Main Render Loop Update (Rotates Optic Fiber Hands in Real-Time)
   */
  update() {
    if (!this.renderer || !this.scene || !this.camera) return;

    const elapsedTime = this.clock.getElapsedTime();

    // 1. Update 3 Optic Fiber Hands in Real-Time from System Time
    const now = new Date();
    const ms = now.getMilliseconds();
    const s = now.getSeconds() + ms / 1000;
    const m = now.getMinutes() + s / 60;
    const h = (now.getHours() % 12) + m / 60;

    // Clockwise rotation from 12 o'clock
    const hourAngle = -(h / 12) * Math.PI * 2;
    const minAngle = -(m / 60) * Math.PI * 2;
    const secAngle = -(s / 60) * Math.PI * 2;

    if (this.hourHandGroup) this.hourHandGroup.rotation.z = hourAngle;
    if (this.minHandGroup) this.minHandGroup.rotation.z = minAngle;
    if (this.secHandGroup) this.secHandGroup.rotation.z = secAngle;

    // 2. Optical Luminescence Shimmer (Photons propagating through silica glass)
    if (this.hourHandGroup?.userData?.sheathMat) {
      this.hourHandGroup.userData.sheathMat.opacity = 0.36 + Math.sin(elapsedTime * 2.6) * 0.08;
    }
    if (this.minHandGroup?.userData?.sheathMat) {
      this.minHandGroup.userData.sheathMat.opacity = 0.36 + Math.sin(elapsedTime * 3.2 + 1.2) * 0.08;
    }
    if (this.secHandGroup?.userData?.sheathMat) {
      this.secHandGroup.userData.sheathMat.opacity = 0.40 + Math.sin(elapsedTime * 4.0 + 2.4) * 0.10;
    }

    // 3. Mouse Parallax & Gentle Breathing
    this.stageGroup.rotation.y += (this.targetRotation.y - this.stageGroup.rotation.y) * 0.06;
    this.stageGroup.rotation.x += (this.targetRotation.x - this.stageGroup.rotation.x) * 0.06;

    // 3. Animate Ambient 3D Wireframe Tetrahedrons
    if (this.ambientTetrahedrons) {
      for (let i = 0; i < this.ambientTetrahedrons.children.length; i++) {
        const tet = this.ambientTetrahedrons.children[i];
        tet.rotation.x += tet.userData.rotSpeedX;
        tet.rotation.y += tet.userData.rotSpeedY;
        tet.rotation.z += tet.userData.rotSpeedZ;
        tet.position.y = tet.userData.baseY + Math.sin(elapsedTime + i) * 0.08;
      }
    }

    // 4. Render Scene
    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    if (!this.canvas || !this.renderer || !this.camera) return;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  }
}
