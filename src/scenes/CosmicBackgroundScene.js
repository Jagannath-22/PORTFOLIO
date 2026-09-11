import * as THREE from 'three';

/**
 * CosmicBackgroundScene
 * 
 * Inherits the exact visual properties of the cosmic particle field from the BGP Globe scene.
 * Renders a full-screen, fixed background of drifting starlight particles (2500 points).
 */
export class CosmicBackgroundScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.cosmicPoints = null;
    this.clock = new THREE.Clock();

    this.init();
  }

  init() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // 1. Scene
    this.scene = new THREE.Scene();
    // Pure solid black background
    this.scene.background = new THREE.Color(0x000000);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 15);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    this.createCosmicField();
  }

  createCosmicField() {
    const particleCount = 2500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const color1 = new THREE.Color(0xffffff);
    const color2 = new THREE.Color(0xffbe6f);
    const color3 = new THREE.Color(0x74e7ff);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60 - 10;

      const r = Math.random();
      const col = r < 0.65 ? color1 : (r < 0.85 ? color2 : color3);
      colors[i * 3 + 0] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;

      sizes[i] = Math.random() * 0.15 + 0.05;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.cosmicPoints = new THREE.Points(geometry, material);
    this.scene.add(this.cosmicPoints);
  }

  update() {
    const delta = this.clock.getDelta();
    const t = this.clock.getElapsedTime();

    if (this.cosmicPoints) {
      // Gentle, slow drift matching the bgp globe background behavior
      this.cosmicPoints.rotation.y = t * 0.012;
      this.cosmicPoints.rotation.x = Math.sin(t * 0.008) * 0.05;
    }

    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }
}
