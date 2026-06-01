/**
 * Airline lookup from ICAO callsign prefixes.
 * Maps 3-letter ICAO designator → airline name.
 * Covers major global carriers commonly seen in ADS-B data.
 */

const AIRLINE_MAP = {
  // India
  IGO: 'IndiGo',
  AIC: 'Air India',
  AIQ: 'Air India Express',
  SEJ: 'SpiceJet',
  VTG: 'Vistara',
  AKJ: 'Akasa Air',
  RBA: 'Royal Brunei',

  // Middle East
  UAE: 'Emirates',
  ETD: 'Etihad Airways',
  QTR: 'Qatar Airways',
  SVR: 'Saudia',
  FDX: 'Flydubai',
  ADH: 'Air Arabia',
  KAC: 'Kuwait Airways',
  GFA: 'Gulf Air',
  OMA: 'Oman Air',
  RJZ: 'Royal Jordanian',
  MEA: 'Middle East Airlines',
  THY: 'Turkish Airlines',

  // Europe
  BAW: 'British Airways',
  VIR: 'Virgin Atlantic',
  EZY: 'easyJet',
  RYR: 'Ryanair',
  DLH: 'Lufthansa',
  AFM: 'Air France',
  AFR: 'Air France',
  KLM: 'KLM',
  SWR: 'Swiss International',
  AUA: 'Austrian Airlines',
  IBE: 'Iberia',
  TAP: 'TAP Air Portugal',
  SAS: 'Scandinavian Airlines',
  FIN: 'Finnair',
  LOT: 'LOT Polish Airlines',
  CSA: 'Czech Airlines',
  ALK: 'Aer Lingus',
  EIN: 'Aer Lingus',
  TOM: 'TUI Airways',
  TRA: 'Transavia',
  VLG: 'Vueling',
  WZZ: 'Wizz Air',
  NAX: 'Norwegian Air Shuttle',
  NOZ: 'Norwegian Air Shuttle',

  // Asia
  SIA: 'Singapore Airlines',
  SQP: 'Singapore Airlines Cargo',
  CPA: 'Cathay Pacific',
  ANA: 'All Nippon Airways',
  JAL: 'Japan Airlines',
  KAL: 'Korean Air',
  AAR: 'Asiana Airlines',
  CCA: 'Air China',
  CES: 'China Eastern',
  CSN: 'China Southern',
  CHH: 'Hainan Airlines',
  EVA: 'EVA Air',
  CAL: 'China Airlines',
  THA: 'Thai Airways',
  MAS: 'Malaysia Airlines',
  AXM: 'AirAsia',
  XAX: 'AirAsia X',
  PAL: 'Philippine Airlines',
  AVA: 'Avianca',
  GAU: 'Garuda Indonesia',
  LAN: 'LATAM Airlines',
  LPE: 'LATAM Peru',
  VOI: 'Volaris',

  // North America
  AAL: 'American Airlines',
  DAL: 'Delta Air Lines',
  UAL: 'United Airlines',
  SWA: 'Southwest Airlines',
  ACA: 'Air Canada',
  WJA: 'WestJet',
  JBU: 'JetBlue Airways',
  ASA: 'Alaska Airlines',
  SKW: 'SkyWest Airlines',
  EDV: 'Endeavor Air',
  RPA: 'Republic Airways',
  ENY: 'Envoy Air',
  PSA: 'PSA Airlines',
  MESA: 'Mesa Airlines',
  FFT: 'Frontier Airlines',
  SPR: 'Spirit Airlines',
  HAL: 'Hawaiian Airlines',

  // Oceania
  QFA: 'Qantas',
  JST: 'Jetstar Airways',
  VOZ: 'Virgin Australia',
  ANZ: 'Air New Zealand',

  // Africa
  SAA: 'South African Airways',
  ETH: 'Ethiopian Airlines',
  EGY: 'EgyptAir',
  KEN: 'Kenya Airways',
  RWD: 'RwandAir',

  // Cargo
  FDX: 'FedEx Express',
  UPS: 'UPS Airlines',
  DHL: 'DHL Aviation',
  CLX: 'Cargolux',
  GTI: 'Atlas Air',
  ABX: 'ABX Air',
};

/**
 * Extract airline name from callsign.
 * Callsigns are typically 3-letter ICAO prefix + flight number (e.g., "UAE203").
 */
export function getAirlineFromCallsign(callsign) {
  if (!callsign || typeof callsign !== 'string') return null;
  const prefix = callsign.trim().substring(0, 3).toUpperCase();
  return AIRLINE_MAP[prefix] || null;
}

/**
 * Full airline catalog for watchlist (always available, not derived from live data).
 */
export const ALL_AIRLINES = [...new Set(Object.values(AIRLINE_MAP))].sort();

/**
 * Full aircraft type catalog for watchlist (always available).
 */
const AIRCRAFT_TYPE_CATALOG = {
  A388: 'Airbus A380-800',
  A359: 'Airbus A350-900',
  A35K: 'Airbus A350-1000',
  A339: 'Airbus A330-900neo',
  A333: 'Airbus A330-300',
  A332: 'Airbus A330-200',
  A321: 'Airbus A321',
  A21N: 'Airbus A321neo',
  A320: 'Airbus A320',
  A20N: 'Airbus A320neo',
  A319: 'Airbus A319',
  A19N: 'Airbus A319neo',
  B77W: 'Boeing 777-300ER',
  B77L: 'Boeing 777-200LR',
  B773: 'Boeing 777-300',
  B772: 'Boeing 777-200',
  B789: 'Boeing 787-9',
  B78X: 'Boeing 787-10',
  B788: 'Boeing 787-8',
  B748: 'Boeing 747-8',
  B744: 'Boeing 747-400',
  B738: 'Boeing 737-800',
  B739: 'Boeing 737-900',
  B38M: 'Boeing 737 MAX 8',
  B39M: 'Boeing 737 MAX 9',
  B763: 'Boeing 767-300',
  B752: 'Boeing 757-200',
  E190: 'Embraer E190',
  E195: 'Embraer E195',
  E175: 'Embraer E175',
  CRJ9: 'Bombardier CRJ-900',
  CRJ7: 'Bombardier CRJ-700',
  DH8D: 'De Havilland Dash 8-Q400',
  AT76: 'ATR 72-600',
  AT75: 'ATR 72-500',
};

export const ALL_AIRCRAFT_TYPES = Object.entries(AIRCRAFT_TYPE_CATALOG)
  .map(([code, label]) => ({ code, label }))
  .sort((a, b) => a.label.localeCompare(b.label));

/**
 * Friendly label for aircraft type codes.
 */
export function getAircraftTypeLabel(code) {
  if (!code) return 'Unknown';
  return AIRCRAFT_TYPE_CATALOG[code] || code;
}
