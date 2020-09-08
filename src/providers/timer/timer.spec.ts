/* Module imports */
import { TestBed, getTestBed, async } from '@angular/core/testing';
import { Platform } from 'ionic-angular';
import { BackgroundMode } from '@ionic-native/background-mode';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { of } from 'rxjs/observable/of';

/* Configure test import */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Mock imports */
import { mockBatch } from '../../../test-config/mockmodels/mockBatch';
import { mockBatchTimer } from '../../../test-config/mockmodels/mockBatchTimer';
import { mockTimer, mockConcurrentTimers } from '../../../test-config/mockmodels/mockTimer';
import { BackgroundModeMock, PlatformMockDev } from '../../../test-config/mocks-ionic';

/* Interface imports */
import { Batch } from '../../shared/interfaces/batch';
import { Timer, BatchTimer } from '../../shared/interfaces/timer';
import { Process } from '../../shared/interfaces/process';
import { ProgressCircleSettings } from '../../shared/interfaces/progress-circle';

/* Provider imports */
import { ClientIdProvider } from '../client-id/client-id';
import { TimerProvider } from './timer';


describe('Timer Provider', () => {
  let injector: TestBed;
  let timerService: TimerProvider;
  let clientIdService: ClientIdProvider;
  let mockBackground: BackgroundMode;
  let mockPlatform: Platform;
  configureTestBed();

  beforeAll(async(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        TimerProvider,
        { provide: ClientIdProvider, useValue: {} },
        { provide: Platform, useClass: PlatformMockDev },
        { provide: BackgroundMode, useClass: BackgroundModeMock }
      ]
    });
  }));

  beforeEach(() => {
    injector = getTestBed();
    timerService = injector.get(TimerProvider);
    clientIdService = injector.get(ClientIdProvider);
    mockBackground = injector.get(BackgroundMode);
    mockPlatform = injector.get(Platform);
  });

  afterEach(() => {
    timerService.batchTimers.forEach(batchTimer => {
      batchTimer.timers.forEach(timer$ => {
        timer$.complete();
      });
    });
    timerService.batchTimers = [];
  });

  test('should perform initial timer setup', () => {
    // Platform mock width is 360
    expect(timerService.timing).not.toBeNull();
    expect(Math.floor(timerService.circumference)).toBe(653);
    expect(timerService.timerHeight).toBe(240);
    expect(timerService.timerStrokeWidth).toBe(8);
    expect(timerService.timerRadius).toBe(104);
    expect(timerService.timerOriginX).toBe(120);
    expect(timerService.timerOriginY).toBe(120);
    expect(timerService.timerDY).toMatch('0.3em');
  }); // end 'should perform initial timer setup' test

  test('should add a new batch timer', () => {
    timerService.getBatchTimerById = jest
      .fn()
      .mockReturnValue(undefined);

    const _mockTimer: Timer = mockTimer();

    timerService.getSettings = jest
      .fn()
      .mockReturnValue(_mockTimer.settings);

    let timeIndex: number = Date.now();

    clientIdService.getNewId = jest
      .fn()
      .mockImplementation(() => {
        return (timeIndex++).toString();
      });

    const _mockBatch: Batch = mockBatch();

    timerService.addBatchTimer(_mockBatch);

    expect(timerService.batchTimers.length).toBe(1);

    const _batchTimer: BatchTimer = timerService.batchTimers[0];

    expect(_batchTimer.batchId).toMatch(_mockBatch.cid);
    expect(_batchTimer.timers.length).toBe(7);

    const schedule: Process[] = _mockBatch.process.schedule;
    const timers: BehaviorSubject<Timer>[] = _batchTimer.timers;

    // First set of timers are concurrent, starts at index 2 in schedule, and
    // has 2 timers
    const _first1: Timer = timers[0].value;
    const _first2: Timer = timers[1].value;

    // both timers should have first set to id of first concurrent timer at
    // index 2
    expect(_first1.first).toMatch(schedule[2].cid);
    expect(_first2.first).toMatch(schedule[2].cid);

    // each timer subject should have a copy of the schedule timer they're
    // based on
    expect(_first1.timer).toStrictEqual(schedule[2]);
    expect(_first2.timer).toStrictEqual(schedule[3]);

    // Second set of timers are concurrent, starts at index 5 in schedule, and
    // has 3 timers
    const _second1: Timer = timers[2].value;
    const _second2: Timer = timers[3].value;
    const _second3: Timer = timers[4].value;

    // all timers should have first set to id of first concurrent timer at
    // index 5
    expect(_second1.first).toMatch(schedule[5].cid);
    expect(_second2.first).toMatch(schedule[5].cid);
    expect(_second3.first).toMatch(schedule[5].cid);

    // each timer subject should have a copy of the schedule timer they're
    // based on
    expect(_second1.timer).toStrictEqual(schedule[5]);
    expect(_second2.timer).toStrictEqual(schedule[6]);
    expect(_second3.timer).toStrictEqual(schedule[7]);

    // Third set of timers are not concurrent and starts at index 10 in schedule
    const _third: Timer = timers[5].value;
    expect(_third.first).toMatch(schedule[10].cid);
    expect(_third.timer).toStrictEqual(schedule[10]);

    // Fourth set of timers are not concurrent and starts at index 15 in
    // schedule
    const _fourth: Timer = timers[6].value;
    expect(_fourth.first).toMatch(schedule[15].cid);
    expect(_fourth.timer).toStrictEqual(schedule[15]);
  }); // end 'should add a new batch timer' test

  test('should not add a batch timer if one with the same id already exists', () => {
    timerService.getBatchTimerById = jest
      .fn()
      .mockReturnValue(mockBatchTimer());

    const _mockBatch: Batch = mockBatch();

    timerService.addBatchTimer(_mockBatch);

    expect(timerService.batchTimers.length).toBe(0);
  }); // end 'should not add a batch timer if one with the same id already exists' test

  test('should add a minute to a timer', done => {
    const _mockTimer: Timer = mockTimer();

    timerService.getTimerSubjectById = jest
      .fn()
      .mockReturnValue(new BehaviorSubject<Timer>(_mockTimer));

    timerService.setProgress = jest
      .fn();

    const originalDuration: number = _mockTimer.timer.duration;
    const originalRemaining: number = _mockTimer.timeRemaining;

    timerService.addTimeToTimer('batchId', _mockTimer.cid)
      .subscribe(
        (response: Timer): void => {
          expect(response.timer.duration).toBe(originalDuration + 1);
          expect(response.timeRemaining).toBe(originalRemaining + 60);
          done();
        },
        (error: any): void => {
          console.log('Should not get an error', error);
          expect(true).toBe(false);
        }
      );
  }); // end 'should add a minute to a timer' test

  test('should fail to add time to timer due to missing timer', done => {
    timerService.getTimerSubjectById = jest
      .fn()
      .mockReturnValue(undefined);

    timerService.addTimeToTimer('batchId', 'timerId')
      .subscribe(
        (response: any): void => {
          console.log('should not have a response', response);
          expect(true).toBe(false);
        },
        (error: string): void => {
          expect(error).toMatch('Timer not found');
          done();
        }
      );
  }); // end 'should fail to add time to timer due to missing timer' test

  test('should format the progress circle text', () => {
    expect(timerService.formatProgressCircleText(3661)).toMatch('1:01:01');
    expect(timerService.formatProgressCircleText(0)).toMatch('0');
    expect(timerService.formatProgressCircleText(3600)).toMatch('1:00:00');
  }); // end 'should format the progress circle text' test

  test('should get a batch timer by the batch id', () => {
    const _mockBatchTimerTarget: BatchTimer = mockBatchTimer();

    _mockBatchTimerTarget.batchId = 'target';

    const _mockBatchTimerOther: BatchTimer = mockBatchTimer();

    timerService.batchTimers = [
      _mockBatchTimerOther,
      _mockBatchTimerTarget
    ];

    const batchTimer: BatchTimer = timerService.getBatchTimerById('target');

    expect(batchTimer).toBeDefined();
  }); // end 'should get a batch timer by the batch id' test

  test('should get undefined if missing the batch timer', () => {
    const missingTimer: BatchTimer = timerService.getBatchTimerById('missing');

    expect(missingTimer).toBeUndefined();
  }); // end 'should get undefined if missing the batch timer' test

  test('should get css font value by time remaining', () => {
    expect(timerService.getFontSize(3601)).toMatch('48px');
    expect(timerService.getFontSize(61)).toMatch('60px');
    expect(timerService.getFontSize(1)).toMatch('80px');
  }); // end 'should get css font value' test

  test('should populate process circle settings', () => {
    const _mockBatch: Batch = mockBatch();

    const timerProcess: Process = _mockBatch.process.schedule[2];

    timerService.getFontSize = jest
      .fn()
      .mockReturnValue('60px');

    timerService.formatProgressCircleText = jest
      .fn()
      .mockReturnValue('1:00:00');

    const settings: ProgressCircleSettings = timerService
      .getSettings(timerProcess);

    expect(settings).toStrictEqual({
      height: 240,
      width: 240,
      circle: {
        strokeDasharray: '653.451271946677 653.451271946677',
        strokeDashoffset: '0',
        stroke: '#ffffff',
        strokeWidth: 8,
        fill: 'transparent',
        radius: 104,
        originX: 120,
        originY: 120
      },
      text: {
        textX: '50%',
        textY: '50%',
        textAnchor: 'middle',
        fill: 'white',
        fontSize: '60px',
        fontFamily: 'Arial',
        dY: '0.3em',
        content: '1:00:00'
      }
    })
  }); // end 'should populate process circle settings' test

  test('should get all timers associated with a process', () => {
    const _mockBatchTimer: BatchTimer = mockBatchTimer();
    const _mockBatch: Batch = mockBatch();
    const _mockConcurrentTimers: Timer[] = mockConcurrentTimers();

    timerService.getBatchTimerById = jest
      .fn()
      .mockReturnValue(_mockBatchTimer);

    // search for schedule index 2 for a pair of concurrent timers
    const result: BehaviorSubject<Timer>[] = timerService
      .getTimersByProcessId(
        _mockBatchTimer.batchId,
        _mockBatch.process.schedule[2].cid
      );

    expect(result.length).toBe(2);
    expect(result[0].value).toStrictEqual(_mockConcurrentTimers[0]);
    expect(result[1].value).toStrictEqual(_mockConcurrentTimers[1]);

    // has batch timers, but timer not present
    expect(
      timerService.getTimersByProcessId(_mockBatchTimer.batchId, 'void').length
    )
    .toBe(0);
  }); // end 'should get all timers associated with a process' test

  test('should get undefined when getting timers by process id if batch timer is missing', () => {
    const _mockBatch: Batch = mockBatch();
    const _mockBatchTimer: BatchTimer = mockBatchTimer();

    timerService.getBatchTimerById = jest
      .fn()
      .mockReturnValue(undefined);

    timerService.batchTimers = [ _mockBatchTimer ];

    expect(
      timerService
        .getTimersByProcessId(
          _mockBatchTimer.batchId,
          _mockBatch.process.schedule[2].cid
        )
    )
    .toBeUndefined();
  }); // end 'should get undefined when getting timers by process id if batch timer is missing' test

  test('should get a timer by its id', () => {
    const _mockBatchTimer: BatchTimer = mockBatchTimer();
    const _mockBatch: Batch = mockBatch();
    const _mockTimer: Timer = mockTimer();

    timerService.getBatchTimerById = jest
      .fn()
      .mockReturnValue(_mockBatchTimer);

    expect(
      timerService.getTimerSubjectById(_mockBatch.cid, _mockTimer.cid).value
    )
    .toStrictEqual(_mockTimer);
  }); // end 'should get a timer by its id' test

  test('should get undefined if batch timer not found or timer not found', () => {
    const _mockBatchTimer: BatchTimer = mockBatchTimer();

    timerService.getBatchTimerById = jest
      .fn()
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(_mockBatchTimer);

    expect(timerService.getTimerSubjectById('void', 'void'))
      .toBeUndefined();

    expect(timerService.getTimerSubjectById(_mockBatchTimer.batchId, 'void'))
      .toBeUndefined();
  }); // end 'should get undefined if batch timer not found or timer not found' test

  test('should remove a batch timer from list', () => {
    const _mockBatchTimerToRemove: BatchTimer = mockBatchTimer();
    _mockBatchTimerToRemove.batchId = 'target';

    const _mockBatchTimer: BatchTimer = mockBatchTimer();

    timerService.batchTimers = [
      _mockBatchTimer,
      _mockBatchTimerToRemove
    ];

    timerService.removeBatchTimer('target');

    expect(timerService.batchTimers.length).toBe(1);
    expect(timerService.batchTimers[0].batchId).toMatch(_mockBatchTimer.batchId);
  }); // end 'should remove a batch timer from list' test

  test('should not remove a batch timer if it is not in list', () => {
    const _mockBatchTimer: BatchTimer = mockBatchTimer();

    timerService.batchTimers = [
      _mockBatchTimer,
      _mockBatchTimer
    ];

    timerService.removeBatchTimer('missing');

    expect(timerService.batchTimers.length).toBe(2);
  }); // end 'should not remove a batch timer if it is not in list' test

  test('should reset a timer to a given duration', done => {
    const _mockTimer: Timer = mockTimer();
    _mockTimer.timeRemaining = 15;
    _mockTimer.timer.duration = 20;

    timerService.getTimerSubjectById = jest
      .fn()
      .mockReturnValue(new BehaviorSubject<Timer>(_mockTimer));

    timerService.setProgress = jest
      .fn();

    timerService.resetTimer('batchId', _mockTimer.cid, 30)
      .subscribe(
        (response: Timer): void => {
          expect(response.timer.duration).toBe(30);
          expect(response.timeRemaining).toBe(1800);
          done();
        },
        (error: any): void => {
          console.log('Should not get an error', error);
          expect(true).toBe(false);
        }
      );
  }); // end 'should reset a timer to a given duration' test

  test('should fail to reset a timer that is not found', done => {
    timerService.getTimerSubjectById = jest
      .fn()
      .mockReturnValue(undefined);

    timerService.resetTimer('void', 'void', 0)
      .subscribe(
        (response: any): void => {
          console.log('should not get a response', response);
          expect(true).toBe(false);
        },
        (error: string): void => {
          expect(error).toMatch('Timer not found');
          done();
        }
      );
  }); // end 'should fail to reset a timer that is not found' test

  test('should set timer css values based on progress', () => {
    const _mockTimer: Timer = mockTimer();

    timerService.getFontSize = jest
      .fn()
      .mockReturnValueOnce('60px')
      .mockReturnValueOnce('60px')
      .mockReturnValueOnce('90px');

    timerService.formatProgressCircleText = jest
      .fn()
      .mockReturnValueOnce('20:01')
      .mockReturnValueOnce('15:00')
      .mockReturnValueOnce('0');

    const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

    _mockTimer.isRunning = true;
    _mockTimer.timeRemaining = 1201;
    _mockTimer.timer.splitInterval = 2;

    timerService.setProgress(_mockTimer);

    expect(_mockTimer.settings.circle.strokeDashoffset)
      .toMatch('217.45406216447748');

    _mockTimer.timeRemaining = 900;

    timerService.setProgress(_mockTimer);

    expect(consoleSpy.mock.calls[0][0]).toMatch('interval alarm');

    _mockTimer.timeRemaining = 0;

    timerService.setProgress(_mockTimer);

    expect(consoleSpy.mock.calls[1][0]).toMatch('timer expired alarm');
    expect(_mockTimer.isRunning).toBe(false);
  }); // end 'should set timer css values based on progress' test

  test('should format a duration string', () => {
    expect(timerService.getFormattedDurationString(61))
      .toMatch('Duration: 1 hour 1 minute');
  }); // end 'should format a duration string' test

  test('should start a timer', done => {
    timerService.switchTimer = jest
      .fn()
      .mockReturnValue(of(mockTimer()));

    const switchSpy: jest.SpyInstance = jest.spyOn(timerService, 'switchTimer');

    timerService.startTimer('batchId', 'timerId')
      .subscribe(
        (response: Timer) => {
          expect(response).toBeDefined();
          expect(switchSpy).toHaveBeenCalledWith(
            'batchId',
            'timerId',
            true
          );
          done();
        },
        (error: any): void => {
          console.log(error);
          expect(true).toBe(false);
        }
      );
  }); // end 'should start a timer' test

  test('should stop a timer', done => {
    timerService.switchTimer = jest
      .fn()
      .mockReturnValue(of(mockTimer()));

    const switchSpy: jest.SpyInstance = jest.spyOn(timerService, 'switchTimer');

    timerService.stopTimer('batchId', 'timerId')
      .subscribe(
        (response: Timer): void => {
          expect(response).toBeDefined();
          expect(switchSpy).toHaveBeenCalledWith(
            'batchId',
            'timerId',
            false
          );
          done();
        },
        (error: any): void => {
          console.log('Should not get an error', error);
          expect(true).toBe(false);
        }
      );
  }); // end 'should stop a timer' test

  test('should toggle timer start', done => {
    const _mockTimer: Timer = mockTimer();

    timerService.getTimerSubjectById = jest
      .fn()
      .mockReturnValue(new BehaviorSubject<Timer>(_mockTimer));

    timerService.setProgress = jest
      .fn();

    timerService.switchTimer('batchId', 'timerId', true)
      .subscribe(
        (response: Timer): void => {
          expect(response.isRunning).toBe(true);
          done();
        },
        (error: any): void => {
          console.log('Should not get an error', error);
          expect(true).toBe(false);
        }
      );
  }); // end 'should toggle timer start' test

  test('should toggle timer stop', done => {
    const _mockTimer: Timer = mockTimer();
    
    timerService.getTimerSubjectById = jest
      .fn()
      .mockReturnValue(new BehaviorSubject<Timer>(_mockTimer));

    timerService.setProgress = jest
      .fn();

    timerService.switchTimer('batchId', 'timerId', false)
      .subscribe(
        (response: Timer): void => {
          expect(response.isRunning).toBe(false);
          done();
        },
        (error: any): void => {
          console.log('Should not get an error', error);
          expect(true).toBe(false);
        }
      );
  }); // end 'should toggle timer stop' test

  test('should fail to toggle a timer due to missing timer', done => {
    timerService.getTimerSubjectById = jest
      .fn()
      .mockReturnValue(undefined);

    timerService.switchTimer('batchId', 'timerId', true)
      .subscribe(
        (response: any): void => {
          console.log('should not get a response', response);
          expect(true).toBe(false);
        },
        (error: string): void => {
          expect(error).toMatch('Timer not found');
          done();
        }
      );
  }); // end 'should fail to toggle a timer due to missing timer' test

  test('should update running timers each tick', () => {
    timerService.setProgress = jest
      .fn();

    // setup two batch timers and start separate timers in each
    const _mockBatchTimer1: BatchTimer = mockBatchTimer();
    _mockBatchTimer1.batchId = 'batchTimer1';

    // start the first timer
    const timer1$: BehaviorSubject<Timer> = _mockBatchTimer1.timers[0];
    const timer1: Timer = timer1$.value;
    timer1.isRunning = true;
    timer1.timeRemaining = 1;
    timer1$.next(timer1);

    const _mockBatchTimer2: BatchTimer = mockBatchTimer();
    _mockBatchTimer2.batchId = 'batchTimer2';

    // start the second and third concurrent timers
    const timer2$: BehaviorSubject<Timer> = _mockBatchTimer2.timers[1];
    const timer3$: BehaviorSubject<Timer> = _mockBatchTimer2.timers[2];
    const timer2: Timer = timer2$.value;
    const timer3: Timer = timer3$.value;
    timer2.isRunning = true;
    timer3.isRunning = true;
    timer2.timeRemaining = 3600;
    timer3.timeRemaining = 2700;
    timer2$.next(timer2);
    timer3$.next(timer3);

    timerService.batchTimers = [
      _mockBatchTimer1,
      _mockBatchTimer2
    ];

    timerService.tick();

    expect(timer1$.value.timeRemaining).toBe(0);
    expect(timer2$.value.timeRemaining).toBe(3599);
    expect(timer3$.value.timeRemaining).toBe(2699);

    timerService.tick();

    expect(timer1$.value.isRunning).toBe(false);
  }); // end 'should update running timers each tick' test

  test('should update background notification', () => {
    mockPlatform.is = jest
      .fn()
      .mockReturnValue(true);
    mockBackground.isEnabled = jest
      .fn()
      .mockReturnValue(true);
    mockBackground.configure = jest
      .fn();

    const configureSpy: jest.SpyInstance = jest
      .spyOn(mockBackground, 'configure');

    const _mockBatch: Batch = mockBatch();
    const _mockTimer: Timer = mockTimer();
    _mockTimer.isRunning = true;

    const _mockBatchTimer1: BatchTimer = {
      batchId: _mockBatch.cid,
      timers: [
        new BehaviorSubject<Timer>(_mockTimer),
        new BehaviorSubject<Timer>(_mockTimer)
      ]
    };

    const _mockBatchTimer2: BatchTimer = {
      batchId: _mockBatch.cid,
      timers: [
        new BehaviorSubject<Timer>(_mockTimer),
        new BehaviorSubject<Timer>(_mockTimer)
      ]
    };

    timerService.batchTimers = [_mockBatchTimer1, _mockBatchTimer2];

    timerService.updateNotifications();

    expect(configureSpy).toHaveBeenCalledWith(
      {
        title: 'content',
        text: '4 timers running',
        hidden: false,
        silent: false,
        color: '40e0cf'
      }
    );
  }); // end 'should update background notification' test

});
