/* Module imports */
import { ComponentFixture, TestBed, getTestBed, async } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SimpleChange } from '@angular/core';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { IonicModule } from 'ionic-angular';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { of } from 'rxjs/observable/of';

/* Test configuration imports */
import { configureTestBed } from '../../../../../test-config/configureTestBed';

/* Interface imports */
import { Timer } from '../../../../shared/interfaces/timer';

/* Mock imports */
import { mockTimer, mockConcurrentTimers } from '../../../../../test-config/mockmodels/mockTimer';
import { mockBatch } from '../../../../../test-config/mockmodels/mockBatch';
import { mockProcessSchedule } from '../../../../../test-config/mockmodels/mockProcessSchedule';

/* Component imports */
import { TimerProcessComponent } from './timer-process';

/* Provider imports */
import { TimerProvider } from '../../../../providers/timer/timer';


describe('Timer Process Component', () => {
  let injector: TestBed;
  let timerService; TimerProvider;
  let timerPage: TimerProcessComponent;
  let fixture: ComponentFixture<TimerProcessComponent>;
  configureTestBed();

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      declarations: [
        TimerProcessComponent
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
  }));

  describe('Non-Concurrent Timer', () => {

    beforeEach(async(() => {
      timerService.getTimersByProcessId = jest
        .fn()
        .mockReturnValue([ new BehaviorSubject<Timer>(mockTimer()) ]);
    }));

    beforeEach(() => {
      timerPage.stepData = [mockProcessSchedule()[10]];
      timerPage.batchId = mockBatch().cid;
      timerPage.isPreview = false;
    });

    test('should create the component', () => {
      fixture.detectChanges();

      expect(timerPage).toBeDefined();
    }); // end 'should create the component' test

    test('should detect changes to step data', () => {
      timerPage.initTimers = jest
        .fn();

      const timerSpy = jest.spyOn(timerPage, 'initTimers');

      const _schedule = mockProcessSchedule();
      const _firstTimer = [_schedule[10]];
      const _secondTimer = [_schedule[15]];

      timerPage.stepData = _firstTimer;

      timerPage.ngOnChanges({
        stepData: new SimpleChange(null, _secondTimer, true)
      });

      fixture.detectChanges();

      expect(timerPage.stepData).toStrictEqual(_secondTimer);
      expect(timerSpy).toHaveBeenCalled();

      timerPage.isPreview = false;

      timerPage.ngOnChanges({
        isPreview: new SimpleChange(null, true, true)
      });

      fixture.detectChanges();

      expect(timerPage.isPreview).toBe(true);
    }); // end 'should detect changes to step data' test

    test('should initialize timers', done => {
      fixture.detectChanges();

      const updateSpy = jest.spyOn(timerPage, 'updateTimerInList');

      timerPage.initTimers();

      setTimeout(() => {
        expect(timerPage.isConcurrent).toBe(false);
        expect(updateSpy).toHaveBeenCalledWith(mockTimer());
        done();
      }, 10);
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

    test('should handle adding a minute to a timer', done => {
      timerService.addTimeToTimer = jest
        .fn()
        .mockReturnValue(of({}));

      fixture.detectChanges();

      const _mockTimer = mockTimer();
      const consoleSpy = jest.spyOn(console, 'log');

      timerPage.addToSingleTimer(_mockTimer);

      setTimeout(() => {
        const callCount = consoleSpy.mock.calls.length;
        expect(consoleSpy.mock.calls[callCount - 1][0]).toMatch('added time to timer');
        expect(consoleSpy.mock.calls[callCount - 1][1]).toMatch(_mockTimer.cid);
        done();
      }, 10);
    }); // end 'should handle adding a minute to a timer' test

    test('should handle error response after trying to add a minute to a timer', done => {
      timerService.addTimeToTimer = jest
        .fn()
        .mockReturnValue(new ErrorObservable('error response'));

      fixture.detectChanges();

      const _mockTimer = mockTimer();
      const consoleSpy = jest.spyOn(console, 'log');

      timerPage.addToSingleTimer(_mockTimer);

      setTimeout(() => {
        const callCount = consoleSpy.mock.calls.length;
        expect(consoleSpy.mock.calls[callCount - 1][0]).toMatch('error adding time to timer');
        expect(consoleSpy.mock.calls[callCount - 1][1]).toMatch('error response');
        done();
      }, 10);
    }); // end 'should handle error response after trying to add a minute to a timer' test

    test('should get appropriate animation values if timer controls should be shown', () => {
      fixture.detectChanges();

      const _mockTimer = mockTimer();

      _mockTimer.show = true;
      const expanded = timerPage.isExpanded(_mockTimer);
      expect(expanded).toStrictEqual({
        value: 'expanded',
        params: {
          height: timerPage.slidingTimers.last.nativeElement.clientHeight,
          speed: 250
        }
      });

      _mockTimer.show = false;
      const collapsed = timerPage.isExpanded(_mockTimer);
      expect(collapsed).toStrictEqual({
        value: 'collapsed',
        params: {
          height: timerPage.slidingTimers.last.nativeElement.clientHeight,
          speed: 250
        }
      });
    }); // end 'should get appropriate animation values if timer controls should be shown' test

    test('should handle starting a timer', done => {
      timerService.startTimer = jest
        .fn()
        .mockReturnValue(of({}));

      fixture.detectChanges();

      const _mockTimer = mockTimer();
      const consoleSpy = jest.spyOn(console, 'log');

      timerPage.startSingleTimer(_mockTimer);

      setTimeout(() => {
        const callCount = consoleSpy.mock.calls.length;
        expect(consoleSpy.mock.calls[callCount - 1][0]).toMatch('started timer');
        expect(consoleSpy.mock.calls[callCount - 1][1]).toMatch(_mockTimer.cid);
        done();
      }, 10);
    }); // end 'should handle starting a timer' test

    test('should handle error response after trying to start a timer', done => {
      timerService.startTimer = jest
        .fn()
        .mockReturnValue(new ErrorObservable('error response'));

      fixture.detectChanges();

      const _mockTimer = mockTimer();
      const consoleSpy = jest.spyOn(console, 'log');

      timerPage.startSingleTimer(_mockTimer);

      setTimeout(() => {
        const callCount = consoleSpy.mock.calls.length;
        expect(consoleSpy.mock.calls[callCount - 1][0]).toMatch('error starting timer');
        expect(consoleSpy.mock.calls[callCount - 1][1]).toMatch('error response');
        done();
      }, 10);
    }); // end 'should handle error response after trying to start a timer' test

    test('should handle stopping a timer', done => {
      timerService.stopTimer = jest
        .fn()
        .mockReturnValue(of({}));

      fixture.detectChanges();

      const _mockTimer = mockTimer();
      const consoleSpy = jest.spyOn(console, 'log');

      timerPage.stopSingleTimer(_mockTimer);

      setTimeout(() => {
        const callCount = consoleSpy.mock.calls.length;
        expect(consoleSpy.mock.calls[callCount - 1][0]).toMatch('stopped timer');
        expect(consoleSpy.mock.calls[callCount - 1][1]).toMatch(_mockTimer.cid);
        done();
      }, 10);
    }); // end 'should handle stopping a timer' test

    test('should handle error response after trying to stop a timer', done => {
      timerService.stopTimer = jest
        .fn()
        .mockReturnValue(new ErrorObservable('error response'));

      fixture.detectChanges();

      const _mockTimer = mockTimer();
      const consoleSpy = jest.spyOn(console, 'log');

      timerPage.stopSingleTimer(_mockTimer);

      setTimeout(() => {
        const callCount = consoleSpy.mock.calls.length;
        expect(consoleSpy.mock.calls[callCount - 1][0]).toMatch('error stopping timer');
        expect(consoleSpy.mock.calls[callCount - 1][1]).toMatch('error response');
        done();
      }, 10);
    }); // end 'should handle error response after trying to stop a timer' test

    test('should handle resetting a timer', done => {
      timerService.resetTimer = jest
        .fn()
        .mockReturnValue(of({}));

      fixture.detectChanges();

      const _mockTimer = mockTimer();
      const consoleSpy = jest.spyOn(console, 'log');

      timerPage.resetSingleTimer(_mockTimer);

      setTimeout(() => {
        const callCount = consoleSpy.mock.calls.length;
        expect(consoleSpy.mock.calls[callCount - 1][0]).toMatch('reset timer');
        expect(consoleSpy.mock.calls[callCount - 1][1]).toMatch(_mockTimer.cid);
        done();
      }, 10);
    }); // end 'should handle resetting a timer' test

    test('should handle error response after trying to reset a timer', done => {
      timerService.resetTimer = jest
        .fn()
        .mockReturnValue(new ErrorObservable('error response'));

      fixture.detectChanges();

      const _mockTimer = mockTimer();
      const consoleSpy = jest.spyOn(console, 'log');

      timerPage.resetSingleTimer(_mockTimer);

      setTimeout(() => {
        const callCount = consoleSpy.mock.calls.length;
        expect(consoleSpy.mock.calls[callCount - 1][0]).toMatch('error resetting timer');
        expect(consoleSpy.mock.calls[callCount - 1][1]).toMatch('error response');
        done();
      }, 10);
    }); // end 'should handle error response after trying to reset a timer' test

    test('should toggle timer controls displayed', () => {
      fixture.detectChanges();

      const _mockTimer = mockTimer();
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

    test('should format a duration (in minutes) to hours:minutes', () => {
      fixture.detectChanges();

      expect(timerPage.getFormattedDurationString(61)).toMatch('1 hour 1 minute');
      expect(timerPage.getFormattedDurationString(30)).toMatch('30 minutes');
      expect(timerPage.getFormattedDurationString(120)).toMatch('2 hours');
    }); // end 'should format a duration (in minutes) to hours:minutes' test

  }); // end 'Non-Concurrent Timer' section


  describe('Concurrent Timers', () => {

    beforeEach(async(() => {
      timerService.getTimersByProcessId = jest
        .fn()
        .mockReturnValue([
          new BehaviorSubject<Timer>(mockConcurrentTimers()[0]),
          new BehaviorSubject<Timer>(mockConcurrentTimers()[1])
        ]);
    }));

    beforeEach(() => {
      timerPage.stepData = mockProcessSchedule().slice(2, 4);
      timerPage.batchId = mockBatch().cid;
      timerPage.isPreview = false;
    });

    test('should create the component', () => {
      fixture.detectChanges();

      expect(timerPage).toBeDefined();
    }); // end 'should create the component' test

    test('should initialize timers', done => {
      fixture.detectChanges();

      const _timers = mockConcurrentTimers();
      const updateSpy = jest.spyOn(timerPage, 'updateTimerInList');

      timerPage.initTimers();

      setTimeout(() => {
        expect(timerPage.isConcurrent).toBe(true);
        expect(updateSpy.mock.calls[0][0]).toStrictEqual(_timers[0]);
        expect(updateSpy.mock.calls[1][0]).toStrictEqual(_timers[1]);
        done();
      }, 10);
    }); // end 'should initialize timers' test

    test('should update a timer in the list', () => {
      fixture.detectChanges();

      const _mockTimer = mockTimer();
      const _mockTimers = mockConcurrentTimers();

      expect(timerPage.timers.length).toBe(2);

      timerPage.updateTimerInList(_mockTimer);

      expect(timerPage.timers.length).toBe(3);
      expect(timerPage.timers[2]).toStrictEqual(_mockTimer);

      _mockTimers[1].show = false;
      timerPage.updateTimerInList(_mockTimers[1]);

      expect(timerPage.timers[1]).toStrictEqual(_mockTimers[1]);
    }); // end 'should update a timer in the list' test

    test('should start all timers', () => {
      timerPage.startSingleTimer = jest
        .fn();

      fixture.detectChanges();

      const _mockTimers = mockConcurrentTimers();
      const startSpy = jest.spyOn(timerPage, 'startSingleTimer');

      timerPage.startAllTimers();

      expect(startSpy.mock.calls[0][0]).toStrictEqual(_mockTimers[0]);
      expect(startSpy.mock.calls[1][0]).toStrictEqual(_mockTimers[1]);
    }); // end 'should start all timers' test

    test('should stop all timers', () => {
      timerPage.stopSingleTimer = jest
        .fn();

      fixture.detectChanges();

      const _mockTimers = mockConcurrentTimers();
      const stopSpy = jest.spyOn(timerPage, 'stopSingleTimer');

      timerPage.stopAllTimers();

      expect(stopSpy.mock.calls[0][0]).toStrictEqual(_mockTimers[0]);
      expect(stopSpy.mock.calls[1][0]).toStrictEqual(_mockTimers[1]);
    }); // end 'should stop all timers' test

    test('should add to all timers', () => {
      timerPage.addToSingleTimer = jest
        .fn();

      fixture.detectChanges();

      const _mockTimers = mockConcurrentTimers();
      const addToSpy = jest.spyOn(timerPage, 'addToSingleTimer');

      timerPage.addToAllTimers();

      expect(addToSpy.mock.calls[0][0]).toStrictEqual(_mockTimers[0]);
      expect(addToSpy.mock.calls[1][0]).toStrictEqual(_mockTimers[1]);
    }); // end 'should add to all timers' test

    test('should reset all timers', () => {
      timerPage.resetSingleTimer = jest
        .fn();

      fixture.detectChanges();

      const _mockTimers = mockConcurrentTimers();
      const resetSpy = jest.spyOn(timerPage, 'resetSingleTimer');

      timerPage.resetAllTimers();

      expect(resetSpy.mock.calls[0][0]).toStrictEqual(_mockTimers[0]);
      expect(resetSpy.mock.calls[1][0]).toStrictEqual(_mockTimers[1]);
    }); // end 'should reset all timers' test

  }); // end 'Concurrent Timers' test

});
