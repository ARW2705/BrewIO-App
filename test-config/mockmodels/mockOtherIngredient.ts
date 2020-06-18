import { OtherIngredients } from '../../src/shared/interfaces/other-ingredients';

export const mockOtherIngredient = () => {
  const mock: Array<OtherIngredients> = [
    {
      _id: '1',
      cid: '1234567890123',
      name: 'other1',
      type: 'flavor',
      description: 'other1 description',
      quantity: 1,
      units: 'unit1'
    },
    {
      _id: '2',
      cid: '1234567890124',
      name: 'other2',
      type: 'water treatment',
      description: 'makes water better',
      quantity: 0.3,
      units: 'unit2'
    }
  ];
  return mock;
};
