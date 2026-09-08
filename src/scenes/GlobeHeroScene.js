import * as THREE from 'three';
import { isPointOnLand, latLonToXYZ } from '../utils/geoUtils.js';
import { BGP_NODES } from '../data/bgpNodes.js';

/**
 * GlobeHeroScene — 3D Internet BGP Telemetry Globe
 * 
 * Implements the master prompt specifications:
 * - 18,000+ dense network particles forming continents
 * - Subtle brightness variations: off-white (#f2f4f7), graphite (#8993a4), technical cyan (#74e7ff), rare amber (#c99a55)
 * - Oceans remain almost completely black
 * - Real Autonomous System (AS) nodes distributed globally
 * - Thin, precise curved great-circle arcs representing BGP relationships
 * - Animated routing pulses travelling along arcs ("THE INTERNET IS TALKING")
 * - Occasional amber telemetry events
 * - Faint atmospheric cyan rim light (no neon halos)
 * - Realistic inertial rotation with mouse & touch drag
 * - Scroll to zoom (camera distance clamp 11.5 - 20)
 * - Hover AS nodes: technical tooltip, nearby routes brighten, unrelated dim
 * - Desktop composition: globe occupies 55–65% of viewport, balanced beside text
 */
export class GlobeHeroScene {
  constructor(canvas, tooltipEl) {
    this.canvas = canvas;
    this.tooltipEl = tooltipEl;

    this.scene = new THREE.Scene();
    this.cameraDistance = 14.5;
    this.targetCameraDistance = 14.5;
    this.camera = new THREE.PerspectiveCamera(42, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    this.camera.position.set(0, 0, this.cameraDistance);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.clock = new THREE.Clock();
    this.elapsedTime = 0;
    this.scrollProgress = 0;

    // Direct 3D rotation & drag physics
    this.isDragging = false;
    this.prevMouse = { x: 0, y: 0 };
    this.rotationVelocity = { x: 0.0003, y: 0.0016 };

    // Raycasting for AS node hover
    this.raycaster = new THREE.Raycaster();
    this.raycaster.params.Points.threshold = 0.28;
    this.mouse = new THREE.Vector2(-999, -999);
    this.hoveredNode = null;

    // Desktop composition: globe sits beside text (55-65% of viewport)
    const isDesktop = window.innerWidth > 960;
    this.baseGroupX = isDesktop ? 1.7 : 0.0;
    this.globeGroup = new THREE.Group();
    this.globeGroup.position.set(this.baseGroupX, 0, 0);
    this.scene.add(this.globeGroup);

    this.radius = 4.2;

    this.initLights();
    this.initEarthPointCloud();
    this.initCoreAndAtmosphere();
    this.initBgpNodesAndArcs();
    this.initEventListeners();
  }

  initLights() {
    // Subtle ambient light
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambient);

    // Warm white directional light
    const dirLight = new THREE.DirectionalLight(0xf2f4f7, 1.4);
    dirLight.position.set(12, 10, 10);
    this.scene.add(dirLight);

    // Technical cyan rim light
    const cyanLight = new THREE.PointLight(0x74e7ff, 2.2, 35);
    cyanLight.position.set(-12, -6, 6);
    this.scene.add(cyanLight);
  }

