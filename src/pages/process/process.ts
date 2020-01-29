/* Module imports */
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { NavController, NavParams, Platform, Events } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/takeUntil';

/* Interface imports */
import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { Recipe } from '../../shared/interfaces/recipe';
import { Batch } from '../../shared/interfaces/batch';
import { Alert } from '../../shared/interfaces/alerts';
import { ProgressCircleSettings } from '../../shared/interfaces/progress-circle';
import { Timer } from '../../shared/interfaces/timers';

/* Utility function imports */
import { clone } from '../../shared/utility-functions/utilities';

/* Animation imports */
import { slideUpDown } from '../../animations/slide';

/* Component imports */
import { CalendarComponent } from '../../components/calendar/calendar';

/* Provider imports */
import { RecipeProvider } from '../../providers/recipe/recipe';
import { ProcessProvider } from '../../providers/process/process';
import { UserProvider } from '../../providers/user/user';
import { ToastProvider } from '../../providers/toast/toast';

@Component({
  selector: 'page-process',
  templateUrl: 'process.html',
  animations: [
    slideUpDown()
  ]
})
export class ProcessPage implements OnInit, OnDestroy {
  @ViewChild('calendar') calendarRef: CalendarComponent;
  selectedBatch$: Observable<Batch> = null;
  destroy$: Subject<boolean> = new Subject<boolean>();
  showDescription: boolean = false;
  master: RecipeMaster = null;
  recipe: Recipe = null;
  batchId: string = null;
  requestedUserId: string = null;
  circumference: number = 0;
  timers: Array<Array<Timer>> = [];
  currentTimers: number = 0;
  viewStepIndex = 0;
  isConcurrent = false;
  selectedBatch: Batch = null;
  _headerNavPop: any;

  timerHeight: number;
  timerWidth: number;
  timerStrokeWidth: number;
  timerRadius: number;
  timerOriginX: number;
  timerOriginY: number;
  timerFontSize: string;
  timerDY: string;

