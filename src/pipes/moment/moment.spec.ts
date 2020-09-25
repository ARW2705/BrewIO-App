/* Module imports */
import * as moment from 'moment';

/* Pipe imports */
import { MomentPipe } from './moment';


describe('Pipe: Moment', () => {

  test('should transform moment instance to formatted text', () => {
    const momentPipe: MomentPipe = new MomentPipe();
    const now: moment.Moment = moment();

    expect(momentPipe.transform(now, 'format', 'MMMM'))
      .toMatch(now.format('MMMM'));

    expect(momentPipe.transform(now, 'date'))
      .toMatch(now.date().toString());

    expect(momentPipe.transform(now, 'other').length).toEqual(0);
  });

});