  // =========================================================================
  // 1. CONTINENTAL POINT CLOUD (Dense particles, dark oceans)
  // =========================================================================
  initEarthPointCloud() {
    const radius = this.radius;

    // Palette strictly matching prompt color system
    const colWhite = new THREE.Color('#f2f4f7');
    const colCyan = new THREE.Color('#74e7ff');
    const colGraphite = new THREE.Color('#8993a4');
    const colBlue = new THREE.Color('#315d91');
    const colAmber = new THREE.Color('#c99a55');
    const colOcean = new THREE.Color('#03050a');

    const positions = [];
    const colors = [];
    const sizes = [];

    // Dense spherical sampling tested with ray-casting point-in-polygon
    const totalSamples = 38000;

    for (let i = 0; i < totalSamples; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;

      const lat = (Math.PI / 2 - phi) * (180 / Math.PI);
      const lon = (theta - Math.PI) * (180 / Math.PI);

      const isLand = isPointOnLand(lat, lon);

      // Oceans remain almost completely black with sparse subtle points
      if (!isLand) {
        if (Math.random() > 0.05) continue;
        const pt = latLonToXYZ(lat, lon, radius);
        positions.push(pt.x, pt.y, pt.z);
        colors.push(colOcean.r, colOcean.g, colOcean.b);
        sizes.push(0.03);
        continue;
      }

      // Continents emerge from the point cloud
      const r = radius + (Math.random() - 0.5) * 0.03;
      const pt = latLonToXYZ(lat, lon, r);
      positions.push(pt.x, pt.y, pt.z);

      // Subtle brightness variation across continent particles
      const brightness = 0.72 + Math.random() * 0.28;
      let c;
      const rand = Math.random();

      if (rand < 0.52) {
        c = colWhite.clone().multiplyScalar(brightness);
      } else if (rand < 0.80) {
        c = colCyan.clone().multiplyScalar(brightness);
      } else if (rand < 0.93) {
        c = colGraphite.clone().multiplyScalar(brightness);
      } else {
        c = colAmber.clone(); // Rare amber highlight
      }

      colors.push(c.r, c.g, c.b);
      sizes.push(0.065 + Math.random() * 0.03);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

    this.pointCloudMaterial = new THREE.PointsMaterial({
      size: 0.075,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.pointsMesh = new THREE.Points(geometry, this.pointCloudMaterial);
    this.globeGroup.add(this.pointsMesh);
  }

  // =========================================================================
  // 2. INNER DARK CORE & SUBTLE CYAN ATMOSPHERIC RIM
  // =========================================================================
  initCoreAndAtmosphere() {
    const radius = this.radius;

    // Dark core sphere prevents see-through
    const coreGeo = new THREE.SphereGeometry(radius * 0.985, 36, 36);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x03050a
    });
    this.innerCore = new THREE.Mesh(coreGeo, coreMat);
    this.globeGroup.add(this.innerCore);

    // Extremely faint cyan rim light (BackSide)
    const atmosGeo = new THREE.SphereGeometry(radius * 1.04, 48, 48);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: 0x74e7ff,
      transparent: true,
      opacity: 0.045,
      side: THREE.BackSide
    });
    this.atmosphereMesh = new THREE.Mesh(atmosGeo, atmosMat);
    this.globeGroup.add(this.atmosphereMesh);
  }

  // =========================================================================
  // 3. BGP ROUTING NODES & THIN GREAT-CIRCLE ARCS ("THE INTERNET IS TALKING")
  // =========================================================================
  initBgpNodesAndArcs() {
    this.nodesGroup = new THREE.Group();
    this.arcsGroup = new THREE.Group();
    this.globeGroup.add(this.nodesGroup);
    this.globeGroup.add(this.arcsGroup);

    this.nodeMeshes = [];
    this.routeArcs = [];
    this.travelingPackets = [];

    const radius = this.radius;
    const nodeMap = new Map();

    // Create AS Node Markers
    BGP_NODES.forEach((node, idx) => {
      const pt = latLonToXYZ(node.lat, node.lon, radius);
      const pos = new THREE.Vector3(pt.x, pt.y, pt.z);

      // Hit target for raycasting
      const hitGeo = new THREE.SphereGeometry(0.24, 12, 12);
      const hitMat = new THREE.MeshBasicMaterial({
        color: 0x74e7ff,
        transparent: true,
        opacity: 0.0
      });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.position.copy(pos);
      hitMesh.userData = { nodeData: node, index: idx };
      this.nodesGroup.add(hitMesh);

      // Visible glowing node core
      const coreGeo = new THREE.SphereGeometry(0.065, 12, 12);
      const coreMat = new THREE.MeshBasicMaterial({
        color: 0xf2f4f7
      });
      const visualCore = new THREE.Mesh(coreGeo, coreMat);
      visualCore.position.copy(pos);
      this.nodesGroup.add(visualCore);

      // Subtle beacon ring around node
      const ringGeo = new THREE.RingGeometry(0.09, 0.12, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x74e7ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.65
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(pos.clone().multiplyScalar(1.002));
      ringMesh.lookAt(pos.clone().multiplyScalar(2.0));
      this.nodesGroup.add(ringMesh);

      const nodeEntry = {
        data: node,
        position: pos,
        hitMesh,
        visualCore,
        ringMesh,
        baseColor: 0x74e7ff
      };
      this.nodeMeshes.push(nodeEntry);
      nodeMap.set(node.id, nodeEntry);
    });

    // Create BGP Route Arcs (Great-circle curves)
    const arcKeySet = new Set();
    BGP_NODES.forEach((srcNode) => {
      srcNode.peers.forEach((dstId) => {
        const key = [srcNode.id, dstId].sort().join('--');
        if (arcKeySet.has(key)) return;
        arcKeySet.add(key);

        const srcEntry = nodeMap.get(srcNode.id);
        const dstEntry = nodeMap.get(dstId);
        if (!srcEntry || !dstEntry) return;

        const p1 = srcEntry.position;
        const p2 = dstEntry.position;

        // Elevated great-circle midpoint
        const mid = p1.clone().add(p2).multiplyScalar(0.5);
        const dist = p1.distanceTo(p2);
        const elevFactor = 1.0 + Math.min(dist / (radius * 2), 0.45) * 0.45;
        mid.normalize().multiplyScalar(radius * elevFactor);

        const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);

        // Thin, precise route line
        const points = curve.getPoints(36);
        const arcGeo = new THREE.BufferGeometry().setFromPoints(points);

        // Occasional warm amber event (#c99a55), otherwise technical cyan/blue
        const isRareAmber = Math.random() < 0.14;
        const baseColor = isRareAmber ? 0xc99a55 : (Math.random() > 0.45 ? 0x74e7ff : 0x315d91);
        const baseOpacity = isRareAmber ? 0.65 : 0.28;

        const arcMat = new THREE.LineBasicMaterial({
          color: baseColor,
          transparent: true,
          opacity: baseOpacity,
          blending: THREE.AdditiveBlending
        });

        const lineMesh = new THREE.Line(arcGeo, arcMat);
        this.arcsGroup.add(lineMesh);

        const routeEntry = {
          curve,
          lineMesh,
          srcId: srcNode.id,
          dstId: dstId,
          baseColor,
          baseOpacity,
          targetOpacity: baseOpacity,
          isAmber: isRareAmber
        };
        this.routeArcs.push(routeEntry);

        // Animated pulse packet travelling along arc ("THE INTERNET IS TALKING")
        const packetGeo = new THREE.SphereGeometry(0.045, 8, 8);
        const packetMat = new THREE.MeshBasicMaterial({
          color: isRareAmber ? 0xc99a55 : 0xf2f4f7,
          transparent: true,
          opacity: 0.9
        });
        const packetMesh = new THREE.Mesh(packetGeo, packetMat);
        this.arcsGroup.add(packetMesh);

        this.travelingPackets.push({
          mesh: packetMesh,
          curve: curve,
          speed: 0.12 + Math.random() * 0.16,
          offset: Math.random(),
          active: true
        });
      });
    });
  }

  // =========================================================================
  // 4. INTERACTION PHYSICS (Drag to rotate, Scroll zoom, Node hover)
  // =========================================================================
  initEventListeners() {
    window.addEventListener('resize', () => this.onResize());

    // Mouse drag handlers
    window.addEventListener('mousedown', (e) => {
      if (e.target.closest('a, button, input, textarea, .nav-links')) return;
      this.isDragging = true;
      this.prevMouse = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (this.isDragging) {
        const deltaX = e.clientX - this.prevMouse.x;
        const deltaY = e.clientY - this.prevMouse.y;
        this.rotationVelocity.y = deltaX * 0.0035;
        this.rotationVelocity.x = deltaY * 0.0035;
        this.globeGroup.rotation.y += this.rotationVelocity.y;
        this.globeGroup.rotation.x += this.rotationVelocity.x;
        this.prevMouse = { x: e.clientX, y: e.clientY };
      }

      this.checkNodeHover(e.clientX, e.clientY);
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    // Touch drag handlers (Mobile)
    window.addEventListener('touchstart', (e) => {
      if (e.target.closest('a, button, input, textarea, .nav-links')) return;
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (this.isDragging && e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - this.prevMouse.x;
        const deltaY = e.touches[0].clientY - this.prevMouse.y;
        this.rotationVelocity.y = deltaX * 0.0035;
        this.rotationVelocity.x = deltaY * 0.0035;
        this.globeGroup.rotation.y += this.rotationVelocity.y;
        this.globeGroup.rotation.x += this.rotationVelocity.x;
        this.prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.isDragging = false;
    });

    // Scroll wheel zoom
    window.addEventListener('wheel', (e) => {
      if (window.scrollY < 400) {
        this.targetCameraDistance = THREE.MathUtils.clamp(
          this.targetCameraDistance + e.deltaY * 0.008,
          11.5,
          20.0
        );
      }
    }, { passive: true });
  }

  checkNodeHover(screenX, screenY) {
    if (!this.nodeMeshes || !this.tooltipEl) return;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hitMeshes = this.nodeMeshes.map(n => n.hitMesh);
    const intersects = this.raycaster.intersectObjects(hitMeshes, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const nodeData = hit.userData.nodeData;

      if (this.hoveredNode !== nodeData) {
        this.hoveredNode = nodeData;
        this.showTooltip(nodeData, screenX, screenY);
        this.highlightConnectedRoutes(nodeData.id);
      } else {
        this.updateTooltipPosition(screenX, screenY);
      }
    } else {
      if (this.hoveredNode) {
        this.hoveredNode = null;
        this.hideTooltip();
        this.resetRouteHighlights();
      }
    }
  }

  showTooltip(node, x, y) {
    if (!this.tooltipEl) return;
    this.tooltipEl.innerHTML = `
      <div style="font-weight: 700; color: #74e7ff; margin-bottom: 4px; letter-spacing: 0.08em;">${node.id} · ${node.city}</div>
      <div style="color: #f2f4f7; margin-bottom: 2px;">Network: <span style="color: #fff; font-weight: 500;">${node.name}</span></div>
      <div style="color: #8993a4; margin-bottom: 2px;">Prefix: <span style="color: #f2f4f7; font-family: monospace;">${node.prefix}</span></div>
      <div style="color: #8993a4;">Status: <span style="color: ${node.status.includes('RPKI') ? '#c99a55' : '#74e7ff'}; font-weight: 600;">${node.status}</span></div>
    `;
    this.tooltipEl.style.display = 'block';
    this.tooltipEl.style.opacity = '1';
    this.updateTooltipPosition(x, y);
  }

  updateTooltipPosition(x, y) {
    if (!this.tooltipEl) return;
    const padding = 16;
    let left = x + padding;
    let top = y + padding;

    if (left + 230 > window.innerWidth) left = x - 240;
    if (top + 110 > window.innerHeight) top = y - 120;

    this.tooltipEl.style.left = `${left}px`;
    this.tooltipEl.style.top = `${top}px`;
  }

  hideTooltip() {
    if (!this.tooltipEl) return;
    this.tooltipEl.style.opacity = '0';
    this.tooltipEl.style.display = 'none';
  }

  highlightConnectedRoutes(nodeId) {
    this.routeArcs.forEach(arc => {
      if (arc.srcId === nodeId || arc.dstId === nodeId) {
        arc.targetOpacity = 0.95;
        arc.lineMesh.material.color.setHex(0x74e7ff);
      } else {
        arc.targetOpacity = 0.08;
      }
    });
  }

  resetRouteHighlights() {
    this.routeArcs.forEach(arc => {
      arc.targetOpacity = arc.baseOpacity;
      arc.lineMesh.material.color.setHex(arc.baseColor);
    });
  }

  onResize() {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);

    const isDesktop = window.innerWidth > 960;
    this.baseGroupX = isDesktop ? 1.7 : 0.0;
    if (this.globeGroup) {
      this.globeGroup.position.x = this.baseGroupX;
    }
  }

  setScrollProgress(progress) {
    this.scrollProgress = progress;
  }

  // =========================================================================
  // 5. CONTINUOUS RENDER LOOP
  // =========================================================================
  update() {
    const delta = this.clock.getDelta();
    this.elapsedTime += delta;

    // Camera distance zoom
    this.cameraDistance += (this.targetCameraDistance - this.cameraDistance) * 0.08;
    this.camera.position.z = this.cameraDistance;

    // Smooth inertial rotation
    if (!this.isDragging) {
      this.rotationVelocity.x *= 0.94;
      this.rotationVelocity.y = this.rotationVelocity.y * 0.94 + 0.0013;
      this.globeGroup.rotation.x += this.rotationVelocity.x;
      this.globeGroup.rotation.y += this.rotationVelocity.y;
    }

    // Traveling BGP routing packets
    if (this.travelingPackets) {
      for (let i = 0; i < this.travelingPackets.length; i++) {
        const p = this.travelingPackets[i];
        const progress = (this.elapsedTime * p.speed + p.offset) % 1.0;
        const pos = p.curve.getPointAt(progress);
        p.mesh.position.copy(pos);
      }
    }

    // Dynamic living network breathing
    if (this.routeArcs) {
      for (let i = 0; i < this.routeArcs.length; i++) {
        const arc = this.routeArcs[i];
        arc.lineMesh.material.opacity += (arc.targetOpacity - arc.lineMesh.material.opacity) * 0.1;
      }
    }

    // Beacon ring pulsing
    if (this.nodeMeshes) {
      const pulse = 1.0 + Math.sin(this.elapsedTime * 2.5) * 0.2;
      for (let i = 0; i < this.nodeMeshes.length; i++) {
        this.nodeMeshes[i].ringMesh.scale.set(pulse, pulse, pulse);
      }
    }

    // Parallax scroll coordination
    const scroll = this.scrollProgress;
    if (scroll > 0.35) {
      const dissolve = (scroll - 0.35) / 0.65;
      this.globeGroup.position.y = dissolve * 5.0;
      const targetScale = Math.max(1.0 - dissolve * 0.55, 0.4);
      this.globeGroup.scale.set(targetScale, targetScale, targetScale);
      this.pointCloudMaterial.opacity = Math.max((1.0 - dissolve * 0.65) * 0.92, 0.3);
    } else {
      this.globeGroup.position.y = 0;
      this.globeGroup.scale.set(1, 1, 1);
      this.pointCloudMaterial.opacity = 0.92;
    }

    this.renderer.render(this.scene, this.camera);
  }
}
