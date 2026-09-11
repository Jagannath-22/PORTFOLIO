import * as THREE from 'three';

/**
 * ContactCosmicScene
 * 
 * Renders the Cosmic Wave (ethereal parametric ribbon) and
 * Transparent Prism Cubes (translucent physical glass with RGB chromatic dispersion)
 * in the background of the Contact section (#contact).
 * 
 * Features:
 * - Positioned lower down in the contact section to frame correspondence & PGP cards.
 * - Interactive Cursor Dragging: Click and drag either individual cubes or the entire
 *   assembly (wave + cubes) with cursor in 3D space with elastic spring recoil & inertia!
 * - Floating levitation: multi-axis sinusoidal bobbing & gyroscopic tumbling.
 * - Hover play: scene tilt, cursor velocity impulses, raycast glow highlights.
 * - Viewport optimized with IntersectionObserver.
 */
export class ContactCosmicScene {
  constructor(canvas, container) {
    this.canvas = canvas;
    this.container = container || canvas.parentElement;
    if (!this.canvas) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();

    // Groups
    this.masterGroup = null;
    this.prismClusterGroup = null;
    this.etherealWaveRibbon = null;
    this.cubes = [];

    // Drag & Physics state
    this.isDragging = false;
    this.draggedCube = null;
    this.dragPlane = new THREE.Plane();
    this.raycaster = new THREE.Raycaster();
    this.mouseVec2 = new THREE.Vector2();
    this.dragOffset = new THREE.Vector3();

    // Master assembly spring-damper physics (shifted lower: Y = -5.8)
    this.restPosition = new THREE.Vector3(0, -5.8, 0);
    this.currentPosition = new THREE.Vector3(0, -5.8, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.springStiffness = 0.05;
    this.springDamping = 0.88;

    // Rotational inertia
    this.rotationVelocity = { x: 0, y: 0 };
    this.rotationDamping = 0.92;
    this.currentRotation = { x: 0.05, y: 0 };

    // Hover Play state
    this.isVisible = true;
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.mouseVelocity = 0;
    this.lastMousePos = { x: 0, y: 0 };
    this.hoveredCube = null;

    this.init();
  }

  init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || 700;

    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 38);

    // 3. Renderer with alpha for seamless transparent blending
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;

