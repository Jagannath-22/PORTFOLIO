/**
 * Real BGP Autonomous System (AS) Nodes & Peering Topologies
 * Comprehensive global routing network spanning all continents.
 */

export const BGP_NODES = [
  // --- NORTH AMERICA ---
  { id: 'AS15169', name: 'Google LLC', city: 'Mountain View', lat: 37.4220, lon: -122.0841, prefix: '8.8.8.0/24', status: 'ANNOUNCED', peers: ['AS3356', 'AS2856', 'AS2497', 'AS13335', 'AS8075'] },
  { id: 'AS13335', name: 'Cloudflare', city: 'San Francisco', lat: 37.7749, lon: -122.4194, prefix: '1.1.1.0/24', status: 'RPKI VALID', peers: ['AS15169', 'AS7922', 'AS3257', 'AS2497', 'AS36492'] },
  { id: 'AS3356', name: 'Lumen / Level 3', city: 'New York', lat: 40.7128, lon: -74.0060, prefix: '4.0.0.0/9', status: 'ESTABLISHED', peers: ['AS15169', 'AS7922', 'AS2856', 'AS680', 'AS27699', 'AS16509'] },
  { id: 'AS7922', name: 'Comcast Cable', city: 'Philadelphia', lat: 39.9526, lon: -75.1652, prefix: '73.0.0.0/8', status: 'ANNOUNCED', peers: ['AS3356', 'AS13335', 'AS16509'] },
  { id: 'AS8075', name: 'Microsoft Azure', city: 'Seattle', lat: 47.6062, lon: -122.3321, prefix: '13.64.0.0/11', status: 'ESTABLISHED', peers: ['AS15169', 'AS2497', 'AS577', 'AS3356'] },
  { id: 'AS16509', name: 'Amazon AWS', city: 'Ashburn', lat: 39.0438, lon: -77.4874, prefix: '54.240.0.0/12', status: 'ESTABLISHED', peers: ['AS3356', 'AS7922', 'AS7018', 'AS2856', 'AS27699'] },
  { id: 'AS7018', name: 'AT&T Global', city: 'Dallas', lat: 32.7767, lon: -96.7970, prefix: '12.0.0.0/8', status: 'ANNOUNCED', peers: ['AS16509', 'AS3356', 'AS36492'] },
  { id: 'AS36492', name: 'Hurricane Electric', city: 'Fremont', lat: 37.5485, lon: -121.9886, prefix: '64.62.128.0/17', status: 'RPKI VALID', peers: ['AS13335', 'AS7018', 'AS2914', 'AS1221'] },
  { id: 'AS577', name: 'Bell Canada', city: 'Toronto', lat: 43.6532, lon: -79.3832, prefix: '142.166.0.0/16', status: 'ESTABLISHED', peers: ['AS8075', 'AS3356', 'AS2856'] },

  // --- EUROPE ---
  { id: 'AS2856', name: 'BT Group plc', city: 'London', lat: 51.5074, lon: -0.1278, prefix: '62.0.0.0/8', status: 'ESTABLISHED', peers: ['AS3356', 'AS15169', 'AS5511', 'AS680', 'AS3257', 'AS1299'] },
  { id: 'AS680', name: 'DFN / Internet2', city: 'Frankfurt', lat: 50.1109, lon: 8.6821, prefix: '141.0.0.0/16', status: 'ESTABLISHED', peers: ['AS3356', 'AS2856', 'AS5511', 'AS3257', 'AS9498', 'AS5384'] },
  { id: 'AS3257', name: 'GTT Communications', city: 'Amsterdam', lat: 52.3676, lon: 4.9041, prefix: '213.136.0.0/19', status: 'ESTABLISHED', peers: ['AS680', 'AS2856', 'AS13335', 'AS2914', 'AS1299'] },
  { id: 'AS5511', name: 'Orange S.A.', city: 'Paris', lat: 48.8566, lon: 2.3522, prefix: '80.12.0.0/16', status: 'ANNOUNCED', peers: ['AS2856', 'AS680', 'AS37100', 'AS1273', 'AS24863'] },
  { id: 'AS1299', name: 'Arelion / Telia', city: 'Stockholm', lat: 59.3293, lon: 18.0686, prefix: '213.180.64.0/19', status: 'RPKI VALID', peers: ['AS2856', 'AS3257', 'AS680', 'AS2497'] },
  { id: 'AS1273', name: 'Vodafone Carrier', city: 'Madrid', lat: 40.4168, lon: -3.7038, prefix: '212.166.0.0/16', status: 'ESTABLISHED', peers: ['AS5511', 'AS3356', 'AS27699'] },
  { id: 'AS6730', name: 'Sunrise Telecom', city: 'Zurich', lat: 47.3769, lon: 8.5417, prefix: '194.230.0.0/16', status: 'ANNOUNCED', peers: ['AS680', 'AS5511'] },
  { id: 'AS5384', name: 'Emirates Integrated', city: 'Dubai', lat: 25.2048, lon: 55.2708, prefix: '94.200.0.0/15', status: 'RPKI VALID', peers: ['AS680', 'AS9498', 'AS6453', 'AS24863'] },

  // --- ASIA ---
  { id: 'AS9498', name: 'Bharti Airtel', city: 'New Delhi', lat: 28.6139, lon: 77.2090, prefix: '125.16.0.0/12', status: 'RPKI VALID', peers: ['AS680', 'AS6453', 'AS4657', 'AS5384', 'AS55836'] },
  { id: 'AS6453', name: 'Tata Communications', city: 'Mumbai', lat: 19.0760, lon: 72.8777, prefix: '180.144.0.0/14', status: 'ESTABLISHED', peers: ['AS9498', 'AS4657', 'AS2856', 'AS37100', 'AS5384', 'AS55836'] },
  { id: 'AS55836', name: 'Reliance Jio Infocomm', city: 'Bengaluru', lat: 12.9716, lon: 77.5946, prefix: '49.204.0.0/14', status: 'ESTABLISHED', peers: ['AS9498', 'AS6453', 'AS4657'] },
  { id: 'AS4657', name: 'StarHub / Singtel', city: 'Singapore', lat: 1.3521, lon: 103.8198, prefix: '103.24.0.0/22', status: 'ANNOUNCED', peers: ['AS9498', 'AS6453', 'AS2914', 'AS1221', 'AS2497'] },
  { id: 'AS2497', name: 'IIJ (Internet Initiative)', city: 'Tokyo', lat: 35.6762, lon: 139.6503, prefix: '202.232.0.0/16', status: 'ESTABLISHED', peers: ['AS15169', 'AS13335', 'AS2914', 'AS8075', 'AS2516', 'AS9264'] },
  { id: 'AS2516', name: 'KDDI Corporation', city: 'Osaka', lat: 34.6937, lon: 135.5023, prefix: '106.128.0.0/11', status: 'ESTABLISHED', peers: ['AS2497', 'AS2914', 'AS3462'] },
  { id: 'AS9264', name: 'KT Corporation', city: 'Seoul', lat: 37.5665, lon: 126.9780, prefix: '211.234.0.0/16', status: 'RPKI VALID', peers: ['AS2497', 'AS2914', 'AS15169'] },
  { id: 'AS2914', name: 'NTT Communications', city: 'Hong Kong', lat: 22.3193, lon: 114.1694, prefix: '129.250.0.0/16', status: 'ESTABLISHED', peers: ['AS2497', 'AS4657', 'AS3257', 'AS1221', 'AS36492', 'AS3462'] },
  { id: 'AS3462', name: 'Chunghwa Telecom', city: 'Taipei', lat: 25.0330, lon: 121.5654, prefix: '168.95.0.0/16', status: 'ANNOUNCED', peers: ['AS2914', 'AS2516', 'AS4657'] },

  // --- OCEANIA ---
  { id: 'AS1221', name: 'Telstra Global', city: 'Sydney', lat: -33.8688, lon: 151.2093, prefix: '139.130.0.0/16', status: 'ANNOUNCED', peers: ['AS4657', 'AS2914', 'AS27699', 'AS4826', 'AS9443'] },
  { id: 'AS4826', name: 'Vocus Group', city: 'Melbourne', lat: -37.8136, lon: 144.9631, prefix: '175.45.0.0/16', status: 'ESTABLISHED', peers: ['AS1221', 'AS4657'] },
  { id: 'AS9443', name: 'Spark New Zealand', city: 'Auckland', lat: -36.8485, lon: 174.7633, prefix: '122.56.0.0/14', status: 'ESTABLISHED', peers: ['AS1221', 'AS36492'] },

  // --- SOUTH AMERICA ---
  { id: 'AS27699', name: 'Telecom Italia Sparkle', city: 'São Paulo', lat: -23.5505, lon: -46.6333, prefix: '200.186.0.0/16', status: 'ESTABLISHED', peers: ['AS3356', 'AS1221', 'AS37100', 'AS16509', 'AS7303'] },
  { id: 'AS7303', name: 'Telecom Argentina', city: 'Buenos Aires', lat: -34.6037, lon: -58.3816, prefix: '190.224.0.0/13', status: 'ANNOUNCED', peers: ['AS27699', 'AS3356'] },
  { id: 'AS6428', name: 'GTD Teleductos', city: 'Santiago', lat: -33.4489, lon: -70.6693, prefix: '200.75.0.0/16', status: 'ESTABLISHED', peers: ['AS7303', 'AS27699'] },

  // --- AFRICA ---
  { id: 'AS37100', name: 'SEACOM Subsea Network', city: 'Johannesburg', lat: -26.2041, lon: 28.0473, prefix: '105.16.0.0/14', status: 'ANNOUNCED', peers: ['AS5511', 'AS6453', 'AS27699', 'AS36937'] },
  { id: 'AS36937', name: 'Safaricom Telecommunications', city: 'Nairobi', lat: -1.2921, lon: 36.8219, prefix: '197.248.0.0/15', status: 'RPKI VALID', peers: ['AS37100', 'AS6453', 'AS5384'] },
  { id: 'AS24863', name: 'Link Egypt Telecom', city: 'Cairo', lat: 30.0444, lon: 31.2357, prefix: '213.131.64.0/18', status: 'ESTABLISHED', peers: ['AS5511', 'AS5384', 'AS36937'] }
];
