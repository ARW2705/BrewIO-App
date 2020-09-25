/* ABV, IBU, SRM conversions */
export const ABV_FACTORS:      number[] = [76.08, 1.775, 0.794]; // advanced ABV calculation
export const BIGNESS_FACTOR:   number   = 1.65;
export const BIGNESS_BASE:     number   = 0.000125;
export const BOIL_TIME_FACTOR: number   = 4.15;
export const BOIL_TIME_EXP:    number   = -0.04;
export const IBU_FACTOR:       number   = 74.9;
export const SRM_FACTOR:       number   = 1.4922;
export const SRM_EXP:          number   = 0.6859;

/* Weight conversions */
// Kilogram <-> Pound
// Gram <-> Ounce
export const KG_TO_LB: number = 2.204623;
export const LB_TO_KG: number = 0.453592;
export const G_TO_OZ : number = 0.035274;
export const OZ_TO_G : number = 28.349523;

/* Volume conversions */
// Liter <-> Gallon
// Milliliter <-> Fluid Ounce
export const L_TO_GAL: number = 0.264172;
export const GAL_TO_L: number = 3.785412;
export const ML_TO_FL: number = 0.033814;
export const FL_TO_ML: number = 29.57353;

/* Density conversions */
// Plato <-> Specific Gravity
export const PLATO_TO_SG: number[] = [258.6, 227.1, 258.2];
export const SG_TO_PLATO: number[] = [135.997, 630.272, 1111.14, 616.868];
