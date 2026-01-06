
import { ProfileType, ProfileStandard } from './types';

export const STANDARD_PROFILES: Record<ProfileType, ProfileStandard[]> = {
  [ProfileType.SQUARE_TUBE]: [
    { id: 't1', name: '50x50x3.0', dimensions: { b: 5, h: 5, t: 0.3 } },
    { id: 't2', name: '100x100x4.75', dimensions: { b: 10, h: 10, t: 0.475 } },
    { id: 't3', name: '150x150x6.35', dimensions: { b: 15, h: 15, t: 0.635 } },
  ],
  [ProfileType.ANGLE]: [
    { id: 'a1', name: '1" x 1/8"', dimensions: { b: 2.54, h: 2.54, t: 0.317 } },
    { id: 'a2', name: '2" x 1/4"', dimensions: { b: 5.08, h: 5.08, t: 0.635 } },
    { id: 'a3', name: '4" x 3/8"', dimensions: { b: 10.16, h: 10.16, t: 0.952 } },
  ],
  [ProfileType.U_CHANNEL]: [
    { id: 'u1', name: 'U 3" (6.10 kg/m)', dimensions: { h: 7.62, b: 3.58, tw: 0.43, tf: 0.69 } },
    { id: 'u2', name: 'U 6" (12.20 kg/m)', dimensions: { h: 15.24, b: 4.88, tw: 0.51, tf: 0.87 } },
    { id: 'u3', name: 'U 10" (22.80 kg/m)', dimensions: { h: 25.40, b: 6.60, tw: 0.61, tf: 1.11 } },
  ],
  [ProfileType.STIFFENED_U]: [
    { id: 'ue1', name: 'UE 75x40x15x2.25', dimensions: { h: 7.5, b: 4, d: 1.5, t: 0.225 } },
    { id: 'ue2', name: 'UE 100x50x17x2.65', dimensions: { h: 10, b: 5, d: 1.7, t: 0.265 } },
    { id: 'ue3', name: 'UE 150x60x20x3.00', dimensions: { h: 15, b: 6, d: 2.0, t: 0.3 } },
  ],
  [ProfileType.IW_BEAM]: [
    { id: 'iw1', name: 'W 150x13.0', dimensions: { h: 14.8, b: 10, tw: 0.43, tf: 0.49 } },
    { id: 'iw2', name: 'W 200x22.5', dimensions: { h: 20.6, b: 13.3, tw: 0.62, tf: 0.8 } },
    { id: 'iw3', name: 'W 310x32.7', dimensions: { h: 30.8, b: 10.2, tw: 0.66, tf: 1.08 } },
  ],
};

export function calculateProperties(type: ProfileType, dims: Record<string, number>) {
  let area = 0;
  let ix = 0;
  let iy = 0;

  switch (type) {
    case ProfileType.SQUARE_TUBE: {
      const { b, h, t } = dims;
      area = (b * h) - ((b - 2 * t) * (h - 2 * t));
      ix = (b * Math.pow(h, 3) - (b - 2 * t) * Math.pow(h - 2 * t, 3)) / 12;
      iy = (h * Math.pow(b, 3) - (h - 2 * t) * Math.pow(b - 2 * t, 3)) / 12;
      break;
    }
    case ProfileType.ANGLE: {
      const { b, h, t } = dims;
      area = (b * t) + ((h - t) * t);
      // Simplificado
      ix = (t * Math.pow(h, 3)) / 3 + (b * Math.pow(t, 3)) / 12; 
      iy = (t * Math.pow(b, 3)) / 3 + (h * Math.pow(t, 3)) / 12;
      break;
    }
    case ProfileType.IW_BEAM:
    case ProfileType.U_CHANNEL: {
      const { b, h, tw, tf } = dims;
      area = (2 * b * tf) + ((h - 2 * tf) * tw);
      ix = (b * Math.pow(h, 3) - (b - tw) * Math.pow(h - 2 * tf, 3)) / 12;
      iy = (2 * tf * Math.pow(b, 3) + (h - 2 * tf) * Math.pow(tw, 3)) / 12;
      break;
    }
    case ProfileType.STIFFENED_U: {
      const { b, h, d, t } = dims;
      area = (h * t) + (2 * b * t) + (2 * d * t);
      // Aproximação linear para inércia
      ix = (t * Math.pow(h, 3)) / 12 + 2 * (b * t * Math.pow(h / 2, 2)) + 2 * (t * Math.pow(d, 3) / 12 + d * t * Math.pow(h / 2 - d / 2, 2));
      iy = (h * Math.pow(t, 3)) / 12 + 2 * (t * Math.pow(b, 3) / 12 + b * t * Math.pow(b / 2, 2)) + 2 * (d * t * Math.pow(b, 2));
      break;
    }
  }

  const rmin = Math.sqrt(Math.min(ix, iy) / area);
  return { ix, rmin, area };
}
