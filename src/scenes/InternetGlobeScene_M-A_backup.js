import * as THREE from 'three';
import { isPointOnLand, latLonToXYZ } from '../utils/geoUtils.js';

/**
 * InternetGlobeScene — Master Cinematic Cybersecurity Scene.
 * 
 * SEQUENCE:
 * COSMIC PARTICLES → FIBER-OPTIC EYE → GAZE LEFT → GAZE RIGHT → GAZE CENTER
 * → ONE BLINK (PUPIL 100% COVERED) → OPEN → ZOOM INTO CIRCULAR PUPIL
 * → SEAMLESS TRANSITION TO EXISTING BGP GLOBE → INTERACTIVE GLOBE & BGP TELEMETRY
 * 
 * RULES:
 * - The opening eye sequence is 100% autonomous inside the 100vh viewport.
 * - Zero automatic scrolling.
 * - The existing BGP globe geometry, density, routing arcs, and interaction are PRESERVED.
 */
export class InternetGlobeScene {
  constructor(canvas, onNodeHover, onStateChange) {
    this.canvas = canvas;
    this.onNodeHover = onNodeHover;
    this.onStateChange = onStateChange;

    // Timeline state
    this.sequenceTime = 0;
    this.currentState = 'COSMIC_SPACE';
    this.globeRevealed = false;
    this.scrollProgress = 0;

    // Three.js Core
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    this.camera.position.set(0, 0, 13);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x030509, 1.0); // Near-black background

    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouse2D = new THREE.Vector2(-999, -999);
    this.targetMouse = new THREE.Vector2(0, 0);
    this.smoothedMouse = new THREE.Vector2(0, 0);

    // Globe interaction & inertia
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.rotationVelocity = { x: 0.0015, y: 0.002 };
    this.globeRotation = { x: 0.22, y: 0.0 };

    // Configuration
    this.globeRadius = 4.2;
    this.particleCount = 42000;

