import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { NavController, NavParams, Platform } from 'ionic-angular';
import * as moment from 'moment';

import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { Recipe } from '../../shared/interfaces/recipe';
import { Process } from '../../shared/interfaces/process';
import { Batch } from '../../shared/interfaces/batch';
import { Alert } from '../../shared/interfaces/alerts';
import { ProgressCircleSettings } from '../../shared/interfaces/progress-circle';
import { Timer } from '../../shared/interfaces/timers';
import { clone } from '../../shared/utility-functions/utilities';

import { slideUpDown } from '../../animations/slide';

import { CalendarComponent } from '../../components/calendar/calendar';

import { RecipeProvider } from '../../providers/recipe/recipe';
import { ProcessProvider } from '../../providers/process/process';
import { UserProvider } from '../../providers/user/user';

@Component({
  selector: 'page-process',
  templateUrl: 'process.html',
  animations: [slideUpDown()]
})
export class ProcessPage implements OnInit {
  title: string = '';
  @ViewChild('calendar') calendarRef: CalendarComponent;
  private showDescription: boolean = false;
  private master: RecipeMaster = null;
  private recipe: Recipe = null;
  private batchId: string = null;
  private requestedUserId: string = null;
  public circumference: number = 0;
  public timers: Array<Array<Timer>> = [];
  private currentTimers: number = 0;
  private viewStepIndex = 0;
  private isConcurrent = false;
  private selectedBatch: Batch = null;

  private timerHeight: number;
  private timerWidth: number;
  private timerStrokeWidth: number;
  private timerRadius: number;
  private timerOriginX: number;
  private timerOriginY: number;
  private timerFontSize: string;
  private timerDY: string;

