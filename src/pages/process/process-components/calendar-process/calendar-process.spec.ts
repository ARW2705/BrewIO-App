/* Module imports */
import { ComponentFixture, TestBed, getTestBed, async } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { IonicModule, Events } from 'ionic-angular';

/* Test configuration imports */
import { configureTestBed } from '../../../../../test-config/configureTestBed';

/* Mock imports */
import { EventsMock, SortPipeMock } from '../../../../../test-config/mocks-ionic';
import { mockProcessSchedule } from '../../../../../test-config/mockmodels/mockProcessSchedule';
import { mockAlert, mockAlertPast, mockAlertFuture } from '../../../../../test-config/mockmodels/mockAlert';

/* Utilitiy imports */
import { getId } from '../../../../shared/utility-functions/utilities';

/* Component imports */
import { CalendarProcessComponent } from './calendar-process';
import { CalendarComponent } from '../../../../components/calendar/calendar';


describe('Calendar Process Component', () => {
  let injector: TestBed;
  let eventService: Events;
  let cpPage: CalendarProcessComponent;
  let fixture: ComponentFixture<CalendarProcessComponent>;
  configureTestBed();

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      declarations: [
        CalendarProcessComponent,
        CalendarComponent,
        SortPipeMock
      ],
      imports: [
        IonicModule.forRoot(CalendarProcessComponent)
      ],
      providers: [
        { provide: Events, useClass: EventsMock }
      ],
      schemas: [
        NO_ERRORS_SCHEMA
      ]
    });
    await TestBed.compileComponents();
  })()
  .then(done)
  .catch(done.fail));

  beforeEach(async(() => {
    injector = getTestBed();
    eventService = injector.get(Events);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CalendarProcessComponent);
    cpPage = fixture.componentInstance;
    cpPage.stepData = mockProcessSchedule()[0];
    cpPage.isPreview = false;
    cpPage.alerts = [];
    cpPage.calendarRef = new CalendarComponent();
  });

  test('should create the component', () => {
    fixture.detectChanges();

    expect(cpPage).toBeDefined();
    expect(cpPage.stepData).toStrictEqual(mockProcessSchedule()[0]);
  }); // end 'should create the component' test

  test('should publish a change date event', () => {
    fixture.detectChanges();

    const eventSpy = jest.spyOn(eventService, 'publish');

    cpPage.changeDate();

    expect(eventSpy).toHaveBeenCalledWith('change-date');
  }); // end 'should publish a change date event' test

  test('should get the appropriate classes for the closest alert (\'past\')', () => {
    fixture.detectChanges();

    cpPage.alerts = [mockAlert(), mockAlertPast(), mockAlertFuture()];

    const alertClass = cpPage.getAlertClass(mockAlertPast());

    expect(alertClass['next-datetime']).toBe(false);
    expect(alertClass['past-datetime']).toBe(true);
  }); // end 'should get the appropriate classes for the closest alert (\'past\')' test

  test('should get the appropriate classes for the closest alert (\'next\')', () => {
    fixture.detectChanges();

    const targetAlert = mockAlert();
    const now = new Date();
    now.setDate(now.getDate() + 2);
    targetAlert.datetime = now.toISOString();
    cpPage.alerts = [targetAlert, mockAlert(), mockAlertPast(), mockAlertFuture()];

    const alertClass = cpPage.getAlertClass(targetAlert);

    expect(alertClass['next-datetime']).toBe(true);
    expect(alertClass['past-datetime']).toBe(false);
  }); // end 'should get the appropriate classes for the closest alert (\'next\')' test

  test('should get the closest alert to current datetime within a group', () => {
    fixture.detectChanges();

    const targetAlert = mockAlert();
    cpPage.alerts = [targetAlert, mockAlertFuture()];

    const closest = cpPage.getClosestAlertByGroup();

    expect(closest.datetime).toMatch(targetAlert.datetime);
  }); // end 'should get the closest alert to current datetime within a group' test

  test('should get the step data of current calendar step', () => {
    fixture.detectChanges();

    const calendarStep = 13;
    const stepData = mockProcessSchedule()[calendarStep];
    cpPage.stepData = stepData;

    const data = cpPage.getCurrentStepCalendarData();

    expect(data._id).toMatch(stepData._id);
    expect(data.duration).toBe(stepData.duration);
    expect(data.title).toMatch(stepData.name);
    expect(data.description).toMatch(stepData.description);
  }); // end 'should get the step data of current calendar step' test

  test('should check if a calendar step is in progress', () => {
    fixture.detectChanges();

    expect(cpPage.isCalendarInProgress()).toBe(false);

    cpPage.stepData['startDatetime'] = (new Date()).toISOString();

    expect(cpPage.isCalendarInProgress()).toBe(true);
  }); // end 'should check if a calendar step is in progress' test

  test('should start a calendar step', () => {
    fixture.detectChanges();

    const now = (new Date()).toISOString();
    cpPage.calendarRef = new CalendarComponent();
    cpPage.calendarRef.getFinal = jest
      .fn()
      .mockReturnValue(
        {
          _id: getId(cpPage.stepData),
          startDatetime: now,
          alerts: []
        }
      );

    const startData = cpPage.startCalendar();
    expect(startData['id']).toMatch(getId(cpPage.stepData));
    expect(startData['update']['startDatetime']).toMatch(now);
    expect(startData['update']['alerts']).toStrictEqual([]);
  }); // end 'should start a calendar step' test

  test('should toggle show description flag', () => {
    fixture.detectChanges();

    expect(cpPage.showDescription).toBe(false);

    cpPage.toggleShowDescription();

    expect(cpPage.showDescription).toBe(true);

    cpPage.toggleShowDescription();

    expect(cpPage.showDescription).toBe(false);
  }); // end 'should toggle show description flag' test

});
