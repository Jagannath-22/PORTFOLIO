import * as THREE from 'three';

export class KintsugiScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    this.camera.position.set(0, 0, 7.5);

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

    this.initLights();
    this.initVesselAndGoldCracks();
    this.initEventListeners();
  }

  initLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const goldKeyLight = new THREE.DirectionalLight(0xd4a574, 3.5);
    goldKeyLight.position.set(5, 8, 5);
    this.scene.add(goldKeyLight);

    const rimCyan = new THREE.PointLight(0x00f5ff, 2.0, 15);
    rimCyan.position.set(-4, -3, 3);
    this.scene.add(rimCyan);
  }

  initVesselAndGoldCracks() {
    this.vesselGroup = new THREE.Group();
    this.scene.add(this.vesselGroup);

    // 1. Charcoal Ceramic Bowl / Shield Geometry
    const bowlGeo = new THREE.CylinderGeometry(2.4, 0.9, 1.4, 32, 1, true);
    const darkCeramicMat = new THREE.MeshStandardMaterial({
      color: 0x0a0f1d,
      roughness: 0.85,
      metalness: 0.15,
      side: THREE.DoubleSide
    });
    this.bowl = new THREE.Mesh(bowlGeo, darkCeramicMat);
    this.vesselGroup.add(this.bowl);

    // 2. Molten Gold Kintsugi Fracture Seams (Spline tubes cutting through the ceramic)
    this.goldSeams = new THREE.Group();
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd4a574,
      emissive: 0xffb347,
      emissiveIntensity: 1.2,
      roughness: 0.1,
      metalness: 0.95
    });

    const crackPaths = [
      [
        new THREE.Vector3(0, 0.7, 2.4),
        new THREE.Vector3(0.2, 0.2, 1.8),
        new THREE.Vector3(-0.3, -0.2, 1.2),
        new THREE.Vector3(0.1, -0.7, 0.9)
      ],
      [
        new THREE.Vector3(-1.8, 0.7, 1.6),
        new THREE.Vector3(-1.2, 0.3, 1.4),
        new THREE.Vector3(-0.3, -0.2, 1.2)
      ],
      [
        new THREE.Vector3(1.9, 0.7, 1.5),
        new THREE.Vector3(1.3, 0.1, 1.3),
        new THREE.Vector3(0.2, 0.2, 1.8)
      ]
    ];

    crackPaths.forEach((pts) => {
      const curve = new THREE.CatmullRomCurve3(pts);
      const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.04, 8, false);
      const tubeMesh = new THREE.Mesh(tubeGeo, goldMat);
      this.goldSeams.add(tubeMesh);
    });

    this.vesselGroup.add(this.goldSeams);
    this.vesselGroup.rotation.x = 0.4;
  }

  initEventListeners() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.targetX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.targetY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    });
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

    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    this.vesselGroup.rotation.y = time * 0.2 + this.mouse.x * 0.6;
    this.vesselGroup.rotation.x = 0.4 - this.mouse.y * 0.4;

    this.renderer.render(this.scene, this.camera);
  }
}
