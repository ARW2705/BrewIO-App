/* Pipe imports */
import { TruncatePipe } from './truncate';


describe('Pipe: Truncate', () => {

  test('should truncate number to n places', () => {
    const truncatePipe: TruncatePipe = new TruncatePipe();
    expect(truncatePipe.transform(1.2345, 3)).toMatch('1.234');
    expect(truncatePipe.transform(1, 4)).toMatch('1.0000');
  });

});
