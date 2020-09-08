/* Module imports */
import { Component, Input, OnChanges, OnInit, SimpleChange, SimpleChanges } from '@angular/core';
import * as moment from 'moment';

/* Utility imports */
import { getId } from '../../shared/utility-functions/id-helpers';

/* Interface imports */
import { CalendarDate } from '../../shared/interfaces/calendar-date';


@Component({
  selector: 'calendar',
  templateUrl: 'calendar.html'
})
export class CalendarComponent implements OnInit, OnChanges {
  @Input('data') stepData;
  currentDate: moment.Moment = null;
  editType: string = '';
  isProjectedSelection: boolean = false;
  month: CalendarDate[][] = [];
  projectedDates: CalendarDate[] = [];
  selectedDay: CalendarDate = null;
  startDate: CalendarDate = null;
  weekdays: string[] = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  constructor() {
    this.currentDate = moment();
  }

  /***** Lifecycle Hooks *****/

  ngOnInit() {
    this.initCalendar();
  }

  ngOnChanges(changes: SimpleChanges) {
    const change: SimpleChange = changes.stepData;

    if (change.previousValue !== undefined
        && (getId(change.currentValue) !== getId(change.previousValue))) {
      this.stepData = change.currentValue;
      this.initCalendar();
    }
  }

  /***** End Lifecycle hooks *****/


  /**
   * Mark calendar date as a projected date and add to projected dates array;
   * Projected dates cannot be the start date
   *
   * @params: date - a calendar date to use as projected
   *
   * @return: none
  **/
  addToProjectedDates(date: CalendarDate): void {
    date.isProjected = true;
    date.isStart = false;
    this.projectedDates.push(date);
  }

  /**
   * Change the month or year to be displayed
   *
   * @params: direction - either 'next' or 'prev'
   * @params: timeframe - either 'month' or 'year'
   *
   * @return: none
  **/
  changeMonthYear(
    direction: string,
    timeframe: moment.unitOfTime.DurationConstructor
  ): void {
    this.currentDate =  direction === 'next'
                        ? moment(this.currentDate).add(1, timeframe)
                        : moment(this.currentDate).subtract(1, timeframe);
    this.populateCalendar();
    this.updateView();
  }

  /**
   * Generate the calendar as a 7 x 6 grid containing the days of the current
   * month and filling out the remaining grid positions with days of the
   * previous month on the top row and days of the next month on the bottom row
   *
   * @params: currentMoment - current datetime
   *
   * @return: array of 42 Calendar dates
  **/
  fillDates(currentMoment: moment.Moment): CalendarDate[] {
    const firstOfMonth: number = moment(currentMoment)
      .startOf('month')
      .day();

    const firstOfGrid: moment.Moment = moment(currentMoment)
      .startOf('month')
      .subtract(firstOfMonth, 'days');

    const start: number = firstOfGrid.date();

    const populatedCalendar: CalendarDate[] = [];
    for (let i=start; i < start + 42; i++) {
      const _date: moment.Moment = moment(firstOfGrid).date(i);
      populatedCalendar.push({
        isToday: this.isToday(_date),
        isStart: this.isStart(_date),
        isProjected: this.isProjected(_date),
        mDate: _date
      })
    }
    return populatedCalendar;
  }

  /**
   * Get calendar data to use at the start of a calendar process step
   *
   * @params: none
   *
   * @return: object with step id, start datetime, and any alerts
  **/
  getFinal(): object {
    return {
      _id: getId(this.stepData),
      startDatetime: this.startDate.mDate.toISOString(),
      alerts: this.projectedDates.map(date => {
        return {
          title: this.stepData.title,
          description: '',
          datetime: date.mDate.toISOString()
        };
      })
    };
  }

  /**
   * Initialize calendar with two dates preselected - today's date, and the
   * end date per the step's duration field
   *
   * @params: none
   * @return: none
  **/
  initCalendar(): void {
    const today: CalendarDate = {
      mDate: this.currentDate,
      isStart: true,
      isProjected: false,
      isToday: true,
    };

    const end: CalendarDate = {
      mDate: this.currentDate.clone().add(this.stepData.duration, 'days'),
      isStart: false,
      isProjected: true,
      isToday: false
    };

    this.startDate = today;
    this.populateCalendar();
    this.addToProjectedDates(end);
    this.selectStartDate(today);
  }

