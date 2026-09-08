import * as THREE from 'three';
import { sounds } from '../components/SoundManager.js';

export class SkillGraphScene {
  constructor(canvas, onNodeSelect) {
    this.canvas = canvas;
    this.onNodeSelect = onNodeSelect;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    this.camera.position.set(0, 0, 14);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.nodes = [
      { id: 'heap_exp', label: 'Heap Exploitation', category: 'OFFENSIVE', color: 0xff3366, pos: [-3.5, 2.2, 1.2], tools: 'GDB, GEF, Pwntools, Radare2' },
      { id: 'rev_eng', label: 'Reverse Engineering', category: 'OFFENSIVE', color: 0xff3366, pos: [-4.2, -0.8, -1.0], tools: 'Ghidra, IDA Pro, Binary Ninja' },
      { id: 'zero_trust', label: 'Zero Trust Architecture', category: 'DEFENSIVE', color: 0x00f5ff, pos: [3.8, 2.0, -0.5], tools: 'SPIFFE/SPIRE, eBPF, Cilium, WireGuard' },
      { id: 'ebpf_sec', label: 'eBPF Threat Telemetry', category: 'DEFENSIVE', color: 0x00f5ff, pos: [4.0, -1.8, 1.5], tools: 'Tetragon, Tracee, BCC, Kernel C' },
      { id: 'pqc_crypto', label: 'Post-Quantum Crypto', category: 'CRYPTOGRAPHY', color: 0xd4a574, pos: [0.0, 3.5, -1.2], tools: 'Kyber, Dilithium, OpenSSL 3.0' },
      { id: 'stego_analysis', label: 'LSB Steganography', category: 'CRYPTOGRAPHY', color: 0xd4a574, pos: [0.0, -3.2, 0.8], tools: 'Stegsolve, Zsteg, Bit-Plane Matrix' },
      { id: 'ai_redteam', label: 'AI Adversarial Defense', category: 'AI_SECURITY', color: 0x9d4edd, pos: [-1.2, 0.5, 2.0], tools: 'Garak, Prompt Injections, Tensor Guard' },
      { id: 'bgp_routing', label: 'BGP Routing Hardening', category: 'NETWORK', color: 0x00ff88, pos: [1.8, -0.2, -2.0], tools: 'RPKI, ROA Validation, BRD' }
    ];

    this.nodeMeshes = [];
    this.hoveredNode = null;

    this.initGraph();
    this.initEventListeners();
  }

  initGraph() {
    this.graphGroup = new THREE.Group();
    this.scene.add(this.graphGroup);

    // Node spheres & halo rings
    this.nodes.forEach((data) => {
      const group = new THREE.Group();
      group.position.set(...data.pos);

      // Core sphere
      const sphereGeo = new THREE.SphereGeometry(0.35, 24, 24);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: data.color,
        emissive: data.color,
        emissiveIntensity: 0.7,
        roughness: 0.2,
        metalness: 0.8
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.userData = data;

      // Outer orbit ring
      const ringGeo = new THREE.RingGeometry(0.5, 0.56, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: data.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.4
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);

      group.add(sphere);
      group.add(ring);
      this.graphGroup.add(group);
      this.nodeMeshes.push(sphere);
    });

    // Connecting network laser filaments
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x00f5ff,
      transparent: true,
      opacity: 0.25
    });

    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const p1 = new THREE.Vector3(...this.nodes[i].pos);
        const p2 = new THREE.Vector3(...this.nodes[j].pos);
        if (p1.distanceTo(p2) < 5.8) {
          const lineGeo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
          const line = new THREE.Line(lineGeo, lineMat);
          this.graphGroup.add(line);
        }
      }
    }
  }

  initEventListeners() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.nodeMeshes);

      if (intersects.length > 0) {
        const target = intersects[0].object;
        if (this.hoveredNode !== target) {
          this.hoveredNode = target;
          document.body.style.cursor = 'pointer';
          sounds.playScan();
        }
      } else {
        this.hoveredNode = null;
        document.body.style.cursor = 'default';
      }
    });

    this.canvas.addEventListener('click', () => {
      if (this.hoveredNode && this.onNodeSelect) {
        sounds.playClick();
        this.onNodeSelect(this.hoveredNode.userData);
      }
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

    this.graphGroup.rotation.y = time * 0.08 + this.mouse.x * 0.3;
    this.graphGroup.rotation.x = this.mouse.y * 0.2;

    this.nodeMeshes.forEach((mesh, idx) => {
      mesh.parent.position.y += Math.sin(time * 2 + idx) * 0.002;
    });

    this.renderer.render(this.scene, this.camera);
  }
}
