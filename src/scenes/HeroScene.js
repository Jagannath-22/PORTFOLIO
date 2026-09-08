import * as THREE from 'three';
import { SimplexNoise } from '../utils/math.js';

export class HeroScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 0, 18);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.noise = new SimplexNoise(1337);
    this.clock = new THREE.Clock();

    this.scrollProgress = 0;
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    this.initLights();
    this.initFiberStrands();
    this.initEyelids();
    this.initGlobeAndPedestal();
    this.initEventListeners();
  }

  initLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xd4a574, 2.5);
    dirLight.position.set(10, 15, 10);
    this.scene.add(dirLight);

    const cyanLight = new THREE.PointLight(0x00f5ff, 4.0, 30);
    cyanLight.position.set(-8, -4, 6);
    this.scene.add(cyanLight);
  }

  initFiberStrands() {
    this.strandGroup = new THREE.Group();
    this.scene.add(this.strandGroup);

    this.numStrands = 72;
    this.strandData = [];

    const strandMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4a574,
      emissive: 0x00f5ff,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8,
      wireframe: false
    });

    const tipMaterial = new THREE.MeshBasicMaterial({
      color: 0xffd166
    });

    for (let i = 0; i < this.numStrands; i++) {
      const angle = (i / this.numStrands) * Math.PI * 2;
      const radius = 2.4 + (Math.random() - 0.5) * 0.5;

      // Base control points for bundle vs Iris
      const bundleP0 = new THREE.Vector3(0.5, 3.5, -2 + Math.random() * 0.5);
      const bundleP1 = new THREE.Vector3(1.2, 1.0, (Math.random() - 0.5) * 1.5);
      const bundleP2 = new THREE.Vector3(
        1.5 + Math.cos(angle) * 1.2,
        -1.5 + Math.sin(angle) * 0.8,
        (Math.random() - 0.5) * 1.0
      );

      // Iris target positions (360° concentric circle)
      const irisP0 = new THREE.Vector3(Math.cos(angle) * 0.7, Math.sin(angle) * 0.7, 0);
      const irisP1 = new THREE.Vector3(Math.cos(angle + 0.15) * 1.6, Math.sin(angle + 0.15) * 1.6, 0.2);
      const irisP2 = new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);

      const curve = new THREE.QuadraticBezierCurve3(bundleP0, bundleP1, bundleP2);
      const geometry = new THREE.TubeGeometry(curve, 32, 0.05 + Math.random() * 0.03, 8, false);
      const mesh = new THREE.Mesh(geometry, strandMaterial.clone());

      // Tip sphere
      const tipGeo = new THREE.SphereGeometry(0.12, 12, 12);
      const tipMesh = new THREE.Mesh(tipGeo, tipMaterial);
      tipMesh.position.copy(bundleP2);

      this.strandGroup.add(mesh);
      this.strandGroup.add(tipMesh);

      this.strandData.push({
        mesh,
        tipMesh,
        bundlePoints: [bundleP0, bundleP1, bundleP2],
        irisPoints: [irisP0, irisP1, irisP2],
        angle,
        radius,
        phase: Math.random() * Math.PI * 2
      });
    }

    // Outer refractive glass iris ring
    const ringGeo = new THREE.RingGeometry(2.3, 3.2, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f5ff,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide
    });
    this.irisRing = new THREE.Mesh(ringGeo, ringMat);
    this.irisRing.position.z = -0.1;
    this.strandGroup.add(this.irisRing);
  }

  initEyelids() {
    this.eyelidGroup = new THREE.Group();
    this.scene.add(this.eyelidGroup);

    const lidMat = new THREE.MeshStandardMaterial({
      color: 0x050b18,
      metalness: 0.9,
      roughness: 0.3,
      emissive: 0x002233,
      emissiveIntensity: 0.2
    });

    const topGeo = new THREE.CylinderGeometry(4.5, 4.5, 4, 32, 1, false, 0, Math.PI);
    this.topEyelid = new THREE.Mesh(topGeo, lidMat);
    this.topEyelid.rotation.z = Math.PI;
    this.topEyelid.position.set(0, 6, 0.5);

    const botGeo = new THREE.CylinderGeometry(4.5, 4.5, 4, 32, 1, false, 0, Math.PI);
    this.bottomEyelid = new THREE.Mesh(botGeo, lidMat);
    this.bottomEyelid.position.set(0, -6, 0.5);

    this.eyelidGroup.add(this.topEyelid);
    this.eyelidGroup.add(this.bottomEyelid);
    this.eyelidGroup.visible = false;
  }

  initGlobeAndPedestal() {
    this.globeGroup = new THREE.Group();
    this.scene.add(this.globeGroup);
    this.globeGroup.position.set(0, 0, 0);
    this.globeGroup.scale.set(0.001, 0.001, 0.001); // starts invisible until morph phase

    // 1. Threat Wireframe Globe
    const globeGeo = new THREE.SphereGeometry(2.8, 48, 48);
    const globeWireMat = new THREE.MeshBasicMaterial({
      color: 0x00f5ff,
      wireframe: true,
      transparent: true,
      opacity: 0.25
    });
    this.globeWire = new THREE.Mesh(globeGeo, globeWireMat);

    // Inner dark sphere
    const innerGeo = new THREE.SphereGeometry(2.75, 32, 32);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x040814,
      metalness: 0.9,
      roughness: 0.4
    });
    const innerSphere = new THREE.Mesh(innerGeo, innerMat);

    // Cyber security attack nodes & longitude arcs
    this.arcsGroup = new THREE.Group();
    for (let i = 0; i < 16; i++) {
      const p1 = new THREE.Vector3(
        (Math.random() - 0.5) * 4.5,
        (Math.random() - 0.5) * 4.5,
        (Math.random() - 0.5) * 4.5
      ).normalize().multiplyScalar(2.85);

      const p2 = new THREE.Vector3(
        (Math.random() - 0.5) * 4.5,
        (Math.random() - 0.5) * 4.5,
        (Math.random() - 0.5) * 4.5
      ).normalize().multiplyScalar(2.85);

      const mid = p1.clone().add(p2).multiplyScalar(0.5).normalize().multiplyScalar(3.8);
      const arcCurve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      const arcGeo = new THREE.TubeGeometry(arcCurve, 24, 0.02, 6, false);
      const arcMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xff3366 : 0x00f5ff,
        transparent: true,
        opacity: 0.8
      });
      const arcMesh = new THREE.Mesh(arcGeo, arcMat);
      this.arcsGroup.add(arcMesh);
    }

    this.globeGroup.add(innerSphere);
    this.globeGroup.add(this.globeWire);
    this.globeGroup.add(this.arcsGroup);

    // 2. Futuristic Concentric Pedestal Base (Reactor Ring Stand)
    this.pedestalGroup = new THREE.Group();
    this.pedestalGroup.position.set(0, -3.2, 0);

    // Outer metallic ring
    const outerRingGeo = new THREE.CylinderGeometry(3.6, 4.0, 0.4, 48);
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x111c30,
      metalness: 0.95,
      roughness: 0.2
    });
    const outerRing = new THREE.Mesh(outerRingGeo, metalMat);

    // Inner glowing cyan track
    const glowTrackGeo = new THREE.TorusGeometry(3.2, 0.08, 16, 64);
    const glowTrackMat = new THREE.MeshBasicMaterial({
      color: 0x00f5ff
    });
    const glowTrack = new THREE.Mesh(glowTrackGeo, glowTrackMat);
    glowTrack.rotation.x = Math.PI / 2;
    glowTrack.position.y = 0.21;

    // Secondary rotating gyroscopic bevel ring
    const bevelRingGeo = new THREE.TorusGeometry(2.6, 0.12, 16, 48);
    const bevelMat = new THREE.MeshStandardMaterial({
      color: 0xd4a574,
      metalness: 0.9,
      roughness: 0.3
    });
    this.bevelRing = new THREE.Mesh(bevelRingGeo, bevelMat);
    this.bevelRing.rotation.x = Math.PI / 2;
    this.bevelRing.position.y = 0.35;

    this.pedestalGroup.add(outerRing);
    this.pedestalGroup.add(glowTrack);
    this.pedestalGroup.add(this.bevelRing);
    this.globeGroup.add(this.pedestalGroup);
  }

  initEventListeners() {
    window.addEventListener('resize', () => this.onResize());
    window.addEventListener('mousemove', (e) => {
      this.mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    });
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  setScrollProgress(progress) {
    this.scrollProgress = progress; // 0.0 (hero top) to 1.0 (scrolled)
  }

  update() {
    const time = this.clock.getElapsedTime();
    const dt = this.clock.getDelta();

    // Smooth mouse lerping
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    const scroll = this.scrollProgress;

    // Phase 1: Fiber Bundle -> Phase 2: Iris Formation (scroll 0.0 -> 0.3)
    const irisMorph = Math.min(Math.max((scroll - 0.02) / 0.28, 0), 1);

    // Update fiber geometry interpolation
    for (let i = 0; i < this.strandData.length; i++) {
      const data = this.strandData[i];
      const n = this.noise.noise2D(time * 0.5 + i, data.phase) * (1 - irisMorph);

      const p0 = data.bundlePoints[0].clone().lerp(data.irisPoints[0], irisMorph);
      const p1 = data.bundlePoints[1].clone().lerp(data.irisPoints[1], irisMorph);
      const p2 = data.bundlePoints[2].clone().lerp(data.irisPoints[2], irisMorph);

      p1.x += Math.sin(time * 2 + data.phase) * 0.15 * (1 - irisMorph);
      p1.y += Math.cos(time * 1.8 + data.phase) * 0.15 * (1 - irisMorph);

      const curve = new THREE.QuadraticBezierCurve3(p0, p1, p2);
      data.mesh.geometry.dispose();
      data.mesh.geometry = new THREE.TubeGeometry(curve, 24, 0.05, 6, false);
      data.tipMesh.position.copy(p2);
    }

    // Eye gaze tracking (Phase 2-3)
    this.strandGroup.rotation.y = this.mouse.x * 0.4;
    this.strandGroup.rotation.x = -this.mouse.y * 0.3;

    // Phase 3 & 4: Eyelid Scanner & Zoom-Out to Globe (scroll 0.3 -> 0.7)
    if (scroll > 0.25 && scroll < 0.6) {
      this.eyelidGroup.visible = true;
      const lidProgress = Math.sin((scroll - 0.25) / 0.35 * Math.PI);
      this.topEyelid.position.y = 6 - lidProgress * 4.2;
      this.bottomEyelid.position.y = -6 + lidProgress * 4.2;
    } else {
      this.eyelidGroup.visible = false;
    }

    // Phase 5: Zoom out & Reveal 3D Earth Threat Globe on Pedestal (scroll 0.45 -> 1.0)
    if (scroll > 0.35) {
      const globeScale = Math.min(Math.max((scroll - 0.35) / 0.25, 0), 1);
      this.globeGroup.scale.set(globeScale, globeScale, globeScale);
      this.globeWire.rotation.y += 0.008;
      this.arcsGroup.rotation.y -= 0.005;
      this.bevelRing.rotation.z += 0.02;

      // Fade out strands
      this.strandGroup.scale.set(1 - globeScale, 1 - globeScale, 1 - globeScale);
    } else {
      this.globeGroup.scale.set(0.001, 0.001, 0.001);
      this.strandGroup.scale.set(1, 1, 1);
    }

    // Smooth camera dolly
    this.camera.position.z = 18 - scroll * 4;

    this.renderer.render(this.scene, this.camera);
  }
}
