/**
 * Predefined sticker slot positions per weapon.
 * UV coordinates matching official CS2 Valve models.
 * Most weapons have 4 slots; some have 5.
 *
 * Slot naming follows CS2 convention:
 *   Slot 1: Front body / barrel area
 *   Slot 2: Mid body
 *   Slot 3: Rear body / grip area
 *   Slot 4: Stock / back
 *   Slot 5: Extra (magazine, suppressor, etc.)
 */

export interface StickerSlotDef {
  name: string;
  uvX: number;
  uvY: number;
  rotation: number; // radians
}

// Default 4-slot layout for weapons without specific definitions
const DEFAULT_SLOTS: StickerSlotDef[] = [
  { name: "Slot 1", uvX: 0.25, uvY: 0.5, rotation: 0 },
  { name: "Slot 2", uvX: 0.45, uvY: 0.5, rotation: 0 },
  { name: "Slot 3", uvX: 0.65, uvY: 0.5, rotation: 0 },
  { name: "Slot 4", uvX: 0.85, uvY: 0.5, rotation: 0 },
];

const WEAPON_STICKER_SLOTS: Record<string, StickerSlotDef[]> = {
  // Rifles
  ak47: [
    { name: "Barrel", uvX: 0.18, uvY: 0.42, rotation: 0 },
    { name: "Body", uvX: 0.38, uvY: 0.42, rotation: 0 },
    { name: "Rear", uvX: 0.58, uvY: 0.42, rotation: 0 },
    { name: "Stock", uvX: 0.78, uvY: 0.42, rotation: 0 },
  ],
  m4a4: [
    { name: "Barrel", uvX: 0.15, uvY: 0.45, rotation: 0 },
    { name: "Body", uvX: 0.35, uvY: 0.45, rotation: 0 },
    { name: "Rear", uvX: 0.55, uvY: 0.45, rotation: 0 },
    { name: "Stock", uvX: 0.75, uvY: 0.45, rotation: 0 },
  ],
  m4a1_silencer: [
    { name: "Suppressor", uvX: 0.12, uvY: 0.45, rotation: 0 },
    { name: "Barrel", uvX: 0.28, uvY: 0.45, rotation: 0 },
    { name: "Body", uvX: 0.48, uvY: 0.45, rotation: 0 },
    { name: "Rear", uvX: 0.65, uvY: 0.45, rotation: 0 },
    { name: "Stock", uvX: 0.82, uvY: 0.45, rotation: 0 },
  ],
  aug: [
    { name: "Barrel", uvX: 0.18, uvY: 0.45, rotation: 0 },
    { name: "Body", uvX: 0.38, uvY: 0.45, rotation: 0 },
    { name: "Rear", uvX: 0.58, uvY: 0.45, rotation: 0 },
    { name: "Stock", uvX: 0.78, uvY: 0.45, rotation: 0 },
  ],
  sg556: [
    { name: "Barrel", uvX: 0.18, uvY: 0.45, rotation: 0 },
    { name: "Body", uvX: 0.38, uvY: 0.45, rotation: 0 },
    { name: "Rear", uvX: 0.58, uvY: 0.45, rotation: 0 },
    { name: "Stock", uvX: 0.78, uvY: 0.45, rotation: 0 },
  ],
  famas: [
    { name: "Barrel", uvX: 0.15, uvY: 0.45, rotation: 0 },
    { name: "Front", uvX: 0.30, uvY: 0.45, rotation: 0 },
    { name: "Body", uvX: 0.48, uvY: 0.45, rotation: 0 },
    { name: "Rear", uvX: 0.65, uvY: 0.45, rotation: 0 },
    { name: "Stock", uvX: 0.82, uvY: 0.45, rotation: 0 },
  ],
  galilar: [
    { name: "Barrel", uvX: 0.18, uvY: 0.45, rotation: 0 },
    { name: "Body", uvX: 0.38, uvY: 0.45, rotation: 0 },
    { name: "Rear", uvX: 0.58, uvY: 0.45, rotation: 0 },
    { name: "Stock", uvX: 0.78, uvY: 0.45, rotation: 0 },
  ],

  // Snipers
  awp: [
    { name: "Barrel", uvX: 0.15, uvY: 0.42, rotation: 0 },
    { name: "Scope", uvX: 0.35, uvY: 0.42, rotation: 0 },
    { name: "Body", uvX: 0.55, uvY: 0.42, rotation: 0 },
    { name: "Stock", uvX: 0.78, uvY: 0.42, rotation: 0 },
  ],
  ssg08: [
    { name: "Barrel", uvX: 0.18, uvY: 0.45, rotation: 0 },
    { name: "Body", uvX: 0.38, uvY: 0.45, rotation: 0 },
    { name: "Rear", uvX: 0.58, uvY: 0.45, rotation: 0 },
    { name: "Stock", uvX: 0.78, uvY: 0.45, rotation: 0 },
  ],
  scar20: [
    { name: "Barrel", uvX: 0.18, uvY: 0.45, rotation: 0 },
    { name: "Body", uvX: 0.38, uvY: 0.45, rotation: 0 },
    { name: "Rear", uvX: 0.58, uvY: 0.45, rotation: 0 },
    { name: "Stock", uvX: 0.78, uvY: 0.45, rotation: 0 },
  ],
  g3sg1: [
    { name: "Barrel", uvX: 0.18, uvY: 0.45, rotation: 0 },
    { name: "Body", uvX: 0.38, uvY: 0.45, rotation: 0 },
    { name: "Rear", uvX: 0.58, uvY: 0.45, rotation: 0 },
    { name: "Stock", uvX: 0.78, uvY: 0.45, rotation: 0 },
  ],

  // SMGs
  p90: [
    { name: "Front", uvX: 0.15, uvY: 0.45, rotation: 0 },
    { name: "Top", uvX: 0.32, uvY: 0.35, rotation: 0 },
    { name: "Body", uvX: 0.50, uvY: 0.45, rotation: 0 },
    { name: "Rear", uvX: 0.68, uvY: 0.45, rotation: 0 },
    { name: "Stock", uvX: 0.82, uvY: 0.45, rotation: 0 },
  ],
  mp7: [
    { name: "Front", uvX: 0.15, uvY: 0.45, rotation: 0 },
    { name: "Body", uvX: 0.35, uvY: 0.45, rotation: 0 },
    { name: "Grip", uvX: 0.55, uvY: 0.45, rotation: 0 },
    { name: "Rear", uvX: 0.72, uvY: 0.45, rotation: 0 },
    { name: "Stock", uvX: 0.85, uvY: 0.45, rotation: 0 },
  ],
  mp9: [
    { name: "Front", uvX: 0.20, uvY: 0.45, rotation: 0 },
    { name: "Body", uvX: 0.40, uvY: 0.45, rotation: 0 },
    { name: "Rear", uvX: 0.60, uvY: 0.45, rotation: 0 },
    { name: "Stock", uvX: 0.80, uvY: 0.45, rotation: 0 },
  ],
  mp5sd: [
    { name: "Suppressor", uvX: 0.10, uvY: 0.45, rotation: 0 },
    { name: "Front", uvX: 0.25, uvY: 0.45, rotation: 0 },
    { name: "Body", uvX: 0.42, uvY: 0.45, rotation: 0 },
    { name: "Rear", uvX: 0.60, uvY: 0.45, rotation: 0 },
    { name: "Stock", uvX: 0.78, uvY: 0.45, rotation: 0 },
    { name: "Grip", uvX: 0.90, uvY: 0.45, rotation: 0 },
  ],
  mac10: [
    { name: "Front", uvX: 0.20, uvY: 0.45, rotation: 0 },
    { name: "Body", uvX: 0.40, uvY: 0.45, rotation: 0 },
    { name: "Rear", uvX: 0.60, uvY: 0.45, rotation: 0 },
    { name: "Stock", uvX: 0.80, uvY: 0.45, rotation: 0 },
  ],
  ump45: [
    { name: "Front", uvX: 0.20, uvY: 0.45, rotation: 0 },
    { name: "Body", uvX: 0.40, uvY: 0.45, rotation: 0 },
    { name: "Rear", uvX: 0.60, uvY: 0.45, rotation: 0 },
    { name: "Stock", uvX: 0.80, uvY: 0.45, rotation: 0 },
  ],
  bizon: [
    { name: "Front", uvX: 0.20, uvY: 0.45, rotation: 0 },
    { name: "Body", uvX: 0.40, uvY: 0.45, rotation: 0 },
    { name: "Rear", uvX: 0.60, uvY: 0.45, rotation: 0 },
    { name: "Stock", uvX: 0.80, uvY: 0.45, rotation: 0 },
  ],

  // Pistols
  glock18: [
    { name: "Barrel", uvX: 0.20, uvY: 0.48, rotation: 0 },
    { name: "Slide", uvX: 0.40, uvY: 0.48, rotation: 0 },
    { name: "Grip", uvX: 0.60, uvY: 0.48, rotation: 0 },
    { name: "Rear", uvX: 0.80, uvY: 0.48, rotation: 0 },
  ],
  usp_silencer: [
    { name: "Suppressor", uvX: 0.12, uvY: 0.48, rotation: 0 },
    { name: "Barrel", uvX: 0.28, uvY: 0.48, rotation: 0 },
    { name: "Slide", uvX: 0.48, uvY: 0.48, rotation: 0 },
    { name: "Grip", uvX: 0.65, uvY: 0.48, rotation: 0 },
    { name: "Rear", uvX: 0.82, uvY: 0.48, rotation: 0 },
  ],
  hkp2000: [
    { name: "Barrel", uvX: 0.20, uvY: 0.48, rotation: 0 },
    { name: "Slide", uvX: 0.40, uvY: 0.48, rotation: 0 },
    { name: "Grip", uvX: 0.60, uvY: 0.48, rotation: 0 },
    { name: "Rear", uvX: 0.80, uvY: 0.48, rotation: 0 },
  ],
  p250: [
    { name: "Barrel", uvX: 0.20, uvY: 0.48, rotation: 0 },
    { name: "Slide", uvX: 0.40, uvY: 0.48, rotation: 0 },
    { name: "Grip", uvX: 0.60, uvY: 0.48, rotation: 0 },
    { name: "Rear", uvX: 0.80, uvY: 0.48, rotation: 0 },
  ],
  fiveseven: [
    { name: "Barrel", uvX: 0.20, uvY: 0.48, rotation: 0 },
    { name: "Slide", uvX: 0.40, uvY: 0.48, rotation: 0 },
    { name: "Grip", uvX: 0.60, uvY: 0.48, rotation: 0 },
    { name: "Rear", uvX: 0.80, uvY: 0.48, rotation: 0 },
  ],
  deagle: [
    { name: "Barrel", uvX: 0.20, uvY: 0.48, rotation: 0 },
    { name: "Slide", uvX: 0.40, uvY: 0.48, rotation: 0 },
    { name: "Grip", uvX: 0.60, uvY: 0.48, rotation: 0 },
    { name: "Rear", uvX: 0.80, uvY: 0.48, rotation: 0 },
  ],
  elite: [
    { name: "Barrel", uvX: 0.20, uvY: 0.48, rotation: 0 },
    { name: "Slide", uvX: 0.40, uvY: 0.48, rotation: 0 },
    { name: "Grip", uvX: 0.60, uvY: 0.48, rotation: 0 },
    { name: "Rear", uvX: 0.80, uvY: 0.48, rotation: 0 },
  ],
  tec9: [
    { name: "Barrel", uvX: 0.20, uvY: 0.48, rotation: 0 },
    { name: "Body", uvX: 0.40, uvY: 0.48, rotation: 0 },
    { name: "Grip", uvX: 0.60, uvY: 0.48, rotation: 0 },
    { name: "Rear", uvX: 0.80, uvY: 0.48, rotation: 0 },
  ],
  cz75a: [
    { name: "Barrel", uvX: 0.20, uvY: 0.48, rotation: 0 },
    { name: "Slide", uvX: 0.40, uvY: 0.48, rotation: 0 },
    { name: "Grip", uvX: 0.60, uvY: 0.48, rotation: 0 },
    { name: "Rear", uvX: 0.80, uvY: 0.48, rotation: 0 },
  ],
  revolver: [
    { name: "Barrel", uvX: 0.20, uvY: 0.48, rotation: 0 },
    { name: "Body", uvX: 0.40, uvY: 0.48, rotation: 0 },
    { name: "Grip", uvX: 0.60, uvY: 0.48, rotation: 0 },
    { name: "Rear", uvX: 0.80, uvY: 0.48, rotation: 0 },
  ],

  // Heavy
  nova: [
    { name: "Barrel", uvX: 0.15, uvY: 0.45, rotation: 0 },
    { name: "Front", uvX: 0.30, uvY: 0.45, rotation: 0 },
    { name: "Body", uvX: 0.48, uvY: 0.45, rotation: 0 },
    { name: "Rear", uvX: 0.65, uvY: 0.45, rotation: 0 },
    { name: "Stock", uvX: 0.82, uvY: 0.45, rotation: 0 },
  ],
  mag7: [
    { name: "Barrel", uvX: 0.20, uvY: 0.45, rotation: 0 },
    { name: "Body", uvX: 0.40, uvY: 0.45, rotation: 0 },
    { name: "Rear", uvX: 0.60, uvY: 0.45, rotation: 0 },
    { name: "Stock", uvX: 0.80, uvY: 0.45, rotation: 0 },
  ],
  sawedoff: [
    { name: "Barrel", uvX: 0.20, uvY: 0.45, rotation: 0 },
    { name: "Body", uvX: 0.40, uvY: 0.45, rotation: 0 },
    { name: "Rear", uvX: 0.60, uvY: 0.45, rotation: 0 },
    { name: "Grip", uvX: 0.80, uvY: 0.45, rotation: 0 },
  ],
  xm1014: [
    { name: "Barrel", uvX: 0.18, uvY: 0.45, rotation: 0 },
    { name: "Body", uvX: 0.38, uvY: 0.45, rotation: 0 },
    { name: "Rear", uvX: 0.58, uvY: 0.45, rotation: 0 },
    { name: "Stock", uvX: 0.78, uvY: 0.45, rotation: 0 },
  ],
  m249: [
    { name: "Barrel", uvX: 0.18, uvY: 0.45, rotation: 0 },
    { name: "Body", uvX: 0.38, uvY: 0.45, rotation: 0 },
    { name: "Rear", uvX: 0.58, uvY: 0.45, rotation: 0 },
    { name: "Stock", uvX: 0.78, uvY: 0.45, rotation: 0 },
  ],
  negev: [
    { name: "Barrel", uvX: 0.18, uvY: 0.45, rotation: 0 },
    { name: "Body", uvX: 0.38, uvY: 0.45, rotation: 0 },
    { name: "Rear", uvX: 0.58, uvY: 0.45, rotation: 0 },
    { name: "Stock", uvX: 0.78, uvY: 0.45, rotation: 0 },
  ],

  // Other
  taser: [
    { name: "Front", uvX: 0.25, uvY: 0.50, rotation: 0 },
    { name: "Body", uvX: 0.50, uvY: 0.50, rotation: 0 },
    { name: "Rear", uvX: 0.75, uvY: 0.50, rotation: 0 },
  ],
};

/** Get sticker slot positions for a weapon. Falls back to default 4-slot layout. */
export function getStickerSlots(weaponId: string): StickerSlotDef[] {
  return WEAPON_STICKER_SLOTS[weaponId] ?? DEFAULT_SLOTS;
}