    // Build scene layers
    this.initLighting();
    this.initCosmicBackgroundField();
    this.initEyeScene();
    this.initBGPExistingGlobe();
    this.initEventHandlers();
  }

  // =========================================================================
  // LIGHTING — restrained, scientific, cinematic
  // =========================================================================
  initLighting() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.45);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xd4a574, 1.0);
    dirLight.position.set(10, 12, 10);
    this.scene.add(dirLight);

    const cyanRim = new THREE.PointLight(0x74e7ff, 2.0, 40);
    cyanRim.position.set(-10, -6, 8);
    this.scene.add(cyanRim);
  }

  // =========================================================================
  // 1. COSMIC BACKGROUND FIELD (Tiny Stars & Faint Cyan / Gold Dust)
  // =========================================================================
  initCosmicBackgroundField() {
    this.cosmicGroup = new THREE.Group();
    this.scene.add(this.cosmicGroup);

    const count = 1400;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const colWhite = new THREE.Color(0xf2f4f7);
    const colCyan = new THREE.Color(0x74e7ff);
    const colAmber = new THREE.Color(0xc99a55);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 36;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 26;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20 - 4;

      const r = Math.random();
      const c = r > 0.6 ? colWhite : (r > 0.25 ? colCyan : colAmber);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      sizes[i] = 0.025 + Math.random() * 0.035;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    this.cosmicPoints = new THREE.Points(geo, mat);
    this.cosmicGroup.add(this.cosmicPoints);
  }

  // =========================================================================
  // 2. THE OPTICAL-FIBER TECHNOLOGICAL EYE (Dedicated 3D Subsystem)
  // =========================================================================
  initEyeScene() {
    this.eyeSceneGroup = new THREE.Group();
    this.eyeSceneGroup.position.set(0, 0, 0);
    this.scene.add(this.eyeSceneGroup);

    // Front-facing eye assembly
    this.eyeContainer = new THREE.Group();
    this.eyeSceneGroup.add(this.eyeContainer);

    // Dynamic iris & pupil assembly (for left/right surveillance gaze)
    this.irisGazeGroup = new THREE.Group();
    this.irisGazeGroup.position.set(0, 0, 0.1);
    this.eyeContainer.add(this.irisGazeGroup);

    this.initPupilAndIris();
    this.initEyelidsAndEyelashes();
    this.initEyelidOcclusionShutters();
  }

  // =========================================================================
  // PERFECT CIRCULAR PUPIL & RADIAL OPTICAL FIBER IRIS
  // =========================================================================
  initPupilAndIris() {
    // A. PERFECT CIRCULAR PUPIL — Mathematically circular disc of pitch black
    const pupilRadius = 0.82;
    const pupilGeo = new THREE.CircleGeometry(pupilRadius, 64);
    const pupilMat = new THREE.MeshBasicMaterial({
      color: 0x000000, // Deepest black void
      side: THREE.DoubleSide
    });
    this.pupilMesh = new THREE.Mesh(pupilGeo, pupilMat);
    this.pupilMesh.position.set(0, 0, 0.05);
    this.irisGazeGroup.add(this.pupilMesh);

    // B. INNER SPHINCTER RING — Dense glowing particles tracing the pupil perimeter
    const sphincterCount = 180;
    const sphPos = new Float32Array(sphincterCount * 3);
    const sphColors = new Float32Array(sphincterCount * 3);

    for (let i = 0; i < sphincterCount; i++) {
      const a = (i / sphincterCount) * Math.PI * 2;
      const r = pupilRadius + 0.015 + (Math.random() - 0.5) * 0.02;
      sphPos[i * 3] = Math.cos(a) * r;
      sphPos[i * 3 + 1] = Math.sin(a) * r;
      sphPos[i * 3 + 2] = 0.06 + Math.random() * 0.02;

      const isGold = Math.random() > 0.4;
      sphColors[i * 3] = isGold ? 0.83 : 0.45;
      sphColors[i * 3 + 1] = isGold ? 0.65 : 0.90;
      sphColors[i * 3 + 2] = isGold ? 0.45 : 1.00;
    }

    const sphGeo = new THREE.BufferGeometry();
    sphGeo.setAttribute('position', new THREE.BufferAttribute(sphPos, 3));
    sphGeo.setAttribute('color', new THREE.BufferAttribute(sphColors, 3));

    const sphMat = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.0, // Fades in during assembly
      blending: THREE.AdditiveBlending
    });
    this.sphincterPoints = new THREE.Points(sphGeo, sphMat);
    this.irisGazeGroup.add(this.sphincterPoints);

    // C. RADIAL OPTICAL FIBER STRANDS (240 thin strands radiating outward)
    this.irisFibersGroup = new THREE.Group();
    this.irisGazeGroup.add(this.irisFibersGroup);

    this.radialFibers = [];
    const strandCount = 240;
    const outerIrisRadius = 2.45;

    for (let i = 0; i < strandCount; i++) {
      const a = (i / strandCount) * Math.PI * 2;
      const innerR = pupilRadius + 0.02;
      const rLen = outerIrisRadius + (Math.random() - 0.5) * 0.15;
      const twist = (Math.sin(a * 7.0) * 0.08 + (Math.random() - 0.5) * 0.04);

      const p0 = new THREE.Vector3(Math.cos(a) * innerR, Math.sin(a) * innerR, 0.04);
      const p1 = new THREE.Vector3(
        Math.cos(a + twist) * (innerR + rLen) * 0.5,
        Math.sin(a + twist) * (innerR + rLen) * 0.5,
        0.12 - Math.pow(((innerR + rLen) * 0.5) / outerIrisRadius, 2) * 0.1
      );
      const p2 = new THREE.Vector3(
        Math.cos(a + twist * 1.8) * rLen,
        Math.sin(a + twist * 1.8) * rLen,
        0.02
      );

      const curve = new THREE.QuadraticBezierCurve3(p0, p1, p2);
      const geo = new THREE.TubeGeometry(curve, 18, 0.009, 3, false);

      const isGold = Math.random() > 0.68;
      const strandColor = isGold ? 0xc99a55 : (Math.random() > 0.35 ? 0x74e7ff : 0xf2f4f7);

      const mat = new THREE.MeshBasicMaterial({
        color: strandColor,
        transparent: true,
        opacity: 0.0
      });

      const mesh = new THREE.Mesh(geo, mat);
      this.irisFibersGroup.add(mesh);

      // Fiber luminous tip
      const tipGeo = new THREE.SphereGeometry(0.025, 4, 4);
      const tipMat = new THREE.MeshBasicMaterial({
        color: isGold ? 0xd4a574 : 0x74e7ff,
        transparent: true,
        opacity: 0.0
      });
      const tip = new THREE.Mesh(tipGeo, tipMat);
      tip.position.copy(p2);
      this.irisFibersGroup.add(tip);

      this.radialFibers.push({ mesh, tip, mat, tipMat, p0, p1, p2, angle: a });
    }

    // D. IRIS STROMA PARTICLES (Concentric ciliary field)
    const stromaCount = 2800;
    const stromaPos = new Float32Array(stromaCount * 3);
    const stromaColors = new Float32Array(stromaCount * 3);

    for (let i = 0; i < stromaCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const rRatio = Math.sqrt(Math.random());
      const r = pupilRadius + 0.03 + rRatio * (outerIrisRadius - pupilRadius - 0.05);

      stromaPos[i * 3] = Math.cos(a) * r;
      stromaPos[i * 3 + 1] = Math.sin(a) * r;
      stromaPos[i * 3 + 2] = 0.05 + (Math.random() - 0.5) * 0.06;

      const isGold = Math.random() > 0.65;
      stromaColors[i * 3] = isGold ? 0.78 : (Math.random() > 0.3 ? 0.45 : 0.95);
      stromaColors[i * 3 + 1] = isGold ? 0.60 : (Math.random() > 0.3 ? 0.90 : 0.95);
      stromaColors[i * 3 + 2] = isGold ? 0.40 : 1.0;
    }

    const stromaGeo = new THREE.BufferGeometry();
    stromaGeo.setAttribute('position', new THREE.BufferAttribute(stromaPos, 3));
    stromaGeo.setAttribute('color', new THREE.BufferAttribute(stromaColors, 3));

    this.stromaMat = new THREE.PointsMaterial({
      size: 0.035,
      vertexColors: true,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending
    });
    this.stromaPoints = new THREE.Points(stromaGeo, this.stromaMat);
    this.irisGazeGroup.add(this.stromaPoints);

    // E. LIMBAL OUTER RING — Sharp circular boundary defining the iris edge
    const limbalGeo = new THREE.RingGeometry(outerIrisRadius - 0.03, outerIrisRadius + 0.03, 64);
    this.limbalMat = new THREE.MeshBasicMaterial({
      color: 0x74e7ff,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide
    });
    this.limbalRing = new THREE.Mesh(limbalGeo, this.limbalMat);
    this.limbalRing.position.set(0, 0, 0.04);
    this.irisGazeGroup.add(this.limbalRing);
  }

  // =========================================================================
  // CURVED EYELIDS & COSMIC PARTICLE EYELASHES
  // =========================================================================
  initEyelidsAndEyelashes() {
    this.lidsGroup = new THREE.Group();
    this.eyeContainer.add(this.lidsGroup);

    // Eyelid curve parameters
    // Medial canthus at (-3.6, 0), Lateral canthus at (3.6, 0)
    const upperYMax = 2.15;
    const lowerYMin = -1.65;
    const halfWidth = 3.6;

    // Helper: parametric lid curve
    this.getUpperLidPoint = (x) => {
      const norm = Math.max(0, 1 - Math.pow(x / halfWidth, 2));
      return upperYMax * Math.pow(norm, 0.85);
    };

    this.getLowerLidPoint = (x) => {
      const norm = Math.max(0, 1 - Math.pow(x / halfWidth, 2));
      return lowerYMin * Math.pow(norm, 0.85);
    };

    // A. UPPER EYELID FIBER STRANDS (5 layered luminous curves)
    this.upperLidCurvesGroup = new THREE.Group();
    this.lowerLidCurvesGroup = new THREE.Group();
    this.lidsGroup.add(this.upperLidCurvesGroup);
    this.lidsGroup.add(this.lowerLidCurvesGroup);

    this.lidMaterials = [];

    const numLidStrands = 5;
    for (let s = 0; s < numLidStrands; s++) {
      const offset = (s - 2) * 0.04;
      const upperPts = [];
      const lowerPts = [];

      for (let i = 0; i <= 40; i++) {
        const x = -halfWidth + (i / 40) * (halfWidth * 2);
        const yUp = this.getUpperLidPoint(x) + offset;
        const yLow = this.getLowerLidPoint(x) - offset;
        const z = 0.25 - Math.abs(x / halfWidth) * 0.15;

        upperPts.push(new THREE.Vector3(x, yUp, z));
        lowerPts.push(new THREE.Vector3(x, yLow, z));
      }

      const upCurve = new THREE.CatmullRomCurve3(upperPts);
      const lowCurve = new THREE.CatmullRomCurve3(lowerPts);

      const upGeo = new THREE.TubeGeometry(upCurve, 40, 0.012, 3, false);
      const lowGeo = new THREE.TubeGeometry(lowCurve, 40, 0.012, 3, false);

      const isGold = s % 2 === 1;
      const mat = new THREE.MeshBasicMaterial({
        color: isGold ? 0xc99a55 : 0x74e7ff,
        transparent: true,
        opacity: 0.0
      });

      this.lidMaterials.push(mat);

      const upMesh = new THREE.Mesh(upGeo, mat);
      const lowMesh = new THREE.Mesh(lowGeo, mat);
      this.upperLidCurvesGroup.add(upMesh);
      this.lowerLidCurvesGroup.add(lowMesh);
    }

    // B. COSMIC PARTICLE EYELASHES (Delicate luminous cosmic fringe following eyelid curvature)
    this.upperLashesGroup = new THREE.Group();
    this.lowerLashesGroup = new THREE.Group();
    this.upperLidCurvesGroup.add(this.upperLashesGroup);
    this.lowerLidCurvesGroup.add(this.lowerLashesGroup);

    // Upper Lashes (85 fine lashes curving upward and outward)
    const upperLashCount = 85;
    this.lashMaterials = [];

    for (let i = 0; i < upperLashCount; i++) {
      const t = i / (upperLashCount - 1);
      const x = -halfWidth * 0.92 + t * (halfWidth * 1.84);
      const yBase = this.getUpperLidPoint(x);
      const zBase = 0.25;

      // Normal direction pointing upward and outward
      const angle = Math.PI * 0.5 - (x / halfWidth) * 0.45;
      const len = 0.35 + (1 - Math.abs(x / halfWidth)) * 0.35;

      const p0 = new THREE.Vector3(x, yBase, zBase);
      const p1 = new THREE.Vector3(
        x + Math.cos(angle) * len * 0.5,
        yBase + Math.sin(angle) * len * 0.5,
        zBase + 0.1
      );
      const p2 = new THREE.Vector3(
        x + Math.cos(angle) * len,
        yBase + Math.sin(angle) * len,
        zBase + 0.15
      );

      const curve = new THREE.QuadraticBezierCurve3(p0, p1, p2);
      const geo = new THREE.TubeGeometry(curve, 8, 0.007, 3, false);

      const isGold = Math.random() > 0.6;
      const lashMat = new THREE.MeshBasicMaterial({
        color: isGold ? 0xd4a574 : 0x74e7ff,
        transparent: true,
        opacity: 0.0
      });
      this.lashMaterials.push(lashMat);

      const mesh = new THREE.Mesh(geo, lashMat);
      this.upperLashesGroup.add(mesh);

      // Micro glowing tip particle
      const tipGeo = new THREE.SphereGeometry(0.02, 4, 4);
      const tipMat = new THREE.MeshBasicMaterial({
        color: isGold ? 0xffffff : 0x74e7ff,
        transparent: true,
        opacity: 0.0
      });
      this.lashMaterials.push(tipMat);
      const tip = new THREE.Mesh(tipGeo, tipMat);
      tip.position.copy(p2);
      this.upperLashesGroup.add(tip);
    }

    // Lower Lashes (60 fine lashes curving downward and outward)
    const lowerLashCount = 60;
    for (let i = 0; i < lowerLashCount; i++) {
      const t = i / (lowerLashCount - 1);
      const x = -halfWidth * 0.88 + t * (halfWidth * 1.76);
      const yBase = this.getLowerLidPoint(x);
      const zBase = 0.25;

      const angle = -Math.PI * 0.5 - (x / halfWidth) * 0.35;
      const len = 0.20 + (1 - Math.abs(x / halfWidth)) * 0.20;

      const p0 = new THREE.Vector3(x, yBase, zBase);
      const p1 = new THREE.Vector3(
        x + Math.cos(angle) * len * 0.5,
        yBase + Math.sin(angle) * len * 0.5,
        zBase + 0.08
      );
      const p2 = new THREE.Vector3(
        x + Math.cos(angle) * len,
        yBase + Math.sin(angle) * len,
        zBase + 0.12
      );

      const curve = new THREE.QuadraticBezierCurve3(p0, p1, p2);
      const geo = new THREE.TubeGeometry(curve, 6, 0.006, 3, false);

      const isGold = Math.random() > 0.7;
      const lashMat = new THREE.MeshBasicMaterial({
        color: isGold ? 0xd4a574 : 0x74e7ff,
        transparent: true,
        opacity: 0.0
      });
      this.lashMaterials.push(lashMat);

      const mesh = new THREE.Mesh(geo, lashMat);
      this.lowerLashesGroup.add(mesh);
    }
  }

  // =========================================================================
  // PHYSICAL EYELID OCCLUSION SHUTTERS (Guarantees Pupil is 100% Invisible During Blink)
  // =========================================================================
  initEyelidOcclusionShutters() {
    const halfWidth = 3.8;

    // Upper Shutter (Spans from lid curve up to y = 5.0)
    const upperShape = new THREE.Shape();
    upperShape.moveTo(-halfWidth, 0);
    for (let i = 0; i <= 36; i++) {
      const x = -halfWidth + (i / 36) * (halfWidth * 2);
      const y = this.getUpperLidPoint(x);
      upperShape.lineTo(x, y);
    }
    upperShape.lineTo(halfWidth, 5.5);
    upperShape.lineTo(-halfWidth, 5.5);
    upperShape.closePath();

    const upperGeo = new THREE.ShapeGeometry(upperShape);
    const shutterMat = new THREE.MeshBasicMaterial({
      color: 0x030509, // Pitch black to match canvas
      side: THREE.DoubleSide,
      depthWrite: true
    });

    this.upperShutter = new THREE.Mesh(upperGeo, shutterMat.clone());
    this.upperShutter.position.set(0, 0, 0.22);
    this.eyeContainer.add(this.upperShutter);

    // Lower Shutter (Spans from lid curve down to y = -5.0)
    const lowerShape = new THREE.Shape();
    lowerShape.moveTo(-halfWidth, 0);
    for (let i = 0; i <= 36; i++) {
      const x = -halfWidth + (i / 36) * (halfWidth * 2);
      const y = this.getLowerLidPoint(x);
      lowerShape.lineTo(x, y);
    }
    lowerShape.lineTo(halfWidth, -5.5);
    lowerShape.lineTo(-halfWidth, -5.5);
    lowerShape.closePath();

    const lowerGeo = new THREE.ShapeGeometry(lowerShape);
    this.lowerShutter = new THREE.Mesh(lowerGeo, shutterMat.clone());
    this.lowerShutter.position.set(0, 0, 0.22);
    this.eyeContainer.add(this.lowerShutter);

    // Cosmic seam ripple particles (visible only during the moment of blink closure)
    const seamCount = 64;
    const seamPos = new Float32Array(seamCount * 3);
    const seamColors = new Float32Array(seamCount * 3);

    for (let i = 0; i < seamCount; i++) {
      const x = -halfWidth * 0.9 + (i / (seamCount - 1)) * (halfWidth * 1.8);
      seamPos[i * 3] = x;
      seamPos[i * 3 + 1] = 0.0;
      seamPos[i * 3 + 2] = 0.26;

      seamColors[i * 3] = 0.45;
      seamColors[i * 3 + 1] = 0.90;
      seamColors[i * 3 + 2] = 1.0;
    }

    const seamGeo = new THREE.BufferGeometry();
    seamGeo.setAttribute('position', new THREE.BufferAttribute(seamPos, 3));
    seamGeo.setAttribute('color', new THREE.BufferAttribute(seamColors, 3));

    this.seamMat = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending
    });
    this.seamParticles = new THREE.Points(seamGeo, this.seamMat);
    this.eyeContainer.add(this.seamParticles);
  }

  // =========================================================================
  // 3. THE EXISTING BGP GLOBE (PROTECTED — DO NOT ALTER GEOMETRY OR ROUTING)
  // =========================================================================
  initBGPExistingGlobe() {
    this.globeGroup = new THREE.Group();
    // Initially hidden; reveals seamlessly from the pupil zoom!
    this.globeGroup.visible = false;
    this.globeGroup.scale.set(0.01, 0.01, 0.01);
    this.scene.add(this.globeGroup);

    const count = this.particleCount;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const colWhite = new THREE.Color(0xf2f4f7);
    const colGraphite = new THREE.Color(0x8993a4);
    const colCyan = new THREE.Color(0x74e7ff);
    const colAmber = new THREE.Color(0xc99a55);
    const colOcean = new THREE.Color(0x081326);

    let idx = 0;
    let attempts = 0;
    const maxAttempts = count * 18;

    while (idx < count && attempts < maxAttempts) {
      attempts++;

      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const lat = (Math.PI / 2 - phi) * (180 / Math.PI);
      const lon = (theta - Math.PI) * (180 / Math.PI);

      const isLand = isPointOnLand(lat, lon);
      if (!isLand && Math.random() > 0.055) continue;

      const r = isLand
        ? this.globeRadius + (Math.random() - 0.5) * 0.02
        : this.globeRadius;

      const gx = r * Math.sin(phi) * Math.cos(theta);
      const gy = r * Math.cos(phi);
      const gz = r * Math.sin(phi) * Math.sin(theta);

      positions[idx * 3] = gx;
      positions[idx * 3 + 1] = gy;
      positions[idx * 3 + 2] = gz;

      let c;
      if (isLand) {
        const rand = Math.random();
        if (rand > 0.65) c = colWhite.clone();
        else if (rand > 0.32) c = colCyan.clone();
        else if (rand > 0.12) c = colGraphite.clone();
        else c = colAmber.clone();
      } else {
        c = colOcean.clone();
      }

      colors[idx * 3] = c.r;
      colors[idx * 3 + 1] = c.g;
      colors[idx * 3 + 2] = c.b;

      sizes[idx] = isLand ? 0.065 + Math.random() * 0.04 : 0.032;
      idx++;
    }

    const actualCount = idx;

    const globeGeo = new THREE.BufferGeometry();
    globeGeo.setAttribute('position', new THREE.BufferAttribute(positions.subarray(0, actualCount * 3), 3));
    globeGeo.setAttribute('color', new THREE.BufferAttribute(colors.subarray(0, actualCount * 3), 3));
    globeGeo.setAttribute('size', new THREE.BufferAttribute(sizes.subarray(0, actualCount), 1));

    // Custom shader material for the globe
    const vertexShader = `
      attribute float size;
      varying vec3 vColor;
      uniform float uOpacity;
      
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        float pointSize = size * (430.0 / -mvPosition.z);
        gl_PointSize = max(pointSize, 0.6);
      }
    `;

    const fragmentShader = `
      varying vec3 vColor;
      uniform float uOpacity;
      
      void main() {
        float dist = length(gl_PointCoord - vec2(0.5));
        if (dist > 0.5) discard;
        float alpha = smoothstep(0.5, 0.14, dist) * uOpacity;
        gl_FragColor = vec4(vColor, alpha);
      }
    `;

    this.globeMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uOpacity: { value: 1.0 }
      },
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.globePoints = new THREE.Points(globeGeo, this.globeMaterial);
    this.globeGroup.add(this.globePoints);

    // Inner dark core sphere
    const innerGeo = new THREE.SphereGeometry(this.globeRadius * 0.985, 48, 48);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x03050a
    });
    this.innerSphere = new THREE.Mesh(innerGeo, innerMat);
    this.globeGroup.add(this.innerSphere);

    // Atmospheric cyan rim
    const rimGeo = new THREE.SphereGeometry(this.globeRadius * 1.04, 48, 48);
    const rimMat = new THREE.MeshBasicMaterial({
      color: 0x74e7ff,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide
    });
    this.rimMesh = new THREE.Mesh(rimGeo, rimMat);
    this.globeGroup.add(this.rimMesh);

    // 18 Autonomous System Nodes
    this.initBGPAutonomousSystemNodes();
    this.initRoutingArcsAndPulses();
  }

  initBGPAutonomousSystemNodes() {
    this.nodesGroup = new THREE.Group();
    this.globeGroup.add(this.nodesGroup);

    this.asNodes = [
      { id: 'AS13335', name: 'Cloudflare Edge', city: 'San Francisco, US', lat: 37.77, lon: -122.42, prefix: '104.16.0.0/12', status: 'ANNOUNCED', rtt: '4.2ms' },
      { id: 'AS15169', name: 'Google Global Cache', city: 'Mountain View, US', lat: 37.38, lon: -122.08, prefix: '8.8.8.0/24', status: 'ANNOUNCED', rtt: '2.8ms' },
      { id: 'AS3356',  name: 'Lumen Tier-1 Backbone', city: 'Denver, US', lat: 39.73, lon: -104.99, prefix: '4.0.0.0/8', status: 'ANNOUNCED', rtt: '11.4ms' },
      { id: 'AS7922',  name: 'Comcast National', city: 'Philadelphia, US', lat: 39.95, lon: -75.16, prefix: '73.0.0.0/8', status: 'ANNOUNCED', rtt: '14.2ms' },
      { id: 'AS7018',  name: 'AT&T Global Network', city: 'Dallas, US', lat: 32.77, lon: -96.79, prefix: '12.0.0.0/8', status: 'ANNOUNCED', rtt: '18.1ms' },
      { id: 'AS20940', name: 'Akamai Edge Network', city: 'Cambridge, US', lat: 42.37, lon: -71.10, prefix: '23.0.0.0/12', status: 'ANNOUNCED', rtt: '6.5ms' },
      { id: 'AS16509', name: 'Amazon AWS Backbone', city: 'Ashburn, US', lat: 39.04, lon: -77.48, prefix: '52.0.0.0/11', status: 'ANNOUNCED', rtt: '5.1ms' },
      { id: 'AS9002',  name: 'RETN EurAsia Backbone', city: 'London, UK', lat: 51.50, lon: -0.12, prefix: '87.245.224.0/19', status: 'ANNOUNCED', rtt: '22.3ms' },
      { id: 'AS3257',  name: 'GTT Communications', city: 'Frankfurt, DE', lat: 50.11, lon: 8.68, prefix: '89.149.0.0/16', status: 'ANNOUNCED', rtt: '24.7ms' },
      { id: 'AS1299',  name: 'Arelion (Telia Carrier)', city: 'Stockholm, SE', lat: 59.32, lon: 18.06, prefix: '213.155.128.0/18', status: 'ANNOUNCED', rtt: '28.0ms' },
      { id: 'AS2914',  name: 'NTT Communications', city: 'Tokyo, JP', lat: 35.68, lon: 139.69, prefix: '129.250.0.0/16', status: 'ANNOUNCED', rtt: '88.5ms' },
      { id: 'AS9498',  name: 'Bharti Airtel Core', city: 'Mumbai, IN', lat: 19.07, lon: 72.87, prefix: '125.16.0.0/14', status: 'ANNOUNCED', rtt: '42.1ms' },
      { id: 'AS55836', name: 'Reliance Jio Infocomm', city: 'Delhi, IN', lat: 28.61, lon: 77.20, prefix: '49.44.0.0/14', status: 'ANNOUNCED', rtt: '45.3ms' },
      { id: 'AS4637',  name: 'Telstra Global Gateway', city: 'Sydney, AU', lat: -33.86, lon: 151.20, prefix: '139.130.0.0/16', status: 'ANNOUNCED', rtt: '112.0ms' },
      { id: 'AS6762',  name: 'Sparkle Seabone', city: 'Rome, IT', lat: 41.90, lon: 12.49, prefix: '195.223.0.0/16', status: 'ANNOUNCED', rtt: '31.4ms' },
      { id: 'AS27699', name: 'Telecom Italia SP', city: 'São Paulo, BR', lat: -23.55, lon: -46.63, prefix: '177.16.0.0/12', status: 'ANNOUNCED', rtt: '135.0ms' },
      { id: 'AS37100', name: 'SEACOM Subsea Cable', city: 'Johannesburg, ZA', lat: -26.20, lon: 28.04, prefix: '105.16.0.0/12', status: 'ANNOUNCED', rtt: '148.0ms' },
      { id: 'AS4755',  name: 'TATA Communications', city: 'Singapore, SG', lat: 1.35, lon: 103.81, prefix: '180.87.0.0/17', status: 'ANNOUNCED', rtt: '62.0ms' }
    ];

    this.nodeMeshes = [];

    this.asNodes.forEach((node) => {
      const pos = this.latLonToVector3(node.lat, node.lon, this.globeRadius * 1.015);
      node.position = pos;

      const sphereGeo = new THREE.SphereGeometry(0.045, 12, 12);
      const sphereMat = new THREE.MeshBasicMaterial({
        color: node.id === 'AS15169' || node.id === 'AS9498' ? 0xc99a55 : 0x74e7ff
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.copy(pos);
      sphere.userData = node;

      const ringGeo = new THREE.RingGeometry(0.07, 0.088, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x74e7ff,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      ring.lookAt(0, 0, 0);

      this.nodesGroup.add(sphere);
      this.nodesGroup.add(ring);
      this.nodeMeshes.push(sphere);

      node._sphere = sphere;
      node._ring = ring;
    });
  }

  initRoutingArcsAndPulses() {
    this.arcsGroup = new THREE.Group();
    this.pulsesGroup = new THREE.Group();
    this.globeGroup.add(this.arcsGroup);
    this.globeGroup.add(this.pulsesGroup);

    this.activeRoutes = [];
    this.pulses = [];

    const routes = [
      ['AS13335', 'AS15169'], ['AS15169', 'AS3356'], ['AS3356', 'AS7018'],
      ['AS16509', 'AS9002'],  ['AS9002', 'AS3257'],  ['AS3257', 'AS1299'],
      ['AS1299', 'AS9498'],   ['AS9498', 'AS55836'], ['AS55836', 'AS4755'],
      ['AS4755', 'AS2914'],   ['AS2914', 'AS4637'],  ['AS13335', 'AS2914'],
      ['AS16509', 'AS27699'], ['AS9002', 'AS37100'], ['AS3257', 'AS6762'],
      ['AS7018', 'AS16509'],  ['AS20940', 'AS9002'], ['AS9498', 'AS4755']
    ];

    routes.forEach(([idA, idB], idx) => {
      const nodeA = this.asNodes.find(n => n.id === idA);
      const nodeB = this.asNodes.find(n => n.id === idB);
      if (!nodeA || !nodeB) return;

      const pA = nodeA.position;
      const pB = nodeB.position;

      const dist = pA.distanceTo(pB);
      const mid = pA.clone().add(pB).multiplyScalar(0.5);
      const alt = this.globeRadius * (1.08 + dist * 0.11);
      mid.normalize().multiplyScalar(alt);

      const curve = new THREE.QuadraticBezierCurve3(pA, mid, pB);
      const points = curve.getPoints(36);
      const geo = new THREE.BufferGeometry().setFromPoints(points);

      const isRareAmber = idx % 5 === 0;
      const baseOpacity = isRareAmber ? 0.35 : 0.22;
      const arcColor = isRareAmber ? 0xc99a55 : 0x74e7ff;

      const mat = new THREE.LineBasicMaterial({
        color: arcColor,
        transparent: true,
        opacity: baseOpacity
      });

      const line = new THREE.Line(geo, mat);
      line.userData = { nodeA, nodeB, isRareAmber, baseOpacity };

      this.arcsGroup.add(line);
      this.activeRoutes.push({ curve, line, nodeA, nodeB, baseOpacity, isRareAmber });

      // Traveling data pulses
      for (let p = 0; p < 2; p++) {
        const pulseGeo = new THREE.SphereGeometry(0.045, 6, 6);
        const pulseMat = new THREE.MeshBasicMaterial({
          color: isRareAmber ? 0xc99a55 : (Math.random() > 0.4 ? 0x74e7ff : 0xffffff)
        });
        const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
        this.pulsesGroup.add(pulseMesh);

        this.pulses.push({
          mesh: pulseMesh,
          curve,
          progress: Math.random(),
          speed: 0.003 + Math.random() * 0.004,
          baseSpeed: 0.003 + Math.random() * 0.004
        });
      }
    });
  }

  latLonToVector3(lat, lon, radius) {
    const coords = latLonToXYZ(lat, lon, radius);
    return new THREE.Vector3(coords.x, coords.y, coords.z);
  }

  // =========================================================================
  // INTERACTION (Mouse Drag, Touch & Raycaster Tooltips)
  // =========================================================================
  initEventHandlers() {
    const el = this.canvas;

    el.addEventListener('mousedown', (e) => {
      if (this.globeRevealed) {
        this.isDragging = true;
        this.previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    window.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      this.mouse2D.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse2D.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.targetMouse.set(this.mouse2D.x, this.mouse2D.y);

      if (this.isDragging && this.globeRevealed) {
        const deltaX = e.clientX - this.previousMousePosition.x;
        const deltaY = e.clientY - this.previousMousePosition.y;
        this.rotationVelocity.y = deltaX * 0.003;
        this.rotationVelocity.x = deltaY * 0.003;
        this.globeRotation.y += this.rotationVelocity.y;
        this.globeRotation.x += this.rotationVelocity.x;
        this.previousMousePosition = { x: e.clientX, y: e.clientY };
      }

      if (this.globeRevealed) {
        this.checkRaycasterIntersections(e.clientX, e.clientY);
      }
    });

    // Touch interaction for mobile
    el.addEventListener('touchstart', (e) => {
      if (this.globeRevealed && e.touches.length === 1) {
        this.isDragging = true;
        this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.isDragging = false;
    });

    window.addEventListener('touchmove', (e) => {
      if (this.isDragging && this.globeRevealed && e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - this.previousMousePosition.x;
        const deltaY = e.touches[0].clientY - this.previousMousePosition.y;
        this.rotationVelocity.y = deltaX * 0.003;
        this.rotationVelocity.x = deltaY * 0.003;
        this.globeRotation.y += this.rotationVelocity.y;
        this.globeRotation.x += this.rotationVelocity.x;
        this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }, { passive: true });

    window.addEventListener('resize', () => this.onResize());
  }

  checkRaycasterIntersections(clientX, clientY) {
    this.raycaster.setFromCamera(this.mouse2D, this.camera);
    const intersects = this.raycaster.intersectObjects(this.nodeMeshes);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const nodeData = hit.userData;

      this.canvas.style.cursor = 'pointer';

      this.activeRoutes.forEach((route) => {
        const isConnected = route.nodeA.id === nodeData.id || route.nodeB.id === nodeData.id;
        route.line.material.opacity = isConnected ? 0.85 : 0.04;
      });

      if (this.onNodeHover) {
        this.onNodeHover(nodeData, clientX, clientY);
      }
    } else {
      this.canvas.style.cursor = 'default';
      this.activeRoutes.forEach((route) => {
        route.line.material.opacity = route.baseOpacity;
      });
      if (this.onNodeHover) {
        this.onNodeHover(null);
      }
    }
  }

  setScrollProgress(progress) {
    this.scrollProgress = progress;
  }

  onResize() {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // Method to replay the sequence cleanly anytime
  replay() {
    this.sequenceTime = 0;
    this.globeRevealed = false;
    this.globeGroup.visible = false;
    this.globeGroup.scale.set(0.01, 0.01, 0.01);
    this.eyeSceneGroup.visible = true;
    this.camera.position.set(0, 0, 13);
  }

  // =========================================================================
  // MASTER RENDER LOOP & DETERMINISTIC SEQUENCE MACHINE
  // =========================================================================
  update() {
    const delta = this.clock.getDelta();
    this.sequenceTime += delta;
    const t = this.sequenceTime;

    // Smooth mouse coordinates for parallax
    this.smoothedMouse.lerp(this.targetMouse, 0.06);

    // =======================================================================
    // DETERMINISTIC TIMELINE STATE MACHINE
    // 0.0s – 1.8s   COSMIC_SPACE       Faint cosmic field
    // 1.8s – 5.5s   EYE_ASSEMBLY       Optical fibers & particles assemble eye & iris
    // 5.5s – 7.2s   GAZE_LEFT          Eye looks gently toward the left
    // 7.2s – 8.9s   GAZE_RIGHT         Eye glides gently toward the right
    // 8.9s – 10.2s  GAZE_CENTER        Eye glides back to center, looks directly at user
    // 10.2s – 11.0s BLINK_CLOSING      Eyelids physically close, pupil 100% invisible
    // 11.0s – 12.0s BLINK_OPENING      Eyelids separate, pupil revealed looking centered
    // 12.0s – 14.8s PUPIL_ZOOM         Camera enters circular pupil portal
    // 14.8s – 16.5s GLOBE_REVEAL       BGP globe emerges out of the pupil depth
    // 16.5s+        GLOBE_ACTIVE       Perpetual BGP globe rotation & interactive telemetry
    // =======================================================================

    let state = 'COSMIC_SPACE';
    let statusLabel = '[COSMIC DEPTH // OBSERVATIONAL SENSOR INITIALIZING]';

    if (t >= 14.8) {
      state = 'GLOBE_ACTIVE';
      statusLabel = '[BGP TELEMETRY ACTIVE // 18 AS NODES // 720° ROTATION]';
    } else if (t >= 12.0) {
      state = 'PUPIL_ZOOM';
      statusLabel = '[TRANSITION // ENTERING CIRCULAR PUPIL PORTAL]';
    } else if (t >= 11.0) {
      state = 'BLINK_OPENING';
      statusLabel = '[APERTURE CYCLE // EYELIDS REOPENING]';
    } else if (t >= 10.2) {
      state = 'BLINK_CLOSING';
      statusLabel = '[APERTURE CYCLE // PUPIL OCCLUDED // BLINK]';
    } else if (t >= 8.9) {
      state = 'GAZE_CENTER';
      statusLabel = '[SURVEILLANCE GAZE // CENTERED ON VIEWER]';
    } else if (t >= 7.2) {
      state = 'GAZE_RIGHT';
      statusLabel = '[SURVEILLANCE GAZE // TRACKING RIGHT]';
    } else if (t >= 5.5) {
      state = 'GAZE_LEFT';
      statusLabel = '[SURVEILLANCE GAZE // TRACKING LEFT]';
    } else if (t >= 1.8) {
      state = 'EYE_ASSEMBLY';
      statusLabel = '[OPTIC FIBER CONVERGENCE // BIOMETRIC IRIS ASSEMBLY]';
    }

    if (this.currentState !== state) {
      this.currentState = state;
      if (this.onStateChange) {
        this.onStateChange(state, statusLabel);
      }
    }

    // -----------------------------------------------------------------------
    // A. EYE FORMATION & GAZE STAGES (t < 14.8s)
    // -----------------------------------------------------------------------
    if (t < 14.8) {
      this.eyeSceneGroup.visible = true;
      this.globeGroup.visible = false;

      // 1. Formation progress (0 to 1 between 1.8s and 5.5s)
      const formProgress = t < 1.8 ? 0.0 : Math.min((t - 1.8) / 3.7, 1.0);

      // Fade in eye materials
      const irisOpacity = formProgress * 0.95;
      this.sphincterPoints.material.opacity = irisOpacity;
      this.stromaPoints.material.opacity = irisOpacity * 0.85;
      this.limbalMat.opacity = irisOpacity * 0.7;

      this.radialFibers.forEach((fib, i) => {
        fib.mat.opacity = irisOpacity * (0.6 + Math.sin(t * 3.0 + i * 0.2) * 0.25);
        fib.tipMat.opacity = irisOpacity * 0.85;
      });

      this.lidMaterials.forEach((mat) => {
        mat.opacity = formProgress * 0.85;
      });
      this.lashMaterials.forEach((mat) => {
        mat.opacity = formProgress * 0.80;
      });

      // 2. Gaze Animation (Smooth, human, technological)
      let gazeTargetX = 0.0;
      let gazeTargetRotY = 0.0;

      if (t >= 5.5 && t < 7.2) {
        // Gaze Left
        const pLeft = (t - 5.5) / 1.7;
        const ease = Math.sin(pLeft * Math.PI);
        gazeTargetX = -0.55 * ease;
        gazeTargetRotY = -0.18 * ease;
      } else if (t >= 7.2 && t < 8.9) {
        // Gaze Right
        const pRight = (t - 7.2) / 1.7;
        const ease = Math.sin(pRight * Math.PI);
        gazeTargetX = 0.55 * ease;
        gazeTargetRotY = 0.18 * ease;
      } else if (t >= 8.9 && t < 10.2) {
        // Return Center
        gazeTargetX = 0.0;
        gazeTargetRotY = 0.0;
      }

      // Blend in cursor tracking parallax
      const cursorParallaxX = this.smoothedMouse.x * 0.14;
      const cursorParallaxY = this.smoothedMouse.y * 0.08;

      this.irisGazeGroup.position.x += (gazeTargetX + cursorParallaxX - this.irisGazeGroup.position.x) * 0.08;
      this.irisGazeGroup.position.y += (cursorParallaxY - this.irisGazeGroup.position.y) * 0.08;
      this.irisGazeGroup.rotation.y += (gazeTargetRotY + cursorParallaxX * 0.5 - this.irisGazeGroup.rotation.y) * 0.08;

      // 3. The Single Cosmic Blink (10.2s - 12.0s)
      // Upper shutter moves down by 2.2; lower shutter moves up by 1.7
      let blinkClose = 0.0;
      if (t >= 10.2 && t < 12.0) {
        if (t < 10.9) {
          // Closing (10.2s to 10.9s)
          blinkClose = Math.min((t - 10.2) / 0.7, 1.0);
        } else if (t < 11.2) {
          // Fully shut (10.9s to 11.2s) — PUPIL 100% COVERED
          blinkClose = 1.0;
        } else {
          // Reopening (11.2s to 12.0s)
          blinkClose = 1.0 - Math.min((t - 11.2) / 0.8, 1.0);
        }
      }

      // Apply shutter movement
      const upperCloseDist = 2.25;
      const lowerCloseDist = 1.75;
      this.upperShutter.position.y = -blinkClose * upperCloseDist;
      this.lowerShutter.position.y = blinkClose * lowerCloseDist;

      // Curves follow shutters
      this.upperLidCurvesGroup.position.y = -blinkClose * upperCloseDist;
      this.lowerLidCurvesGroup.position.y = blinkClose * lowerCloseDist;

      // Cosmic seam particle pulse along closed seam
      if (t >= 10.8 && t <= 11.3) {
        this.seamMat.opacity = Math.sin((t - 10.8) / 0.5 * Math.PI) * 0.9;
      } else {
        this.seamMat.opacity = 0.0;
      }

      // 4. Zoom Into Pupil Transition (12.0s - 14.8s)
      if (t >= 12.0) {
        const zoomProg = (t - 12.0) / 2.8; // 0 to 1
        // Camera dollys directly toward centered pupil
        const camZ = 13.0 - Math.pow(zoomProg, 2.2) * 11.8; // 13.0 down to 1.2
        this.camera.position.z = Math.max(camZ, 1.2);
        this.camera.position.x = 0;
        this.camera.position.y = 0;

        // As camera plunges into the pitch-black pupil disc, fade out outer lids
        if (zoomProg > 0.6) {
          const fade = 1.0 - (zoomProg - 0.6) / 0.4;
          this.irisFibersGroup.position.z = -Math.pow(zoomProg, 2.0) * 1.5;
          this.lidsGroup.visible = fade > 0.1;
        }
      } else {
        this.camera.position.set(0, 0, 13);
      }
    }

    // -----------------------------------------------------------------------
    // B. SEAMLESS HAND-OFF TO THE EXISTING BGP GLOBE (t >= 14.8s)
    // -----------------------------------------------------------------------
    if (t >= 14.8) {
      this.eyeSceneGroup.visible = false;
      this.globeGroup.visible = true;
      this.globeRevealed = true;

      // Emergence transition (14.8s to 16.5s)
      if (t < 16.5) {
        const emerge = (t - 14.8) / 1.7; // 0 to 1
        // Smoothly zoom camera back out to globe view
        this.camera.position.z = 1.2 + Math.pow(emerge, 0.5) * 13.8; // 1.2 up to 15.0
        // Scale globe smoothly out of the pupil center
        const s = Math.min(Math.pow(emerge, 0.7), 1.0);
        this.globeGroup.scale.set(s, s, s);
      } else {
        this.camera.position.z = 15.0;
        this.globeGroup.scale.set(1, 1, 1);
      }

      // Existing BGP Globe Rotation & Inertia (Continuous 720° / Perpetual)
      if (!this.isDragging) {
        this.rotationVelocity.x *= 0.95;
        this.rotationVelocity.y = (this.rotationVelocity.y - 0.0014) * 0.95 + 0.0014;
        this.globeRotation.x += this.rotationVelocity.x;
        this.globeRotation.y += this.rotationVelocity.y;
      }
      this.globeGroup.rotation.x = this.globeRotation.x;
      this.globeGroup.rotation.y = this.globeRotation.y;

      // Pulse AS node rings
      this.asNodes.forEach((node) => {
        if (node._ring) {
          const pulse = 1.0 + Math.sin(t * 2.2 + node.lat * 0.1) * 0.18;
          node._ring.scale.set(pulse, pulse, 1);
        }
      });

      // Breathing routing arcs
      this.activeRoutes.forEach((route, i) => {
        const breathe = Math.sin(t * 0.8 + i * 0.7) * 0.08;
        const flap = (Math.sin(t * 0.12 + i * 4.1) > 0.975) ? 0.45 : 0.0;
        route.line.material.opacity = route.baseOpacity + breathe + flap;
      });

      // Traveling packet pulses
      for (let i = 0; i < this.pulses.length; i++) {
        const pulse = this.pulses[i];
        const speedVar = 1.0 + Math.sin(t * 0.6 + i * 1.5) * 0.35;
        pulse.progress += pulse.baseSpeed * speedVar;
        if (pulse.progress > 1.0) pulse.progress = 0.0;

        const pt = pulse.curve.getPoint(pulse.progress);
        pulse.mesh.position.copy(pt);
      }
    }

    // -----------------------------------------------------------------------
    // C. BACKGROUND COSMIC FIELD ANIMATION
    // -----------------------------------------------------------------------
    this.cosmicPoints.rotation.y = t * 0.012;
    this.cosmicPoints.rotation.x = Math.sin(t * 0.008) * 0.05;

    // Render
    this.renderer.render(this.scene, this.camera);
  }
}
