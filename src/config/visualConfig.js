/**
 * VISUAL_CONFIG
 * Central configuration layer for all 3D scene parameters, colors,
 * particle densities, speeds, and interaction physics.
 * Easily tunable without touching core rendering logic.
 */

export const VISUAL_CONFIG = {
  // Globe Core Geometry & Scale (Preserved baseline: 4.2)
  globeRadius: 4.2,
  globeParticleCount: 22000,
  globeParticleSize: 0.085,
  globeRotationSpeed: 0.0012,
  globeCoreRadiusFactor: 0.98,
  globeAtmosRadiusFactor: 1.05,

  // Color Palette (Sophisticated cybersecurity dark mode)
  colors: {
    bgDark: '#030509',
    bgDeep: '#05070B',
    bgCard: '#080B10',
    colorLand: '#dce7f3',       // Off-white continental land points
    colorCoast: '#00f5ff',      // Electric cyan coastal boundaries
    colorOcean: '#0a1832',      // Deep navy ocean points
    colorGold: '#d4a574',       // Muted warm gold telemetry highlights
    colorCore: '#02050e',       // Inner dark core sphere
    colorAtmos: '#00f5ff',      // Cyan atmospheric glow rim
    colorTextMuted: '#64748b',
    colorTextSecondary: '#94a3b8'
  },

  // Hero Fiber & Iris Parameters
  iris: {
    fiberCount: 1600,
    irisRadius: 3.6,
    pupilRadius: 1.1,
    ciliaryDepth: 0.8,
    spinVelocity: 0.003,
    magneticPulseFrequency: 1.4
  },

  // Interactive Physics & Sensitivities
  physics: {
    mouseInfluence: 0.004,
    dragDamping: 0.95,
    scrollSmoothing: 0.08,
    mobileParticleMultiplier: 0.55
  },

  // Global Telemetry Nodes (Major cybersecurity hubs)
  telemetryHubs: [
    { name: 'SF / Silicon Valley', lat: 37.7749, lon: -122.4194, as: 'AS15169' },
    { name: 'New York', lat: 40.7128, lon: -74.0060, as: 'AS3356' },
    { name: 'London', lat: 51.5074, lon: -0.1278, as: 'AS2856' },
    { name: 'Tokyo', lat: 35.6762, lon: 139.6503, as: 'AS2497' },
    { name: 'New Delhi', lat: 28.6139, lon: 77.2090, as: 'AS9498' },
    { name: 'Singapore', lat: 1.3521, lon: 103.8198, as: 'AS4657' },
    { name: 'Sydney', lat: -33.8688, lon: 151.2093, as: 'AS1221' },
    { name: 'Berlin', lat: 52.5200, lon: 13.4050, as: 'AS680' },
    { name: 'São Paulo', lat: -23.5505, lon: -46.6333, as: 'AS27699' }
  ]
};
