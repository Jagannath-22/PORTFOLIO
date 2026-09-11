import * as THREE from 'three';

/**
 * ResearchCosmicScene
 * 
 * 3D Telemetry Globes in Section 03 (Research) background:
 * 1. Globe 1: Exact reference structure (radius 13.5, 2800 points), exact math
 *    (theta = sqrt(N*PI)*phi producing distinct particle lines), exact colors,
 *    exact rings (18.5 & 21.0), exact shader, and exact movement.
 * 2. Globe 2: Smaller version (radius 7.5, rings 10.25 & 11.65) with azure color variant.
 * 3. Positioning: Tucked into sides by default:
 *    - Globe 1 (large): 40% visible on the right edge (60% hidden off-screen).
 *    - Globe 2 (smaller): 80% visible on the left edge (20% hidden off-screen).
 * 4. Drag & Drop: Click and drag with cursor anywhere on a globe or the canvas.
 *    When dropped, IT STAYS THERE (does NOT spring back to original position).
 */
export class ResearchCosmicScene {
  constructor(canvas, container) {
    this.canvas = canvas;
    this.container = container || canvas.parentElement;
    if (!this.canvas) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();

    // Radii matching reference
    this.globe1Radius = 13.5;
    this.globe2Radius = 7.5;

    // Globe Objects
    this.globe1 = null;
    this.globe2 = null;

    // Drag State
    this.isDragging = false;
    this.draggedTarget = null;
    this.dragPlane = new THREE.Plane();
    this.raycaster = new THREE.Raycaster();
    this.mouseVec2 = new THREE.Vector2();
    this.dragOffset = new THREE.Vector3();

    // User customized position flags (so user-dragged position is preserved)
    this.hasBeenDragged1 = false;
    this.hasBeenDragged2 = false;

    // Hover & Parallax
    this.isVisible = true;
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    this.init();
  }

