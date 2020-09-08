/* Module imports */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule, Config } from 'ionic-angular';
import { SimpleChange, SimpleChanges } from '@angular/core';
import * as moment from 'moment';

/* Test configuration imports */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Mock imports */
import { mockCalendarStep } from '../../../test-config/mockmodels/mockCalendarStep';
import { mockCalendarDate } from '../../../test-config/mockmodels/mockCalendarDate';
import { ConfigMock } from '../../../test-config/mocks-ionic';

/* interface imports */
import { CalendarDate } from '../../shared/interfaces/calendar-date';
import { Process } from '../../shared/interfaces/process';

/* Component imports */
import { CalendarComponent } from './calendar';


describe('Calendar Component', () => {
  let fixture: ComponentFixture<CalendarComponent>;
  let calendar: CalendarComponent;
  configureTestBed();

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      declarations: [
        CalendarComponent
      ],
      imports: [
        IonicModule
      ],
      providers: [
        { provide: Config, useClass: ConfigMock }
      ]
    });
    await TestBed.compileComponents();
  })()
  .then(done)
  .catch(done.fail));

  beforeEach(() => {
    fixture = TestBed.createComponent(CalendarComponent);
    calendar = fixture.componentInstance;
    calendar.stepData = mockCalendarStep();
  });

  test('should create the component', () => {
    fixture.detectChanges();

    expect(calendar).toBeDefined();
  }); // end 'should create the component' test

  test('should init the calendar', () => {
    fixture.detectChanges();

    const now: moment.Moment = moment();
    calendar.currentDate = now;

    const popSpy: jest.SpyInstance = jest.spyOn(calendar, 'populateCalendar');
    const addSpy: jest.SpyInstance = jest.spyOn(calendar, 'addToProjectedDates');
    const selectSpy: jest.SpyInstance = jest.spyOn(calendar, 'selectStartDate');

    calendar.initCalendar();

    expect(calendar.startDate.mDate).toStrictEqual(now);
    expect(popSpy).toHaveBeenCalled();
    expect(addSpy.mock.calls[0][0].isProjected).toBe(true);
    expect(selectSpy.mock.calls[0][0].mDate).toStrictEqual(now);
  }); // end 'should init the calendar' test

  test('should update stepData', () => {
    fixture.detectChanges();

    const oldStepData: Process = mockCalendarStep();
    const newStepData: Process = {
      _id: 'different-step',
      cid: '0123456789013',
      type: 'calendar',
      name: 'different-calendar-step',
      description: 'a different mock calendar step',
      duration: 10
    };
    const stepDataChange: SimpleChanges = {
      stepData: new SimpleChange(oldStepData, newStepData, false)
    };

    calendar.ngOnChanges(stepDataChange);

    expect(calendar.stepData).not.toStrictEqual(oldStepData);
    expect(calendar.stepData).toStrictEqual(newStepData);
  }); // end 'should update stepData' test

  test('should add a date to projected dates array', () => {
    fixture.detectChanges();

    const currentProjectedDatesLength: number = calendar.projectedDates.length;

    calendar.addToProjectedDates(mockCalendarDate());

    expect(calendar.projectedDates.length).toBe(currentProjectedDatesLength + 1);
    expect(calendar.projectedDates[currentProjectedDatesLength].isProjected)
      .toBe(true);
    expect(calendar.projectedDates[currentProjectedDatesLength].isStart)
      .toBe(false);
  }); // end 'should add a date to projected dates array' test

  test('should change month to be displayed', () => {
    fixture.detectChanges();

    const now: moment.Moment = mockCalendarDate().mDate;
    const month: number = now.month();
    calendar.currentDate = now;
    calendar.changeMonthYear('next', 'month');

    expect(calendar.currentDate.month()).toEqual(month + 1);

    calendar.currentDate = now;
    calendar.changeMonthYear('prev', 'month');

    expect(calendar.currentDate.month()).toEqual(month - 1);
  }); // end 'should change month to be displayed' test

  test('should change year to be displayed', () => {
    fixture.detectChanges();

    const now: moment.Moment = mockCalendarDate().mDate;
    const year: number = now.year();
    calendar.currentDate = now;

    calendar.changeMonthYear('next', 'year');

    expect(calendar.currentDate.year()).toEqual(year + 1);

    calendar.currentDate = now;
    calendar.changeMonthYear('prev', 'year');

    expect(calendar.currentDate.year()).toEqual(year - 1);
  }); // end 'should change year to be displayed' test

  test('should fill dates of calendar display', () => {
    fixture.detectChanges();

    const now: moment.Moment = mockCalendarDate().mDate;
    calendar.currentDate = now;
    calendar.month = [];

    const dates: CalendarDate[] = calendar.fillDates(now);

    expect(dates[0].mDate.month()).toEqual(0);
    expect(dates[0].mDate.date()).toEqual(26);
    expect(dates[41].mDate.month()).toEqual(2);
    expect(dates[41].mDate.date()).toEqual(7);
  }); // end 'should fill dates of calendar display' test

  test('should return final data to parent component', () => {
    fixture.detectChanges();

    const _mockCalendarStep: Process = mockCalendarStep();
    const now: moment.Moment = mockCalendarDate().mDate;
    const later: moment.Moment = now.clone().add(1, 'days');
    calendar.currentDate = now;
    calendar.startDate = {
      mDate: now,
      isStart: true,
      isProjected: false,
      isToday: true
    };
    calendar.projectedDates = [
      {
        mDate: later,
        isStart: false,
        isProjected: true,
        isToday: false
      }
    ];

    const returnData: object = calendar.getFinal();

    expect(returnData['_id']).toMatch(_mockCalendarStep._id);
    expect(returnData['startDatetime']).toMatch(now.toISOString());
    expect(returnData['alerts'][0].datetime).toMatch(later.toISOString());
  }); // end 'should return final data to parent component' test

  test('should check if given month is the current month', () => {
    fixture.detectChanges();

    const now: moment.Moment = mockCalendarDate().mDate;
    const dateWithCurrentMonth: moment.Moment = moment()
      .year(2020)
      .month(1)
      .date(10);
    const dateWithOtherMonth: moment.Moment = moment()
      .year(2020)
      .month(2)
      .date(7);
    calendar.currentDate = now;

    expect(calendar.isMonth(dateWithCurrentMonth)).toBe(true);
    expect(calendar.isMonth(dateWithOtherMonth)).toBe(false);
  }); // end 'should check if given month is the current month' test

  test('should check if given date is a projected date', () => {
    fixture.detectChanges();

    const now: moment.Moment = mockCalendarDate().mDate;
    calendar.currentDate = now;
    const later: moment.Moment = now.clone().add(1, 'days');

    calendar.startDate = {
      mDate: now,
      isStart: true,
      isProjected: false,
      isToday: true
    };
    calendar.projectedDates = [
      {
        mDate: later,
        isStart: false,
        isProjected: true,
        isToday: false
      }
    ];

    expect(calendar.isProjected(now)).toBe(false);
    expect(calendar.isProjected(later)).toBe(true);
  }); // end 'should check if given date is a projected date' test

  test('should check if given date is the start date', () => {
    fixture.detectChanges();

    const now: moment.Moment = mockCalendarDate().mDate;
    calendar.currentDate = now;

    calendar.startDate = {
      mDate: now,
      isStart: true,
      isProjected: false,
      isToday: true
    };

    expect(calendar.isStart(now)).toBe(true);
    expect(
      calendar.isStart(now.clone().add(mockCalendarStep().duration, 'days'))
    )
    .toBe(false);
  }); // end 'should check if given date is the start date' test

  test('should check if given date is the current date', () => {
    fixture.detectChanges();

    expect(calendar.isToday(mockCalendarDate().mDate)).toBe(false);
    expect(calendar.isToday(moment())).toBe(true);
  }); // end 'should check if given date is the current date' test

  test('should split the calendar dates into weeks', () => {
    fixture.detectChanges();

    calendar.month = [];

    const fillSpy: jest.SpyInstance = jest.spyOn(calendar, 'fillDates');

    calendar.populateCalendar();

    expect(fillSpy).toHaveBeenCalled();
    expect(calendar.month.length).toEqual(6);
    expect(calendar.month[0].length).toEqual(7);
  }); // end 'should split the calendar dates into weeks' test

  test('should select a start date', () => {
    fixture.detectChanges();

    const now: CalendarDate = mockCalendarDate();
    const pastDate: CalendarDate = mockCalendarDate();
    pastDate.mDate = now.mDate.clone().subtract(1, 'days');
    calendar.currentDate = now.mDate;

    const projectedSpy: jest.SpyInstance = jest
      .spyOn(calendar, 'resetProjectedDates');
    const updateSpy: jest.SpyInstance = jest.spyOn(calendar, 'updateView');

    calendar.selectStartDate(pastDate);

    expect(projectedSpy).not.toHaveBeenCalled();
    expect(projectedSpy).not.toHaveBeenCalled();

    calendar.selectStartDate(now);

    expect(projectedSpy).toHaveBeenCalled();
    expect(updateSpy).toHaveBeenCalled();
    expect(calendar.startDate).toStrictEqual(now);
  }); // end 'should select a start date' test

  test('should reset projected dates', () => {
    fixture.detectChanges();

    const _mockCalendarDate: CalendarDate = mockCalendarDate();
    calendar.projectedDates = [
      _mockCalendarDate,
      _mockCalendarDate,
      _mockCalendarDate
    ];
    calendar.currentDate = _mockCalendarDate.mDate;

    calendar.resetProjectedDates();

    expect(calendar.projectedDates.length).toEqual(1);
  }); // end 'should reset projected dates' test

  test('should toggle edit mode', () => {
    fixture.detectChanges();

    expect(calendar.editType).toMatch('');

    calendar.toggleEdit('start');

    expect(calendar.editType).toMatch('start');

    calendar.toggleEdit('alerts');

    expect(calendar.editType).toMatch('alerts');

    calendar.toggleEdit('alerts');

    expect(calendar.editType).toMatch('');
  }); // end 'should toggle edit mode' test

  test('should add a date to projected dates', () => {
    fixture.detectChanges();

    const _mockCalendarDate: CalendarDate = mockCalendarDate();

    const newDate: CalendarDate = mockCalendarDate();
    newDate.mDate = _mockCalendarDate.mDate.clone().add(2, 'days');

    const later: moment.Moment = _mockCalendarDate.mDate.clone().add(7, 'days');
    calendar.currentDate = _mockCalendarDate.mDate;

    calendar.startDate = {
      mDate: _mockCalendarDate.mDate,
      isStart: true,
      isProjected: false,
      isToday: true
    };
    calendar.projectedDates = [
      {
        mDate: later,
        isStart: false,
        isProjected: true,
        isToday: false
      }
    ];

    calendar.toggleProjectedDate(newDate);

    expect(calendar.projectedDates.length).toEqual(2);
    expect(calendar.projectedDates[1].mDate).toStrictEqual(newDate.mDate);
    expect(calendar.projectedDates[1].isProjected).toBe(true);
  }); // end 'should add a date to projected dates' test

  test('should remove a date from projected dates', () => {
    fixture.detectChanges();

    const _mockCalendarDate: CalendarDate = mockCalendarDate();

    const newDate: CalendarDate = mockCalendarDate();
    newDate.mDate = _mockCalendarDate.mDate.clone().add(2, 'days');

    calendar.currentDate = _mockCalendarDate.mDate;

    calendar.startDate = {
      mDate: _mockCalendarDate.mDate,
      isStart: true,
      isProjected: false,
      isToday: true
    };

    calendar.projectedDates = [_mockCalendarDate, newDate];

    calendar.toggleProjectedDate(newDate);

    expect(calendar.projectedDates.length).toEqual(1);
    expect(calendar.projectedDates[0].mDate).not.toStrictEqual(newDate.mDate);
  }); // end 'should remove a date from projected dates' test

  test('should not change projected dates if a past date is given', () => {
    fixture.detectChanges();

    const _mockCalendarDate: CalendarDate = mockCalendarDate();

    const newDate: CalendarDate = mockCalendarDate();
    newDate.mDate = _mockCalendarDate.mDate.clone().subtract(2, 'days');

    calendar.currentDate = _mockCalendarDate.mDate;

    calendar.toggleProjectedDate(newDate);

    expect(calendar.projectedDates.length).toEqual(1);
    expect(calendar.projectedDates[0].mDate).not.toStrictEqual(newDate.mDate);
  }); // end 'should not change projected dates if a past date is given' test

  test('should update the view', () => {
    fixture.detectChanges();

    const _mockCalendarDate: CalendarDate = mockCalendarDate();

    const dateIndex: number[] = [1 , 4];

    const projectedDateIndex: number[] = [2, 4];

    const _mockNewDate: CalendarDate = mockCalendarDate();
    _mockNewDate.mDate = _mockNewDate.mDate.clone().add(2, 'days');

    calendar.currentDate = _mockCalendarDate.mDate;
    calendar.startDate = _mockCalendarDate;

    calendar.initCalendar();

    const shouldChangeToNotStarted: CalendarDate = calendar.month[0][0];
    shouldChangeToNotStarted.isStart = true;

    const shouldChangeToNotProjected: CalendarDate = calendar.month[1][1];
    shouldChangeToNotProjected.isProjected = true;

    const shouldChangeToStarted: CalendarDate = calendar
      .month[dateIndex[0]][dateIndex[1]]
    shouldChangeToStarted.isStart = false;

    const shouldChangeToProjected: CalendarDate = calendar
      .month[projectedDateIndex[0]][projectedDateIndex[1]]
    shouldChangeToProjected.isProjected = false;

    calendar.updateView();

    expect(shouldChangeToNotStarted.isStart).toBe(false);
    expect(shouldChangeToNotProjected.isProjected).toBe(false);
    expect(shouldChangeToStarted.isStart).toBe(true);
    expect(shouldChangeToProjected.isProjected).toBe(true);
  }); // end 'should update the view' test

});