  private timerStroke = '#ffffff';
  private timerCircleFill = 'transparent';
  private timerTextFill = 'white';
  private timerTextXY = '50%';
  private timerTextAnchor = 'middle';
  private timerFontFamily = 'Arial';

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    private platform: Platform,
    private recipeService: RecipeProvider,
    private processService: ProcessProvider,
    private userService: UserProvider) {
      this.master = navParams.get('master');
      this.requestedUserId = navParams.get('requestedUserId');
      this.recipe = this.master.recipes.find(recipe => recipe._id == navParams.get('selectedRecipeId'));
      this.batchId = navParams.get('selectedBatchId');
      this.title = this.recipe.variantName;
  }

  /**
   * Check if current view is at the beginning or end of process schedule
   *
   * params: string
   * direction - either 'prev' or 'next'
   *
   * return: boolean
   * - true if current view index is at the beginning or end of schedule
  **/
  private atViewEnd(direction: string): boolean {
    return this.getStep(false, direction) == -1;
  }

  /**
   * Check if a calendar step has been started, but not finished
   *
   * params: none
   *
   * return: boolean
   * - true if a calendar step has been started, but not completed yet
  **/
  private calendarInProgress(): boolean {
    return  this.selectedBatch.currentStep < this.selectedBatch.schedule.length
            && this.selectedBatch.schedule[this.selectedBatch.currentStep].hasOwnProperty('startDatetime');
  }

  /**
   * Delete the started calendar values - triggers calendar view to choose dates
   *
   * params: none
   *
   * return: none
  **/
  private changeDate(): void {
    delete this.selectedBatch.schedule[this.selectedBatch.currentStep].startDatetime;
  }

  /**
   * Change view index only, does not trigger step completion
   *
   * params: string
   * direction - either 'prev' or 'next'
   *
   * return: none
  **/
  private changeStep(direction: string): void {
    const nextIndex = this.getStep(false, direction);
    if (nextIndex != -1) {
      this.getViewTimers(nextIndex);
      this.viewStepIndex = nextIndex;
    }
  }

  /**
   * Clear setInterval of a timer
   *
   * params: Timer
   * timer - a timer type process step instance
   *
   * return: none
  **/
  private clearTimer(timer: Timer): void {
    clearInterval(timer.interval);
    timer.interval = null;
  }

  /**
   * Complete the current process step and proceed to next step,
   * update the server with the next step index,
   * if on last step, end the process, update the server, then nav back
   *
   * params: none
   *
   * return: none
  **/
  private completeStep(): void {
    const nextIndex = this.getStep(true);
    const isFinished = nextIndex == -1;
    if (!isFinished && this.selectedBatch.schedule[this.selectedBatch.currentStep + 1].type == 'timer') {
      this.getViewTimers(nextIndex);
    }
    this.processService.incrementCurrentStep(this.batchId)
      .subscribe(response => {
        if (isFinished) {
          this.processService.endBatchById(this.batchId)
            .subscribe(response => {
              this.updateRecipeMasterActive(false)
              this.navCtrl.pop();
            });
        } else {
          this.selectedBatch.currentStep = nextIndex;
          this.viewStepIndex = nextIndex;
        }
      });
  }

  /**
   * Group timers in the process schedule into arrays stored in timers array,
   * concurrent timers will be handled as a single step
   *
   * params: none
   *
   * return: none
  **/
  private composeTimers(): void {
    let first = null;
    let concurrent = [];
    for (let i=0; i < this.selectedBatch.schedule.length; i++) {
      if (this.selectedBatch.schedule[i].type == 'timer') {
        const timeRemaining = this.selectedBatch.schedule[i].duration * 60; // change duration from minutes to seconds
        if (this.selectedBatch.schedule[i].concurrent) {
          concurrent.push({
            first: first == null ? this.selectedBatch.schedule[i]._id: first,
            timer: clone(this.selectedBatch.schedule[i]),
            interval: null,
            timeRemaining: timeRemaining,
            show: false,
            settings: this.initTimerSettings(i, timeRemaining)
          });
          if ((i == this.selectedBatch.schedule.length - 1
              || !this.selectedBatch.schedule[i + 1].concurrent)
              && concurrent.length) {
            this.timers.push(concurrent);
            concurrent = [];
            first = null;
          }
        } else {
          // const timeRemaining = this.selectedBatch.schedule[i].duration * 60;
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
   * Format the progress circle text time remaining
   *
   * params: number
   * timeRemaining - time remaining in seconds
   *
   * return: string
   * - return string in hh:mm:ss format - hour/minutes removed if zero
  **/
  private formatProgressCircleText(timeRemaining: number): string {
    let result = '';
    let hours, minutes, seconds;
    if (timeRemaining > 3599) {
      hours = Math.floor(timeRemaining / 3600);
      timeRemaining = timeRemaining % 3600;
      result += hours + ':';
    }
    if (timeRemaining > 59) {
      minutes = Math.floor(timeRemaining / 60);
      timeRemaining = timeRemaining % 60;
      result += minutes < 10 ? '0': '';
      result += minutes + ':';
    }
    result += timeRemaining < 10 ? '0': '';
    result += timeRemaining;
    return result;
  }

  /**
   * Get css classes by alert values
   *
   * params: Alert
   * alert - calendar alert
   *
   * return: obj
   * - ngClass object with associated class names
  **/
  private getAlertClass(alert: Alert): any {
    const closest = this.getClosestAlertByGroup(alert);
    return {
      'next-datetime': alert == closest,
      'past-datetime': new Date().getTime() > new Date(alert.datetime).getTime()
    };
  }

  /**
   * Get alerts for a particular step and sort in chronological order
   *
   * params: Alert
   * alert - an alert instance, use to find all alerts with the same title
   *
   * return: Array<Alert>
   * - array of alerts with the same title and in ascending chronological order
  **/
  private getClosestAlertByGroup(alert: Alert): Alert {
    const alerts = this.selectedBatch.alerts.filter(item => {
      return item.title == alert.title;
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
   * params: none
   *
   * return: Array<Alert>
   * - alerts sorted in chronological order for the currently started calendar step
  **/
  private getCurrentStepCalendarAlerts(): Array<Alert> {
    const alerts = this.selectedBatch.alerts.filter(alert => {
      return alert.title == this.selectedBatch.schedule[this.selectedBatch.currentStep].name;
    });
    alerts.sort((d1, d2) => {
      return new Date(d1.datetime).getTime() - new Date(d2.datetime).getTime();
    });
    return alerts;
  }

  /**
   * Get values from current calendar step
   *
   * params: none
   *
   * return: obj
   * - calendar values to use in template
  **/
  private getCurrentStepCalendarData(): any {
    return {
      id: this.selectedBatch.schedule[this.viewStepIndex]._id,
      duration: this.selectedBatch.schedule[this.viewStepIndex].duration,
      title: this.selectedBatch.schedule[this.viewStepIndex].name,
      description: this.selectedBatch.schedule[this.viewStepIndex].description
    };
  }

  /**
   * Get the appropriate font size for timer display based on the
   * number of digits to be displayed
   *
   * params: number
   * timeRemaining - remaining time in seconds
   *
   * return: string
   * - css font size valu
  **/
  private getFontSize(timeRemaining: number): string {
    if (timeRemaining > 3600) {
      return `${Math.round(this.timerWidth / 5)}px`;
    } else if (timeRemaining > 60) {
      return `${Math.round(this.timerWidth / 4)}px`;
    } else {
      return `${Math.round(this.timerWidth / 3)}px`;
    }
  }

  /**
   * Get step duration to be used in description display
   *
   * params: number
   * duration - stored duration in minutes
   *
   * return: string
   * - formatted time string hh hours mm minutes
  **/
  private getFormattedDurationString(duration: number): string {
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
   * params: string, number
   * direction - either 'prev' or 'next'
   * startIndex - the current index
   *
   * return: number
   * - the next index to use or -1 if at the beginning or end of schedule
  **/
  private getIndexAfterSkippingConcurrent(direction: string, startIndex: number): number {
    let nextIndex = -1;
    if (direction == 'next') {
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
   * Get current step description
   *
   * params: none
   *
   * return: string
   * - the current step's description
  **/
  private getNextDateSummary(): string {
    return this.selectedBatch.schedule[this.selectedBatch.currentStep].description;
  }

  /**
   * Get the next or previous schedule step
   *
   * params: boolean, direction
   * onComplete - true if step is being completed
   * direction - either 'prev' or 'next'
   *
   * return: number
   * - the next index to use or -1 if at the beginning or end of schedule
  **/
  private getStep(onComplete: boolean = false, direction: string = 'next'): number {
    let nextIndex = -1;
    const viewIndex = onComplete ? this.selectedBatch.currentStep: this.viewStepIndex;
    if (direction == 'next') {
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
   * params: none
   *
   * return: string
   * - step description at the current view step index
  **/
  private getViewStepDescription(): string {
    return `${this.selectedBatch.schedule[this.viewStepIndex].description}`;
  }

  /**
   * Get the currently viewed step's name
   *
   * params: none
   *
   * return: string
   * - the process step's name at current view index
  **/
  private getViewStepName(): string {
    return `${this.selectedBatch.schedule[this.viewStepIndex].name}`;
  }

  /**
   * Get the currently viewed step type
   *
   * params: none
   *
   * return: string
   * - the process step's type at current view index
  **/
  private getViewStepType(): string {
    return `${this.selectedBatch.schedule[this.viewStepIndex].type}`;
  }

  /**
   * Get index in array of timers to use from step index
   *
   * params: number
   * index - step index
   *
   * return: none
  **/
  private getViewTimers(index: number): void {
    for (let i=0; i < this.timers.length; i++) {
      if (this.timers[i][0].first == this.selectedBatch.schedule[index]._id) {
        this.isConcurrent = this.timers[i].length > 1;
        this.currentTimers = i;
        return;
      }
    }
    this.currentTimers = 0;
  }

  /**
   * Change view index to the currently active step
   *
   * params: none
   *
   * return: none
  **/
  private goToActiveStep(): void {
    this.getViewTimers(this.selectedBatch.currentStep);
    this.viewStepIndex = this.selectedBatch.currentStep;
  }

  /**
   * Compose process circle css values
   *
   * params: number, number
   * index - process schedule index of the timer
   * timeRemaining - time remaining in seconds
   *
   * return: ProcessCircleSettings
   * - object containing formatted css values
  **/
  private initTimerSettings(index: number, timeRemaining: number): ProgressCircleSettings {
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

  ngOnInit() {
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
      this.processService.startNewBatch(this.requestedUserId, this.master._id, this.recipe._id)
        .subscribe(response => {
          this.userService.updateUserInProgressList(response);
          this.selectedBatch = response[response.length - 1];
          this.batchId = this.selectedBatch._id;
          this.updateRecipeMasterActive(true);
          this.composeTimers();
        });
    } else {
      // Continue an existing batch
      this.processService.getBatchById(this.batchId)
        .subscribe(response => {
          this.selectedBatch = response;
          this.updateRecipeMasterActive(true);
          this.composeTimers();
          this.goToActiveStep();
        });
    }
  }

  /**
   * Reset a timer
   *
   * params: Timer
   * timer - a timer type process step instance
   *
   * return: none
  **/
  private resetDuration(timer: Timer): void {
    const process = this.selectedBatch.schedule.find(process => {
      return process._id == timer.first;
    });
    timer.timer.duration = process.duration;
  }

  /**
   * Update css values as timer progresses
   *
   * params: Timer
   * timer - a timer type process step instance
   *
   * return: none
  **/
  private setProgress(timer: Timer): void {
    timer.settings.text.fontSize = this.getFontSize(timer.timeRemaining);
    timer.settings.circle.strokeDashoffset = `${this.circumference - timer.timeRemaining / (timer.timer.duration * 60) * this.circumference}`;
    timer.settings.text.content = this.formatProgressCircleText(timer.timeRemaining);
    if (timer.timeRemaining < 1) {
      console.log('timer expired');
      this.clearTimer(timer);
      // TODO activate alarm
      console.log('timer expired alarm');
    } else if (timer.timer.splitInterval > 1) {
      const interval = timer.timer.duration * 60 / timer.timer.splitInterval;
      if (timer.timeRemaining % interval == 0) {
        // TODO activate interval alarm
        console.log('interval alarm');
      }
    }
  }

  /**
   * User interface timer functions
   *
   * params: string, obj
   * mode - timer function 'start', 'stop', 'add', 'reset'
   * timer - a timer type process step instance
   *
   * return: none
  **/
  private setTimerFunction(mode: string, timer?: Timer): void {
    if (mode == 'start') {
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
    } else if (mode == 'stop') {
      if (timer) {
        this.clearTimer(timer);
      } else {
        for (let timer of this.timers[this.currentTimers]) {
          this.clearTimer(timer);
        }
      }
    } else if (mode == 'add') {
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
   * Set the start of a calendar step and update server
   *
   * params: none
   *
   * return: none
  **/
  private startCalendar(): void {
    const calendarValues = this.calendarRef.getFinal();
    const update = {
      startDatetime: calendarValues.startDatetime,
      alerts: calendarValues.alerts
    };
    this.processService.patchBatchById(this.batchId, calendarValues._id, update)
      .subscribe(response => {
        this.selectedBatch = response;
      });
  }

  /**
   * Show or hide the current step description
   *
   * params: none
   *
   * return: none
  **/
  private toggleShowDescription(): void {
    this.showDescription = !this.showDescription;
  }

  /**
   * Show or hide individual timer controls
   *
   * params: Timer
   * timer - a timer type process step instance
   *
   * return: none
  **/
  private toggleTimerControls(timer: Timer): void {
    timer.show = !timer.show;
  }

  /**
   * Update recipe master active batch property on server
   *
   * params: boolean
   * start - true if recipe master has an active batch
   *
   * return: none
  **/
  private updateRecipeMasterActive(start: boolean): void {
    this.recipeService.patchRecipeMasterById(this.master._id, {hasActiveBatch: start})
      .subscribe(master => {
        console.log('Recipe master has active batch', master);
      });
  }
}
