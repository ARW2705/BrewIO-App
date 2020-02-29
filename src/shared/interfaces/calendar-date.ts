import * as moment from 'moment';

export interface CalendarDate {
  mDate: moment.Moment;
  isStart?: boolean;
  isProjected?: boolean;
  isToday?: boolean;
  isMonth?: boolean;
};
