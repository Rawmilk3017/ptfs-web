export type Aircraft = {
  callsign: string;
  playerName?: string;
  aircraftType?: string;
  heading?: number;
  altitude?: number;
  speed?: number;
  groundSpeed?: number;
  wind?: string;
  isOnGround?: boolean;
  isEmergencyOccuring?: boolean;
  position?: { x: number; y: number };
};

export type RadarResponse = {
  aircraft: Aircraft[];
  updatedAt: string | null;
  source: 'live' | 'demo' | 'offline';
  message?: string;
};

export type ControllerPosition = {
  holder: string | null;
  heldSince: number | null;
  claimable: boolean;
  airport: string;
  position: string;
  queue: string[];
};

export type AtisRecord = {
  airport: string;
  letter: string;
  content: string;
  lines?: string[];
  editor?: string | null;
};
