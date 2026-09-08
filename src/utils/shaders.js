// GLSL Custom Shaders for Three.js Fiber Glow, Iris Hologram, and Globe Atmosphere

export const FiberGlowShader = {
  vertexShader: `
    uniform float uTime;
    uniform float uMorph;
    attribute float aOffset;
    attribute vec3 aIrisTarget;
    varying vec2 vUv;
    varying float vGlow;

    void main() {
      vUv = uv;
      
      // Undulation noise
      vec3 pos = position;
      float wave = sin(uTime * 2.5 + aOffset * 6.28) * 0.15 * (1.0 - uMorph);
      pos.x += wave;
      pos.y += cos(uTime * 2.0 + aOffset * 3.14) * 0.15 * (1.0 - uMorph);

      // Morph towards Iris concentric ring
      vec3 finalPos = mix(pos, aIrisTarget, uMorph);

      vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      // Glow intensity based on distance along strand
      vGlow = pow(uv.x, 2.0) * (0.8 + 0.3 * sin(uTime * 3.0 + aOffset));
    }
  `,
  fragmentShader: `
    uniform vec3 uColorBase;
    uniform vec3 uColorTip;
    varying vec2 vUv;
    varying float vGlow;

    void main() {
      // Gradient from amber gold / dark fiber to glowing electric cyan/gold tip
      vec3 col = mix(uColorBase, uColorTip, vUv.x);
      col += uColorTip * vGlow * 1.5;
      
      float alpha = clamp(0.3 + vGlow * 0.7, 0.0, 1.0);
      gl_FragColor = vec4(col, alpha);
    }
  `
};

export const GlobeAtmosphereShader = {
  vertexShader: `
    varying vec3 vNormal;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    varying vec3 vNormal;
    void main() {
      float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 2.5);
      gl_FragColor = vec4(uColor, 1.0) * intensity;
    }
  `
};

export const BinaryWaveShader = {
  vertexShader: `
    uniform float uTime;
    attribute float aSpeed;
    varying float vAlpha;
    void main() {
      vec3 pos = position;
      pos.z += sin(pos.x * 2.0 + uTime * uSpeed) * 0.5;
      pos.y += cos(pos.z * 2.0 + uTime * uSpeed) * 0.3;
      vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = (40.0 / -mvPos.z);
      gl_Position = projectionMatrix * mvPos;
      vAlpha = clamp(1.0 - (-mvPos.z / 30.0), 0.2, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    varying float vAlpha;
    void main() {
      float dist = length(gl_PointCoord - vec2(0.5));
      if (dist > 0.5) discard;
      gl_FragColor = vec4(uColor, (1.0 - dist * 2.0) * vAlpha);
    }
  `
};
