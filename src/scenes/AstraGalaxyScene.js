import * as THREE from 'three';

export class AstraGalaxyScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    this.camera.position.set(0, 0, 16);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.clock = new THREE.Clock();
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.morphFactor = 0; // 0 = Spiral Galaxy, 1 = Morphing Arrow Vector
    this.targetMorph = 0;

    this.initGalaxyAndArrowParticles();
    this.initBGPNodes();
    this.initEventListeners();
  }

  initGalaxyAndArrowParticles() {
    this.particleCount = 5500;
    this.geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);
    const galaxyTargets = new Float32Array(this.particleCount * 3);
    const arrowTargets = new Float32Array(this.particleCount * 3);
    const randomOffsets = new Float32Array(this.particleCount * 3);

    const colorCore = new THREE.Color(0xffffff);
    const colorAmber = new THREE.Color(0xd4a574);
    const colorCyan = new THREE.Color(0x00f5ff);
    const colorBlue = new THREE.Color(0x3a86ff);

    // 1. Calculate Galaxy Targets (Logarithmic spiral arms)
    const arms = 3;
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      const r = Math.pow(Math.random(), 2.2) * 9.0;
      const armAngle = ((i % arms) * (Math.PI * 2)) / arms;
      const spinAngle = r * 0.9;
      const angle = armAngle + spinAngle;

      const spreadX = (Math.random() - 0.5) * (0.3 + r * 0.12);
      const spreadY = (Math.random() - 0.5) * (0.3 + r * 0.12);
      const spreadZ = (Math.random() - 0.5) * (0.4 + r * 0.08);

      galaxyTargets[i3] = Math.cos(angle) * r + spreadX;
      galaxyTargets[i3 + 1] = Math.sin(angle) * r * 0.65 + spreadY; // tilted plane
      galaxyTargets[i3 + 2] = spreadZ;

      // 2. Calculate Arrow Targets (Morphing Arrow Vector)
      // Reference: Arrow outline shaped by glowing particles
      const t = (i / this.particleCount);
      let ax = 0, ay = 0, az = (Math.random() - 0.5) * 0.4;

      if (t < 0.35) {
        // Left diagonal wing of arrow
        const segT = t / 0.35;
        ax = -4.5 + segT * 4.5;
        ay = -2.5 + segT * 5.0;
      } else if (t < 0.7) {
        // Right diagonal wing of arrow
        const segT = (t - 0.35) / 0.35;
        ax = 0.0 + segT * 4.5;
        ay = 2.5 - segT * 5.0;
      } else if (t < 0.85) {
        // Inner inverted apex notch
        const segT = (t - 0.7) / 0.15;
        ax = 4.5 - segT * 4.5;
        ay = -2.5 + segT * 1.5;
      } else {
        // Left inner notch closing
        const segT = (t - 0.85) / 0.15;
        ax = 0.0 - segT * 4.5;
        ay = -1.0 - segT * 1.5;
      }

      ax += (Math.random() - 0.5) * 0.35;
      ay += (Math.random() - 0.5) * 0.35;

      arrowTargets[i3] = ax;
      arrowTargets[i3 + 1] = ay;
      arrowTargets[i3 + 2] = az;

      // Random offsets for noise motion
      randomOffsets[i3] = Math.random() * Math.PI * 2;
      randomOffsets[i3 + 1] = Math.random() * Math.PI * 2;
      randomOffsets[i3 + 2] = Math.random() * Math.PI * 2;

      // Initial positions start at galaxy targets
      positions[i3] = galaxyTargets[i3];
      positions[i3 + 1] = galaxyTargets[i3 + 1];
      positions[i3 + 2] = galaxyTargets[i3 + 2];

      // Colors: Core is white/amber, arms are cyan/blue
      let mixedColor = colorCore.clone();
      if (r < 1.5) {
        mixedColor.lerp(colorAmber, r / 1.5);
      } else {
        const tColor = (r - 1.5) / 7.5;
        mixedColor = Math.random() > 0.4 ? colorCyan.clone() : colorBlue.clone();
        if (Math.random() > 0.85) mixedColor = colorAmber.clone();
      }

      colors[i3] = mixedColor.r;
      colors[i3 + 1] = mixedColor.g;
      colors[i3 + 2] = mixedColor.b;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.galaxyTargets = galaxyTargets;
    this.arrowTargets = arrowTargets;
    this.randomOffsets = randomOffsets;

    // Particle Shader Material
    const pointMaterial = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.particleSystem = new THREE.Points(this.geometry, pointMaterial);
    this.scene.add(this.particleSystem);
  }

  initBGPNodes() {
    this.bgpGroup = new THREE.Group();
    this.scene.add(this.bgpGroup);

    // 4 Primary Autonomous System Nodes (BGP Peering Points)
    const asNodes = [
      { name: 'AS13335 // CLOUDFLARE', pos: new THREE.Vector3(-3.5, 2.0, 0), color: 0xd4a574 },
      { name: 'AS15169 // GOOGLE_EDGE', pos: new THREE.Vector3(3.2, 2.2, 0), color: 0x00f5ff },
      { name: 'AS3356 // LUMEN_BACKBONE', pos: new THREE.Vector3(0, -3.5, 0), color: 0x00ff88 },
      { name: 'AS2914 // NTT_SECURITY', pos: new THREE.Vector3(0, 0, 0), color: 0xffffff }
    ];

    asNodes.forEach((node) => {
      const ringGeo = new THREE.RingGeometry(0.3, 0.38, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: node.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(node.pos);
      this.bgpGroup.add(ring);
    });
  }

  initEventListeners() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.targetX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.targetY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    });

    this.canvas.addEventListener('mouseenter', () => {
      this.targetMorph = 1.0; // Morph into Arrow on hover
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.targetMorph = 0.0; // Return to Spiral Galaxy
    });
  }

  toggleMorphState(forceState = null) {
    if (forceState !== null) {
      this.targetMorph = forceState ? 1.0 : 0.0;
    } else {
      this.targetMorph = this.targetMorph === 0 ? 1.0 : 0.0;
    }
  }

  onResize() {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  update() {
    const time = this.clock.getElapsedTime();

    // Lerp morph factor
    this.morphFactor += (this.targetMorph - this.morphFactor) * 0.06;

    // Lerp mouse
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    const positions = this.geometry.attributes.position.array;

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;

      const gx = this.galaxyTargets[i3];
      const gy = this.galaxyTargets[i3 + 1];
      const gz = this.galaxyTargets[i3 + 2];

      const ax = this.arrowTargets[i3];
      const ay = this.arrowTargets[i3 + 1];
      const az = this.arrowTargets[i3 + 2];

      // Dynamic dispersion wave on morph transition
      const wave = Math.sin(time * 3 + this.randomOffsets[i3]) * 0.15;

      const targetX = gx * (1 - this.morphFactor) + ax * this.morphFactor + wave;
      const targetY = gy * (1 - this.morphFactor) + ay * this.morphFactor + wave;
      const targetZ = gz * (1 - this.morphFactor) + az * this.morphFactor;

      positions[i3] += (targetX - positions[i3]) * 0.1;
      positions[i3 + 1] += (targetY - positions[i3 + 1]) * 0.1;
      positions[i3 + 2] += (targetZ - positions[i3 + 2]) * 0.1;
    }

    this.geometry.attributes.position.needsUpdate = true;

    // Rotation: Galaxy rotates continuously, Arrow tracks mouse vector
    if (this.morphFactor < 0.5) {
      this.particleSystem.rotation.z = time * 0.08;
      this.particleSystem.rotation.x = 0.2 + this.mouse.y * 0.3;
      this.particleSystem.rotation.y = this.mouse.x * 0.3;
      this.bgpGroup.visible = true;
      this.bgpGroup.rotation.z = time * 0.04;
    } else {
      // Arrow orientation tracks mouse direction and rotates smoothly
      const angle = Math.atan2(this.mouse.y, this.mouse.x);
      this.particleSystem.rotation.z = THREE.MathUtils.lerp(this.particleSystem.rotation.z, angle - Math.PI / 2, 0.08);
      this.particleSystem.rotation.x = this.mouse.y * 0.4;
      this.particleSystem.rotation.y = this.mouse.x * 0.4;
      this.bgpGroup.visible = false;
    }

    this.renderer.render(this.scene, this.camera);
  }
}
