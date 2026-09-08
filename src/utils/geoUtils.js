import { LAND_WIDTH, LAND_HEIGHT, LAND_GRID_B64 } from '../data/worldLandGrid.js';

let landGrid = null;

function getLandGrid() {
  if (landGrid) return landGrid;
  const binaryString = typeof atob !== 'undefined'
    ? atob(LAND_GRID_B64)
    : Buffer.from(LAND_GRID_B64, 'base64').toString('binary');
  const len = binaryString.length;
  landGrid = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    landGrid[i] = binaryString.charCodeAt(i);
  }
  return landGrid;
}

/**
 * Test whether a geographic coordinate is on land.
 * Uses high-resolution authoritative Natural Earth 110m 1440x720 1-bit raster grid.
 * Covers all ~200 sovereign countries and major islands with true original boundaries.
 * 
 * @param {number} lat - Latitude in degrees (-90 to 90)
 * @param {number} lon - Longitude in degrees (-180 to 180)
 * @returns {boolean} true if the point is on land
 */
export function isPointOnLand(lat, lon) {
  const grid = getLandGrid();
  const x = Math.floor(((lon + 180) / 360) * LAND_WIDTH);
  const y = Math.floor(((90 - lat) / 180) * LAND_HEIGHT);
  if (x < 0 || x >= LAND_WIDTH || y < 0 || y >= LAND_HEIGHT) return false;
  const idx = y * LAND_WIDTH + x;
  return ((grid[idx >> 3] >> (idx & 7)) & 1) === 1;
}

/**
 * Convert latitude/longitude to a Three.js Vector3 on a sphere.
 * Follows the standard geographic convention.
 * 
 * @param {number} lat - Latitude in degrees
 * @param {number} lon - Longitude in degrees  
 * @param {number} radius - Sphere radius
 * @returns {{x: number, y: number, z: number}}
 */
export function latLonToXYZ(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return {
    x: -radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta)
  };
}
