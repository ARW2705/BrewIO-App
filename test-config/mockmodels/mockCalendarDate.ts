import * as moment from 'moment';
import { CalendarDate } from '../../src/shared/interfaces/calendar-date';

export const mockCalendarDate = () => {
  const mock: CalendarDate  = {
    mDate: moment().year(2020).month(1).date(6),
    isStart: false,
    isProjected: false,
    isToday: false,
    isMonth: false
  };
  return mock;
};
