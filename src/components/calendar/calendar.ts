/* Module imports */
import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import * as moment from 'moment';
import * as _ from 'lodash';

/* Interface imports */
import { CalendarDate } from '../../shared/interfaces/calendar-date';

@Component({
  selector: 'calendar',
  templateUrl: 'calendar.html'
})
export class CalendarComponent implements OnInit, OnChanges {
  @Input('data') stepData;
  weekdays: Array<string> = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  selectedDay: CalendarDate = null;
  month: Array<Array<CalendarDate>> = [];
  projectedDates: Array<CalendarDate> = [];
  startDate: CalendarDate = null;
  currentDate: moment.Moment = null;
  isProjectedSelection: boolean = false;
  editType: string = '';

  constructor() {
    this.currentDate = moment();
  }

  /***** Lifecycle Hooks *****/

  ngOnChanges(changes: SimpleChanges) {
    if (changes.stepData.previousValue === undefined
        || changes.stepData.currentValue._id === changes.stepData.previousValue._id) return;
    this.stepData = changes.stepData.currentValue;
    this.initCalendar();
  }

  ngOnInit() {
    this.initCalendar();
  }

  /***** End Lifecycle hooks *****/


  /**
   * Mark calendar date as a projected date and add to projected dates array
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
  changeMonthYear(direction: string, timeframe: moment.unitOfTime.DurationConstructor): void {
    this.currentDate =
      direction === 'next'
      ? moment(this.currentDate).add(1, timeframe)
      : moment(this.currentDate).subtract(1, timeframe);
    this.populateCalendar();
    this.updateView();
  }

  /**
   * Generate the calendar as a 7 x 6 grid containing the days of the current month
   * and filling out the remaining grid positions with days of the previous month
   * on the top row and days of the next month on the bottom row
   *
   * @params: currentMoment - current datetime
   *
   * @return: array of 42 Calendar dates
  **/
  fillDates(currentMoment: moment.Moment): Array<CalendarDate> {
    const firstOfMonth = moment(currentMoment).startOf('month').day();
    const firstOfGrid = moment(currentMoment).startOf('month').subtract(firstOfMonth, 'days');
    const start = firstOfGrid.date();
    return _.range(start, start + 42)
      .map((date: number): CalendarDate => {
        const _date = moment(firstOfGrid).date(date);
        return {
          isToday: this.isToday(_date),
          isStart: this.isStart(_date),
          isProjected: this.isProjected(_date),
          mDate: _date
        };
      });
  }

  /**
   * Get calendar data at start of a calendar process
   *
   * @params: none
   *
   * @return: object with step id, start datetime, and any alerts
  **/
  getFinal(): any {
    return {
      _id: this.stepData._id,
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
    const today = {
      mDate: this.currentDate,
      isStart: true,
      isProjected: false,
      isToday: true,
    };
    const end = {
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
    return _.findIndex(this.projectedDates, projectedDate => {
      return moment(date).isSame(projectedDate.mDate, 'day');
    }) !== -1;
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
   * Assemble calendar to display
   *
   * @params: none
   * @return: none
  **/
  populateCalendar(): void {
    const dates: Array<CalendarDate> = this.fillDates(this.currentDate);
    const month: Array<Array<CalendarDate>> = [];
    for (let i=0; i < 6; i++) {
      month.push(dates.slice(i * 7, i * 7 + 7));
    }
    this.month = month;
  }

  /**
   * Set given date as start date
   *
   * @params: date - datetime to set as start
   *
   * @return: none
  **/
  selectStartDate(date: CalendarDate): void {
    if (moment(date.mDate).isBefore(this.currentDate, 'day')) return;
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
    const index = _.findIndex(this.projectedDates, pDate => {
      return moment(pDate.mDate).isSame(date.mDate);
    });
    if (index == -1) {
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
        if (moment(day.mDate).isSame(this.startDate.mDate, 'day')) {
          day.isStart = true;
          day.isProjected = false;
        } else {
          day.isStart = false;
        }
        if (this.projectedDates.some(date => moment(date.mDate).isSame(day.mDate, 'day'))) {
          day.isStart = false;
          day.isProjected = true;
        } else {
          day.isProjected = false;
        }
      });
    });
  }

}
