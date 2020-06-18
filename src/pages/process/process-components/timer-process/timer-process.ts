/* Module imports */
import { Component, ViewChildren, Input, QueryList, ElementRef, OnInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { take } from 'rxjs/operators/take';
import { takeUntil } from 'rxjs/operators/takeUntil';

/* Interface imports */
import { Process } from '../../../../shared/interfaces/process';
import { Timer } from '../../../../shared/interfaces/timer';

/* Utility imports */
import { hasId } from '../../../../shared/utility-functions/utilities';

/* Animation imports */
import { slideUpDown } from '../../../../animations/slide';

/* Provider imports */
import { TimerProvider } from '../../../../providers/timer/timer';


@Component({
  selector: 'timer-process',
  templateUrl: 'timer-process.html',
  animations: [
    slideUpDown()
  ]
})
export class TimerProcessComponent implements OnInit, OnChanges, OnDestroy {
  @Input() stepData: Array<Process>;
  @Input() batchId: string;
  @Input() isPreview: boolean;
  @ViewChildren('slidingTimers') slidingTimers: QueryList<ElementRef>;

  showDescription: boolean = false;
  isConcurrent: boolean = false;
  destroy$: Subject<boolean> = new Subject<boolean>();
  timers: Array<Timer> = [];

  constructor(public timerService: TimerProvider) { }

  /***** Lifecycle Hooks *****/

  ngOnInit() {
    this.initTimers();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.stepData !== undefined && changes.stepData.currentValue !== undefined) {
      this.stepData = changes.stepData.currentValue;
      this.destroy$.next(true);
      this.initTimers();
    }
    if (changes.isPreview !== undefined && changes.isPreview.currentValue !== undefined) {
      this.isPreview = changes.isPreview.currentValue;
    }
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  /***** End Lifecycle Hooks *****/

  /**
   * Initialize timers for the current step and subscribe to their subjects
   *
   * @params: none
   * @return: none
  **/
  initTimers(): void {
    this.timers = [];
    const timers: Array<BehaviorSubject<Timer>> = this.timerService.getTimersByProcessId(this.batchId, this.stepData[0].cid);
    this.isConcurrent = timers.length > 1;
    timers.forEach(timer$ => {
      timer$
        .pipe(takeUntil(this.destroy$))
        .subscribe(timer => {
          this.updateTimerInList(timer);
        });
    });
  }

  /**
   * Update a timer in timers list
   *
   * @params: timer - updated Timer
   *
   * @return: none
  **/
  updateTimerInList(timer: Timer): void {
    const timerIndex: number = this.timers.findIndex(_timer => _timer.cid === timer.cid);
    if (timerIndex === -1) {
      this.timers.push(timer);
    } else {
      this.timers[timerIndex] = timer;
    }
  }

  /**
   * Add a minute to a single timer instance
   *
   * @params: timer - the timer with which to add time
   *
   * @return: none
  **/
  addToSingleTimer(timer: Timer): void {
    this.timerService.addToTimer(this.batchId, timer.cid)
      .pipe(take(1))
      .subscribe(
        () => {
          console.log('added time to timer', timer.cid);
        },
        error => {
          console.log('error adding time to timer', error);
        }
      );
  }

  /**
   * Trigger for slideUpDown animation
   *
   * @params: timer - Timer on which to trigger the animation
   *
   * @return: object - sets state value and params for animation
  **/
  isExpanded(timer: Timer): object {
    if (this.slidingTimers === undefined) return {};
    return {
      value: timer.show ? 'expanded': 'collapsed',
      params: {
        height: this.slidingTimers.last.nativeElement.clientHeight,
        speed: 250
      }
    };
  }

  /**
   * Start a single timer instance
   *
   * @params: timer - the timer to start
   *
   * @return: none
  **/
  startSingleTimer(timer: Timer): void {
    this.timerService.startTimer(this.batchId, timer.cid)
      .pipe(take(1))
      .subscribe(
        () => {
          console.log('started timer', timer.cid);
        },
        error => {
          console.log('error starting timer', error);
        }
      );
  }

  /**
   * Stop a single timer instance
   *
   * @params: timer - the timer to stop
   *
   * @return: none
  **/
  stopSingleTimer(timer: Timer): void {
    this.timerService.stopTimer(this.batchId, timer.cid)
      .pipe(take(1))
      .subscribe(
        () => {
          console.log('stopped timer', timer.cid);
        },
        error => {
          console.log('error stopping timer', error);
        }
      );
  }

  /**
   * Reset a single timer instance
   *
   * @params: timer - the timer to reset
   *
   * @return: none
  **/
  resetSingleTimer(timer: Timer): void {
    const process: Process = this.stepData.find(process => {
      return hasId(process, timer.timer.cid);
    });
    this.timerService.resetTimer(this.batchId, timer.cid, process.duration)
      .pipe(take(1))
      .subscribe(
        () => {
          console.log('reset timer', timer.cid);
        },
        error => {
          console.log('error resetting timer', error);
        }
      );
  }

  /**
   * Start all timers for the current step
   *
   * @params: none
   * @return: none
  **/
  startAllTimers(): void {
    this.timers.forEach(timer => {
      this.startSingleTimer(timer);
    });
  }

  /**
   * Stop all timers for the current step
   *
   * @params: none
   * @return: none
  **/
  stopAllTimers(): void {
    this.timers.forEach(timer => {
      this.stopSingleTimer(timer);
    });
  }

  /**
   * Add a minute to all timers for the current step
   *
   * @params: none
   * @return: none
  **/
  addToAllTimers(): void {
    this.timers.forEach(timer => {
      this.addToSingleTimer(timer);
    });
  }

  /**
   * Reset all timers for the current Step
   *
   * @params: none
   * @return: none
  **/
  resetAllTimers(): void {
    this.timers.forEach(timer => {
      this.resetSingleTimer(timer);
    });
  }

  /**
   * Show or hide individual timer controls
   *
   * @params: timer - a timer type process step instance
   *
   * @return: none
  **/
  toggleTimerControls(timer: Timer): void {
    timer.show = !timer.show;
  }

  /**
   * Show or hide the current step description
   *
   * @params: none
   * @return: none
  **/
  toggleShowDescription(): void {
    this.showDescription = !this.showDescription;
  }

  /**
   * Get step duration to be used in description display
   *
   * @params: duration - stored duration in minutes
   *
   * @return: datetime string hh:mm
  **/
  getFormattedDurationString(duration: number): string {
    let result: string = 'Duration: ';
    if (duration > 59) {
      const hours = Math.floor(duration / 60);
      result += `${hours} hour${hours > 1 ? 's': ''}`;
      duration = duration % 60;
      result += (duration) ? ' ': '';
    }
    if (duration) {
      result += `${duration} minute${duration > 1 ? 's': ''}`;
    }
    return result;
  }

}
