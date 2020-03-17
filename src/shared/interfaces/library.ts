export interface Style {
  _id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  description: string;
  originalGravity: Array<number>;
  finalGravity: Array<number>;
  IBU: Array<number>;
  SRM: Array<number>;
  co2Volume: Array<number>;
};

export interface Grains {
  _id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  lovibond: number;
  gravity: number;
  description: string;
};

export interface Hops {
  _id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  alphaAcid: number;
  type: string;
  description: string;
  usedFor: Array<Style>;
  alternatives: Array<Hops>;
};

export interface HopsRefs {
  name: string;
  usedFor: Array<string>;
  alternatives: Array<string>;
};

export interface Yeast {
  _id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  brand: string;
  form: string;
  description: string;
  attenuation: Array<number>;
  flocculation: string;
  optimumTemperature: Array<number>;
  alcoholTolerance: Array<number>;
  recommendedStyles: Array<Style>;
};

export interface YeastRefs {
  name: string;
  styles: Array<string>;
};

export interface LibraryCache {
  grains: Array<Grains>;
  hops: Array<Hops>;
  yeast: Array<Yeast>;
  style: Array<Style>;
};
