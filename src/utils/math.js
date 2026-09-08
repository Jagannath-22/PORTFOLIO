// Mathematical utilities, 3D vector interpolation, simplex noise algorithms, and easing functions

export function lerp(start, end, factor) {
  return start + (end - start) * factor;
}

export function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

// Pseudo-random 3D noise generator (Simplex approximation for procedural undulation)
export class SimplexNoise {
  constructor(seed = 42) {
    this.seed = seed;
  }

  noise2D(xin, yin) {
    let n = Math.sin(xin * 12.9898 + yin * 78.233 + this.seed) * 43758.5453123;
    return (n - Math.floor(n)) * 2.0 - 1.0;
  }

  noise3D(x, y, z) {
    let n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + this.seed) * 43758.5453123;
    return (n - Math.floor(n)) * 2.0 - 1.0;
  }
}

// Catmull-Rom spline evaluator for smooth fiber optic curves
export function getCatmullRomPoint(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;

  const v0 = (p2.x - p0.x) * 0.5;
  const v1 = (p3.x - p1.x) * 0.5;

  const x = (2 * p1.x - 2 * p2.x + v0 + v1) * t3 +
            (-3 * p1.x + 3 * p2.x - 2 * v0 - v1) * t2 +
            v0 * t + p1.x;

  const vy0 = (p2.y - p0.y) * 0.5;
  const vy1 = (p3.y - p1.y) * 0.5;
  const y = (2 * p1.y - 2 * p2.y + vy0 + vy1) * t3 +
            (-3 * p1.y + 3 * p2.y - 2 * vy0 - vy1) * t2 +
            vy0 * t + p1.y;

  const vz0 = (p2.z - p0.z) * 0.5;
  const vz1 = (p3.z - p1.z) * 0.5;
  const z = (2 * p1.z - 2 * p2.z + vz0 + vz1) * t3 +
            (-3 * p1.z + 3 * p2.z - 2 * vz0 - vz1) * t2 +
            vz0 * t + p1.z;

  return { x, y, z };
}
