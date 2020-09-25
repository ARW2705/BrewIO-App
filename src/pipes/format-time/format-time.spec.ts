/* Pipe imports */
import { FormatTimePipe } from './format-time';


describe('Pipe: FormatTime', () => {
  let formatPipe: FormatTimePipe;

  beforeEach(() => {
    formatPipe = new FormatTimePipe();
  });

  test('should transform time based on type', () => {
    formatPipe.formatDuration = jest
      .fn()
      .mockReturnValue('Duration: 1 hour');

    expect(formatPipe.transform('60', 'duration')).toMatch('Duration: 1 hour');
    expect(formatPipe.transform('60', 'other')).toMatch('60');
  }); // end 'should transform time based on type' test

  test('should format duration to string', () => {
    expect(formatPipe.formatDuration(50)).toMatch('50 minutes');
    expect(formatPipe.formatDuration(60)).toMatch('1 hour');
    expect(formatPipe.formatDuration(61)).toMatch('1 hour 1 minute');
    expect(formatPipe.formatDuration(122)).toMatch('2 hours 2 minutes');
  }); // end 'should format duration to string' test

});