  /**
   * Check if given date and current date are the same month
   *
   * @params: date - datetime to compare
   *
   * @return: true if given datetime is the same month as current
  **/
  isMonth(date: moment.Moment): boolean {
    return  moment(this.currentDate).isSame(date, 'years')
            && moment(this.currentDate).isSame(date, 'months');
  }

  /**
   * Check if given date is the same day as a date in the projectedDates array
   *
   * @params: date - datetime to compare
   *
   * @return: true if given datetime is a projected date
  **/
  isProjected(date: moment.Moment): boolean {
    return this.projectedDates.some((projectedDate: CalendarDate) => {
      return moment(date).isSame(projectedDate.mDate, 'day');
    });
  }

  /**
   * Check if given date is the same day as start date
   *
   * @params: date - datetime to compare
   *
   * @return: true if given datetime is the same as the start date
  **/
  isStart(date: moment.Moment): boolean {
    return moment(date).isSame(this.startDate.mDate, 'day');
  }

  /**
   * Check if given date is the same day as today
   *
   * @params: date - datetime to compare
   *
   * @return: true if given datetime is the same as current day
  **/
  isToday(date: moment.Moment): boolean {
    return moment().isSame(moment(date), 'day');
  }

  /**
   * Assemble 7x6 calendar for display
   *
   * @params: none
   * @return: none
  **/
  populateCalendar(): void {
    const dates: CalendarDate[] = this.fillDates(this.currentDate);
    const month: CalendarDate[][] = [];
    for (let i=0; i < 6; i++) {
      month.push(dates.slice(i * 7, i * 7 + 7));
    }
    this.month = month;
  }

  /**
   * Set given date as start date as long as it is not in the past
   *
   * @params: date - datetime to set as start
   *
   * @return: none
  **/
  selectStartDate(date: CalendarDate): void {
    if (moment(date.mDate).isBefore(this.currentDate, 'day')) {
      return;
    }

    this.startDate = date;
    this.resetProjectedDates();
    this.updateView();
  }

  /**
   * Reset projectedDates array and re-populate
   *
   * @params: none
   * @return: none
  **/
  resetProjectedDates(): void {
    this.projectedDates = [];

    this.addToProjectedDates({
      mDate: this.startDate.mDate.clone().add(this.stepData.duration, 'days'),
      isStart: false,
      isProjected: true,
      isToday: false
    });
  }

  /**
   * Toggle editing state
   *
   * @params: edit - either 'start' or 'alerts' for editing, or '' for not editing
   *
   * @return: none
  **/
  toggleEdit(edit: string): void {
    this.editType = this.editType === edit ? '': edit;
  }

  /**
   * Toggle the selected state of date in projectedDates array
   * May not be a past date
   *
   * @params: date - datetime to toggle state
   *
   * @return: none
  **/
  toggleProjectedDate(date: CalendarDate): void {
    if (date.mDate.isSameOrBefore(this.startDate.mDate, 'day')) return;

    const index: number = this.projectedDates.findIndex((pDate: CalendarDate) => {
      return moment(pDate.mDate).isSame(date.mDate);
    });

    if (index === -1) {
      // add date
      date.isProjected = true;
      date.isStart = false;
      this.projectedDates.push(date);
    } else {
      // remove date
      date.isProjected = false;
      this.projectedDates.splice(index, 1);
    }
  }

  /**
   * Update calendar view data with new date information
   * Assign start and projected date booleans
   *
   * @params: none
   * @return: none
  **/
  updateView(): void {
    this.month.forEach(week => {
      week.forEach(day => {
        day.isMonth = this.isMonth(day.mDate);

        // set isStart status
        if (moment(day.mDate).isSame(this.startDate.mDate, 'day')) {
          day.isStart = true;
          day.isProjected = false;
        } else {
          day.isStart = false;
        }

        // set isProjected status
        if (this.projectedDates.some(date => {
          return moment(date.mDate).isSame(day.mDate, 'day')
        })) {
          day.isStart = false;
          day.isProjected = true;
        } else {
          day.isProjected = false;
        }
      });
    });
  }

}
