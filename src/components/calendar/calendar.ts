import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import moment from 'moment';
import _ from 'lodash';

interface CalendarDate {
  mDate: moment.Moment;
  isStart?: boolean;
  isProjected?: boolean;
  isToday?: boolean;
  isMonth?: boolean;
};

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

  addToProjectedDates(date: CalendarDate): void {
    date.isProjected = true;
    date.isStart = false;
    this.projectedDates.push(date);
  }

  // Change month or year to be displayed
  changeMonthYear(direction: string, timeframe: moment.unitOfTime.DurationConstructor): void {
    this.currentDate =
      direction === 'next'
      ? moment(this.currentDate).add(1, timeframe)
      : moment(this.currentDate).subtract(1, timeframe);
    this.populateCalendar();
    this.updateView();
  }

  // Called from process page to get calendar data
  getFinal() {
    return {
      _id: this.stepData.id,
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
   * Generate the calendar as a 7 x 6 grid containing the days of the current month
   * and filling out the remaining grid positions with days of the previous month
   * on the top row and days of the next month on the bottom row
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
   * Initialize calendar with two dates preselected - today's date, and the
   * end date per the step's duration field
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

  // Check if given date and current date are the same month
  isMonth(date: moment.Moment): boolean {
    return moment(this.currentDate).isSame(date, 'months');
  }

  // Check if given date is the same day as a date in the projectedDates array
  isProjected(date: moment.Moment): boolean {
    return _.findIndex(this.projectedDates, projectedDate => {
      return moment(date).isSame(projectedDate.mDate, 'day');
    }) !== -1;
  }

  // Check if given date is the same day as start date
  isStart(date: moment.Moment): boolean {
    return moment(date).isSame(this.startDate.mDate, 'day');
  }

  // Check if given date is the same day as today
  isToday(date: moment.Moment): boolean {
    return moment().isSame(moment(date), 'day');
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.stepData.previousValue === undefined
        || changes.stepData.currentValue.id === changes.stepData.previousValue.id) return;
    this.stepData = changes.stepData.currentValue;
    this.initCalendar();
  }

  ngOnInit() {
    this.initCalendar();
  }

  // Assemble calendar to display
  populateCalendar(): void {
    const dates: Array<CalendarDate> = this.fillDates(this.currentDate);
    const month: Array<Array<CalendarDate>> = [];
    for (let i=0; i < 6; i++) {
      month.push(dates.slice(i * 7, i * 7 + 7));
    }
    this.month = month;
  }

  removeFromProjecteDates(date: CalendarDate): void {
    date.isProjected = false;
    const index = _.findIndex(this.projectedDates, pDate => pDate === date);
    this.projectedDates.splice(index, 1);
  }

  selectStartDate(date: CalendarDate): void {
    if (moment(date.mDate).isBefore(this.currentDate, 'day')) return;
    this.startDate = date;
    this.setProjectedDates();
    this.updateView();
  }

  // Reset projectedDates array and re-populate
  setProjectedDates(): void {
    this.projectedDates = [];
    this.addToProjectedDates({
      mDate: this.startDate.mDate.clone().add(this.stepData.duration, 'days'),
      isStart: false,
      isProjected: true,
      isToday: false
    });
  }

  toggleEdit(edit: string): void {
    this.editType = this.editType === edit ? '': edit;
  }

  /**
   * Toggle the selected state of date in projectedDates array
   * May not be a past date
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
