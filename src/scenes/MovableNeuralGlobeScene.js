import * as THREE from 'three';

/**
 * MovableNeuralGlobeScene
 * 
 * Interactive 3D Neural Network Globe for Section 03 (About)
 * - "Not meshy": Clean geodesic/Fibonacci node lattice with near-uniform distance
 * - "Not glowy": Crisp, minimal particle shaders without oversized blinding bloom
 * - "Nearly uniform, premium": High-precision node distribution and sleek connectivity
 * - "Movable & bouncy": Click and drag to reposition anywhere with elastic spring-damper recoil physics
 * - Inertial 3D rotation on drag
 */
export class MovableNeuralGlobeScene {
  constructor(canvas) {
    this.canvas = canvas;
    if (!this.canvas) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();

    // Master container for the movable, bouncy globe
    this.globeAnchor = null;
    this.networkGroup = null;

    // Physics state for movable & bouncy behavior
    this.isDragging = false;
    this.dragPlane = new THREE.Plane();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.pointerDownPos = { x: 0, y: 0 };

    // Spring-damper translation physics
    this.restPosition = new THREE.Vector3(0, 0, 0);
    this.currentPosition = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.springStiffness = 0.055; // Snappy bouncy spring constant
    this.springDamping = 0.86;    // Satisfying elastic oscillation settling
    this.dragOffset = new THREE.Vector3();

    // Rotational inertia
    this.rotationVelocity = { x: 0, y: 0 };
    this.rotationalDamping = 0.93;

    // Network data
    this.nodes = [];
    this.edges = [];
    this.pulses = [];

    this.init();
  }

  init() {
    const width = this.canvas.clientWidth || 540;
    const height = this.canvas.clientHeight || 540;

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 6.2);

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

    // Anchor group (handles translation / bouncy position)
    this.globeAnchor = new THREE.Group();
    this.scene.add(this.globeAnchor);

    // Network group (handles 3D rotation)
    this.networkGroup = new THREE.Group();
    // Subtle initial aesthetic tilt
    this.networkGroup.rotation.x = 0.25;
    this.networkGroup.rotation.y = -0.35;
    this.globeAnchor.add(this.networkGroup);

    // Build the clean, uniform neural network
    this.createDottedSubstrate();
    this.createUniformLattice();
    this.createNetworkEdges();
    this.createSignalPulses();

