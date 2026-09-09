import { feature } from "topojson-client";
import countriesTopology from "../data/countries-110m.json";

const worldCountries = feature(
  countriesTopology,
  countriesTopology.objects.countries,
);

function pointInRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const crossesLatitude = yi > lat !== yj > lat;
    const intersectionLon = ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (crossesLatitude && lon < intersectionLon) inside = !inside;
  }
  return inside;
}

function pointInPolygon(lon, lat, polygon) {
  if (!pointInRing(lon, lat, polygon[0])) return false;
  for (let i = 1; i < polygon.length; i++) {
    if (pointInRing(lon, lat, polygon[i])) return false;
  }
  return true;
}

function pointInGeometry(lon, lat, geometry) {
  if (geometry.type === "Polygon") {
    return pointInPolygon(lon, lat, geometry.coordinates);
  }
  return geometry.coordinates.some((polygon) =>
    pointInPolygon(lon, lat, polygon),
  );
}

/**
 * Test whether a geographic coordinate is on land.
 * Uses the bundled Natural Earth country polygons so each land dot follows the
 * source coastline instead of a separately generated raster approximation.
 *
 * @param {number} lat - Latitude in degrees (-90 to 90)
 * @param {number} lon - Longitude in degrees (-180 to 180)
 * @returns {boolean} true if the point is on land
 */
export function isPointOnLand(lat, lon) {
  return worldCountries.features.some((country) =>
    pointInGeometry(lon, lat, country.geometry),
  );
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
    z: radius * Math.sin(phi) * Math.sin(theta),
  };
}