  timerStroke = '#ffffff';
  timerCircleFill = 'transparent';
  timerTextFill = 'white';
  timerTextXY = '50%';
  timerTextAnchor = 'middle';
  timerFontFamily = 'Arial';

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    public platform: Platform,
    public events: Events,
    public recipeService: RecipeProvider,
    public processService: ProcessProvider,
    public userService: UserProvider,
    public toastService: ToastProvider) {
      this.master = navParams.get('master');
      this.requestedUserId = navParams.get('requestedUserId');
      this.recipe = this.master.recipes.find(recipe => recipe._id === navParams.get('selectedRecipeId'));
      this.batchId = navParams.get('selectedBatchId');
      this._headerNavPop = this.headerNavPopEventHandler.bind(this);
  }

  /***** Lifecycle Hooks *****/

  ngOnDestroy() {
    this.events.unsubscribe('pop-header-nav', this._headerNavPop);
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  ngOnInit() {
    this.events.subscribe('pop-header-nav', this._headerNavPop);
    const timerWidth = Math.round(this.platform.width() * 2 / 3);
    this.timerWidth = timerWidth;
    this.timerHeight = timerWidth;
    this.timerStrokeWidth = 8;
    this.timerRadius = (timerWidth / 2) - (this.timerStrokeWidth * 2);
    this.circumference = this.timerRadius * 2 * Math.PI;
    this.timerOriginX = timerWidth / 2;
    this.timerOriginY = timerWidth / 2;
    this.timerFontSize = `${Math.round(timerWidth / 3)}px`;
    this.timerDY = `${timerWidth / 800}em`;

    if (!this.batchId) {
      // Start a new batch
      console.log('starting batch');
      this.processService.startNewBatch(this.requestedUserId, this.master._id, this.recipe._id)
        .subscribe(newBatch => {
          this.selectedBatch$ = this.processService.getActiveBatchById(newBatch._id);
          this.selectedBatch$
            .takeUntil(this.destroy$)
            .subscribe((selectedBatch: Batch) => {
              this.selectedBatch = selectedBatch;
              this.batchId = selectedBatch._id;
              this.updateRecipeMasterActive(true);
              this.composeTimers();
            });
        });
    } else {
      // Continue an existing batch
      console.log('continuing batch');
      this.selectedBatch$ = this.processService.getActiveBatchById(this.batchId);
      this.selectedBatch$
        .takeUntil(this.destroy$)
        .subscribe((selectedBatch: Batch) => {
          this.selectedBatch = selectedBatch;
          this.composeTimers();
          this.goToActiveStep();
        });
    }
  }

  /***** End Lifecycle Hooks *****/


  /***** Step Controls *****/

  /**
   * Check if current view is at the beginning or end of process schedule
   *
   * @params: direction - either 'prev' or 'next'
   *
   * @return: true if current view index is at the beginning or end of schedule
  **/
  atViewEnd(direction: string): boolean {
    return this.getStep(false, direction) === -1;
  }

  /**
   * Change view index only, does not trigger step completion
   *
   * @params: direction - either 'prev' or 'next'
   *
   * @return: none
  **/
  changeStep(direction: string): void {
    const nextIndex = this.getStep(false, direction);
    if (nextIndex !== -1) {
      this.getViewTimers(nextIndex);
      this.viewStepIndex = nextIndex;
    }
  }

  /**
   * Complete the current process step and proceed to next step,
   * update the server with the next step index,
   * if on last step, end the process, update the server, then nav back
   *
   * @params: none
   *
   * @return: none
  **/
  completeStep(): void {
    const nextIndex = this.getStep(true);
    const isFinished = nextIndex === -1;
    if (!isFinished && this.selectedBatch.schedule[this.selectedBatch.currentStep + 1].type === 'timer') {
      this.getViewTimers(nextIndex);
    }
    this.processService.incrementCurrentStep(this.batchId)
      .subscribe(() => {
        if (isFinished) {
          this.processService.endBatchById(this.batchId)
            .subscribe(() => {
              this.updateRecipeMasterActive(false);
              this.toastService.presentToast('Enjoy!', 1000, 'bright-toast');
              this.events.publish('update-nav-header', {other: 'batch-end'});
            });
        } else {
          this.selectedBatch.currentStep = nextIndex;
          this.viewStepIndex = nextIndex;
        }
      });
  }

  /**
   * Get step duration to be used in description display
   *
   * @params: duration - stored duration in minutes
   *
   * @return: datetime string hh:mm
  **/
  getFormattedDurationString(duration: number): string {
    let result = '';
    if (duration > 59) {
      const hours = Math.floor(duration / 60);
      result += `${hours} hour${hours > 1 ? 's': ''}`;
      duration = duration % 60;
    }
    if (duration) {
      result += ` ${duration} minutes`;
    }
    return result;
  }

  /**
   * Get the next index, treating adjacent concurrent timers as a single step
   *
   * @params: direction - either 'prev' or 'next'
   * @params: startIndex - the current index
   *
   * @return: next index to use or -1 if at the beginning or end of schedule
  **/
  getIndexAfterSkippingConcurrent(direction: string, startIndex: number): number {
    let nextIndex = -1;
    if (direction === 'next') {
      for (let i=startIndex; i < this.selectedBatch.schedule.length; i++) {
        if (!this.selectedBatch.schedule[i].concurrent) {
          nextIndex = i;
          break;
        }
      }
    } else {
      for (let i=startIndex - 1; i >= 0; i--) {
        if (!this.selectedBatch.schedule[i].concurrent) {
          nextIndex = i;
          break;
        }
      }
    }
    return nextIndex;
  }

  /**
   * Get the next or previous schedule step
   *
   * @params: onComplete - true if step is being completed
   * @params: direction - either 'prev' or 'next'
   *
   * @return: next index to use or -1 if at the beginning or end of schedule
  **/
  getStep(onComplete: boolean = false, direction: string = 'next'): number {
    let nextIndex = -1;
    const viewIndex = onComplete ? this.selectedBatch.currentStep: this.viewStepIndex;
    if (direction === 'next') {
      if (viewIndex < this.selectedBatch.schedule.length - 1) {
        if (this.selectedBatch.schedule[viewIndex].concurrent) {
          nextIndex = this.getIndexAfterSkippingConcurrent(direction, viewIndex);
        } else {
          nextIndex = viewIndex + 1;
        }
      }
    } else {
      if (viewIndex > 0) {
        if (this.selectedBatch.schedule[viewIndex].concurrent) {
          nextIndex = this.getIndexAfterSkippingConcurrent(direction, viewIndex);
        } else {
          nextIndex = viewIndex - 1;
        }
      }
    }
    return nextIndex;
  }

  /**
   * Get the currently viewed step description
   *
   * @return: step description at the current view step index
  **/
  getViewStepDescription(): string {
    return `${this.selectedBatch.schedule[this.viewStepIndex].description}`;
  }

  /**
   * Get the currently viewed step's name
   *
   * @return: process step's name at current view index
  **/
  getViewStepName(): string {
    return `${this.selectedBatch.schedule[this.viewStepIndex].name}`;
  }

  /**
   * Get the currently viewed step type
   *
   * @return: process step's type at current view index
  **/
  getViewStepType(): string {
    return `${this.selectedBatch.schedule[this.viewStepIndex].type}`;
  }

  // Change view index to the currently active step
  goToActiveStep(): void {
    this.getViewTimers(this.selectedBatch.currentStep);
    this.viewStepIndex = this.selectedBatch.currentStep;
  }

  /***** End Step Controls *****/


  /***** Alerts *****/

  /**
   * Get css classes by alert values
   *
   * @params: alert - calendar alert
   *
   * @return: ngClass object with associated class names
  **/
  getAlertClass(alert: Alert): any {
    const closest = this.getClosestAlertByGroup(alert);
    return {
      'next-datetime': alert === closest,
      'past-datetime': new Date().getTime() > new Date(alert.datetime).getTime()
    };
  }

  /**
   * Get alerts for a particular step and sort in chronological order
   *
   * @params: alert - an alert instance, use to find all alerts with the same title
   *
   * @return: array of alerts with the same title and in ascending chronological order
  **/
  getClosestAlertByGroup(alert: Alert): Alert {
    const alerts = this.selectedBatch.alerts.filter(item => {
      return item.title === alert.title;
    });
    return alerts.reduce((acc, curr) => {
      const accDiff = new Date(acc.datetime).getTime() - new Date().getTime();
      const currDiff = new Date(curr.datetime).getTime() - new Date().getTime();
      const isCurrCloser = Math.abs(currDiff) < Math.abs(accDiff) && currDiff > 0;
      return isCurrCloser ? curr: acc;
    });
  }

  /**
   * Get array of alerts associated with current calendar step
   *
   * @params: none
   *
   * @return: alerts sorted in chronological order for the currently started calendar step
  **/
  getCurrentStepCalendarAlerts(): Array<Alert> {
    const alerts = this.selectedBatch.alerts.filter(alert => {
      return alert.title === this.selectedBatch.schedule[this.selectedBatch.currentStep].name;
    });
    alerts.sort((d1, d2) => {
      return new Date(d1.datetime).getTime() - new Date(d2.datetime).getTime();
    });
    return alerts;
  }

  /***** End Alerts *****/


  /***** Calendar *****/

  /**
   * Check if a calendar step has been started, but not finished
   *
   * @params: none
   *
   * @return: true if a calendar step has been started, but not completed yet
  **/
  calendarInProgress(): boolean {
    return  this.selectedBatch.currentStep < this.selectedBatch.schedule.length
            && this.selectedBatch.schedule[this.selectedBatch.currentStep].hasOwnProperty('startDatetime');
  }

  // Delete the started calendar values - triggers calendar view to choose dates
  changeDate(): void {
    this.toastService.presentToast('Select new dates', 1000, 'top');
    delete this.selectedBatch.schedule[this.selectedBatch.currentStep].startDatetime;
  }

  /**
   * Get values from current calendar step
   *
   * @params: none
   *
   * @return: calendar values to use in template
  **/
  getCurrentStepCalendarData(): any {
    return {
      id: this.selectedBatch.schedule[this.viewStepIndex]._id,
      duration: this.selectedBatch.schedule[this.viewStepIndex].duration,
      title: this.selectedBatch.schedule[this.viewStepIndex].name,
      description: this.selectedBatch.schedule[this.viewStepIndex].description
    };
  }

  getNextDateSummary(): string {
    return this.selectedBatch.schedule[this.selectedBatch.currentStep].description;
  }

  /**
   * Set the start of a calendar step and update server
   *
   * @params: none
   * @return: none
  **/
  startCalendar(): void {
    const calendarValues = this.calendarRef.getFinal();
    const update = {
      startDatetime: calendarValues.startDatetime,
      alerts: calendarValues.alerts
    };
    this.processService.patchStepById(this.batchId, calendarValues._id, update)
      .subscribe(response => {
        console.log(`Started calendar on ${(new Date(response.startDatetime)).toString()}`);
      });
  }

  /***** End Calendar *****/


  /***** Timers *****/

  /**
   * Clear setInterval of given timer interval
   *
   * @params: timer - a timer type process step instance
   *
   * @return: none
  **/
  clearTimer(timer: Timer): void {
    clearInterval(timer.interval);
    timer.interval = null;
  }

  /**
   * Group timers in the process schedule into arrays stored in timers array,
   * concurrent timers will be handled as a single step
   *
   * @params: none
   *
   * @params: none
  **/
  composeTimers(): void {
    let first = null;
    let concurrent = [];
    for (let i=0; i < this.selectedBatch.schedule.length; i++) {
      if (this.selectedBatch.schedule[i].type === 'timer') {
        const timeRemaining = this.selectedBatch.schedule[i].duration * 60; // change duration from minutes to seconds
        if (this.selectedBatch.schedule[i].concurrent) {
          concurrent.push({
            first: first === null ? this.selectedBatch.schedule[i]._id: first,
            timer: clone(this.selectedBatch.schedule[i]),
            interval: null,
            timeRemaining: timeRemaining,
            show: false,
            settings: this.initTimerSettings(i, timeRemaining)
          });
          if ((i === this.selectedBatch.schedule.length - 1
              || !this.selectedBatch.schedule[i + 1].concurrent)
              && concurrent.length) {
            this.timers.push(concurrent);
            concurrent = [];
            first = null;
          }
        } else {
          this.timers.push([{
            first: this.selectedBatch.schedule[i]._id,
            timer: clone(this.selectedBatch.schedule[i]),
            interval: null,
            timeRemaining: timeRemaining,
            show: false,
            settings: this.initTimerSettings(i, timeRemaining)
          }]);
        }
      } else {
        if (concurrent.length) {
          this.timers.push(concurrent);
          concurrent = [];
          first = null;
        }
      }
    }
  }

  /**
   * Format the time remaining text inside progress circle
   *
   * @params: timeRemaining - time remaining in seconds
   *
   * @return: datetime string in hh:mm:ss format - hour/minutes removed if zero
  **/
  formatProgressCircleText(timeRemaining: number): string {
    let remainder = timeRemaining;
    let result = '';
    let hours, minutes;
    if (remainder > 3599) {
      hours = Math.floor(remainder / 3600);
      remainder = remainder % 3600;
      result += hours + ':';
    }
    if (remainder > 59 || timeRemaining > 3599) {
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
   * Get index in array of timers to use from step index
   *
   * @params: index - step index
  **/
  getViewTimers(index: number): void {
    for (let i=0; i < this.timers.length; i++) {
      if (this.timers[i][0].first === this.selectedBatch.schedule[index]._id) {
        this.isConcurrent = this.timers[i].length > 1;
        this.currentTimers = i;
        return;
      }
    }
    this.currentTimers = 0;
  }

  /**
   * Compose process circle css values
   *
   * @params: index - process schedule index of the timer
   * @params: timeRemaining - time remaining in seconds
   *
   * @return: object containing formatted css values
  **/
  initTimerSettings(index: number, timeRemaining: number): ProgressCircleSettings {
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
        fontSize: this.getFontSize(timeRemaining),
        fontFamily: this.timerFontFamily,
        dY: this.timerDY,
        content: this.formatProgressCircleText(this.selectedBatch.schedule[index].duration * 60)
      }
    };
  }

  /**
   * Reset a timer interval
   *
   * @params: timer - a timer type process step instance
   *
   * @return: none
  **/
  resetDuration(timer: Timer): void {
    const process = this.selectedBatch.schedule.find(process => {
      return process._id === timer.first;
    });
    timer.timer.duration = process.duration;
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
      this.clearTimer(timer);
      // TODO activate alarm
      console.log('timer expired alarm');
    } else if (timer.timer.splitInterval > 1) {
      const interval = timer.timer.duration * 60 / timer.timer.splitInterval;
      if (timer.timeRemaining % interval === 0) {
        // TODO activate interval alarm
        console.log('interval alarm');
      }
    }
  }

  /**
   * User interface timer functions
   *
   * @params: mode - timer function 'start', 'stop', 'add', 'reset'
   * @params: timer - a timer type process step instance
   *
   * @return: none
  **/
  setTimerFunction(mode: string, timer?: Timer): void {
    if (mode === 'start') {
      if (timer) {
        timer.interval = setInterval(() => {
          if (timer.timeRemaining > 0) {
            timer.timeRemaining--;
          }
          this.setProgress(timer);
        }, 1000);
      } else {
        for (let timer of this.timers[this.currentTimers]) {
          timer.interval = setInterval(() => {
            if (timer.timeRemaining > 0) {
              timer.timeRemaining--;
            }
            this.setProgress(timer);
          }, 1000);
        }
      }
    } else if (mode === 'stop') {
      if (timer) {
        this.clearTimer(timer);
      } else {
        for (let timer of this.timers[this.currentTimers]) {
          this.clearTimer(timer);
        }
      }
    } else if (mode === 'add') {
      if (timer) {
        timer.timer.duration++;
        timer.timeRemaining += 60;
        this.setProgress(timer);
      } else {
        for (let timer of this.timers[this.currentTimers]) {
          timer.timer.duration++;
          timer.timeRemaining += 60;
          this.setProgress(timer);
        }
      }
    } else {
      if (timer) {
        this.clearTimer(timer);
        timer.timeRemaining = timer.timer.duration * 60;
        this.setProgress(timer);
      } else {
        for (let timer of this.timers[this.currentTimers]) {
          this.clearTimer(timer);
          this.resetDuration(timer);
          timer.timeRemaining = timer.timer.duration * 60;
          this.setProgress(timer);
        }
      }
    }
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

  /***** End Timers *****/

  /***** Other *****/

  headerNavPopEventHandler(): void {
    this.navCtrl.pop();
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
   * Update recipe master active batch property on server
   *
   * @params: start - true if recipe master has an active batch
   *
   * @return: none
  **/
  updateRecipeMasterActive(start: boolean): void {
    this.recipeService.patchRecipeMasterById(this.master._id, {hasActiveBatch: start})
      .subscribe(master => {
        console.log('Recipe master has active batch', master);
      });
  }

  /***** End Other *****/
}
