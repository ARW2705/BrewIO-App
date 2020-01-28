export const mockNestedObject = () => {
  const mock: object = {
    _id: 0,
    a: 1,
    b: {
      c: 2,
      d: 3,
      e: {
        f: 4
      }
    },
    g: [
      {
        h: 5
      },
      {
        i: 6
      }
    ]
  };
  return mock;
};
