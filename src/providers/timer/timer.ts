/* Module imports */
import { Injectable } from '@angular/core';
import { Platform } from 'ionic-angular';
import { BackgroundMode } from '@ionic-native/background-mode';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { _throw as throwError } from 'rxjs/observable/throw';

/* Interface imports */
import { Timer, BatchTimer } from '../../shared/interfaces/timer';
import { Batch } from '../../shared/interfaces/batch';
import { ProgressCircleSettings } from '../../shared/interfaces/progress-circle';
import { Process } from '../../shared/interfaces/process';

/* Utility imports */
import {
  hasId,
  clone
} from '../../shared/utility-functions/utilities';

/* Provider imports */
import { ClientIdProvider } from '../client-id/client-id';


@Injectable()
export class TimerProvider {
  batchTimers: Array<BatchTimer> = [];
  timing: any = null;

  circumference: number;
  timerHeight: number;
  timerWidth: number;
  timerStrokeWidth: number;
  timerRadius: number;
  timerOriginX: number;
  timerOriginY: number;
  timerDY: string;

  timerStroke: string = '#ffffff';
  timerCircleFill: string = 'transparent';
  timerTextFill: string = 'white';
  timerTextXY: string = '50%';
  timerTextAnchor: string = 'middle';
  timerFontFamily: string = 'Arial';

  constructor(
    public platform: Platform,
    public backgroundMode: BackgroundMode,
    public clientIdService: ClientIdProvider
  ) {
    if (this.platform.is('cordova')) {
      this.backgroundMode.enable();
    }
    this.timing = setInterval(() => {
      this.tick();
    }, 1000);
    this.setupInitialSettings();
  }

  /**
   * Add a new batch set of timers
   *
   * @params: batch - new Batch to generate batch timer
   *
   * @return: none
  **/
  addBatchTimer(batch: Batch): void {
    console.log('adding batch timer');
    if (this.getBatchTimerById(batch.cid) !== undefined) return;

    let timers: Array<BehaviorSubject<Timer>> = [];
    let concurrentIndex: number = 0;
    for (let i=0; i < batch.schedule.length; i++) {
      if (batch.schedule[i].type === 'timer') {
        const timeRemaining: number = batch.schedule[i].duration * 60; // change duration from minutes to seconds

        const newTimer$: BehaviorSubject<Timer> = new BehaviorSubject<Timer>({
          cid: this.clientIdService.getNewId(),
          first: batch.schedule[i - concurrentIndex].cid,
          timer: clone(batch.schedule[i]),
          timeRemaining: timeRemaining,
          show: false,
          isRunning: false,
          settings: this.getSettings(batch.schedule[i])
        });
        timers.push(newTimer$);

        if (i < batch.schedule.length - 1
          && batch.schedule[i].concurrent
          && batch.schedule[i + 1].concurrent) {
          concurrentIndex++;
        } else {
          concurrentIndex = 0;
        }
      }
    }
    this.batchTimers.push({
      batchId: batch.cid,
      timers: timers
    });
  }

  /**
   * Add a minute to a timer
   *
   * @params: batchId - batch id associated with BatchTimer
   * @params: timerId - timer id within BatchTimer to update
   *
   * @return: observable of updated timer
  **/
  addTimeToTimer(batchId: string, timerId: string): Observable<Timer> {
    const timer$: BehaviorSubject<Timer> = this.getTimerSubjectById(batchId, timerId);
    if (timer$ === undefined) return throwError('Timer not found');

    const timer: Timer = timer$.value;
    timer.timer.duration++;
    timer.timeRemaining += 60;
    this.setProgress(timer);
    timer$.next(timer);
    return timer$;
  }

  /**
   * Format the time remaining text inside progress circle
   *
   * @params: timeRemaining - time remaining in seconds
   *
   * @return: datetime string in hh:mm:ss format - hour/minutes removed if zero
  **/
  formatProgressCircleText(timeRemaining: number): string {
    let remainder: number = timeRemaining;
    let result: string = '';
    let hours: number, minutes: number;
    if (remainder > 3599) {
      hours = Math.floor(remainder / 3600);
      remainder = remainder % 3600;
      result += hours + ':';
    }
    if (remainder > 59) {
      minutes = Math.floor(remainder / 60);
      remainder = remainder % 60;
      result += minutes < 10 && timeRemaining > 599 ? '0': '';
      result += minutes + ':';
    }
    result += remainder < 10 ? '0': '';
    result += remainder;
    return result;
  }

