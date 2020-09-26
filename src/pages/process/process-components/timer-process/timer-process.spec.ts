/* Module imports */
import { ComponentFixture, TestBed, getTestBed, async } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SimpleChange, SimpleChanges, QueryList, ElementRef } from '@angular/core';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { IonicModule } from 'ionic-angular';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { of } from 'rxjs/observable/of';

/* Test configuration imports */
import { configureTestBed } from '../../../../../test-config/configureTestBed';

/* Interface imports */
import { Batch } from '../../../../shared/interfaces/batch';
import { Process } from '../../../../shared/interfaces/process';
import { Timer } from '../../../../shared/interfaces/timer';

/* Mock imports */
import { mockTimer, mockConcurrentTimers } from '../../../../../test-config/mockmodels/mockTimer';
import { mockBatch } from '../../../../../test-config/mockmodels/mockBatch';
import { mockProcessSchedule } from '../../../../../test-config/mockmodels/mockProcessSchedule';
import { FormatTimePipeMock, UnitConversionPipeMock } from '../../../../../test-config/mocks-ionic';

/* Component imports */
import { TimerProcessComponent } from './timer-process';

/* Provider imports */
import { TimerProvider } from '../../../../providers/timer/timer';


describe('Timer Process Component', () => {
  let injector: TestBed;
  let timerService; TimerProvider;
  let timerPage: TimerProcessComponent;
  let fixture: ComponentFixture<TimerProcessComponent>;
  let originalNgOnInit: () => void;
  let originalNgOnChanges: (changes: SimpleChanges) => void;
  let originalNgOnDestroy: () => void;
  let originalNgAfterViewInit: () => void;
  const staticBatch: Batch = mockBatch();
  const staticProcessSchedule: Process[] = mockProcessSchedule();
  configureTestBed();

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      declarations: [
        TimerProcessComponent,
        FormatTimePipeMock,
        UnitConversionPipeMock
      ],
      imports: [
        IonicModule.forRoot(TimerProcessComponent),
        NoopAnimationsModule
      ],
      providers: [
        { provide: TimerProvider, useValue: {} }
      ],
      schemas: [
        NO_ERRORS_SCHEMA
      ]
    });
    await TestBed.compileComponents();
  })()
  .then(done)
  .catch(done.fail));

  beforeAll(async(() => {
    injector = getTestBed();
    timerService = injector.get(TimerProvider);
  }));

  beforeEach(async(() => {
    fixture = TestBed.createComponent(TimerProcessComponent);
    timerPage = fixture.componentInstance;

    originalNgOnInit = timerPage.ngOnInit;
    timerPage.ngOnInit = jest
      .fn();
    originalNgOnChanges = timerPage.ngOnChanges;
    timerPage.ngOnChanges = jest
      .fn();
    originalNgOnDestroy = timerPage.ngOnDestroy;
    timerPage.ngOnDestroy = jest
      .fn();
    originalNgAfterViewInit = timerPage.ngAfterViewInit;
    timerPage.ngAfterViewInit = jest
      .fn()
      .mockImplementation(() => {
        timerPage.height = 600;
      });

    timerService.getTimersByProcessId = jest
      .fn()
      .mockReturnValue([ new BehaviorSubject<Timer>(mockTimer()) ]);
  }));

  describe('Non-Concurrent Timer', () => {

    beforeEach(() => {
      timerPage.stepData = [staticProcessSchedule[10]];
      timerPage.batchId = staticBatch.cid;
      timerPage.isPreview = false;
    });

    test('should create the component', () => {
      timerPage.ngOnInit = originalNgOnInit;
      timerPage.ngOnDestroy = originalNgOnDestroy;

      timerPage.initTimers = jest
        .fn();

      fixture.detectChanges();

      expect(timerPage).toBeDefined();
    }); // end 'should create the component' test

    test('should detect changes to step data', () => {
      timerPage.ngOnChanges = originalNgOnChanges;
      timerPage.initTimers = jest
        .fn();
      timerPage.hasChanges = jest
        .fn()
        .mockReturnValue(true);

      const timerSpy: jest.SpyInstance = jest.spyOn(timerPage, 'initTimers');

      const _schedule: Process[] = staticProcessSchedule;
      const _firstTimer: Process[] = [ _schedule[10] ];
      const _secondTimer: Process[] = [ _schedule[15] ];

      timerPage.stepData = _firstTimer;

      fixture.detectChanges();

      timerPage.ngOnChanges({
        stepData: new SimpleChange(null, _secondTimer, true)
      });

      expect(timerPage.stepData).toStrictEqual(_secondTimer);
      expect(timerSpy).toHaveBeenCalled();

      timerPage.isPreview = false;

      timerPage.ngOnChanges({
        isPreview: new SimpleChange(null, true, true)
      });

      fixture.detectChanges();

      expect(timerPage.isPreview).toBe(true);

      _firstTimer[0].type = 'not a timer';
      timerPage.ngOnChanges({
        stepData: new SimpleChange(null, _firstTimer, false)
      });

      expect(timerSpy.mock.calls.length).toEqual(1);
    }); // end 'should detect changes to step data' test

    test('should initialize timers', () => {
      fixture.detectChanges();

      const updateSpy: jest.SpyInstance = jest
        .spyOn(timerPage, 'updateTimerInList');

      timerPage.initTimers();

      expect(timerPage.isConcurrent).toBe(false);
      expect(updateSpy).toHaveBeenCalledWith(mockTimer());
    }); // end 'should initialize timers' test

    test('should short circuit init timers if unable to get timers', () => {
      timerService.getTimersByProcessId = jest
        .fn()
        .mockReturnValue(undefined);

      fixture.detectChanges();

      timerPage.timers = [ mockTimer() ];

      timerPage.initTimers();

      expect(timerPage.timers.length).toBe(0);
    }); // end 'should short circuit init timers if unable to get timers' test

    test('should handle adding a minute to a timer', () => {
      timerService.addTimeToTimer = jest
        .fn()
        .mockReturnValue(of({}));

      fixture.detectChanges();

      const _mockTimer: Timer = mockTimer();
      const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

      timerPage.addToSingleTimer(_mockTimer);

      const callCount: number = consoleSpy.mock.calls.length;
      expect(consoleSpy.mock.calls[callCount - 1][0])
        .toMatch('added time to timer');
      expect(consoleSpy.mock.calls[callCount - 1][1]).toMatch(_mockTimer.cid);
    }); // end 'should handle adding a minute to a timer' test

    test('should handle error response after trying to add a minute to a timer', () => {
      timerService.addTimeToTimer = jest
        .fn()
        .mockReturnValue(new ErrorObservable('error response'));

      fixture.detectChanges();

      const _mockTimer: Timer = mockTimer();
      const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

      timerPage.addToSingleTimer(_mockTimer);

      const callCount: number = consoleSpy.mock.calls.length;
      expect(consoleSpy.mock.calls[callCount - 1][0])
        .toMatch('error adding time to timer');
      expect(consoleSpy.mock.calls[callCount - 1][1]).toMatch('error response');
    }); // end 'should handle error response after trying to add a minute to a timer' test

    test('should handle starting a timer', () => {
      timerService.startTimer = jest
        .fn()
        .mockReturnValue(of({}));

      fixture.detectChanges();

      const _mockTimer: Timer = mockTimer();
      const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

      timerPage.startSingleTimer(_mockTimer);

      const callCount: number = consoleSpy.mock.calls.length;
      expect(consoleSpy.mock.calls[callCount - 1][0]).toMatch('started timer');
      expect(consoleSpy.mock.calls[callCount - 1][1]).toMatch(_mockTimer.cid);
    }); // end 'should handle starting a timer' test

    test('should handle error response after trying to start a timer', () => {
      timerService.startTimer = jest
        .fn()
        .mockReturnValue(new ErrorObservable('error response'));

      fixture.detectChanges();

      const _mockTimer: Timer = mockTimer();
      const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

      timerPage.startSingleTimer(_mockTimer);

      const callCount: number = consoleSpy.mock.calls.length;
      expect(consoleSpy.mock.calls[callCount - 1][0])
        .toMatch('error starting timer');
      expect(consoleSpy.mock.calls[callCount - 1][1]).toMatch('error response');
    }); // end 'should handle error response after trying to start a timer' test

    test('should handle stopping a timer', () => {
      timerService.stopTimer = jest
        .fn()
        .mockReturnValue(of({}));

      fixture.detectChanges();

      const _mockTimer: Timer = mockTimer();
      const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

      timerPage.stopSingleTimer(_mockTimer);

      const callCount: number = consoleSpy.mock.calls.length;
      expect(consoleSpy.mock.calls[callCount - 1][0]).toMatch('stopped timer');
      expect(consoleSpy.mock.calls[callCount - 1][1]).toMatch(_mockTimer.cid);
    }); // end 'should handle stopping a timer' test

    test('should handle error response after trying to stop a timer', () => {
      timerService.stopTimer = jest
        .fn()
        .mockReturnValue(new ErrorObservable('error response'));

      fixture.detectChanges();

      const _mockTimer: Timer = mockTimer();
      const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

      timerPage.stopSingleTimer(_mockTimer);

      const callCount: number = consoleSpy.mock.calls.length;
      expect(consoleSpy.mock.calls[callCount - 1][0])
        .toMatch('error stopping timer');
      expect(consoleSpy.mock.calls[callCount - 1][1]).toMatch('error response');
    }); // end 'should handle error response after trying to stop a timer' test

    test('should handle resetting a timer', () => {
      timerService.resetTimer = jest
        .fn()
        .mockReturnValue(of({}));

      fixture.detectChanges();

      const _mockTimer: Timer = mockTimer();
      const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

      timerPage.resetSingleTimer(_mockTimer);

      const callCount: number = consoleSpy.mock.calls.length;
      expect(consoleSpy.mock.calls[callCount - 1][0]).toMatch('reset timer');
      expect(consoleSpy.mock.calls[callCount - 1][1]).toMatch(_mockTimer.cid);
    }); // end 'should handle resetting a timer' test

    test('should handle error response after trying to reset a timer', () => {
      timerService.resetTimer = jest
        .fn()
        .mockReturnValue(new ErrorObservable('error response'));

      fixture.detectChanges();

      const _mockTimer: Timer = mockTimer();
      const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

      timerPage.resetSingleTimer(_mockTimer);

      const callCount: number = consoleSpy.mock.calls.length;
      expect(consoleSpy.mock.calls[callCount - 1][0])
        .toMatch('error resetting timer');
      expect(consoleSpy.mock.calls[callCount - 1][1]).toMatch('error response');
    }); // end 'should handle error response after trying to reset a timer' test

    test('should toggle timer controls displayed', () => {
      fixture.detectChanges();

      const _mockTimer: Timer = mockTimer();
      _mockTimer.show = false;

      timerPage.toggleTimerControls(_mockTimer);

      expect(_mockTimer.show).toBe(true);

      timerPage.toggleTimerControls(_mockTimer);

      expect(_mockTimer.show).toBe(false);
    }); // end 'should toggle timer controls displayed' test

    test('should toggle timer description displayed', () => {
      fixture.detectChanges();

      timerPage.showDescription = false;

      timerPage.toggleShowDescription();

      expect(timerPage.showDescription).toBe(true);

      timerPage.toggleShowDescription();

      expect(timerPage.showDescription).toBe(false);
    }); // end 'should toggle timer description displayed' test

  }); // end 'Non-Concurrent Timer' section


  describe('Concurrent Timers', () => {

    beforeEach(async(() => {
      timerPage.timers = mockConcurrentTimers();
    }));

    beforeEach(() => {
      timerPage.stepData = staticProcessSchedule.slice(2, 4);
      timerPage.batchId = staticBatch.cid;
      timerPage.isPreview = false;
    });

    test('should create the component', () => {
      fixture.detectChanges();

      expect(timerPage).toBeDefined();
    }); // end 'should create the component' test

    test('should initialize timers', () => {
      const _mockConcurrentTimers: Timer[] = mockConcurrentTimers();
      timerService.getTimersByProcessId = jest
        .fn()
        .mockReturnValue([
          new BehaviorSubject<Timer>(_mockConcurrentTimers[0]),
          new BehaviorSubject<Timer>(_mockConcurrentTimers[1])
        ]);

      timerPage.updateTimerInList = jest
        .fn();

      const updateSpy: jest.SpyInstance = jest
        .spyOn(timerPage, 'updateTimerInList');

      fixture.detectChanges();

      timerPage.initTimers();

      expect(timerPage.isConcurrent).toBe(true);
      expect(updateSpy.mock.calls[0][0])
        .toStrictEqual(_mockConcurrentTimers[0]);
      expect(updateSpy.mock.calls[1][0])
        .toStrictEqual(_mockConcurrentTimers[1]);
    }); // end 'should initialize timers' test

    test('should update a timer in the list', () => {
      const _mockTimer: Timer = mockTimer();
      const _mockConcurrentTimers: Timer[] = mockConcurrentTimers();
      timerPage.timers = _mockConcurrentTimers;

      fixture.detectChanges();

      expect(timerPage.timers.length).toBe(2);

      timerPage.updateTimerInList(_mockTimer);

      expect(timerPage.timers.length).toBe(3);
      expect(timerPage.timers[2]).toStrictEqual(_mockTimer);

      _mockConcurrentTimers[1].show = false;
      timerPage.updateTimerInList(_mockConcurrentTimers[1]);

      expect(timerPage.timers[1]).toStrictEqual(_mockConcurrentTimers[1]);
    }); // end 'should update a timer in the list' test

    test('should start all timers', () => {
      timerPage.startSingleTimer = jest
        .fn();

      const startSpy: jest.SpyInstance = jest
        .spyOn(timerPage, 'startSingleTimer');

      fixture.detectChanges();

      const _mockTimers: Timer[] = mockConcurrentTimers();

      timerPage.startAllTimers();

      expect(startSpy.mock.calls[0][0]).toStrictEqual(_mockTimers[0]);
      expect(startSpy.mock.calls[1][0]).toStrictEqual(_mockTimers[1]);
    }); // end 'should start all timers' test

    test('should stop all timers', () => {
      timerPage.stopSingleTimer = jest
        .fn();

      fixture.detectChanges();

      const _mockTimers: Timer[] = mockConcurrentTimers();
      const stopSpy: jest.SpyInstance = jest.spyOn(timerPage, 'stopSingleTimer');

      timerPage.stopAllTimers();

      expect(stopSpy.mock.calls[0][0]).toStrictEqual(_mockTimers[0]);
      expect(stopSpy.mock.calls[1][0]).toStrictEqual(_mockTimers[1]);
    }); // end 'should stop all timers' test

    test('should add to all timers', () => {
      timerPage.addToSingleTimer = jest
        .fn();

      fixture.detectChanges();

      const _mockTimers: Timer[] = mockConcurrentTimers();
      const addToSpy: jest.SpyInstance = jest
        .spyOn(timerPage, 'addToSingleTimer');

      timerPage.addToAllTimers();

      expect(addToSpy.mock.calls[0][0]).toStrictEqual(_mockTimers[0]);
      expect(addToSpy.mock.calls[1][0]).toStrictEqual(_mockTimers[1]);
    }); // end 'should add to all timers' test

    test('should reset all timers', () => {
      timerPage.resetSingleTimer = jest
        .fn();

      fixture.detectChanges();

      const _mockTimers: Timer[] = mockConcurrentTimers();
      const resetSpy: jest.SpyInstance = jest
        .spyOn(timerPage, 'resetSingleTimer');

      timerPage.resetAllTimers();

      expect(resetSpy.mock.calls[0][0]).toStrictEqual(_mockTimers[0]);
      expect(resetSpy.mock.calls[1][0]).toStrictEqual(_mockTimers[1]);
    }); // end 'should reset all timers' test

  }); // end 'Concurrent Timers' test

  describe('Other operations', () => {

    test('should check if changes are present', () => {
      fixture.detectChanges();

      const withChanges: SimpleChange = new SimpleChange(
        { a: 1 },
        { a: 2 },
        false
      );

      expect(timerPage.hasChanges(withChanges)).toBe(true);

      const withoutChanges: SimpleChange = new SimpleChange(
        { a: 1 },
        { a: 1 },
        false
      );

      expect(timerPage.hasChanges(withoutChanges)).toBe(false);
    }); // end 'should check if changes are present' test

  });

});
