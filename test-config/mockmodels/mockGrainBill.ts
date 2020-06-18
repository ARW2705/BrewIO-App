import { GrainBill } from '../../src/shared/interfaces/grain-bill';

export const mockGrainBill = () => {
  const mock: Array<GrainBill> = [
    {
      _id: '1',
      cid: '1234567890123',
      grainType: {
        _id: "5ca285e8f7e5f91a1f31d776",
        name: "Pale Malt 2-row",
        lovibond: 1.8,
        gravity: 1.038,
        description: "Smooth, less grainy, moderate malt flavor. Basic malt for all beer styles.",
        createdAt: "2019-04-01T21:43:04.357Z",
        updatedAt: "2019-04-01T21:43:04.357Z"
      },
      quantity: 10,
      mill: 1,
      notes: []
    },
    {
      _id: '2',
      cid: '1234567890124',
      grainType: {
        _id: "5ca285e8f7e5f91a1f31d775",
        name: "Munich Malt",
        lovibond: 10,
        gravity: 1.034,
        description: "Sweet, toasted flavor and aroma. For Oktoberfests and malty styles.",
        createdAt: "2019-04-01T21:43:04.357Z",
        updatedAt: "2019-04-01T21:43:04.357Z"
      },
      quantity: 2,
      mill: 1,
      notes: []
    },
    {
      _id: '3',
      cid: '1234567890125',
      grainType: {
        _id: "5ca285e8f7e5f91a1f31d76b",
        name: "US Chocolate Malt",
        lovibond: 350,
        gravity: 1.034,
        description: "Use in all types to adjust color and add nutty, toasted flavor. Chocolate flavor.",
        createdAt: "2019-04-01T21:43:04.356Z",
        updatedAt: "2019-04-01T21:43:04.356Z"
      },
      quantity: 0.5,
      mill: 1,
      notes: []
    }
  ];
  return mock;
};
