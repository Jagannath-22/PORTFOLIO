import * as THREE from "three";
import { isPointOnLand, latLonToXYZ } from "../utils/geoUtils.js";

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
    this.camera.position.set(0, 0, 13);

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

    // Configuration
    this.globeRadius = 4.2;
    this.particleCount = 68000;

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
  // 2. THE OPTICAL-FIBER COSMIC EYE (3D System with User's Authentic Texture)
  // =========================================================================
  initEyeScene() {
    this.eyeSceneGroup = new THREE.Group();
    this.eyeSceneGroup.position.set(0, 0, 0);
    this.scene.add(this.eyeSceneGroup);

    // Front-facing eye container with 3D gaze tracking
    this.eyeContainer = new THREE.Group();
    this.eyeSceneGroup.add(this.eyeContainer);

    // Load the user's authentic cosmic fiber-optic eye texture with 4K anisotropic filtering
    const textureLoader = new THREE.TextureLoader();
    this.eyeTexture = textureLoader.load("/textures/cosmic-eye.jpg");
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.eyeTexture.anisotropy = maxAniso;
    this.eyeTexture.generateMipmaps = true;
    this.eyeTexture.minFilter = THREE.LinearMipmapLinearFilter;
    this.eyeTexture.magFilter = THREE.LinearFilter;
    this.eyeTexture.colorSpace = THREE.SRGBColorSpace;

    // A. 3D CURVED EYE MESH (Anatomical Corneal Bulge)
    // 16:9 aspect ratio matching the 1024x576 source image
    const eyeWidth = 11.2;
    const eyeHeight = 6.3;
    const eyeGeo = new THREE.PlaneGeometry(eyeWidth, eyeHeight, 64, 48);
    const pos = eyeGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const nx = x / (eyeWidth * 0.5);
      const ny = y / (eyeHeight * 0.5);
      const distSq = nx * nx + ny * ny;
      // Eyeball curvature: center projects forward toward viewer
      const bulge = Math.max(0.0, 1.0 - distSq);
      const z = Math.pow(bulge, 1.4) * 0.85;
      pos.setZ(i, z);
    }
    eyeGeo.computeVertexNormals();

    // Shader Material: 4K crisp texture, seamless edge vignetting & almond blink
    this.eyeShaderMat = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: this.eyeTexture },
        uOpacity: { value: 0.0 },
        uBlink: { value: 0.0 }, // 0.0 = open, 1.0 = fully closed
        uTime: { value: 0.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPos.xyz;
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        uniform float uOpacity;
        uniform float uBlink;
        uniform float uTime;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
          // Seamless edge fade into black background (#030509)
          float edgeX = smoothstep(0.0, 0.06, vUv.x) * smoothstep(1.0, 0.94, vUv.x);
          float edgeY = smoothstep(0.0, 0.06, vUv.y) * smoothstep(1.0, 0.94, vUv.y);
          float edgeAlpha = edgeX * edgeY;

          vec4 texColor = texture2D(uTexture, vUv);

          // Subtle fiber shimmer on luminous tips
          float luma = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
          float sparkle = sin(uTime * 3.0 + vUv.x * 25.0 + vUv.y * 25.0) * 0.06 * step(0.6, luma);
          vec3 col = texColor.rgb + sparkle * vec3(0.45, 0.90, 1.0);

          // Eyelid blink occlusion (anatomical almond curve centered at pupil: 0.485, 0.482)
          float dx = clamp(abs(vUv.x - 0.485) / 0.18, 0.0, 1.0);
          float curveFactor = pow(max(0.0, 1.0 - dx * dx), 0.7);
          float maxHalfOpening = 0.065 * curveFactor;
          float dy = abs(vUv.y - 0.482);

          float currentHalfOpening = maxHalfOpening * (1.0 - uBlink);
          float lidOcclusion = smoothstep(currentHalfOpening - 0.012, currentHalfOpening + 0.012, dy) * uBlink;

          vec3 eyelidTone = vec3(0.012, 0.02, 0.036);
          col = mix(col, eyelidTone, clamp(lidOcclusion * 1.5, 0.0, 1.0));

          // Glowing optic seam pulse when blink reaches full closure
          float seamGlow = smoothstep(0.015, 0.0, dy) * smoothstep(0.7, 1.0, uBlink) * curveFactor;
          vec3 seamColor = mix(vec3(0.45, 0.9, 1.0), vec3(0.9, 0.4, 1.0), sin(vUv.x * 12.0) * 0.5 + 0.5);
          col += seamGlow * seamColor * 2.2;

          gl_FragColor = vec4(col, texColor.a * edgeAlpha * uOpacity);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    this.eyeMesh = new THREE.Mesh(eyeGeo, this.eyeShaderMat);
    this.eyeMesh.position.set(0, 0, 0);
    this.eyeContainer.add(this.eyeMesh);

    // B. FLOATING 3D COSMIC STARDUST & FIBER-OPTIC BOKEH PARTICLES
    const bokehCount = 550;
    const bokehGeo = new THREE.BufferGeometry();
    const bokehPos = new Float32Array(bokehCount * 3);
    const bokehColors = new Float32Array(bokehCount * 3);
    this.bokehBaseData = [];

    const colCyan = new THREE.Color(0x74e7ff);
    const colViolet = new THREE.Color(0xd050ff);
    const colGold = new THREE.Color(0xffbe76);
    const colWhite = new THREE.Color(0xffffff);

    for (let i = 0; i < bokehCount; i++) {
      const bx = (Math.random() - 0.5) * 14.0;
      const by = (Math.random() - 0.5) * 8.0;
      const bz = 0.15 + Math.random() * 1.6;

      bokehPos[i * 3] = bx;
      bokehPos[i * 3 + 1] = by;
      bokehPos[i * 3 + 2] = bz;

      const r = Math.random();
      let c;
      if (r > 0.65) c = colCyan;
      else if (r > 0.35) c = colViolet;
      else if (r > 0.15) c = colGold;
      else c = colWhite;

      bokehColors[i * 3] = c.r;
      bokehColors[i * 3 + 1] = c.g;
      bokehColors[i * 3 + 2] = c.b;

      this.bokehBaseData.push({
        x: bx,
        y: by,
        z: bz,
        speed: 0.2 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
      });
    }

    bokehGeo.setAttribute("position", new THREE.BufferAttribute(bokehPos, 3));
    bokehGeo.setAttribute("color", new THREE.BufferAttribute(bokehColors, 3));

    this.bokehMat = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.bokehPoints = new THREE.Points(bokehGeo, this.bokehMat);
    this.eyeContainer.add(this.bokehPoints);
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
      if (this.globeRevealed) {
        this.isDragging = true;
        this.previousMousePosition = { x: e.clientX, y: e.clientY };
      }
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
      }
    });

    // Touch interaction for mobile
    el.addEventListener(
      "touchstart",
      (e) => {
        if (this.globeRevealed && e.touches.length === 1) {
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
        if (this.isDragging && this.globeRevealed && e.touches.length === 1) {
          const deltaX = e.touches[0].clientX - this.previousMousePosition.x;
          const deltaY = e.touches[0].clientY - this.previousMousePosition.y;
          this.rotationVelocity.y = deltaX * 0.003;
          this.rotationVelocity.x = deltaY * 0.003;
          this.globeRotation.y += this.rotationVelocity.y;
          this.globeRotation.x += this.rotationVelocity.x;
          this.previousMousePosition = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
          };
        }
      },
      { passive: true },
    );

    window.addEventListener("resize", () => this.onResize());
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
    if (this.sequenceTime >= 16.5) {
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
    // 0.0s – 1.0s   COSMIC_SPACE       Faint cosmic field & particle acceleration
    // 1.0s – 10.0s  EYE_OBSERVING      Authentic biometric eye, forward observation
    // 10.0s – 12.0s BLINK_CYCLE        Aperture blink cycle (pupil occluded, then reopened)
    // 12.0s – 14.8s PUPIL_ZOOM         Camera enters circular pupil portal
    // 14.8s+        GLOBE_ACTIVE       Protected BGP globe rotation & telemetry
    // =======================================================================

    let state = "COSMIC_SPACE";
    let statusLabel = "[QUANTUM OBSERVER // COSMIC PARTICLES ACCELERATING]";

    if (t >= 14.8) {
      state = "GLOBE_ACTIVE";
      statusLabel = "[BGP TELEMETRY ACTIVE // 18 AS NODES // 720° ROTATION]";
    } else if (t >= 12.0) {
      state = "PUPIL_ZOOM";
      statusLabel = "[TRANSITION // ENTERING CIRCULAR PUPIL PORTAL]";
    } else if (t >= 11.0) {
      state = "BLINK_OPENING";
      statusLabel = "[APERTURE CYCLE // EYELIDS REOPENING]";
    } else if (t >= 10.0) {
      state = "BLINK_CLOSING";
      statusLabel = "[APERTURE CYCLE // SYNCHRONIZED BLINK]";
    } else if (t >= 1.0) {
      state = "EYE_OBSERVING";
      statusLabel = "[BIOMETRIC SYSTEM ONLINE // FORWARD OBSERVATION]";
    }

    if (this.currentState !== state) {
      this.currentState = state;
      if (this.onStateChange) {
        this.onStateChange(state, statusLabel);
      }
    }

    // -----------------------------------------------------------------------
    // A. EYE FORMATION, BLINK & PUPIL ZOOM (t < 14.8s)
    // -----------------------------------------------------------------------
    if (t < 14.8) {
      this.eyeSceneGroup.visible = true;
      this.globeGroup.visible = false;

      // 1. Smooth fade-in of the eye & bokeh (1.0s to 3.0s)
      const eyeFade = t < 1.0 ? 0.0 : Math.min((t - 1.0) / 2.0, 1.0);
      if (this.eyeShaderMat) {
        this.eyeShaderMat.uniforms.uOpacity.value = eyeFade;
        this.eyeShaderMat.uniforms.uTime.value = t;
      }
      if (this.bokehMat) {
        this.bokehMat.opacity = eyeFade * 0.85;
      }
      // Animate floating bokeh particles
      if (this.bokehPoints && this.bokehBaseData) {
        const posAttr = this.bokehPoints.geometry.attributes.position;
        for (let i = 0; i < this.bokehBaseData.length; i++) {
          const b = this.bokehBaseData[i];
          const curY = b.y + Math.sin(t * b.speed + b.phase) * 0.12;
          const curX = b.x + Math.cos(t * b.speed * 0.7 + b.phase) * 0.08;
          posAttr.setXY(i, curX, curY);
        }
        posAttr.needsUpdate = true;
      }

      // 2. Subtle mouse parallax for the eye (forward biometric lock)
      const cursorParallaxX = this.smoothedMouse.x * 0.14;
      const cursorParallaxY = this.smoothedMouse.y * 0.09;
      this.eyeContainer.position.x +=
        (cursorParallaxX - this.eyeContainer.position.x) * 0.08;
      this.eyeContainer.position.y +=
        (cursorParallaxY - this.eyeContainer.position.y) * 0.08;
      this.eyeContainer.rotation.y +=
        (cursorParallaxX * 0.22 - this.eyeContainer.rotation.y) * 0.08;
      this.eyeContainer.rotation.x +=
        (-cursorParallaxY * 0.18 - this.eyeContainer.rotation.x) * 0.08;

      // 3. The Single Cosmic Blink (10.0s - 12.0s)
      let blinkVal = 0.0;
      if (t >= 10.0 && t < 12.0) {
        if (t < 10.85) {
          // Closing
          blinkVal = Math.min((t - 10.0) / 0.85, 1.0);
        } else if (t < 11.15) {
          // Fully shut
          blinkVal = 1.0;
        } else {
          // Reopening
          blinkVal = 1.0 - Math.min((t - 11.15) / 0.85, 1.0);
        }
      }
      if (this.eyeShaderMat) {
        this.eyeShaderMat.uniforms.uBlink.value = blinkVal;
      }

      // 4. Zoom Into Circular Pupil (12.0s - 14.8s)
      if (t >= 12.0) {
        const zoomProg = (t - 12.0) / 2.8; // 0 to 1
        // Camera dollys straight into the pitch black pupil center at (0, 0)
        const camZ = 13.0 - Math.pow(zoomProg, 2.2) * 11.8; // 13.0 down to 1.2
        this.camera.position.z = Math.max(camZ, 1.2);
        this.camera.position.x = 0;
        this.camera.position.y = 0;

        if (zoomProg > 0.7 && this.eyeShaderMat) {
          const fadeOut = 1.0 - (zoomProg - 0.7) / 0.3;
          this.eyeShaderMat.uniforms.uOpacity.value = Math.max(0.0, fadeOut);
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
      const targetGlobeX = window.innerWidth > 960 ? 1.6 : 0.0;

      if (t < 16.5) {
        const emerge = (t - 14.8) / 1.7; // 0 to 1
        // Smoothly zoom camera back out to globe view
        this.camera.position.z = 1.2 + Math.pow(emerge, 0.5) * 13.8; // 1.2 up to 15.0
        // Scale globe smoothly out of the pupil center
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
