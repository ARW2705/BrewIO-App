import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { Events } from 'ionic-angular';
import * as moment from 'moment';
import * as _ from 'lodash';

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
  private selectedDay: CalendarDate = null;
  private month: Array<Array<CalendarDate>> = [];
  private projectedDates: Array<CalendarDate> = [];
  private startDate: CalendarDate = null;
  private currentDate: moment.Moment = null;
  private isProjectedSelection: boolean = false;
  private editType: string = '';

  constructor(private events: Events) {
    this.currentDate = moment();
  }

  getFinal() {
    return {
      _id: this.stepData.id,
      startDatetime: this.startDate.mDate.toISOString(),
      alerts: this.projectedDates.map(date => {
        return date.mDate.toISOString();
      })
    };
  }

  addToProjectedDates(date: CalendarDate): void {
    date.isProjected = true;
    date.isStart = false;
    this.projectedDates.push(date);
  }

  changeMonthYear(direction: string, timeframe: moment.unitOfTime.DurationConstructor): void {
    this.currentDate =
      direction == 'next'
      ? moment(this.currentDate).add(1, timeframe)
      : moment(this.currentDate).subtract(1, timeframe);
    this.populateCalendar();
    this.updateView();
  }

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

  ngOnChanges(changes: SimpleChanges) {
    if (changes.stepData.previousValue == undefined
        || changes.stepData.currentValue.id == changes.stepData.previousValue.id) return;
    this.stepData = changes.stepData.currentValue;
    this.initCalendar();
  }

  ngOnInit() {
    this.initCalendar();
  }

  initCalendar(): void {
    console.log('calendar init', this.stepData);
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
    this.selectDay(today);
  }

  isMonth(date: moment.Moment): boolean {
    return moment(this.currentDate).isSame(date, 'months');
  }

  isProjected(date: moment.Moment): boolean {
    return _.findIndex(this.isProjectedSelection, projectedDate => {
      return moment(date).isSame(projectedDate.mDate, 'day');
    }) != -1;
  }

  isStart(date: moment.Moment): boolean {
    return moment(date).isSame(this.startDate.mDate, 'day');
  }

  isToday(date: moment.Moment): boolean {
    return moment().isSame(moment(date), 'day');
  }

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
    const index = _.findIndex(this.projectedDates, pDate => pDate == date);
    this.projectedDates.splice(index, 1);
  }

  selectDay(date: CalendarDate): void {
    if (moment(date.mDate).isBefore(this.currentDate, 'day')) return;
    this.startDate = date;
    this.setProjectedDates();
    this.updateView();
  }

  setProjectedDates(): void {
    this.projectedDates = [];
    this.addToProjectedDates({
      mDate: this.startDate.mDate.clone().add(this.stepData.duration, 'days'),
      isStart: false,
      isProjected: true,
      isToday: false
    });
  }

  submitStartDate(date: CalendarDate): void {
    const schedule: Array<string> = [];
    schedule.push(this.startDate.mDate.toISOString());
    schedule.concat(this.projectedDates.map(date => date.mDate.toISOString()));
    this.events.publish('calendar-schedule', schedule);
  }

  toggleEdit(edit: string): void {
    this.editType = this.editType == edit ? '': edit;
  }

  toggleProjectedDates(date: CalendarDate): void {
    if (date.mDate.isSameOrBefore(this.startDate.mDate, 'day')) return;
    const index = _.findIndex(this.projectedDates, pDate => {
      return moment(pDate.mDate).isSame(date.mDate);
    });
    if (index == -1) {
      console.log('add date');
      date.isProjected = true;
      date.isStart = false;
      this.projectedDates.push(date);
    } else {
      console.log('remove date');
      date.isProjected = false;
      this.projectedDates.splice(index, 1);
    }
  }

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
