import { StockType } from '../interfaces/stocktype';

export const STOCK_TYPES: StockType[] = [
  { isDiscreteUnit: true , name: 'Standard Bottle' },
  { isDiscreteUnit: true , name: 'Large Bottle'    },
  { isDiscreteUnit: true , name: 'Standard Can'    },
  { isDiscreteUnit: true , name: 'Large Can'       },
  { isDiscreteUnit: true , name: 'Crowler'         },
  { isDiscreteUnit: false, name: 'Growler'         },
  { isDiscreteUnit: false, name: 'Keg'             }
];