  /**
   * Get a batch timer by its id
   *
   * @params: batchId - batch id associated with batch timer
   *
   * @return: the BatchTimer associated with given batch id else undefined if
   *          not found
  **/
  getBatchTimerById(batchId: string): BatchTimer {
    return this.batchTimers.find(batchTimer => batchTimer.batchId === batchId);
  }

  /**
   * Get the appropriate font size for timer display based on the
   * number of digits to be displayed
   *
   * @params: timeRemaining - remaining time in seconds
   *
   * @return: css font size value
  **/
  getFontSize(timeRemaining: number): string {
    if (timeRemaining > 3600) {
      return `${Math.round(this.timerWidth / 5)}px`;
    } else if (timeRemaining > 60) {
      return `${Math.round(this.timerWidth / 4)}px`;
    } else {
      return `${Math.round(this.timerWidth / 3)}px`;
    }
  }

  /**
   * Get timer progress circle settings
   *
   * @params: process - Process to help create settings
   *
   * @return: ProgressCircleSettings object
  **/
  getSettings(process: Process): ProgressCircleSettings {
    return {
      height: this.timerHeight,
      width: this.timerWidth,
      circle: {
        strokeDasharray: `${this.circumference} ${this.circumference}`,
        strokeDashoffset: '0',
        stroke: this.timerStroke,
        strokeWidth: this.timerStrokeWidth,
        fill: this.timerCircleFill,
        radius: this.timerRadius,
        originX: this.timerOriginX,
        originY: this.timerOriginY
      },
      text: {
        textX: this.timerTextXY,
        textY: this.timerTextXY,
        textAnchor: this.timerTextAnchor,
        fill: this.timerTextFill,
        fontSize: this.getFontSize(process.duration * 60),
        fontFamily: this.timerFontFamily,
        dY: this.timerDY,
        content: this.formatProgressCircleText(process.duration * 60)
      }
    };
  }

  /**
   * Get all timer behaviorsubjects associated with given process id
   *
   * @params: batchId - batch id assigned to batchTimer
   * @params: processId -  the Process to match timers to
   *
   * @return: array of timer behaviorsubjects associated to process else
   *          else undefined if not found
  **/
  getTimersByProcessId(batchId: string, processId: string): Array<BehaviorSubject<Timer>> {
    const batchTimer: BatchTimer = this.getBatchTimerById(batchId);
    if (batchTimer === undefined) return undefined;

    return batchTimer.timers.filter(timer$ => timer$.value.first === processId);
  }

  /**
   * Get timer behaviorsubject by its id
   *
   * @params: batchId - batch id used to search for BatchTimer
   * @params: timerId - Timer id to search
   *
   * @return: timer behaviorsubject else undefined if not found
  **/
  getTimerSubjectById(batchId: string, timerId: string): BehaviorSubject<Timer> {
    const batchTimer: BatchTimer = this.getBatchTimerById(batchId);
    if (batchTimer === undefined) return undefined;

    return batchTimer.timers.find(timer$ => hasId(timer$.value, timerId));
  }

  /**
   * Remove a BatchTimer from list
   *
   * @params: batchId - batch id associated with BatchTimer
   *
   * @return: none
  **/
  removeBatchTimer(batchId: string): void {
    const batchTimerIndex: number = this.batchTimers.findIndex(batchTimer => {
      return batchTimer.batchId === batchId;
    });
    if (batchTimerIndex === -1) return;

    this.batchTimers[batchTimerIndex].timers.forEach(timer$ => timer$.complete());
    this.batchTimers.splice(batchTimerIndex, 1);
  }

