export interface Unit {
  system: string;
  longName: string;
  shortName: string;
  symbol?: string;
};

export interface SelectedUnits {
  system: string;
  weightSmall: Unit;
  weightLarge: Unit;
  volumeSmall: Unit;
  volumeLarge: Unit;
  temperature: Unit;
  density: Unit;
};
