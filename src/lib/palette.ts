export const PALETTE = {
  background: '#8a7a6a',
  floor: '#e8dcc0',
  wall: '#f2ece0',
  trim: '#a08560',
  furniture: '#7d8464',
  wood: '#9a6b4a',
  accent1: '#4fa8a0',
  accent2: '#e8a0a8',
  glass: '#7ec8d8',
  paper: '#f5f0e5',
} as const;

export type PaletteKey = keyof typeof PALETTE;
