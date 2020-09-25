/* Pipe imports */
import { RoundPipe } from './round';


describe('Pipe: Round', () => {
  let roundPipe: RoundPipe;

  beforeEach(() => {
    roundPipe = new RoundPipe();
  });

  test('should round input value', () => {
    expect(roundPipe.transform('5.15')).toEqual(5);
  });

  test('should handle an error when rounding', () => {
    expect(roundPipe.transform('a')).toMatch('a');
  });

});