    // 4. Master group holding wave and cubes (positioned down)
    this.masterGroup = new THREE.Group();
    this.masterGroup.position.copy(this.restPosition);
    this.scene.add(this.masterGroup);

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0x1a2e3b, 1.3);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
    keyLight.position.set(20, 25, 25);
    this.scene.add(keyLight);

    const cyanRimLight = new THREE.PointLight(0x74e7ff, 3.2, 70);
    cyanRimLight.position.set(-18, 5, 12);
    this.scene.add(cyanRimLight);

    const goldFillLight = new THREE.PointLight(0xffbe6f, 2.5, 60);
    goldFillLight.position.set(18, -12, 14);
    this.scene.add(goldFillLight);

    // 6. Build visual elements (positioned lower down)
    this.createEtherealParametricWave();
    this.createTransparentPrismCubes();

    // 7. Setup Drag & Hover interactions
    this.setupInteractions();
    this.setupIntersectionObserver();
  }

  /**
   * Cosmic Wave Ribbon (shifted down)
   */
  createEtherealParametricWave() {
    this.etherealWaveRibbon = new THREE.Group();
    const ringCount = 28;
    const pointsPerRing = 130;

    for (let r = 0; r < ringCount; r++) {
      const ringProgress = r / ringCount;
      const positions = [];
      const colors = [];
      const baseRadius = 7.5 + Math.sin(ringProgress * Math.PI) * 3.6;
      const zOffset = (ringProgress - 0.5) * 16.0;

      for (let i = 0; i <= pointsPerRing; i++) {
        const theta = (i / pointsPerRing) * Math.PI * 2;
        const waveMod = Math.sin(theta * 3.0 + ringProgress * 4.0) * 1.5 + Math.cos(theta * 2.0) * 1.0;
        const radius = baseRadius + waveMod;

        const x = Math.cos(theta) * radius;
        const y = Math.sin(theta) * radius * 0.65 + Math.sin(theta * 2.0 + ringProgress * 2.2) * 1.4;
        const z = zOffset + Math.sin(theta * 3.0) * 1.8;

        positions.push(x, y, z);

        const colFactor = (Math.sin(theta + ringProgress * 3.0) + 1.0) * 0.5;
        const rVal = 0.20 + colFactor * 0.25;
        const gVal = 0.60 + colFactor * 0.35;
        const bVal = 0.95 + colFactor * 0.05;
        colors.push(rVal, gVal, bVal);
      }

      const ringGeo = new THREE.BufferGeometry();
      ringGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      ringGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

      ringGeo.userData = {
        initialPositions: new Float32Array(positions),
        ringProgress: ringProgress
      };

      const ringMat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: Math.max(0.12, 0.42 - (ringProgress * 0.18)),
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      const line = new THREE.Line(ringGeo, ringMat);
      this.etherealWaveRibbon.add(line);
    }

    // Positioned lower down within the master group, shifted ~8 cm right (5 cm + 3 cm more)
    this.etherealWaveRibbon.position.set(5.2, -2.0, -5);
    this.etherealWaveRibbon.rotation.set(0.24, 0.30, -0.12);
    this.masterGroup.add(this.etherealWaveRibbon);
  }

  /**
   * Transparent Prism Glass Cubes with RGB Chromatic Dispersion (shifted lower)
   */
  createTransparentPrismCubes() {
    this.prismClusterGroup = new THREE.Group();
    this.cubes = [];

    // Positioned downward to comfortably frame the PGP card and correspondence
    const cubeConfigs = [
      { size: 4.8, pos: [11.5, 0.0, -2], rot: [0.35, 0.4, 0.1], bobFreq: 0.8, bobAmp: 0.7 },
      { size: 3.4, pos: [15.5, 3.8, -5], rot: [-0.2, 0.8, -0.3], bobFreq: 1.1, bobAmp: 0.5 },
      { size: 3.8, pos: [-11.0, -4.5, -3], rot: [0.5, -0.3, 0.2], bobFreq: 0.9, bobAmp: 0.6 },
      { size: 2.6, pos: [-15.5, 1.2, -7], rot: [0.1, 0.2, 0.6], bobFreq: 1.2, bobAmp: 0.45 },
      { size: 2.9, pos: [5.5, -5.5, -4], rot: [0.25, -0.45, 0.4], bobFreq: 0.75, bobAmp: 0.55 },
      { size: 2.2, pos: [-4.0, 3.0, -6], rot: [-0.4, 0.3, -0.2], bobFreq: 1.05, bobAmp: 0.4 }
    ];

    cubeConfigs.forEach((cfg, idx) => {
      const singleCubeGroup = new THREE.Group();
      const boxGeo = new THREE.BoxGeometry(cfg.size, cfg.size, cfg.size);

      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x08121a,
        metalness: 0.08,
        roughness: 0.12,
        transmission: 0.88,
        thickness: 3.2,
        reflectivity: 0.92,
        transparent: true,
        opacity: 0.82,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1
      });
      const glassMesh = new THREE.Mesh(boxGeo, glassMat);
      singleCubeGroup.add(glassMesh);

      const edgesGeo = new THREE.EdgesGeometry(boxGeo);

      // Red dispersion line
      const redLine = new THREE.LineSegments(edgesGeo, new THREE.LineBasicMaterial({
        color: 0xff2a2a,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending
      }));
      redLine.position.set(-0.045, 0.045, 0.035);
      singleCubeGroup.add(redLine);

      // Cyan dispersion line
      const cyanLine = new THREE.LineSegments(edgesGeo, new THREE.LineBasicMaterial({
        color: 0x2a7fff,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending
      }));
      cyanLine.position.set(0.045, -0.035, -0.025);
      singleCubeGroup.add(cyanLine);

      // Lime dispersion line
      const limeLine = new THREE.LineSegments(edgesGeo, new THREE.LineBasicMaterial({
        color: 0x2aff2a,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending
      }));
      limeLine.position.set(0.015, 0.015, 0.045);
      singleCubeGroup.add(limeLine);

      singleCubeGroup.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
      singleCubeGroup.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);

      singleCubeGroup.userData = {
        basePos: new THREE.Vector3(cfg.pos[0], cfg.pos[1], cfg.pos[2]),
        customOffset: new THREE.Vector3(0, 0, 0),
        cubeVelocity: new THREE.Vector3(0, 0, 0),
        bobFreq: cfg.bobFreq,
        bobAmp: cfg.bobAmp,
        phase: idx * 1.35,
        rotSpeedX: (Math.random() - 0.5) * 0.005 + 0.002,
        rotSpeedY: (Math.random() - 0.5) * 0.006 + 0.003,
        rotSpeedZ: (Math.random() - 0.5) * 0.004,
        hoverImpulse: 0,
        glassMesh: glassMesh,
        dispersionLines: [redLine, cyanLine, limeLine]
      };

      this.cubes.push(singleCubeGroup);
      this.prismClusterGroup.add(singleCubeGroup);
    });

    this.masterGroup.add(this.prismClusterGroup);
  }

  /**
   * Setup Dragging and Hover Play with Cursor
   */
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
      // Don't hijack clicks on email link or buttons
      if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || e.target.closest('a')) {
        return;
      }

      const { ndcX, ndcY, rawX, rawY } = getCoords(e);
      pointerStartX = rawX;
      pointerStartY = rawY;

      this.mouseVec2.set(ndcX, ndcY);
      this.raycaster.setFromCamera(this.mouseVec2, this.camera);

      // Check if user clicked directly on one of the transparent cubes
      const meshes = this.cubes.map(c => c.userData.glassMesh);
      const intersects = this.raycaster.intersectObjects(meshes, false);

      this.isDragging = true;
      this.canvas.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';

      if (intersects.length > 0) {
        // Drag specific cube
        const hitMesh = intersects[0].object;
        this.draggedCube = hitMesh.parent;

        // Plane aligned with camera passing through cube world position
        const worldPos = new THREE.Vector3();
        this.draggedCube.getWorldPosition(worldPos);
        this.dragPlane.setFromNormalAndCoplanarPoint(
          this.camera.getWorldDirection(new THREE.Vector3()).negate(),
          worldPos
        );

        const planeIntersect = new THREE.Vector3();
        if (this.raycaster.ray.intersectPlane(this.dragPlane, planeIntersect)) {
          this.dragOffset.copy(worldPos).sub(planeIntersect);
        }
      } else {
        // Drag entire assembly (wave + all cubes)
        this.draggedCube = null;
        this.dragPlane.setFromNormalAndCoplanarPoint(
          this.camera.getWorldDirection(new THREE.Vector3()).negate(),
          this.currentPosition
        );

        const planeIntersect = new THREE.Vector3();
        if (this.raycaster.ray.intersectPlane(this.dragPlane, planeIntersect)) {
          this.dragOffset.copy(this.currentPosition).sub(planeIntersect);
        }
      }
    };

    const onPointerMove = (e) => {
      const { ndcX, ndcY, rawX, rawY } = getCoords(e);
      const deltaX = rawX - pointerStartX;
      const deltaY = rawY - pointerStartY;
      pointerStartX = rawX;
      pointerStartY = rawY;

      this.mouse.targetX = ndcX;
      this.mouse.targetY = ndcY;

      // Mouse velocity for hover impulse (calm and dampened)
      const dx = ndcX - this.lastMousePos.x;
      const dy = ndcY - this.lastMousePos.y;
      const speed = Math.sqrt(dx * dx + dy * dy);
      this.mouseVelocity = Math.min(this.mouseVelocity + speed * 1.4, 1.2);
      this.lastMousePos.x = ndcX;
      this.lastMousePos.y = ndcY;

      // When dragging with cursor
      if (this.isDragging) {
        this.mouseVec2.set(ndcX, ndcY);
        this.raycaster.setFromCamera(this.mouseVec2, this.camera);
        const planeIntersect = new THREE.Vector3();

        if (this.raycaster.ray.intersectPlane(this.dragPlane, planeIntersect)) {
          if (this.draggedCube) {
            // Drag specific cube in 3D space
            const worldTarget = planeIntersect.add(this.dragOffset);
            const parent = this.draggedCube.parent;
            const localTarget = parent.worldToLocal(worldTarget.clone());

            const prevPos = this.draggedCube.position.clone();
            this.draggedCube.position.lerp(localTarget, 0.65);
            this.draggedCube.userData.cubeVelocity.copy(this.draggedCube.position).sub(prevPos);
            this.draggedCube.userData.customOffset.copy(this.draggedCube.position).sub(this.draggedCube.userData.basePos);
          } else {
            // Drag the entire wave + cubes assembly
            const targetPos = planeIntersect.add(this.dragOffset);
            // Clamp so it stays comfortably within view range
            targetPos.x = THREE.MathUtils.clamp(targetPos.x, -16.0, 16.0);
            targetPos.y = THREE.MathUtils.clamp(targetPos.y, -14.0, 3.0);
            targetPos.z = THREE.MathUtils.clamp(targetPos.z, -8.0, 8.0);

            const prevPos = this.currentPosition.clone();
            this.currentPosition.lerp(targetPos, 0.65);
            this.velocity.copy(this.currentPosition).sub(prevPos);

            // Add rotational toss momentum
            this.rotationVelocity.y += deltaX * 0.0035;
            this.rotationVelocity.x += deltaY * 0.0035;
          }
        }
      } else {
        // Raycast to check for hover interaction on cubes
        this.checkCubeHover(ndcX, ndcY);
      }
    };

    const onPointerUp = () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.draggedCube = null;
      this.canvas.style.cursor = 'grab';
      document.body.style.userSelect = '';
    };

    const onPointerLeave = () => {
      this.mouse.targetX = 0;
      this.mouse.targetY = 0;
      if (this.isDragging) {
        onPointerUp();
      }
      this.resetHoveredCube();
    };

    // Attach pointer listeners to the container and canvas
    this.container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp);
    this.container.addEventListener('pointerleave', onPointerLeave);

    // Initial cursor
    this.canvas.style.cursor = 'grab';
  }

  checkCubeHover(x, y) {
    if (!this.camera || this.cubes.length === 0) return;

    this.mouseVec2.set(x, y);
    this.raycaster.setFromCamera(this.mouseVec2, this.camera);
    const meshes = this.cubes.map(c => c.userData.glassMesh);
    const intersects = this.raycaster.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      const cubeGroup = hitMesh.parent;

      if (this.hoveredCube !== cubeGroup) {
        if (this.hoveredCube) this.resetHoveredCube();
        this.hoveredCube = cubeGroup;
        cubeGroup.userData.hoverImpulse = 2.0;
        this.canvas.style.cursor = 'pointer';
      }
    } else {
      if (this.hoveredCube) {
        this.resetHoveredCube();
        this.canvas.style.cursor = 'grab';
      }
    }
  }

  resetHoveredCube() {
    if (!this.hoveredCube) return;
    this.hoveredCube = null;
  }

  setupIntersectionObserver() {
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          this.isVisible = entry.isIntersecting;
        });
      },
      { threshold: 0.05 }
    );

    observer.observe(this.container);
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  update() {
    if (!this.isVisible) return;

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const t = this.clock.getElapsedTime();

    // 1. Mouse coordinates smooth lerp (gentler response)
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.04;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.04;
    this.mouseVelocity *= 0.90;

    // 2. Spring-Damper Physics for Master Assembly (Wave + Cubes)
    if (!this.isDragging || this.draggedCube) {
      // Elastic spring force pulling back to lower rest position
      const displacement = new THREE.Vector3().copy(this.currentPosition).sub(this.restPosition);
      const springForce = displacement.multiplyScalar(-this.springStiffness);

      this.velocity.add(springForce);
      this.velocity.multiplyScalar(this.springDamping);
      this.currentPosition.add(this.velocity);

      // Rotational inertia damping
      this.rotationVelocity.x *= this.rotationDamping;
      this.rotationVelocity.y *= this.rotationDamping;
      this.currentRotation.x += this.rotationVelocity.x;
      this.currentRotation.y += this.rotationVelocity.y;
    }

    // 3. Update Master Group Translation & Parallax Tilt
    if (this.masterGroup) {
      // Gentle ambient floating sway layered on top of current dragged position
      const swayY = Math.sin(t * 0.5) * 0.45;
      const swayX = Math.cos(t * 0.4) * 0.35;

      this.masterGroup.position.set(
        this.currentPosition.x + swayX,
        this.currentPosition.y + swayY,
        this.currentPosition.z
      );

      // Hover parallax + inertia rotation (subtle and stable)
      const targetRotY = this.currentRotation.y + (this.mouse.x * 0.08);
      const targetRotX = this.currentRotation.x + (-this.mouse.y * 0.06);

      this.masterGroup.rotation.y += (targetRotY - this.masterGroup.rotation.y) * 0.05;
      this.masterGroup.rotation.x += (targetRotX - this.masterGroup.rotation.x) * 0.05;
    }

    // 4. Update Cosmic Wave Ribbon: continuous floating rotation and undulating ripples (calm, less volatile)
    if (this.etherealWaveRibbon) {
      this.etherealWaveRibbon.rotation.y = t * 0.045 + (this.mouse.x * 0.035);
      this.etherealWaveRibbon.rotation.z = Math.sin(t * 0.22) * 0.12 + (-this.mouse.y * 0.03);

      const speedMult = 1.0 + this.mouseVelocity * 0.20;
      this.etherealWaveRibbon.children.forEach((line) => {
        const geo = line.geometry;
        const initPos = geo.userData.initialPositions;
        const ringProgress = geo.userData.ringProgress;
        const posAttr = geo.attributes.position;
        const count = posAttr.count;

        for (let i = 0; i < count; i++) {
          const idx = i * 3;
          const origY = initPos[idx + 1];
          const waveShift = Math.sin(t * 1.6 * speedMult + i * 0.08 + ringProgress * 3.0) * 0.38;
          posAttr.array[idx + 1] = origY + waveShift;
        }
        posAttr.needsUpdate = true;
      });
    }

    // 5. Update Transparent Prism Cubes: floating levitation + toss damping
    if (this.cubes && this.cubes.length > 0) {
      this.cubes.forEach((cube) => {
        const u = cube.userData;

        // Toss inertia damping for individual dragged cubes
        if (this.draggedCube !== cube) {
          u.cubeVelocity.multiplyScalar(0.92);
          u.customOffset.add(u.cubeVelocity);
          // Gently pull custom offset back toward 0 (original configuration)
          u.customOffset.multiplyScalar(0.985);
        }

        u.hoverImpulse *= 0.92;
        const currentSpeedMult = 1.0 + u.hoverImpulse * 3.2 + this.mouseVelocity * 1.2;

        // Gyroscopic rotation
        cube.rotation.x += u.rotSpeedX * currentSpeedMult;
        cube.rotation.y += u.rotSpeedY * currentSpeedMult;
        cube.rotation.z += u.rotSpeedZ * currentSpeedMult;

        // Natural sinusoidal bobbing
        if (this.draggedCube !== cube) {
          const bobOffset = Math.sin(t * u.bobFreq + u.phase) * u.bobAmp;
          const driftSide = Math.cos(t * (u.bobFreq * 0.6) + u.phase) * (u.bobAmp * 0.4);

          cube.position.y = u.basePos.y + u.customOffset.y + bobOffset;
          cube.position.x = u.basePos.x + u.customOffset.x + driftSide + (this.mouse.x * 0.6 * (1.0 / (Math.abs(u.basePos.z) + 1)));
        }

        // Scale reaction when hovered
        const targetScale = 1.0 + u.hoverImpulse * 0.12;
        cube.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

        // RGB chromatic dispersion glow
        const edgeOpacity = Math.min(1.0, 0.85 + u.hoverImpulse * 0.3);
        u.dispersionLines[0].material.opacity = edgeOpacity;
        u.dispersionLines[1].material.opacity = edgeOpacity;
        u.dispersionLines[2].material.opacity = Math.min(0.9, 0.55 + u.hoverImpulse * 0.35);
      });
    }

    // 6. Render
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
