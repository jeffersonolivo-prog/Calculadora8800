
import { ProfileType, ProfileStandard } from './types';

export const STANDARD_PROFILES: Record<ProfileType, ProfileStandard[]> = {
  [ProfileType.SQUARE_TUBE]: [
    { id: 't1', name: '50x50x3.0', dimensions: { b: 50, h: 50, t: 3.0 } },
    { id: 't2', name: '100x100x4.75', dimensions: { b: 100, h: 100, t: 4.75 } },
    { id: 't3', name: '150x150x6.35', dimensions: { b: 150, h: 150, t: 6.35 } },
  ],
  [ProfileType.ANGLE]: [
    { id: 'a1', name: '1" x 1/8"', dimensions: { b: 25.4, h: 25.4, t: 3.17 } },
    { id: 'a2', name: '2" x 1/4"', dimensions: { b: 50.8, h: 50.8, t: 6.35 } },
    { id: 'a3', name: '4" x 3/8"', dimensions: { b: 101.6, h: 101.6, t: 9.52 } },
  ],
  [ProfileType.U_CHANNEL]: [
    { id: 'u1', name: 'U 3" (6.10 kg/m)', dimensions: { h: 76.2, b: 35.8, tw: 4.3, tf: 6.9 } },
    { id: 'u2', name: 'U 6" (12.20 kg/m)', dimensions: { h: 152.4, b: 48.8, tw: 5.1, tf: 8.7 } },
    { id: 'u3', name: 'U 10" (22.80 kg/m)', dimensions: { h: 254.0, b: 66.0, tw: 6.1, tf: 11.1 } },
  ],
  [ProfileType.STIFFENED_U]: [
    { id: 'ue1', name: 'UE 75x40x15x2.25', dimensions: { h: 75, b: 40, d: 15, t: 2.25 } },
    { id: 'ue2', name: 'UE 100x50x17x2.65', dimensions: { h: 100, b: 50, d: 17, t: 2.65 } },
    { id: 'ue3', name: 'UE 150x60x20x3.00', dimensions: { h: 150, b: 60, d: 20, t: 3.0 } },
  ],
  [ProfileType.IW_BEAM]: [
    { id: 'iw1', name: 'W 150x13.0', dimensions: { h: 148, b: 100, tw: 4.3, tf: 4.9 } },
    { id: 'iw2', name: 'W 200x22.5', dimensions: { h: 206, b: 133, tw: 6.2, tf: 8.0 } },
    { id: 'iw3', name: 'W 310x32.7', dimensions: { h: 308, b: 102, tw: 6.6, tf: 10.8 } },
  ],
};

export function calculateProperties(type: ProfileType, dims: Record<string, number>) {
  // Converte todas as dimensões de mm para cm para manter a saída de inércia em cm4
  const d: Record<string, number> = {};
  for (const key in dims) {
    d[key] = dims[key] / 10;
  }

  let area = 0;
  let ix = 0;
  let iy = 0;

  switch (type) {
    case ProfileType.SQUARE_TUBE: {
      const { b, h, t } = d;
      area = (b * h) - ((b - 2 * t) * (h - 2 * t));
      ix = (b * Math.pow(h, 3) - (b - 2 * t) * Math.pow(h - 2 * t, 3)) / 12;
      iy = (h * Math.pow(b, 3) - (h - 2 * t) * Math.pow(b - 2 * t, 3)) / 12;
      break;
    }
    case ProfileType.ANGLE: {
      const { b, h, t } = d;
      area = (b * t) + ((h - t) * t);
      // Simplificado (aproximação para inércia de abas iguais/desiguais)
      ix = (t * Math.pow(h, 3)) / 3 + (b * Math.pow(t, 3)) / 12; 
      iy = (t * Math.pow(b, 3)) / 3 + (h * Math.pow(t, 3)) / 12;
      break;
    }
    case ProfileType.IW_BEAM:
    case ProfileType.U_CHANNEL: {
      const { b, h, tw, tf } = d;
      area = (2 * b * tf) + ((h - 2 * tf) * tw);
      ix = (b * Math.pow(h, 3) - (b - tw) * Math.pow(h - 2 * tf, 3)) / 12;
      iy = (2 * tf * Math.pow(b, 3) + (h - 2 * tf) * Math.pow(tw, 3)) / 12;
      break;
    }
    case ProfileType.STIFFENED_U: {
      const { b, h, d: stiff, t } = d;
      area = (h * t) + (2 * b * t) + (2 * stiff * t);
      // Aproximação linear para inércia
      ix = (t * Math.pow(h, 3)) / 12 + 2 * (b * t * Math.pow(h / 2, 2)) + 2 * (t * Math.pow(stiff, 3) / 12 + stiff * t * Math.pow(h / 2 - stiff / 2, 2));
      iy = (h * Math.pow(t, 3)) / 12 + 2 * (t * Math.pow(b, 3) / 12 + b * t * Math.pow(b / 2, 2)) + 2 * (stiff * t * Math.pow(b, 2));
      break;
    }
  }

  const rmin = Math.sqrt(Math.min(ix, iy) / area);
  return { ix, rmin, area };
}
