import * as THREE from "three";
import { isPointOnLand, latLonToXYZ } from "../utils/geoUtils.js";

/**
 * InternetGlobeScene — Master Cinematic Cybersecurity Scene.
 *
 * SEQUENCE:
 * DEEP SPACE → 3D SPIRAL GALAXY FORMATION → CINEMATIC ZOOM-OUT
 * → SEAMLESS TRANSITION TO EXISTING BGP GLOBE → INTERACTIVE GLOBE & BGP TELEMETRY
 *
 * RULES:
 * - The opening galaxy sequence is 100% autonomous inside the 100vh viewport.
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
    this.currentState = "COSMIC_SPACE";
    this.globeRevealed = false;
    this.scrollProgress = 0;

    // Three.js Core
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      38,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      1000,
    );
    this.camera.position.set(0, 0, 4);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
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

    // Galaxy interaction & inertia: rotates on itself around its central axis, default horizontal tilt 1.20 rad
    this.galaxyTiltX = 1.20;
    this.galaxySpinAngle = 0.0;
    this.galaxySpinVelocity = 0.0;
    this.galaxyTiltVelocity = 0.0;
    this.galaxyPointerLocal = new THREE.Vector3(999, 999, 0);
    this.galaxyPointerActive = false;

    // Configuration
    this.globeRadius = 4.2;
    this.particleCount = 68000;

    // Build scene layers
    this.initLighting();
    this.initCosmicBackgroundField();
    this.initGalaxyIntro();
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
      const c = r > 0.6 ? colWhite : r > 0.25 ? colCyan : colAmber;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      sizes[i] = 0.025 + Math.random() * 0.035;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });

    this.cosmicPoints = new THREE.Points(geo, mat);
    this.cosmicGroup.add(this.cosmicPoints);
  }

  // =========================================================================
  // =========================================================================
  // 2. CINEMATIC 3D SPIRAL GALAXY INTRO (Astra-Grade Logarithmic Architecture)
  // =========================================================================
  initGalaxyIntro() {
    this.galaxyGroup = new THREE.Group();
    this.galaxyGroup.position.set(0, 0, 0);
    this.scene.add(this.galaxyGroup);

    // Galaxy Configuration — 16,000 stellar points for dense, high-fidelity arms
    this.galaxyParticleCount = 16000;
    const coreCount = 3800;

    // Buffers for galaxy particles
    const positions = new Float32Array(this.galaxyParticleCount * 3);
    const colors = new Float32Array(this.galaxyParticleCount * 3);
    const sizes = new Float32Array(this.galaxyParticleCount);
    const isPixels = new Float32Array(this.galaxyParticleCount); // 15% pixels, 85% cosmic particles

    this.galaxySpiralTargets = new Float32Array(this.galaxyParticleCount * 3);
    this.galaxyScatteredStart = new Float32Array(this.galaxyParticleCount * 3);
    this.galaxyVelocities = new Float32Array(this.galaxyParticleCount * 3);
    this.galaxyRandomPhases = new Float32Array(this.galaxyParticleCount);

    // Astronomical star palette: crisp white starlight dominant (plurality/max), with rich celestial colors
    const colCoreWhite = new THREE.Color(0xffffff);
    const colStarWhite = new THREE.Color(0xf4f7fd);

    // Colored starlight palette (converting 30% of white particles to vivid celestial & cyber hues)
    const coloredPalette = [
      new THREE.Color(0x00f0ff), // Vivid Cyber Cyan
      new THREE.Color(0x38bdf8), // Electric Azure
      new THREE.Color(0xffc857), // Warm Solar Gold
      new THREE.Color(0xff9e00), // Radiant Amber
      new THREE.Color(0xda46ff), // Neon Violet / Magenta
      new THREE.Color(0x00f59b), // Emerald Mint
      new THREE.Color(0xfb7185), // Coral Rose
      new THREE.Color(0x9bd7ff), // Pale Starlight Blue
      new THREE.Color(0xff7a00), // Warm Solar Orange
      new THREE.Color(0xcae8ff), // Ice Cyan
    ];

    // 1. Dense Glowing Galactic Nucleus / Core (~3,800 stars)
    for (let i = 0; i < coreCount; i++) {
      const i3 = i * 3;
      // Exponential falloff toward central singularity
      const r = Math.pow(Math.random(), 2.2) * 1.35;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.7; // subtle vertical compression

      const gx = r * Math.cos(theta) * Math.cos(phi);
      const gy = r * Math.sin(theta) * Math.cos(phi) * 0.75;
      const gz = r * Math.sin(phi) * 0.45;

      this.galaxySpiralTargets[i3] = gx;
      this.galaxySpiralTargets[i3 + 1] = gy;
      this.galaxySpiralTargets[i3 + 2] = gz;

      // Start positions: dispersed in deep space (for inward convergence stream)
      const sAngle = Math.random() * Math.PI * 2;
      const sPhi = Math.acos(2 * Math.random() - 1);
      const sR = 18 + Math.random() * 22;
      this.galaxyScatteredStart[i3] = Math.sin(sPhi) * Math.cos(sAngle) * sR;
      this.galaxyScatteredStart[i3 + 1] = Math.sin(sPhi) * Math.sin(sAngle) * sR;
      this.galaxyScatteredStart[i3 + 2] = Math.cos(sPhi) * sR;

      positions[i3] = this.galaxyScatteredStart[i3];
      positions[i3 + 1] = this.galaxyScatteredStart[i3 + 1];
      positions[i3 + 2] = this.galaxyScatteredStart[i3 + 2];

      this.galaxyRandomPhases[i] = Math.random() * Math.PI * 2;

      // Exactly 15% pixel particles, 85% cosmic particles
      isPixels[i] = Math.random() < 0.15 ? 1.0 : 0.0;

      // Core colors: White remains majority (~58%), 30% converted to colored starlight
      const roll = Math.random();
      let col;
      if (roll > 0.42) {
        col = colCoreWhite;
      } else {
        col = coloredPalette[Math.floor(Math.random() * coloredPalette.length)];
      }
      colors[i3] = col.r;
      colors[i3 + 1] = col.g;
      colors[i3 + 2] = col.b;

      // Core particle sizes: larger, intense glow
      sizes[i] = 0.055 + Math.random() * 0.085;
    }

    // 2. Majestic Logarithmic Spiral Arms (~12,200 stars)
    // 2 primary logarithmic arms + 2 secondary branches (matching user reference 3rd pic)
    for (let i = coreCount; i < this.galaxyParticleCount; i++) {
      const i3 = i * 3;

      // Arm distribution: 72% in 2 primary major arms, 28% in trailing spurs
      const isMainArm = Math.random() > 0.28;
      const armIndex = Math.floor(Math.random() * 2); // 0 or 1
      const armBaseAngle = armIndex * Math.PI + (isMainArm ? 0 : 0.54);

      // Radial distribution along logarithmic curve
      const u = Math.pow(Math.random(), 1.28);
      const r = 1.2 + u * 7.6; // 1.2 to 8.8

      // Logarithmic spiral equation: theta = theta0 + b * ln(r/r0) + swirl
      const winding = 2.85 * Math.log(r / 1.1) + r * 0.16;
      const baseAngle = armBaseAngle + winding;

      // Gaussian cross-section spread for realistic star cloud density
      const spreadR = (Math.random() + Math.random() - 1.0) * (0.16 + r * 0.048);
      const spreadAngle = (Math.random() + Math.random() - 1.0) * (0.11 + 0.018 * r);
      const finalAngle = baseAngle + spreadAngle;
      const finalR = Math.max(0.45, r + spreadR);

      // Height thickness: thinner at outer edges, thicker near center
      const zThickness = (Math.random() - 0.5) * (0.28 + 0.04 * r) * Math.exp(-r / 5.2);

      this.galaxySpiralTargets[i3] = Math.cos(finalAngle) * finalR;
      this.galaxySpiralTargets[i3 + 1] = Math.sin(finalAngle) * finalR * 0.65;
      this.galaxySpiralTargets[i3 + 2] = zThickness;

      // Scattered start positions for inward collapse
      const sAngle = Math.random() * Math.PI * 2;
      const sPhi = Math.acos(2 * Math.random() - 1);
      const sR = 20 + Math.random() * 24;
      this.galaxyScatteredStart[i3] = Math.sin(sPhi) * Math.cos(sAngle) * sR;
      this.galaxyScatteredStart[i3 + 1] = Math.sin(sPhi) * Math.sin(sAngle) * sR;
      this.galaxyScatteredStart[i3 + 2] = Math.cos(sPhi) * sR;

      positions[i3] = this.galaxyScatteredStart[i3];
      positions[i3 + 1] = this.galaxyScatteredStart[i3 + 1];
      positions[i3 + 2] = this.galaxyScatteredStart[i3 + 2];

      this.galaxyRandomPhases[i] = Math.random() * Math.PI * 2;

      // Exactly 15% pixel particles, 85% cosmic particles
      isPixels[i] = Math.random() < 0.15 ? 1.0 : 0.0;

      // Spiral arm colors: White remains plurality/max (~53%), 30% of white converted to colored starlight
      const roll = Math.random();
      let col;
      if (roll > 0.47) {
        col = Math.random() > 0.5 ? colCoreWhite : colStarWhite;
      } else {
        col = coloredPalette[Math.floor(Math.random() * coloredPalette.length)];
      }

      colors[i3] = col.r;
      colors[i3 + 1] = col.g;
      colors[i3 + 2] = col.b;

      // Size variation: crisp pinpoint stars and soft background dust
      const sizeRand = Math.random();
      sizes[i] = sizeRand > 0.93 ? 0.075 + Math.random() * 0.045 : 0.028 + Math.random() * 0.038;
    }

    const galaxyGeo = new THREE.BufferGeometry();
    galaxyGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    galaxyGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    galaxyGeo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    galaxyGeo.setAttribute("isPixel", new THREE.BufferAttribute(isPixels, 1));

    // Custom shader: renders 85% soft cosmic star particles and 15% crisp cyber pixels
    this.galaxyMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        attribute float size;
        attribute float isPixel;
        varying vec3 vColor;
        varying float vDist;
        varying float vIsPixel;
        void main() {
          vColor = color;
          vIsPixel = isPixel;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vDist = length(position.xy);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = max(size * (560.0 / -mvPosition.z), 1.0);
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        varying vec3 vColor;
        varying float vDist;
        varying float vIsPixel;
        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);

          if (vIsPixel > 0.5) {
            // 15% Sharp cyber pixel particles (crisp square starlight pixels)
            float maxDist = max(abs(coord.x), abs(coord.y));
            if (maxDist > 0.44) discard;
            float pixelAlpha = smoothstep(0.44, 0.36, maxDist) * uOpacity;
            gl_FragColor = vec4(vColor * 1.25, pixelAlpha * 0.95);
          } else {
            // 85% Cosmic star particles (crisp pinpoint starlight with subtle clean halo)
            float dist = length(coord);
            if (dist > 0.5) discard;
            float core = smoothstep(0.18, 0.0, dist);
            float halo = smoothstep(0.5, 0.0, dist) * 0.35;
            float alpha = (core + halo) * uOpacity;
            vec3 finalColor = vColor + vec3(core * 0.3);
            gl_FragColor = vec4(finalColor, alpha);
          }
        }
      `,
      transparent: true,
      depthWrite: false,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uOpacity: { value: 0.0 },
      },
    });

    this.galaxyPoints = new THREE.Points(galaxyGeo, this.galaxyMaterial);
    this.galaxyGroup.add(this.galaxyPoints);

    // Initial horizontal 3D perspective orientation (matching Screenshot 2)
    this.galaxyGroup.rotation.x = this.galaxyTiltX;
    this.galaxyGroup.rotation.y = 0.0;
    this.galaxyGroup.rotation.z = 0.0;
    this.galaxyPoints.rotation.z = this.galaxySpinAngle;
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
    const maxAttempts = count * 22;

    while (idx < count && attempts < maxAttempts) {
      attempts++;

      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const lat = (Math.PI / 2 - phi) * (180 / Math.PI);
      const lon = (theta - Math.PI) * (180 / Math.PI);

      const isLand = isPointOnLand(lat, lon);
      if (!isLand && Math.random() > 0.025) continue;

      const r = isLand
        ? this.globeRadius + (Math.random() - 0.5) * 0.02
        : this.globeRadius;

      const gx = -r * Math.sin(phi) * Math.cos(theta);
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

      sizes[idx] = isLand ? 0.052 + Math.random() * 0.035 : 0.022;
      idx++;
    }

    const actualCount = idx;

    const globeGeo = new THREE.BufferGeometry();
    globeGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(positions.subarray(0, actualCount * 3), 3),
    );
    globeGeo.setAttribute(
      "color",
      new THREE.BufferAttribute(colors.subarray(0, actualCount * 3), 3),
    );
    globeGeo.setAttribute(
      "size",
      new THREE.BufferAttribute(sizes.subarray(0, actualCount), 1),
    );

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
        uOpacity: { value: 1.0 },
      },
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.globePoints = new THREE.Points(globeGeo, this.globeMaterial);
    this.globeGroup.add(this.globePoints);

    // Inner core and rim meshes disabled so globe color matches the background (#030509) seamlessly
    const innerGeo = new THREE.SphereGeometry(this.globeRadius * 0.985, 48, 48);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x030509,
      transparent: true,
      opacity: 0.0,
      visible: false,
    });
    this.innerSphere = new THREE.Mesh(innerGeo, innerMat);
    this.innerSphere.visible = false;
    this.globeGroup.add(this.innerSphere);

    const rimGeo = new THREE.SphereGeometry(this.globeRadius * 1.04, 48, 48);
    const rimMat = new THREE.MeshBasicMaterial({
      color: 0x030509,
      transparent: true,
      opacity: 0.0,
      visible: false,
    });
    this.rimMesh = new THREE.Mesh(rimGeo, rimMat);
    this.rimMesh.visible = false;
    this.globeGroup.add(this.rimMesh);

    // 18 Autonomous System Nodes
    this.initBGPAutonomousSystemNodes();
    this.initRoutingArcsAndPulses();
  }

  initBGPAutonomousSystemNodes() {
    this.nodesGroup = new THREE.Group();
    this.globeGroup.add(this.nodesGroup);

    this.asNodes = [
      {
        id: "AS13335",
        name: "Cloudflare Edge",
        city: "San Francisco, US",
        lat: 37.77,
        lon: -122.42,
        prefix: "104.16.0.0/12",
        status: "ANNOUNCED",
        rtt: "4.2ms",
      },
      {
        id: "AS15169",
        name: "Google Global Cache",
        city: "Mountain View, US",
        lat: 37.38,
        lon: -122.08,
        prefix: "8.8.8.0/24",
        status: "ANNOUNCED",
        rtt: "2.8ms",
      },
      {
        id: "AS3356",
        name: "Lumen Tier-1 Backbone",
        city: "Denver, US",
        lat: 39.73,
        lon: -104.99,
        prefix: "4.0.0.0/8",
        status: "ANNOUNCED",
        rtt: "11.4ms",
      },
      {
        id: "AS7922",
        name: "Comcast National",
        city: "Philadelphia, US",
        lat: 39.95,
        lon: -75.16,
        prefix: "73.0.0.0/8",
        status: "ANNOUNCED",
        rtt: "14.2ms",
      },
      {
        id: "AS7018",
        name: "AT&T Global Network",
        city: "Dallas, US",
        lat: 32.77,
        lon: -96.79,
        prefix: "12.0.0.0/8",
        status: "ANNOUNCED",
        rtt: "18.1ms",
      },
      {
        id: "AS20940",
        name: "Akamai Edge Network",
        city: "Cambridge, US",
        lat: 42.37,
        lon: -71.1,
        prefix: "23.0.0.0/12",
        status: "ANNOUNCED",
        rtt: "6.5ms",
      },
      {
        id: "AS16509",
        name: "Amazon AWS Backbone",
        city: "Ashburn, US",
        lat: 39.04,
        lon: -77.48,
        prefix: "52.0.0.0/11",
        status: "ANNOUNCED",
        rtt: "5.1ms",
      },
      {
        id: "AS9002",
        name: "RETN EurAsia Backbone",
        city: "London, UK",
        lat: 51.5,
        lon: -0.12,
        prefix: "87.245.224.0/19",
        status: "ANNOUNCED",
        rtt: "22.3ms",
      },
      {
        id: "AS3257",
        name: "GTT Communications",
        city: "Frankfurt, DE",
        lat: 50.11,
        lon: 8.68,
        prefix: "89.149.0.0/16",
        status: "ANNOUNCED",
        rtt: "24.7ms",
      },
      {
        id: "AS1299",
        name: "Arelion (Telia Carrier)",
        city: "Stockholm, SE",
        lat: 59.32,
        lon: 18.06,
        prefix: "213.155.128.0/18",
        status: "ANNOUNCED",
        rtt: "28.0ms",
      },
      {
        id: "AS2914",
        name: "NTT Communications",
        city: "Tokyo, JP",
        lat: 35.68,
        lon: 139.69,
        prefix: "129.250.0.0/16",
        status: "ANNOUNCED",
        rtt: "88.5ms",
      },
      {
        id: "AS9498",
        name: "Bharti Airtel Core",
        city: "Mumbai, IN",
        lat: 19.07,
        lon: 72.87,
        prefix: "125.16.0.0/14",
        status: "ANNOUNCED",
        rtt: "42.1ms",
      },
      {
        id: "AS55836",
        name: "Reliance Jio Infocomm",
        city: "Delhi, IN",
        lat: 28.61,
        lon: 77.2,
        prefix: "49.44.0.0/14",
        status: "ANNOUNCED",
        rtt: "45.3ms",
      },
      {
        id: "AS4637",
        name: "Telstra Global Gateway",
        city: "Sydney, AU",
        lat: -33.86,
        lon: 151.2,
        prefix: "139.130.0.0/16",
        status: "ANNOUNCED",
        rtt: "112.0ms",
      },
      {
        id: "AS6762",
        name: "Sparkle Seabone",
        city: "Rome, IT",
        lat: 41.9,
        lon: 12.49,
        prefix: "195.223.0.0/16",
        status: "ANNOUNCED",
        rtt: "31.4ms",
      },
      {
        id: "AS27699",
        name: "Telecom Italia SP",
        city: "São Paulo, BR",
        lat: -23.55,
        lon: -46.63,
        prefix: "177.16.0.0/12",
        status: "ANNOUNCED",
        rtt: "135.0ms",
      },
      {
        id: "AS37100",
        name: "SEACOM Subsea Cable",
        city: "Johannesburg, ZA",
        lat: -26.2,
        lon: 28.04,
        prefix: "105.16.0.0/12",
        status: "ANNOUNCED",
        rtt: "148.0ms",
      },
      {
        id: "AS4755",
        name: "TATA Communications",
        city: "Singapore, SG",
        lat: 1.35,
        lon: 103.81,
        prefix: "180.87.0.0/17",
        status: "ANNOUNCED",
        rtt: "62.0ms",
      },
    ];

    this.nodeMeshes = [];

    this.asNodes.forEach((node) => {
      const pos = this.latLonToVector3(
        node.lat,
        node.lon,
        this.globeRadius * 1.015,
      );
      node.position = pos;

      const sphereGeo = new THREE.SphereGeometry(0.045, 12, 12);
      const sphereMat = new THREE.MeshBasicMaterial({
        color:
          node.id === "AS15169" || node.id === "AS9498" ? 0xc99a55 : 0x74e7ff,
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.copy(pos);
      sphere.userData = node;

      const ringGeo = new THREE.RingGeometry(0.07, 0.088, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x74e7ff,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide,
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
      ["AS13335", "AS15169"],
      ["AS15169", "AS3356"],
      ["AS3356", "AS7018"],
      ["AS16509", "AS9002"],
      ["AS9002", "AS3257"],
      ["AS3257", "AS1299"],
      ["AS1299", "AS9498"],
      ["AS9498", "AS55836"],
      ["AS55836", "AS4755"],
      ["AS4755", "AS2914"],
      ["AS2914", "AS4637"],
      ["AS13335", "AS2914"],
      ["AS16509", "AS27699"],
      ["AS9002", "AS37100"],
      ["AS3257", "AS6762"],
      ["AS7018", "AS16509"],
      ["AS20940", "AS9002"],
      ["AS9498", "AS4755"],
      ["AS13335", "AS9498"],
      ["AS3356", "AS16509"],
      ["AS27699", "AS4755"],
    ];

    routes.forEach(([idA, idB], idx) => {
      const nodeA = this.asNodes.find((n) => n.id === idA);
      const nodeB = this.asNodes.find((n) => n.id === idB);
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

      const isNewWarmRoute = idx >= 18;
      const isRareAmber = idx % 5 === 0;
      const baseOpacity = isRareAmber ? 0.35 : 0.22;
      const warmColors = [0xc99a55, 0xffc857, 0xf0a43c];
      const arcColor = isNewWarmRoute
        ? warmColors[idx - 18]
        : isRareAmber
          ? 0xc99a55
          : 0x74e7ff;

      const mat = new THREE.LineBasicMaterial({
        color: arcColor,
        transparent: true,
        opacity: baseOpacity,
      });

      const line = new THREE.Line(geo, mat);
      line.userData = { nodeA, nodeB, isRareAmber, baseOpacity };

      this.arcsGroup.add(line);
      this.activeRoutes.push({
        curve,
        line,
        nodeA,
        nodeB,
        baseOpacity,
        isRareAmber,
      });

      // Traveling data pulses
      for (let p = 0; p < 2; p++) {
        const pulseGeo = new THREE.SphereGeometry(0.045, 6, 6);
        const pulseMat = new THREE.MeshBasicMaterial({
          color: isNewWarmRoute
            ? warmColors[idx - 18]
            : isRareAmber
              ? 0xc99a55
              : Math.random() > 0.4
                ? 0x74e7ff
                : 0xffffff,
        });
        const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
        this.pulsesGroup.add(pulseMesh);

        this.pulses.push({
          mesh: pulseMesh,
          curve,
          progress: Math.random(),
          speed: 0,
          baseSpeed:
            idx % 5 === 0
              ? 0.006 + Math.random() * 0.001
              : idx % 3 === 0
                ? 0.0007 + Math.random() * 0.0005
                : 0.0022 + Math.random() * 0.0015,
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

    el.addEventListener("mousedown", (e) => {
      this.isDragging = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener("mouseup", () => {
      this.isDragging = false;
    });

    window.addEventListener("mousemove", (e) => {
      const clientX = e.clientX;
      const clientY = e.clientY;
      const rect = el.getBoundingClientRect();
      this.mouse2D.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse2D.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      this.targetMouse.set(this.mouse2D.x, this.mouse2D.y);

      if (this.globeRevealed) {
        if (this.isDragging) {
          const deltaX = clientX - this.previousMousePosition.x;
          const deltaY = clientY - this.previousMousePosition.y;
          this.rotationVelocity.y = deltaX * 0.003;
          this.rotationVelocity.x = deltaY * 0.003;
          this.globeRotation.y += this.rotationVelocity.y;
          this.globeRotation.x += this.rotationVelocity.x;
          this.previousMousePosition = { x: clientX, y: clientY };
        }
        this.checkRaycasterIntersections(clientX, clientY);
      } else {
        // Galaxy interaction: 720-degree spin on itself & tilt
        if (this.isDragging) {
          const deltaX = clientX - this.previousMousePosition.x;
          const deltaY = clientY - this.previousMousePosition.y;
          this.galaxySpinVelocity = deltaX * 0.0035;
          this.galaxyTiltVelocity = deltaY * 0.0035;
          this.galaxySpinAngle += this.galaxySpinVelocity;
          this.galaxyTiltX += this.galaxyTiltVelocity;
          this.previousMousePosition = { x: clientX, y: clientY };
        }
        // Track pointer for real-time particle disturbance & reshape
        this.updateGalaxyPointer();
      }
    });

    // Touch interaction for mobile
    el.addEventListener(
      "touchstart",
      (e) => {
        if (e.touches.length === 1) {
          this.isDragging = true;
          this.previousMousePosition = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
          };
        }
      },
      { passive: true },
    );

    window.addEventListener("touchend", () => {
      this.isDragging = false;
    });

    window.addEventListener(
      "touchmove",
      (e) => {
        if (e.touches.length === 1) {
          const rect = el.getBoundingClientRect();
          this.targetMouse.set(
            ((e.touches[0].clientX - rect.left) / rect.width) * 2 - 1,
            -((e.touches[0].clientY - rect.top) / rect.height) * 2 + 1,
          );
          const clientX = e.touches[0].clientX;
          const clientY = e.touches[0].clientY;

          if (this.globeRevealed) {
            if (this.isDragging) {
              const deltaX = clientX - this.previousMousePosition.x;
              const deltaY = clientY - this.previousMousePosition.y;
              this.rotationVelocity.y = deltaX * 0.003;
              this.rotationVelocity.x = deltaY * 0.003;
              this.globeRotation.y += this.rotationVelocity.y;
              this.globeRotation.x += this.rotationVelocity.x;
              this.previousMousePosition = { x: clientX, y: clientY };
            }
          } else {
            if (this.isDragging) {
              const deltaX = clientX - this.previousMousePosition.x;
              const deltaY = clientY - this.previousMousePosition.y;
              this.galaxySpinVelocity = deltaX * 0.0035;
              this.galaxyTiltVelocity = deltaY * 0.0035;
              this.galaxySpinAngle += this.galaxySpinVelocity;
              this.galaxyTiltX += this.galaxyTiltVelocity;
              this.previousMousePosition = { x: clientX, y: clientY };
            }
            this.updateGalaxyPointer();
          }
        }
      },
      { passive: true },
    );

    window.addEventListener("resize", () => this.onResize());
  }

  updateGalaxyPointer() {
    if (!this.galaxyGroup || !this.camera) return;
    this.raycaster.setFromCamera(this.mouse2D, this.camera);
    const planeNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(this.camera.quaternion);
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(planeNormal, this.galaxyGroup.position);
    const hitWorld = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(plane, hitWorld)) {
      this.galaxyGroup.worldToLocal(hitWorld);
      this.galaxyPointerLocal.copy(hitWorld);
      this.galaxyPointerActive = true;
    } else {
      this.galaxyPointerActive = false;
    }
  }

  checkRaycasterIntersections(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      if (this.onNodeHover) {
        this.onNodeHover(null);
      }
      this.canvas.style.cursor = "default";
      return;
    }

    this.raycaster.setFromCamera(this.mouse2D, this.camera);
    const intersects = this.raycaster.intersectObjects(this.nodeMeshes);

    // Filter to front-facing nodes only (facing user, not on the far side of the sphere)
    let frontHit = null;
    const worldPos = new THREE.Vector3();
    const globeWorld = new THREE.Vector3();
    this.globeGroup.getWorldPosition(globeWorld);

    for (let i = 0; i < intersects.length; i++) {
      const obj = intersects[i].object;
      obj.getWorldPosition(worldPos);
      const normal = worldPos.clone().sub(globeWorld).normalize();
      const toCam = this.camera.position.clone().sub(worldPos).normalize();
      if (normal.dot(toCam) > 0.05) {
        frontHit = obj;
        break;
      }
    }

    // Keep the rendered node tiny, but make its hover target easier to reach.
    if (!frontHit) {
      const hoverRadius = 28;
      let closestDistance = hoverRadius;
      const projected = new THREE.Vector3();

      this.nodeMeshes.forEach((nodeMesh) => {
        nodeMesh.getWorldPosition(worldPos);
        const normal = worldPos.clone().sub(globeWorld).normalize();
        const toCam = this.camera.position.clone().sub(worldPos).normalize();
        if (normal.dot(toCam) <= 0.05) return;

        projected.copy(worldPos).project(this.camera);
        const nodeX = rect.left + (projected.x + 1) * 0.5 * rect.width;
        const nodeY = rect.top + (1 - projected.y) * 0.5 * rect.height;
        const distance = Math.hypot(clientX - nodeX, clientY - nodeY);
        if (distance < closestDistance) {
          closestDistance = distance;
          frontHit = nodeMesh;
        }
      });
    }

    if (frontHit) {
      const nodeData = frontHit.userData;

      this.canvas.style.cursor = "pointer";

      this.activeRoutes.forEach((route) => {
        const isConnected =
          route.nodeA.id === nodeData.id || route.nodeB.id === nodeData.id;
        route.line.material.opacity = isConnected ? 0.85 : 0.04;
      });

      if (this.onNodeHover) {
        this.onNodeHover(nodeData, clientX, clientY);
      }
    } else {
      this.canvas.style.cursor = "default";
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
    if (this.sequenceTime >= 13.2) {
      this.globeGroup.position.x = window.innerWidth > 960 ? 1.6 : 0.0;
    }
  }

  // Method to replay the sequence cleanly anytime
  replay() {
    this.sequenceTime = 0;
    this.globeRevealed = false;
    this.globeGroup.visible = false;
    this.globeGroup.scale.set(0.01, 0.01, 0.01);
    this.globeGroup.position.set(0, 0, 0);
    this.galaxyGroup.visible = true;
    this.galaxyGroup.scale.set(1, 1, 1);
    this.galaxyTiltX = 1.20;
    this.galaxySpinAngle = 0.0;
    this.galaxySpinVelocity = 0.0;
    this.galaxyTiltVelocity = 0.0;
    this.camera.position.set(0, 0, 4);

    if (this.galaxyPoints && this.galaxyScatteredStart) {
      const pos = this.galaxyPoints.geometry.attributes.position.array;
      for (let i = 0; i < this.galaxyParticleCount * 3; i++) {
        pos[i] = this.galaxyScatteredStart[i];
        if (this.galaxyVelocities) this.galaxyVelocities[i] = 0;
      }
      this.galaxyPoints.geometry.attributes.position.needsUpdate = true;
    }
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
    // 0.0s – 1.8s   GALAXY_COLLAPSE    Particles rush from deep space to center (Image 2)
    // 1.8s – 3.6s   GALAXY_UNFURLING   Particles blossom into logarithmic spiral (Image 3)
    // 3.6s – 10.5s  GALAXY_INTERACTIVE 720° rotation & hover disturbance/reshaping
    // 10.5s – 12.5s GALAXY_ZOOM_OUT    Accelerating cosmic zoom-out
    // 12.5s+        GLOBE_ACTIVE       Protected BGP globe rotation & telemetry
    // =======================================================================

    let state = "GALAXY_COLLAPSE";
    let statusLabel = "[DEEP SPACE TELEMETRY // INWARD CONVERGENCE STREAM]";

    if (t >= 12.5) {
      state = "GLOBE_ACTIVE";
      statusLabel = "[BGP TELEMETRY ACTIVE // 18 AS NODES // 720° ROTATION]";
    } else if (t >= 10.5) {
      state = "GALAXY_ZOOM_OUT";
      statusLabel = "[TRANSITION // COSMIC ZOOM-OUT SEQUENCE]";
    } else if (t >= 3.6) {
      state = "GALAXY_INTERACTIVE";
      statusLabel = "[SPIRAL GALAXY ONLINE // 16K STELLAR PARTICLES // 720° ROTATION]";
    } else if (t >= 1.8) {
      state = "GALAXY_UNFURLING";
      statusLabel = "[SPIRAL FORMATION // LOGARITHMIC ARMS BLOOMING]";
    }

    if (this.currentState !== state) {
      this.currentState = state;
      if (this.onStateChange) {
        this.onStateChange(state, statusLabel);
      }
    }

    // -----------------------------------------------------------------------
    // A. GALAXY LIFECYCLE, 720° ROTATION & HOVER DISTURBANCE (t < 12.5s)
    // -----------------------------------------------------------------------
    if (t < 12.5) {
      this.galaxyGroup.visible = true;
      this.globeGroup.visible = false;

      const posAttr = this.galaxyPoints.geometry.attributes.position;
      const posArray = posAttr.array;

      // Continuous rotation on itself around its central axis & momentum inertia
      if (!this.isDragging) {
        this.galaxySpinVelocity *= 0.95;
        this.galaxyTiltVelocity *= 0.95;
        this.galaxySpinAngle += this.galaxySpinVelocity + 0.0016;
        this.galaxyTiltX += this.galaxyTiltVelocity;
      }
      this.galaxyGroup.rotation.x = this.galaxyTiltX;
      this.galaxyGroup.rotation.y = 0.0;
      this.galaxyGroup.rotation.z = 0.0;
      this.galaxyPoints.rotation.z = this.galaxySpinAngle;

      // --- Stage 1: Particles rushing inward to center (0.0s – 1.8s) ---
      if (t < 1.8) {
        const pIn = t / 1.8;
        const easeIn = pIn * pIn * (3.0 - 2.0 * pIn);
        const vortexSpin = (1.0 - easeIn) * 3.5;

        for (let i = 0; i < this.galaxyParticleCount; i++) {
          const i3 = i * 3;
          const sx = this.galaxyScatteredStart[i3];
          const sy = this.galaxyScatteredStart[i3 + 1];
          const sz = this.galaxyScatteredStart[i3 + 2];

          const tx = this.galaxySpiralTargets[i3] * 0.14;
          const ty = this.galaxySpiralTargets[i3 + 1] * 0.14;
          const tz = this.galaxySpiralTargets[i3 + 2] * 0.14;

          // Inward pull with vortex rotation
          const curX = sx * (1.0 - easeIn) + tx * easeIn;
          const curY = sy * (1.0 - easeIn) + ty * easeIn;
          const curZ = sz * (1.0 - easeIn) + tz * easeIn;

          const cosS = Math.cos(vortexSpin);
          const sinS = Math.sin(vortexSpin);
          posArray[i3] = curX * cosS - curY * sinS;
          posArray[i3 + 1] = curX * sinS + curY * cosS;
          posArray[i3 + 2] = curZ;

          this.galaxyVelocities[i3] = 0;
          this.galaxyVelocities[i3 + 1] = 0;
          this.galaxyVelocities[i3 + 2] = 0;
        }
        posAttr.needsUpdate = true;

        this.galaxyMaterial.uniforms.uOpacity.value = Math.min(t / 0.8, 1.0);
        this.camera.position.z = 4.2 + t * 1.2;
      }
      // --- Stage 2: Blossoming / unfurling outward into spiral arms (1.8s – 3.6s) ---
      else if (t < 3.6) {
        const pOut = (t - 1.8) / 1.8;
        const easeOut = 1.0 - Math.pow(1.0 - pOut, 3.0);

        for (let i = 0; i < this.galaxyParticleCount; i++) {
          const i3 = i * 3;
          const tx = this.galaxySpiralTargets[i3];
          const ty = this.galaxySpiralTargets[i3 + 1];
          const tz = this.galaxySpiralTargets[i3 + 2];

          // Expand smoothly from nucleus into full spiral coordinates
          const coreX = tx * 0.14;
          const coreY = ty * 0.14;
          const coreZ = tz * 0.14;

          const targetX = coreX * (1.0 - easeOut) + tx * easeOut;
          const targetY = coreY * (1.0 - easeOut) + ty * easeOut;
          const targetZ = coreZ * (1.0 - easeOut) + tz * easeOut;

          posArray[i3] += (targetX - posArray[i3]) * 0.18;
          posArray[i3 + 1] += (targetY - posArray[i3 + 1]) * 0.18;
          posArray[i3 + 2] += (targetZ - posArray[i3 + 2]) * 0.18;
        }
        posAttr.needsUpdate = true;

        this.galaxyMaterial.uniforms.uOpacity.value = 1.0;
        this.camera.position.z = 6.36 + pOut * 3.0; // 6.36 -> 9.36
      }
      // --- Stage 3: Stable interactive galaxy (3.6s – 10.5s) ---
      else if (t < 10.5) {
        const hasHover = this.galaxyPointerActive;
        const px = this.galaxyPointerLocal.x;
        const py = this.galaxyPointerLocal.y;
        const pz = this.galaxyPointerLocal.z;
        const hoverRadius = 1.9;
        const hoverRadiusSq = hoverRadius * hoverRadius;

        for (let i = 0; i < this.galaxyParticleCount; i++) {
          const i3 = i * 3;
          const tx = this.galaxySpiralTargets[i3];
          const ty = this.galaxySpiralTargets[i3 + 1];
          const tz = this.galaxySpiralTargets[i3 + 2];

          // 1. Mouse hover proximity disturbance (reduced by 30% for gentle, fluid response)
          if (hasHover) {
            const dx = posArray[i3] - px;
            const dy = posArray[i3 + 1] - py;
            const dz = posArray[i3 + 2] - pz;
            const distSq = dx * dx + dy * dy + dz * dz;

            if (distSq < hoverRadiusSq) {
              const dist = Math.sqrt(distSq);
              const factor = 1.0 - dist / hoverRadius;
              const force = factor * factor * 0.315; // 30% reduction from 0.45
              // Fluid radial repulsion + vortex swirl wake
              this.galaxyVelocities[i3] += (dx / (dist + 0.001)) * force - dy * force * 0.266;
              this.galaxyVelocities[i3 + 1] += (dy / (dist + 0.001)) * force + dx * force * 0.266;
              this.galaxyVelocities[i3 + 2] += (dz / (dist + 0.001)) * force * 0.175;
            }
          }

          // 2. Spring-damper restoring force back to equilibrium spiral arms ("and reshape..")
          const rx = tx - posArray[i3];
          const ry = ty - posArray[i3 + 1];
          const rz = tz - posArray[i3 + 2];

          this.galaxyVelocities[i3] = (this.galaxyVelocities[i3] + rx * 0.08) * 0.88;
          this.galaxyVelocities[i3 + 1] = (this.galaxyVelocities[i3 + 1] + ry * 0.08) * 0.88;
          this.galaxyVelocities[i3 + 2] = (this.galaxyVelocities[i3 + 2] + rz * 0.08) * 0.88;

          // Subtle astronomical twinkle
          const phase = this.galaxyRandomPhases[i];
          const shimmer = Math.sin(t * 1.8 + phase) * 0.012;

          posArray[i3] += this.galaxyVelocities[i3] + shimmer;
          posArray[i3 + 1] += this.galaxyVelocities[i3 + 1] + shimmer;
          posArray[i3 + 2] += this.galaxyVelocities[i3 + 2];
        }
        posAttr.needsUpdate = true;

        this.galaxyMaterial.uniforms.uOpacity.value = 1.0;
        // Camera slow steady cinematic pullback
        const pullProg = (t - 3.6) / 6.9;
        this.camera.position.z = 9.36 + pullProg * 2.8; // 9.36 -> 12.16
      }
      // --- Stage 4: Accelerating zoom into center / moving towards us (10.5s – 12.5s) ---
      else {
        const zoomProg = (t - 10.5) / 2.0;
        const easeIn = Math.pow(zoomProg, 2.2);

        // Camera dollys forward into the center (12.16 down to 1.2)
        this.camera.position.z = Math.max(12.16 - easeIn * 10.96, 1.2);

        // Galaxy moves towards us / expands outward
        const expandScale = 1.0 + easeIn * 1.8;
        this.galaxyGroup.scale.set(expandScale, expandScale, expandScale);

        // Smooth fade out as camera penetrates center core
        if (zoomProg > 0.65) {
          const fadeOut = 1.0 - (zoomProg - 0.65) / 0.35;
          this.galaxyMaterial.uniforms.uOpacity.value = Math.max(0.0, fadeOut);
        } else {
          this.galaxyMaterial.uniforms.uOpacity.value = 1.0;
        }
      }

      this.camera.position.x = 0;
      this.camera.position.y = 0;
    }

    // -----------------------------------------------------------------------
    // B. SEAMLESS HAND-OFF TO THE EXISTING BGP GLOBE (t >= 12.5s)
    // -----------------------------------------------------------------------
    if (t >= 12.5) {
      this.galaxyGroup.visible = false;
      this.globeGroup.visible = true;
      this.globeRevealed = true;

      // Emergence transition (12.5s to 14.2s)
      const targetGlobeX = window.innerWidth > 960 ? 1.6 : 0.0;

      if (t < 14.2) {
        const emerge = (t - 12.5) / 1.7; // 0 to 1
        // Smoothly zoom camera back out to globe view
        this.camera.position.z = 1.2 + Math.pow(emerge, 0.5) * 13.8; // 1.2 up to 15.0
        // Scale globe smoothly out of the center
        const s = Math.min(Math.pow(emerge, 0.7), 1.0);
        this.globeGroup.scale.set(s, s, s);
        // Smoothly glide position to the right
        this.globeGroup.position.x =
          targetGlobeX * Math.sin(emerge * Math.PI * 0.5);
      } else {
        this.camera.position.z = 15.0;
        this.globeGroup.scale.set(1, 1, 1);
        this.globeGroup.position.x = targetGlobeX;
      }

      // Existing BGP Globe Rotation & Inertia (Continuous 720° / Perpetual)
      if (!this.isDragging) {
        this.rotationVelocity.x *= 0.95;
        this.rotationVelocity.y =
          (this.rotationVelocity.y - 0.0014) * 0.95 + 0.0014;
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
        const flap = Math.sin(t * 0.12 + i * 4.1) > 0.975 ? 0.45 : 0.0;
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
