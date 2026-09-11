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

    // Build the clean, uniform geodesic neural network (exact reference outer structure)
    this.createUniformGeodesicLattice();
    this.createSignalPulses();

    // Setup drag and bounce interactions
    this.setupInteractions();
  }

  /**
   * Uniform Geodesic Neural Lattice (Reference Outer Structure)
   * Built on a geodesic Icosahedron (subdivision 2) providing 100% uniform,
   * equidistant node spacing across the sphere with crisp triangular wireframe edges.
   */
  createUniformGeodesicLattice() {
    const radius = 1.85;
    // Outer geodesic icosahedron geometry from reference (detail 2 for uniform equilateral triangles)
    const icoGeo = new THREE.IcosahedronGeometry(radius, 2);
    const posAttr = icoGeo.attributes.position;

    // 1. Extract unique vertices for uniform node points & edges
    const uniqueMap = new Map();
    this.nodePositions = [];
    const uniqueIndices = [];

    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      const z = posAttr.getZ(i);
      const key = `${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`;

      if (!uniqueMap.has(key)) {
        const idx = this.nodePositions.length;
        uniqueMap.set(key, idx);
        this.nodePositions.push(new THREE.Vector3(x, y, z));
        uniqueIndices.push(idx);
      } else {
        uniqueIndices.push(uniqueMap.get(key));
      }
    }

    // 2. Collect unique edges from geodesic triangles for clean 1px thin lines & data pulses
    this.edges = [];
    const edgeSet = new Set();

    for (let t = 0; t < uniqueIndices.length; t += 3) {
      const i1 = uniqueIndices[t];
      const i2 = uniqueIndices[t + 1];
      const i3 = uniqueIndices[t + 2];

      const pairs = [
        [i1, i2],
        [i2, i3],
        [i3, i1]
      ];

      pairs.forEach(([a, b]) => {
        const edgeKey = a < b ? `${a}-${b}` : `${b}-${a}`;
        if (!edgeSet.has(edgeKey)) {
          edgeSet.add(edgeKey);
          this.edges.push({
            start: this.nodePositions[a],
            end: this.nodePositions[b]
          });
        }
      });
    }

    // 3. Delicate, Thin Geodesic Line Segments (single hairline per edge without mesh thickness)
    const linePositions = new Float32Array(this.edges.length * 2 * 3);
    const lineColors = new Float32Array(this.edges.length * 2 * 3);

    for (let i = 0; i < this.edges.length; i++) {
      const p1 = this.edges[i].start;
      const p2 = this.edges[i].end;

      linePositions[i * 6 + 0] = p1.x;
      linePositions[i * 6 + 1] = p1.y;
      linePositions[i * 6 + 2] = p1.z;
      linePositions[i * 6 + 3] = p2.x;
      linePositions[i * 6 + 4] = p2.y;
      linePositions[i * 6 + 5] = p2.z;

      // Exact Contact wave gradient colors
      const theta1 = Math.atan2(p1.z, p1.x);
      const phi1 = Math.asin(p1.y / radius);
      const cf1 = (Math.sin(theta1 * 2.0 + phi1 * 1.5) + 1.0) * 0.5;

      const theta2 = Math.atan2(p2.z, p2.x);
      const phi2 = Math.asin(p2.y / radius);
      const cf2 = (Math.sin(theta2 * 2.0 + phi2 * 1.5) + 1.0) * 0.5;

      lineColors[i * 6 + 0] = 0.20 + cf1 * 0.25;
      lineColors[i * 6 + 1] = 0.60 + cf1 * 0.35;
      lineColors[i * 6 + 2] = 0.95 + cf1 * 0.05;

      lineColors[i * 6 + 3] = 0.20 + cf2 * 0.25;
      lineColors[i * 6 + 4] = 0.60 + cf2 * 0.35;
      lineColors[i * 6 + 5] = 0.95 + cf2 * 0.05;
    }

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeo.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.22, // Fine hairline lines
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.wireMesh = new THREE.LineSegments(lineGeo, lineMat);
    this.networkGroup.add(this.wireMesh);

    // 4. Node Points at every uniform vertex (kept identical as requested: "but node must be same..")
    const nodeCount = this.nodePositions.length;
    const nodePositionsArray = new Float32Array(nodeCount * 3);
    const nodeColorsArray = new Float32Array(nodeCount * 3);

    for (let i = 0; i < nodeCount; i++) {
      const v = this.nodePositions[i];
      nodePositionsArray[i * 3 + 0] = v.x;
      nodePositionsArray[i * 3 + 1] = v.y;
      nodePositionsArray[i * 3 + 2] = v.z;

      const theta = Math.atan2(v.z, v.x);
      const phi = Math.asin(v.y / radius);
      const colFactor = (Math.sin(theta * 2.0 + phi * 1.5) + 1.0) * 0.5;

      // 1 in 3 nodes is crisp white highlight, others follow wave colors
      if (i % 3 === 0) {
        nodeColorsArray[i * 3 + 0] = 1.0;
        nodeColorsArray[i * 3 + 1] = 1.0;
        nodeColorsArray[i * 3 + 2] = 1.0;
      } else {
        nodeColorsArray[i * 3 + 0] = 0.20 + colFactor * 0.25;
        nodeColorsArray[i * 3 + 1] = 0.60 + colFactor * 0.35;
        nodeColorsArray[i * 3 + 2] = 0.95 + colFactor * 0.05;
      }
    }

    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePositionsArray, 3));
    nodeGeo.setAttribute('color', new THREE.BufferAttribute(nodeColorsArray, 3));

    const nodeTex = this.createCrispCircleTexture(64);
    const nodeMat = new THREE.PointsMaterial({
      size: 0.085,
      vertexColors: true,
      map: nodeTex,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.nodesMesh = new THREE.Points(nodeGeo, nodeMat);
    this.networkGroup.add(this.nodesMesh);
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
      size: 0.045,
      color: 0x74e7ff, // Bright cosmic cyan from wave
      map: pulseTex,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.pulseMesh = new THREE.Points(pulseGeo, pulseMat);
    this.networkGroup.add(this.pulseMesh);
  }

  /**
   * Helper: Crisp Circular Texture (Cosmic Wave Cyan & Azure)
   */
  createCrispCircleTexture(size = 32) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const center = size / 2;
    const radius = size * 0.44;

    const grad = ctx.createRadialGradient(center, center, 0, center, center, radius);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.45, 'rgba(116, 231, 255, 0.95)');
    grad.addColorStop(0.85, 'rgba(32, 92, 176, 0.3)');
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