    // Setup drag and bounce interactions
    this.setupInteractions();
  }

  /**
   * 1. Dotted Substrate Core
   * Fine, uniform Fibonacci points that provide a faint structural volume
   */
  createDottedSubstrate() {
    const count = 1400;
    const radius = 1.78;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const colorPrimary = new THREE.Color(0x3a7ea8);
    const colorSubtle = new THREE.Color(0x132a42);
    const colorWhite = new THREE.Color(0xd6f4ff);

    const phi = Math.PI * (Math.sqrt(5) - 1); // Golden angle

    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;

      const x = Math.cos(theta) * radiusAtY * radius;
      const py = y * radius;
      const z = Math.sin(theta) * radiusAtY * radius;

      positions[i * 3 + 0] = x;
      positions[i * 3 + 1] = py;
      positions[i * 3 + 2] = z;

      const rand = Math.random();
      const c = rand > 0.92 ? colorWhite : (rand > 0.4 ? colorPrimary : colorSubtle);
      colors[i * 3 + 0] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Crisp dot texture with sharp circular edge (not fuzzy/glowy)
    const dotTex = this.createCrispCircleTexture(32);

    const mat = new THREE.PointsMaterial({
      size: 0.032,
      vertexColors: true,
      map: dotTex,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.substrateMesh = new THREE.Points(geo, mat);
    this.networkGroup.add(this.substrateMesh);
  }

  /**
   * 2. Uniform Node Lattice
   * Uniformly spaced Fibonacci nodes (~36 nodes) - Clean & Elegant
   */
  createUniformLattice() {
    const nodeCount = 38;
    const radius = 1.82;
    this.nodePositions = [];

    const phi = Math.PI * (Math.sqrt(5) - 1); // Golden ratio spiral

    for (let i = 0; i < nodeCount; i++) {
      const y = 1 - (i / (nodeCount - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;

      const x = Math.cos(theta) * radiusAtY * radius;
      const py = y * radius;
      const z = Math.sin(theta) * radiusAtY * radius;

      this.nodePositions.push(new THREE.Vector3(x, py, z));
    }

    // Node points geometry
    const positions = new Float32Array(nodeCount * 3);
    const colors = new Float32Array(nodeCount * 3);

    const colCyan = new THREE.Color(0x74e7ff);
    const colWhite = new THREE.Color(0xffffff);

    for (let i = 0; i < nodeCount; i++) {
      const pos = this.nodePositions[i];
      positions[i * 3 + 0] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;

      // Key vertices are crisp white, others electric cyan
      const isKey = (i % 5 === 0);
      const c = isKey ? colWhite : colCyan;
      colors[i * 3 + 0] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const nodeTex = this.createCrispCircleTexture(64);

    const mat = new THREE.PointsMaterial({
      size: 0.058, // Small, clean, uniform (no oversized blooms)
      vertexColors: true,
      map: nodeTex,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.nodesMesh = new THREE.Points(geo, mat);
    this.networkGroup.add(this.nodesMesh);
  }

  /**
   * 3. Clean Nearest-Neighbor Network Edges (Not Meshy!)
   * Connect only closest neighbors to maintain an open, architectural graph
   */
  createNetworkEdges() {
    const linePositions = [];
    this.edges = [];
    const maxNeighbors = 3; // Maximum 3 connections per node to avoid meshy clutter
    const maxDist = 1.35;   // Strict distance threshold

    for (let i = 0; i < this.nodePositions.length; i++) {
      const p1 = this.nodePositions[i];
      const neighbors = [];

      for (let j = 0; j < this.nodePositions.length; j++) {
        if (i === j) continue;
        const p2 = this.nodePositions[j];
        const dist = p1.distanceTo(p2);
        if (dist <= maxDist) {
          neighbors.push({ index: j, dist });
        }
      }

      // Sort by proximity
      neighbors.sort((a, b) => a.dist - b.dist);

      // Connect only closest neighbors
      const count = Math.min(neighbors.length, maxNeighbors);
      for (let k = 0; k < count; k++) {
        const j = neighbors[k].index;
        if (i < j) { // Avoid duplicate bidirectional lines
          const p2 = this.nodePositions[j];
          linePositions.push(p1.x, p1.y, p1.z);
          linePositions.push(p2.x, p2.y, p2.z);
          this.edges.push({ start: p1, end: p2 });
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));

    const mat = new THREE.LineBasicMaterial({
      color: 0x3d7b9e,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.linesMesh = new THREE.LineSegments(geo, mat);
    this.networkGroup.add(this.linesMesh);
  }

  /**
   * 4. Minimal, Subtle Signal Pulses
   * Small discrete data packets that travel smoothly along edges
   */
  createSignalPulses() {
    const pulseCount = 14;
    this.pulses = [];

    for (let i = 0; i < pulseCount; i++) {
      const edge = this.edges[Math.floor(Math.random() * this.edges.length)];
      this.pulses.push({
        edge,
        progress: Math.random(),
        speed: 0.003 + Math.random() * 0.005,
        forward: Math.random() > 0.5
      });
    }

    const pulsePositions = new Float32Array(pulseCount * 3);
    const pulseGeo = new THREE.BufferGeometry();
    pulseGeo.setAttribute('position', new THREE.BufferAttribute(pulsePositions, 3));

    const pulseTex = this.createCrispCircleTexture(32);

    const pulseMat = new THREE.PointsMaterial({
      size: 0.042,
      color: 0x74e7ff,
      map: pulseTex,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.pulseMesh = new THREE.Points(pulseGeo, pulseMat);
    this.networkGroup.add(this.pulseMesh);
  }

  /**
   * Helper: Crisp Circular Texture
   */
  createCrispCircleTexture(size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const center = size / 2;

    const grad = ctx.createRadialGradient(center, center, 0, center, center, center);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.5, 'rgba(116, 231, 255, 0.9)');
    grad.addColorStop(0.85, 'rgba(64, 150, 200, 0.25)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    return new THREE.CanvasTexture(canvas);
  }

  /**
   * 5. Interactive Drag & Bouncy Physics Setup
   */
  setupInteractions() {
    let pointerX = 0;
    let pointerY = 0;

    const getCanvasRelativePos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
      const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? 0;
      return {
        x: ((clientX - rect.left) / rect.width) * 2 - 1,
        y: -(((clientY - rect.top) / rect.height) * 2 - 1),
        rawX: clientX,
        rawY: clientY
      };
    };

    const onPointerDown = (e) => {
      this.isDragging = true;
      const pos = getCanvasRelativePos(e);
      pointerX = pos.rawX;
      pointerY = pos.rawY;

      // Plane aligned with camera for dragging
      this.dragPlane.setFromNormalAndCoplanarPoint(
        this.camera.getWorldDirection(new THREE.Vector3()).negate(),
        this.globeAnchor.position
      );

      this.mouse.x = pos.x;
      this.mouse.y = pos.y;
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersection = new THREE.Vector3();
      if (this.raycaster.ray.intersectPlane(this.dragPlane, intersection)) {
        this.dragOffset.copy(this.globeAnchor.position).sub(intersection);
      }

      // Visual feedback: grabbing cursor
      this.canvas.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    };

    const onPointerMove = (e) => {
      const pos = getCanvasRelativePos(e);
      const deltaX = pos.rawX - pointerX;
      const deltaY = pos.rawY - pointerY;
      pointerX = pos.rawX;
      pointerY = pos.rawY;

      if (!this.isDragging) return;

      // 1. Translation in 3D space
      this.mouse.x = pos.x;
      this.mouse.y = pos.y;
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersection = new THREE.Vector3();
      if (this.raycaster.ray.intersectPlane(this.dragPlane, intersection)) {
        const target = intersection.add(this.dragOffset);
        // Elastic stretch boundary limit so globe stays cleanly within viewing range
        target.x = THREE.MathUtils.clamp(target.x, -2.5, 2.5);
        target.y = THREE.MathUtils.clamp(target.y, -1.6, 1.6);
        target.z = 0;

        const prevPos = this.currentPosition.clone();
        this.currentPosition.lerp(target, 0.7);
        this.velocity.copy(this.currentPosition).sub(prevPos);
      }

      // 2. Rotational momentum while dragging
      this.rotationVelocity.y += deltaX * 0.0035;
      this.rotationVelocity.x += deltaY * 0.0035;
    };

    const onPointerUp = () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.canvas.style.cursor = 'grab';
      document.body.style.userSelect = '';
      // Retain natural toss velocity for the spring recoil
    };

    this.canvas.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('mouseup', onPointerUp);

    this.canvas.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    this.canvas.style.cursor = 'grab';
  }

  /**
   * Main Animation Loop Update
   */
  update() {
    if (!this.renderer || !this.scene || !this.camera) return;

    // 1. Spring-Damper Physics (Bouncy Recoil when released)
    if (!this.isDragging) {
      // Hooke's Law: F = -k * (x - rest)
      const displacement = new THREE.Vector3().copy(this.currentPosition).sub(this.restPosition);
      const springForce = displacement.multiplyScalar(-this.springStiffness);

      // Add spring force to velocity
      this.velocity.add(springForce);
      // Damping
      this.velocity.multiplyScalar(this.springDamping);
      // Update position
      this.currentPosition.add(this.velocity);
    }

    // Apply translation position to anchor
    this.globeAnchor.position.copy(this.currentPosition);

    // 2. Rotational Inertia
    this.networkGroup.rotation.y += this.rotationVelocity.y;
    this.networkGroup.rotation.x += this.rotationVelocity.x;
    this.rotationVelocity.x *= this.rotationalDamping;
    this.rotationVelocity.y *= this.rotationalDamping;

    // 3. Update Signal Pulses
    if (this.pulseMesh && this.pulses.length > 0) {
      const posAttr = this.pulseMesh.geometry.attributes.position;
      for (let i = 0; i < this.pulses.length; i++) {
        const p = this.pulses[i];
        p.progress += p.speed;
        if (p.progress >= 1.0) {
          p.progress = 0;
          p.edge = this.edges[Math.floor(Math.random() * this.edges.length)];
          p.forward = Math.random() > 0.5;
        }

        const t = p.forward ? p.progress : 1.0 - p.progress;
        const edge = p.edge;
        const x = edge.start.x + (edge.end.x - edge.start.x) * t;
        const y = edge.start.y + (edge.end.y - edge.start.y) * t;
        const z = edge.start.z + (edge.end.z - edge.start.z) * t;

        posAttr.setXYZ(i, x, y, z);
      }
      posAttr.needsUpdate = true;
    }

    // Render
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
