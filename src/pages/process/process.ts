import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { NavController, NavParams, Platform } from 'ionic-angular';
import * as moment from 'moment';

import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { Recipe } from '../../shared/interfaces/recipe';
import { Process } from '../../shared/interfaces/process';
import { ProgressCircleSettings } from '../../shared/interfaces/progress-circle';
import { Timer } from '../../shared/interfaces/timers';
import { clone } from '../../shared/utility-functions/utilities';

import { slideInOut } from '../../animations/slide';

import { CalendarComponent } from '../../components/calendar/calendar';

import { RecipeProvider } from '../../providers/recipe/recipe';
import { ProcessProvider } from '../../providers/process/process';

@Component({
  selector: 'page-process',
  templateUrl: 'process.html',
  animations: [slideInOut()]
})
export class ProcessPage implements OnInit {
  title: string = '';
  @ViewChild('calendar') calendarRef: CalendarComponent;
  private showDescription: boolean = false;
  private master: RecipeMaster = null;
  private recipe: Recipe = null;
  public circumference: number = 0;
  public timers: Array<Array<Timer>> = [];
  private currentTimers: number = 0;
  private viewStepIndex = 0;
  private isConcurrent = false;

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
    private processService: ProcessProvider) {
      this.master = navParams.get('master');
      this.recipe = this.master.recipes.find(recipe => recipe._id == navParams.get('selected'));
      console.log('recipe', this.recipe);
      this.title = this.recipe.variantName;
      this.recipeService.patchRecipeMasterById(this.master._id, {hasActiveBatch: true})
        .subscribe(response => {
          console.log('starting batch, update master', response);
        });
      this.recipeService.patchRecipeById(this.master._id, this.recipe._id, {isActive: true})
        .subscribe(response => {
          console.log('starting batch, update recipe', response);
        });
  }

  changeStep(direction: string) {
    let nextIndex;
    if (direction == 'next') {
      if (this.recipe.processSchedule[this.viewStepIndex].concurrent) {
        for (let i=this.viewStepIndex; i < this.recipe.processSchedule.length; i++) {
          if (!this.recipe.processSchedule[i].concurrent) {
            nextIndex = i;
            break;
          }
        }
      } else {
        nextIndex = this.viewStepIndex + 1;
      }
    } else {
      if (this.recipe.processSchedule[this.viewStepIndex - 1].concurrent) {
        for (let i=this.viewStepIndex - 1; i >= 0; i--) {
          if (!this.recipe.processSchedule[i].concurrent) {
            nextIndex = i + 1;
            break;
          }
        }
      } else {
        nextIndex = this.viewStepIndex - 1;
      }
    }
    this.getViewTimers(nextIndex);
    this.viewStepIndex = nextIndex;
  }

  completeStep() {
    let isFinished = false;
    let nextIndex = 0;
    if (this.recipe.processSchedule[this.recipe.currentStep].type == 'calendar') {
      const calendarValues = this.calendarRef.getFinal();
      const update = {
        startDatetime: calendarValues.startDatetime,
        alerts: calendarValues.alerts
      };
      this.processService.patchStepById(this.master._id, this.recipe._id, calendarValues._id, update)
        .subscribe(response => {
          console.log('submitted calendar', response);
        });
    }
    if (this.recipe.currentStep == this.recipe.processSchedule.length - 1) {
      // TODO create route to check if master has other active batches. only update if this was the only active
      this.recipeService.patchRecipeMasterById(this.master._id, {hasActiveBatch: false})
        .subscribe(response => {
          console.log('ending batch, update master', response);
        });
      this.recipeService.patchRecipeById(this.master._id, this.recipe._id, {isActive: false})
        .subscribe(response => {
          console.log('ending batch, update recipe', response);
        });
      nextIndex = 0;
      isFinished = true;
    } else if (this.recipe.processSchedule[this.recipe.currentStep].concurrent) {
      for (let i=this.recipe.currentStep; i < this.recipe.processSchedule.length; i++) {
        if (!this.recipe.processSchedule[i].concurrent) {
          nextIndex = i;
          break;
        }
      }
    } else {
      nextIndex = this.recipe.currentStep + 1;
    }
    this.getViewTimers(nextIndex);
    this.recipeService.patchRecipeById(this.master._id, this.recipe._id, {currentStep: nextIndex})
      .subscribe(response => {
        this.recipe.currentStep = nextIndex;
        this.viewStepIndex = nextIndex;
        if (isFinished) {
          // TODO toast to finishing
          this.navCtrl.pop();
        }
      });
  }

  composeTimers() {
    let first = null;
    let concurrent = [];
    for (let i=0; i < this.recipe.processSchedule.length; i++) {
      if (this.recipe.processSchedule[i].type == 'timer') {
        const timeRemaining = this.recipe.processSchedule[i].duration * 60;
        if (this.recipe.processSchedule[i].concurrent) {
          concurrent.push({
            first: first == null ? this.recipe.processSchedule[i]._id: first,
            timer: clone(this.recipe.processSchedule[i]),
            interval: null,
            timeRemaining: timeRemaining,
            show: false,
            settings: this.initTimerSettings(i, timeRemaining)
          });
        } else {
          if (concurrent.length) {
            this.timers.push(concurrent);
            concurrent = [];
            first = null;
          }
          const timeRemaining = this.recipe.processSchedule[i].duration * 60;
          this.timers.push([{
            first: this.recipe.processSchedule[i]._id,
            timer: clone(this.recipe.processSchedule[i]),
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
    console.log(this.timers);
  }

  getCurrentStepCalendarData() {
    return {
      id: this.recipe.processSchedule[this.viewStepIndex]._id,
      duration: this.recipe.processSchedule[this.viewStepIndex].duration
    };
  }

  getFontSize(timeRemaining): string {
    if (timeRemaining > 3600) {
      return `${Math.round(this.timerWidth / 5)}px`;
    } else if (timeRemaining > 60) {
      return `${Math.round(this.timerWidth / 4)}px`;
    } else {
      return `${Math.round(this.timerWidth / 3)}px`;
    }
  }

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
        content: this.formatProgressCircleText(this.recipe.processSchedule[index].duration * 60)
      }
    };
  }

  formatProgressCircleText(timeRemaining: number): string {
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
    } else {
      result += '00:';
    }
    result += timeRemaining < 10 ? '0': '';
    result += timeRemaining;
    return result;
  }

  toggleTimerControls(timer: Timer) {
    timer.show = !timer.show;
  }

  setProgress(timer: Timer) {
    timer.settings.text.fontSize = this.getFontSize(timer.timeRemaining);
    timer.settings.circle.strokeDashoffset = `${this.circumference - timer.timeRemaining / (timer.timer.duration * 60) * this.circumference}`;
    timer.settings.text.content = this.formatProgressCircleText(timer.timeRemaining);
    if (timer.timeRemaining == 0) {
      this.clearTimer(timer);
      // TODO activate alarm
    } else if (timer.timer.splitInterval > 1) {
      const interval = timer.timer.duration * 60 / timer.timer.splitInterval;
      if (timer.timeRemaining % interval == 0) {
        // TODO activate interval alarm
        console.log('interval alarm');
      }
    }
  }

  clearTimer(timer: Timer) {
    clearInterval(timer.interval);
    timer.interval = null;
  }

  goToActiveStep() {
    this.getViewTimers(this.recipe.currentStep);
    this.viewStepIndex = this.recipe.currentStep;
  }

  setTimerFunction(mode: string, timer?: any) {
    console.log('timer', mode, timer);
    if (mode == 'start') {
      if (timer) {
        timer.interval = setInterval(() => {
          timer.timeRemaining--;
          this.setProgress(timer);
        }, 1000);
      } else {
        for (let timer of this.timers[this.currentTimers]) {
          timer.interval = setInterval(() => {
            timer.timeRemaining--;
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
          console.log(this.recipe.processSchedule);
          this.resetDuration(timer);
          timer.timeRemaining = timer.timer.duration * 60;
          this.setProgress(timer);
        }
      }
    }
  }

  resetDuration(timer: Timer) {
    const process = this.recipe.processSchedule.find(process => {
      return process._id == timer.first;
    });
    timer.timer.duration = process.duration;
  }

  ngOnInit() {
    console.log(this.platform.width());
    const timerWidth = Math.round(this.platform.width() * 2 / 3);
    console.log(timerWidth);
    this.timerWidth = timerWidth;
    this.timerHeight = timerWidth;
    this.timerStrokeWidth = 8;
    this.timerRadius = (timerWidth / 2) - (this.timerStrokeWidth * 2);
    this.circumference = this.timerRadius * 2 * Math.PI;
    this.timerOriginX = timerWidth / 2;
    this.timerOriginY = timerWidth / 2;
    this.timerFontSize = `${Math.round(timerWidth / 3)}px`;
    this.timerDY = `${timerWidth / 800}em`;
    console.log('init complete, compose timers');
    this.composeTimers();
  }

  toggleShowDescription(): void {
    this.showDescription = !this.showDescription;
  }

  getViewStepDescription(): string {
    return `${this.recipe.processSchedule[this.viewStepIndex].description}`;
  }

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

  getViewTimers(index) {
    console.log('get timers for index', index);
    for (let i=0; i < this.timers.length; i++) {
      if (this.timers[i][0].first == this.recipe.processSchedule[index]._id) {
        console.log('found the timer', this.timers[i]);
        this.isConcurrent = this.timers[i].length > 1;
        this.currentTimers = i;
        return;
      }
    }
    this.currentTimers = 0;
  }

  getViewStepName(): string {
    return `${this.recipe.processSchedule[this.viewStepIndex].name}`;
  }

  getViewStepType(): string {
    return `${this.recipe.processSchedule[this.viewStepIndex].type}`;
  }

  getQuickviewNextStep(batch: Recipe): string {
    return `${batch.processSchedule[batch.currentStep].name}`;
  }

  goToActiveBatchDetails(batch: Recipe) {
    // TODO map this batch to show in page
  }

}