  init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || 800;

    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 52);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    // 4. Calculate responsive edge positions (40% visible for Globe 1, 80% visible for Globe 2)
    const { x1, y1, x2, y2 } = this.computeDefaultPositions();

    // 5. Globe 1: Exact structure, radius 13.5, rings 18.5 & 21.0, distinct particle lines
    this.globe1 = this.createExactTelemetryGlobe({
      id: 'globe1',
      pointCount: 2800,
      sphereRadius: this.globe1Radius,
      ring1Radius: 18.5,
      ring1TiltX: 0.8,
      ring1TiltZ: 0.35,
      ring2Radius: 21.0,
      ring2TiltX: -0.6,
      ring2TiltZ: -0.25,
      basePos: new THREE.Vector3(x1, y1, -8.0),
      colors: {
        navy: new THREE.Color(0x1e3a8a),
        cyan: new THREE.Color(0x38bdf8),
        white: new THREE.Color(0xffffff)
      },
      ringColor: 0x38bdf8,
      ringOpacity: 0.35,
      rotSpeedY: 0.1,
      ring1Speed: 0.25,
      ring2Speed: -0.2,
      floatFreq: 0.7,
      floatAmp: 0.6,
      floatPhase: 0,
      hitRadius: 21.0
    });
    this.scene.add(this.globe1.group);

    // 6. Globe 2: Smaller version (radius 7.5, rings 10.25 & 11.65, 80% visible on left)
    this.globe2 = this.createExactTelemetryGlobe({
      id: 'globe2',
      pointCount: 1900,
      sphereRadius: this.globe2Radius,
      ring1Radius: 10.25,
      ring1TiltX: -0.7,
      ring1TiltZ: 0.4,
      ring2Radius: 11.65,
      ring2TiltX: 0.55,
      ring2TiltZ: -0.3,
      basePos: new THREE.Vector3(x2, y2, -14.0),
      colors: {
        navy: new THREE.Color(0x10285a),
        cyan: new THREE.Color(0x2563eb),
        white: new THREE.Color(0xffffff)
      },
      whiteRatio: 0.50, // 30% of blue particles converted to white (50% white total)
      ringColor: 0x38bdf8,
      ringOpacity: 0.30,
      rotSpeedY: -0.09,
      ring1Speed: -0.22,
      ring2Speed: 0.18,
      floatFreq: 0.6,
      floatAmp: 0.5,
      floatPhase: 1.5,
      hitRadius: 12.0
    });
    this.scene.add(this.globe2.group);

    // 7. Event listeners
    this.setupInteractions();
    this.setupIntersectionObserver();
  }

  /**
   * Computes the default side positions:
   * - Globe 1: 40% visible peeking in from right side edge (60% hidden off-screen)
   * - Globe 2: 80% visible peeking in from left side edge (20% hidden off-screen)
   */
  computeDefaultPositions() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || 800;
    const aspect = width / height;
    const fovRad = THREE.MathUtils.degToRad(this.camera.fov * 0.5);

    // Globe 1 (at Z = -8.0, distance = camera.z - (-8.0) = 60.0)
    const dist1 = this.camera.position.z - (-8.0);
    const halfWidth1 = Math.tan(fovRad) * dist1 * aspect;
    // 40% of diameter (2*R1) is visible inside the screen:
    // Left-most point is at halfWidth1 - (0.4 * 2 * R1) = halfWidth1 - 0.8 * R1.
    // Center = halfWidth1 - 0.8 * R1 + R1 = halfWidth1 + 0.2 * R1.
    const x1 = halfWidth1 + (this.globe1Radius * 0.2);
    const y1 = 7.5; // Shifted ~1.7cm higher above baseline

    // Globe 2 (at Z = -14.0, distance = camera.z - (-14.0) = 66.0)
    const dist2 = this.camera.position.z - (-14.0);
    const halfWidth2 = Math.tan(fovRad) * dist2 * aspect;
    // 80% of diameter (2*R2) is visible inside the screen:
    // Right-most point is at -halfWidth2 + (0.8 * 2 * R2) = -halfWidth2 + 1.6 * R2.
    // Center = -halfWidth2 + 1.6 * R2 - R2 = -halfWidth2 + 0.6 * R2.
    const x2 = -halfWidth2 + (this.globe2Radius * 0.6);
    const y2 = -7.5;

    return { x1, y1, x2, y2 };
  }

  /**
   * Constructs the Telemetry Globe with particles in DISTINCT SPIRAL LINES
   * exactly matching the reference math.
   */
  createExactTelemetryGlobe(cfg) {
    const globeGroup = new THREE.Group();
    globeGroup.position.copy(cfg.basePos);

    const pointCount = cfg.pointCount;
    const sphereRadius = cfg.sphereRadius;
    const positions = new Float32Array(pointCount * 3);
    const colors = new Float32Array(pointCount * 3);
    const sizes = new Float32Array(pointCount);

    const { navy, cyan, white } = cfg.colors;
    const whiteRatio = cfg.whiteRatio ?? 0.20;

    // Exact reference math: theta = Math.sqrt(pointCount * Math.PI) * phi
    // This places particles in clean, uninterrupted distinct spiral lines winding across the sphere
    for (let i = 0; i < pointCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / pointCount);
      const theta = Math.sqrt(pointCount * Math.PI) * phi;
      const noise = Math.sin(phi * 5.0) * Math.cos(theta * 5.0);
      // Clean, coherent surface keeping points strictly in distinct lines
      const r = sphereRadius + (noise > 0.25 ? 0.28 : 0.0);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const isWhite = Math.random() < whiteRatio;
      const chosen = isWhite ? white : (Math.random() > 0.5 ? cyan : navy);
      colors[i * 3] = chosen.r;
      colors[i * 3 + 1] = chosen.g;
      colors[i * 3 + 2] = chosen.b;

      sizes[i] = Math.random() * 2.0 + 1.0;
    }

    const globeGeo = new THREE.BufferGeometry();
    globeGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    globeGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    globeGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Exact shader from reference
    const globeMat = new THREE.ShaderMaterial({
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (110.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float alpha = smoothstep(0.5, 0.05, d);
          gl_FragColor = vec4(vColor, alpha * 0.82);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const globePoints = new THREE.Points(globeGeo, globeMat);
    globeGroup.add(globePoints);

    // Exact orbital rings helper from reference
    const createOrbitRing = (radius, tiltX, tiltZ, ringColor, ringOpacity) => {
      const pts = [];
      const segs = 120;
      for (let i = 0; i <= segs; i++) {
        const t = (i / segs) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(t) * radius, 0, Math.sin(t) * radius));
      }
      const rGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const rMat = new THREE.LineBasicMaterial({
        color: ringColor,
        transparent: true,
        opacity: ringOpacity,
        blending: THREE.AdditiveBlending
      });
      const line = new THREE.Line(rGeo, rMat);
      line.rotation.x = tiltX;
      line.rotation.z = tiltZ;
      return line;
    };

    const ring1 = createOrbitRing(cfg.ring1Radius, cfg.ring1TiltX, cfg.ring1TiltZ, cfg.ringColor, cfg.ringOpacity);
    const ring2 = createOrbitRing(cfg.ring2Radius, cfg.ring2TiltX, cfg.ring2TiltZ, cfg.ringColor, cfg.ringOpacity);
    globeGroup.add(ring1);
    globeGroup.add(ring2);

    return {
      id: cfg.id,
      group: globeGroup,
      points: globePoints,
      ring1: ring1,
      ring2: ring2,
      anchorPos: cfg.basePos.clone(), // Where the globe stays when dropped
      velocity: new THREE.Vector3(0, 0, 0),
      rotSpeedY: cfg.rotSpeedY,
      ring1Speed: cfg.ring1Speed,
      ring2Speed: cfg.ring2Speed,
      floatFreq: cfg.floatFreq,
      floatAmp: cfg.floatAmp,
      floatPhase: cfg.floatPhase,
      hitRadius: cfg.hitRadius
    };
  }

  setupInteractions() {
    let pointerStartX = 0;
    let pointerStartY = 0;

    const getCoords = (e) => {
      const rect = this.container.getBoundingClientRect();
      const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
      const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? 0;
      return {
        ndcX: ((clientX - rect.left) / rect.width) * 2 - 1,
        ndcY: -(((clientY - rect.top) / rect.height) * 2 - 1),
        rawX: clientX,
        rawY: clientY
      };
    };

    const onPointerDown = (e) => {
      if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || e.target.closest('a')) {
        return;
      }

      const { ndcX, ndcY, rawX, rawY } = getCoords(e);
      pointerStartX = rawX;
      pointerStartY = rawY;

      this.mouseVec2.set(ndcX, ndcY);
      this.raycaster.setFromCamera(this.mouseVec2, this.camera);

      // Raycast against the spheres
      const checkHit = (globeObj) => {
        if (!globeObj) return false;
        const worldPos = new THREE.Vector3();
        globeObj.group.getWorldPosition(worldPos);
        const sphere = new THREE.Sphere(worldPos, globeObj.hitRadius);
        return this.raycaster.ray.intersectsSphere(sphere);
      };

      const hit1 = checkHit(this.globe1);
      const hit2 = checkHit(this.globe2);

      this.isDragging = true;
      this.canvas.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';

      if (hit1) {
        this.draggedTarget = this.globe1;
        this.hasBeenDragged1 = true;
      } else if (hit2) {
        this.draggedTarget = this.globe2;
        this.hasBeenDragged2 = true;
      } else {
        // Drag nearest globe
        const dist1 = this.camera.position.distanceTo(this.globe1.group.position);
        const dist2 = this.camera.position.distanceTo(this.globe2.group.position);
        this.draggedTarget = dist1 <= dist2 ? this.globe1 : this.globe2;
        if (this.draggedTarget === this.globe1) this.hasBeenDragged1 = true;
        else this.hasBeenDragged2 = true;
      }

      const worldPos = new THREE.Vector3();
      this.draggedTarget.group.getWorldPosition(worldPos);

      this.dragPlane.setFromNormalAndCoplanarPoint(
        this.camera.getWorldDirection(new THREE.Vector3()).negate(),
        worldPos
      );

      const planeIntersect = new THREE.Vector3();
      if (this.raycaster.ray.intersectPlane(this.dragPlane, planeIntersect)) {
        this.dragOffset.copy(worldPos).sub(planeIntersect);
      }
    };

    const onPointerMove = (e) => {
      const { ndcX, ndcY } = getCoords(e);
      this.mouse.targetX = ndcX;
      this.mouse.targetY = ndcY;

      if (this.isDragging && this.draggedTarget) {
        this.mouseVec2.set(ndcX, ndcY);
        this.raycaster.setFromCamera(this.mouseVec2, this.camera);
        const planeIntersect = new THREE.Vector3();

        if (this.raycaster.ray.intersectPlane(this.dragPlane, planeIntersect)) {
          const worldTarget = planeIntersect.add(this.dragOffset);
          const parent = this.draggedTarget.group.parent || this.scene;
          const localTarget = parent.worldToLocal(worldTarget.clone());

          const prevPos = this.draggedTarget.group.position.clone();
          this.draggedTarget.group.position.lerp(localTarget, 0.7);
          this.draggedTarget.velocity.copy(this.draggedTarget.group.position).sub(prevPos);

          // Update anchor position so it will STAY where dropped
          this.draggedTarget.anchorPos.copy(this.draggedTarget.group.position);
        }
      }
    };

    const onPointerUp = () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      if (this.draggedTarget) {
        // Permanently set the new anchor position where it was dropped (NO returning to original position)
        this.draggedTarget.anchorPos.copy(this.draggedTarget.group.position);
      }
      this.draggedTarget = null;
      this.canvas.style.cursor = 'grab';
      document.body.style.userSelect = '';
    };

    const onPointerLeave = () => {
      this.mouse.targetX = 0;
      this.mouse.targetY = 0;
      if (this.isDragging) {
        onPointerUp();
      }
    };

    this.container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp);
    this.container.addEventListener('pointerleave', onPointerLeave);

    this.canvas.style.cursor = 'grab';
  }

  setupIntersectionObserver() {
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          this.isVisible = entry.isIntersecting;
        });
      },
      { threshold: 0.02 }
    );

    observer.observe(this.container);
  }

  updateScroll() {
    // Keep internal tracker if needed
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);

    // Only reposition un-dragged globes to keep default 40% & 80% visibility on new viewport size
    const { x1, y1, x2, y2 } = this.computeDefaultPositions();
    if (this.globe1 && !this.hasBeenDragged1) {
      this.globe1.anchorPos.set(x1, y1, -8.0);
    }
    if (this.globe2 && !this.hasBeenDragged2) {
      this.globe2.anchorPos.set(x2, y2, -14.0);
    }
  }

  update() {
    if (!this.isVisible) return;

    const t = this.clock.getElapsedTime();

    // Subtle mouse parallax
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    this.camera.position.x = this.mouse.x * 1.5;
    this.camera.position.y = -this.mouse.y * 1.2;
    this.camera.rotation.y = -this.mouse.x * 0.025;
    this.camera.rotation.x = this.mouse.y * 0.02;

    // Update Globe 1: rotates & gently floats around its current anchor position (STAYS where dropped)
    if (this.globe1) {
      const g1 = this.globe1;
      g1.points.rotation.y = t * g1.rotSpeedY;
      g1.ring1.rotation.y = t * g1.ring1Speed;
      g1.ring2.rotation.y = t * g1.ring2Speed;

      if (!this.isDragging || this.draggedTarget !== g1) {
        // Natural release momentum glides to a stop
        g1.velocity.multiplyScalar(0.92);
        g1.anchorPos.add(g1.velocity);

        const floatOffset = Math.sin(t * g1.floatFreq + g1.floatPhase) * g1.floatAmp;
        g1.group.position.set(
          g1.anchorPos.x,
          g1.anchorPos.y + floatOffset,
          g1.anchorPos.z
        );
      }
    }

    // Update Globe 2: rotates & gently floats around its current anchor position (STAYS where dropped)
    if (this.globe2) {
      const g2 = this.globe2;
      g2.points.rotation.y = t * g2.rotSpeedY;
      g2.ring1.rotation.y = t * g2.ring1Speed;
      g2.ring2.rotation.y = t * g2.ring2Speed;

      if (!this.isDragging || this.draggedTarget !== g2) {
        g2.velocity.multiplyScalar(0.92);
        g2.anchorPos.add(g2.velocity);

        const floatOffset = Math.sin(t * g2.floatFreq + g2.floatPhase) * g2.floatAmp;
        g2.group.position.set(
          g2.anchorPos.x,
          g2.anchorPos.y + floatOffset,
          g2.anchorPos.z
        );
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