  /**
   * Stop a timer and reset its duration and time remaining
   *
   * @params: batchId - batch id associated with BatchTimer
   * @params: timerId - timer id within BatchTimer to update
   * @params: duration - duration in minutes
   *
   * @return: observable of updated timer
  **/
  resetTimer(batchId: string, timerId: string, duration: number): Observable<Timer> {
    const timer$: BehaviorSubject<Timer> = this.getTimerSubjectById(batchId, timerId);
    if (timer$ === undefined) return throwError('Timer not found');

    const timer: Timer = timer$.value;
    timer.isRunning = false;
    timer.timer.duration = duration;
    timer.timeRemaining = timer.timer.duration * 60;
    this.setProgress(timer);
    timer$.next(timer);
    return timer$;
  }

  /**
  * Update css values as timer progresses
  *
  * @params: timer - a timer type process step instance
  *
  * @return: none
  **/
  setProgress(timer: Timer): void {
    timer.settings.text.fontSize = this.getFontSize(timer.timeRemaining);
    timer.settings.circle.strokeDashoffset = `
      ${this.circumference - timer.timeRemaining / (timer.timer.duration * 60) * this.circumference}
    `;
    timer.settings.text.content = this.formatProgressCircleText(timer.timeRemaining);
    if (timer.timeRemaining < 1) {
      timer.isRunning = false;
      // TODO activate alarm
      console.log('timer expired alarm');
    } else if (timer.timer.splitInterval > 1) {
      const interval: number = timer.timer.duration * 60 / timer.timer.splitInterval;
      if (timer.timeRemaining % interval === 0) {
        // TODO activate interval alarm
        console.log('interval alarm');
      }
    }
  }

  /**
   * Generate initial base settings for timers
   *
   * @params: none
   * @return: none
  **/
  setupInitialSettings(): void {
    const width: number = Math.round(this.platform.width() * 2 / 3);
    const strokeWidth: number = 8;
    const radius: number = (width / 2) - (strokeWidth * 2);
    const circumference: number = radius * 2 * Math.PI;
    this.circumference = circumference;
    this.timerHeight = width;
    this.timerWidth = width;
    this.timerStrokeWidth = strokeWidth;
    this.timerRadius = radius;
    this.timerOriginX = width / 2;
    this.timerOriginY = width / 2;
    this.timerDY = `${this.timerWidth / 800}em`;
  }

  /**
   * Start a timer by id
   *
   * @params: batchId - batch id associated with BatchTimer
   * @params: timerId - timer id within BatchTimer to update
   *
   * @return: observable of updated timer
  **/
  startTimer(batchId: string, timerId: string): Observable<Timer> {
    return this.switchTimer(batchId, timerId, true);
  }

  /**
   * Stop a timer by id
   *
   * @params: batchId - batch id associated with BatchTimer
   * @params: timerId - timer id within BatchTimer to update
   *
   * @return: observable of updated timer
  **/
  stopTimer(batchId: string, timerId: string): Observable<Timer> {
    return this.switchTimer(batchId, timerId, false);
  }

  /**
   * Toggle timer start/stop
   *
   * @params: batchId - batch id associated with BatchTimer
   * @params: timerId - timer id within BatchTimer to update
   * @params: run - true if timer should run, false if should stop
   *
   * @return: observable of updated timer
  **/
  switchTimer(batchId: string, timerId: string, run: boolean): Observable<Timer> {
    const timer$: BehaviorSubject<Timer> = this.getTimerSubjectById(batchId, timerId);
    if (timer$ === undefined) return throwError('Timer not found');

    const timer: Timer = timer$.value;
    timer.isRunning = run;
    this.setProgress(timer);
    timer$.next(timer);
    return timer$;
  }

  /**
   * Update all running timers
   *
   * @params: none
   * @return: none
  **/
  tick(): void {
    this.batchTimers.forEach(batchTimer => {
      batchTimer.timers.forEach(timer$ => {
        const timer: Timer = timer$.value;
        if (timer.isRunning) {
          if (timer.timeRemaining > 0) {
            timer.timeRemaining--;
          } else {
            timer.isRunning = false;
          }
        }
        this.setProgress(timer);
        timer$.next(timer);
      });
    });
  }

}
