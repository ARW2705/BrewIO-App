/* Module imports */
import { ComponentFixture, TestBed, getTestBed } from '@angular/core/testing';
import { SimpleChange, SimpleChanges, NO_ERRORS_SCHEMA } from '@angular/core';
import { IonicModule, Events } from 'ionic-angular';

/* Test configuration imports */
import { configureTestBed } from '../../../../../test-config/configureTestBed';

/* Mock imports */
import { EventsMock, MomentPipeMock, SortPipeMock } from '../../../../../test-config/mocks-ionic';
import { mockProcessSchedule } from '../../../../../test-config/mockmodels/mockProcessSchedule';
import { mockAlert, mockAlertFuture } from '../../../../../test-config/mockmodels/mockAlert';

/* Utilitiy imports */
import { getId } from '../../../../shared/utility-functions/id-helpers';

/* Interface imports */
import { Process } from '../../../../shared/interfaces/process';

/* Component imports */
import { CalendarProcessComponent } from './calendar-process';
import { CalendarComponent } from '../../../../components/calendar/calendar';


describe('Calendar Process Component', () => {
  let injector: TestBed;
  let eventService: Events;
  let cpPage: CalendarProcessComponent;
  let fixture: ComponentFixture<CalendarProcessComponent>;
  let originalNgOnChanges: () => void;
  const staticProcessSchedule: Process[] = mockProcessSchedule();
  configureTestBed();

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      declarations: [
        CalendarProcessComponent,
        CalendarComponent,
        MomentPipeMock,
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

  beforeEach(() => {
    fixture = TestBed.createComponent(CalendarProcessComponent);
    cpPage = fixture.componentInstance;
    cpPage.stepData = staticProcessSchedule[0];
    cpPage.isPreview = false;
    cpPage.alerts = [];
    cpPage.calendarRef = new CalendarComponent();

    injector = getTestBed();
    eventService = injector.get(Events);

    originalNgOnChanges = cpPage.ngOnChanges;
    cpPage.ngOnChanges = jest
      .fn();
  });

  test('should create the component', () => {
    fixture.detectChanges();

    expect(cpPage).toBeDefined();
    expect(cpPage.stepData).toStrictEqual(staticProcessSchedule[0]);
  }); // end 'should create the component' test

  test('should listen for changes', () => {
    cpPage.ngOnChanges = originalNgOnChanges;

    const alertSpy: jest.SpyInstance = jest
      .spyOn(cpPage, 'getClosestAlertByGroup');

    fixture.detectChanges();

    cpPage.ngOnChanges();

    expect(alertSpy).toHaveBeenCalled();
  }); // end 'should listen for changes' test

  test('should publish a change date event', () => {
    fixture.detectChanges();

    const eventSpy = jest.spyOn(eventService, 'publish');

    cpPage.changeDate();

    expect(eventSpy).toHaveBeenCalledWith('change-date');
  }); // end 'should publish a change date event' test

  test('should get the closest alert to current datetime within a group', () => {
    fixture.detectChanges();

    const targetAlert = mockAlert();
    cpPage.alerts = [targetAlert, mockAlertFuture()];

    const closest = cpPage.getClosestAlertByGroup();

    expect(closest.datetime).toMatch(targetAlert.datetime);
  }); // end 'should get the closest alert to current datetime within a group' test

  test('should not get an alert if there are no alerts', () => {
    fixture.detectChanges();

    cpPage.alerts = [];

    const closest = cpPage.getClosestAlertByGroup();

    expect(closest).toBeNull();
  }); // end 'should not get an alert if there are no alerts' test

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
