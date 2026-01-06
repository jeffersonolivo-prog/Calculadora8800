
export enum ModuleType {
  BEAM = 'viga',
  COLUMN = 'coluna'
}

export enum SupportCondition {
  FIXED_FIXED = 0.5,
  FIXED_PINNED = 0.7,
  PINNED_PINNED = 1.0,
  FIXED_FREE = 2.0
}

export enum ProfileType {
  SQUARE_TUBE = 'tubo_quadrado',
  ANGLE = 'cantoneira',
  U_CHANNEL = 'perfil_u',
  STIFFENED_U = 'perfil_u_enrijecido',
  IW_BEAM = 'perfil_iw'
}

export interface ProfileStandard {
  id: string;
  name: string;
  dimensions: Record<string, number>;
}

export interface CalculationResult {
  isApproved: boolean;
  value: number;
  limit: number;
  message: string;
  recommendation?: string;
}
