/* Module imports */
import { Component, ElementRef, Input, OnInit, OnChanges, OnDestroy, QueryList, SimpleChange, SimpleChanges, ViewChildren } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subject } from 'rxjs/Subject';
import { take } from 'rxjs/operators/take';
import { takeUntil } from 'rxjs/operators/takeUntil';

/* Interface imports */
import { Process } from '../../../../shared/interfaces/process';
import { Timer } from '../../../../shared/interfaces/timer';

/* Utility imports */
import { hasId } from '../../../../shared/utility-functions/id-helpers';

/* Animation imports */
import { expandUpDown } from '../../../../animations/expand';

/* Provider imports */
import { TimerProvider } from '../../../../providers/timer/timer';


@Component({
  selector: 'timer-process',
  templateUrl: 'timer-process.html',
  animations: [
    expandUpDown()
  ]
})
export class TimerProcessComponent implements OnInit, OnChanges, OnDestroy {
  @Input() batchId: string;
  @Input() isPreview: boolean;
  @Input() stepData: Process[];
  @ViewChildren('slidingTimers') slidingTimers: QueryList<ElementRef>;
  destroy$: Subject<boolean> = new Subject<boolean>();
  isConcurrent: boolean = false;
  showDescription: boolean = false;
  timers: Timer[] = [];

  constructor(public timerService: TimerProvider) { }

  /***** Lifecycle Hooks *****/

  ngOnInit() {
    this.initTimers();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.stepData !== undefined && changes.stepData.currentValue !== undefined) {
      if (changes.stepData.currentValue[0].type !== 'timer') {
        this.destroy$.next(true);
      } else if (this.hasChanges(changes.stepData)) {
        this.stepData = changes.stepData.currentValue;
        this.destroy$.next(true);
        this.initTimers();
      }
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


  /***** Timer Controls *****/

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
   * Add a minute to a single timer instance
   *
   * @params: timer - the timer with which to add time
   *
   * @return: none
  **/
  addToSingleTimer(timer: Timer): void {
    this.timerService.addTimeToTimer(this.batchId, timer.cid)
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
   * Show or hide the current step description
   *
   * @params: none
   * @return: none
  **/
  toggleShowDescription(): void {
    this.showDescription = !this.showDescription;
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

  /***** End Timer Controls *****/


  /***** Timer Settings *****/

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

  /**
   * Initialize timers for the current step and subscribe to their subjects
   *
   * @params: none
   * @return: none
  **/
  initTimers(): void {
    this.timers = [];
    const timers: BehaviorSubject<Timer>[] = this.timerService
      .getTimersByProcessId(this.batchId, this.stepData[0].cid);

    if (timers === undefined) return;

    this.isConcurrent = timers.length > 1;
    timers.forEach((timer$: BehaviorSubject<Timer>) => {
      timer$
        .pipe(takeUntil(this.destroy$))
        .subscribe((timer: Timer) => {
          this.updateTimerInList(timer);
        });
    });
  }

  /**
   * Update a timer in timers list or add to list if not present
   *
   * @params: timer - updated Timer
   *
   * @return: none
  **/
  updateTimerInList(timer: Timer): void {
    const timerIndex: number = this.timers
      .findIndex((_timer: Timer) => _timer.cid === timer.cid);

    if (timerIndex === -1) {
      this.timers.push(timer);
    } else {
      this.timers[timerIndex] = timer;
    }
  }

  /***** End Timer Settings *****/


  hasChanges(changes: SimpleChange): boolean {
    return  JSON.stringify(changes.currentValue)
            !== JSON.stringify(changes.previousValue);
  }

  /**
   * Trigger for expandUpDown animation
   *
   * @params: timer - Timer on which to trigger the animation
   *
   * @return: object - sets state value and params for animation
  **/
  isExpanded(timer: Timer): object {
    try {
      const height: number = this.slidingTimers.last.nativeElement.clientHeight;
      return {
        value: timer.show ? 'expanded': 'collapsed',
        params: {
          height: height,
          speed: 250
        }
      };
    } catch(e) {
      return {};
    }
  }

}
