/* Module imports */
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { NavController, NavParams, Platform, Events } from 'ionic-angular';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subject } from 'rxjs/Subject';
import { takeUntil } from 'rxjs/operators/takeUntil';
import { take } from 'rxjs/operators/take';

/* Interface imports */
import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { RecipeVariant } from '../../shared/interfaces/recipe-variant';
import { Batch } from '../../shared/interfaces/batch';
import { Alert } from '../../shared/interfaces/alert';
import { Process } from '../../shared/interfaces/process';

/* Utility function imports */
import { getId } from '../../shared/utility-functions/utilities';
import { hasId } from '../../shared/utility-functions/utilities';

/* Animation imports */
import { slideUpDown } from '../../animations/slide';

/* Component imports */
import { CalendarProcessComponent } from './process-components/calendar-process/calendar-process';

/* Provider imports */
import { RecipeProvider } from '../../providers/recipe/recipe';
import { ProcessProvider } from '../../providers/process/process';
import { UserProvider } from '../../providers/user/user';
import { ToastProvider } from '../../providers/toast/toast';
import { TimerProvider } from '../../providers/timer/timer';

@Component({
  selector: 'page-process',
  templateUrl: 'process.html',
  animations: [
    slideUpDown()
  ]
})
export class ProcessPage implements OnInit, OnDestroy {
  @ViewChild('calendar') calendarRef: CalendarProcessComponent;
  selectedBatch$: BehaviorSubject<Batch> = null;
  selectedBatch: Batch = null;
  destroy$: Subject<boolean> = new Subject<boolean>();
  master: RecipeMaster = null;
  recipe: RecipeVariant = null;
  batchId: string = null;
  requestedUserId: string = null;
  viewStepIndex: number = 0;
  isConcurrent: boolean = false;
  _headerNavPop: any;
  _changeDate: any;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public platform: Platform,
    public events: Events,
    public recipeService: RecipeProvider,
    public processService: ProcessProvider,
    public userService: UserProvider,
    public toastService: ToastProvider,
    public timerService: TimerProvider
  ) {
    this.master = navParams.get('master');
    this.requestedUserId = navParams.get('requestedUserId');
    this.recipe = this.master.variants.find(variant => hasId(variant, navParams.get('selectedRecipeId')));
    this.batchId = navParams.get('selectedBatchId');
    this._headerNavPop = this.headerNavPopEventHandler.bind(this);
    this._changeDate = this.changeDateEventHandler.bind(this);
  }

  /***** Lifecycle Hooks *****/

  ngOnInit() {
    this.events.subscribe('pop-header-nav', this._headerNavPop);
    this.events.subscribe('change-date', this._changeDate);

    if (!this.batchId) {
      // Start a new batch
      console.log('starting batch');
      this.processService.startNewBatch(this.requestedUserId, getId(this.master), getId(this.recipe))
        .subscribe(
          newBatch => {
            this.selectedBatch$ = this.processService.getActiveBatchById(getId(newBatch));

            if (this.selectedBatch$ === null) {
              this.toastService.presentToast('Internal error: Batch not found', 3000, 'bottom');
              setTimeout(() => {
                this.events.publish('update-nav-header', {caller: 'process page', other: 'batch-end'});
              }, 3000);
            } else {
              this.selectedBatch$
                .pipe(takeUntil(this.destroy$))
                .subscribe((selectedBatch: Batch) => {
                  this.selectedBatch = selectedBatch;
                  this.batchId = getId(selectedBatch);
                  this.updateRecipeMasterActive(true);
                  this.timerService.addBatchTimer(selectedBatch);
                });
            }
          },
          error => {
            // TODO change toast to error message in view, then call go back
            this.toastService.presentToast(error);
            this.events.publish('update-nav-header', {caller: 'process page', other: 'batch-end'});
        });
    } else {
      // Continue an existing batch
      console.log('continuing batch', this.batchId);
      this.selectedBatch$ = this.processService.getActiveBatchById(this.batchId);
      this.selectedBatch$
        .pipe(takeUntil(this.destroy$))
        .subscribe(
          (selectedBatch: Batch) => {
            this.selectedBatch = selectedBatch;
            this.timerService.addBatchTimer(selectedBatch);
            this.goToActiveStep();
          },
          error => {
            // TODO change toast to error message in view, then call go back
            this.toastService.presentToast(error);
            this.events.publish('update-nav-header', {caller: 'process page', other: 'batch-end'});
          });
    }
  }

  ngOnDestroy() {
    this.events.unsubscribe('pop-header-nav', this._headerNavPop);
    this.events.unsubscribe('change-date', this._changeDate);
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  /***** End Lifecycle Hooks *****/


  /***** Child Component Outputs *****/

  /**
   * Get alerts associated with the current step
   *
   * @params: none
   *
   * @return: Array of alerts
  **/
  getAlerts(): Array<Alert> {
    return this.selectedBatch.alerts.filter((alert: Alert) => {
      return  alert.title
              === this.selectedBatch.schedule[this.selectedBatch.currentStep].name;
    });
  }

  /**
   * Get the selected batch cid
   *
   * @params: none
   *
   * @return: selected batch cid
  **/
  getBatchId(): string {
    return this.selectedBatch.cid;
  }

  /**
   * Get the process step at current view index
   *
   * @params: none
   *
   * @return: the current process
  **/
  getStepData(): Process {
    return this.selectedBatch.schedule[this.viewStepIndex];
  }

  /**
   * Get the timer step process steps starting at current view index
   *
   * @params: none
   *
   * @return: Array of processes
  **/
  getTimerStepData(): Array<Process> {
    const batch = this.selectedBatch;

    const start = this.viewStepIndex;
    let end = start + 1;

    if (batch.schedule[start].concurrent) {
      for (; end < batch.schedule.length; end++) {
        if (!batch.schedule[end].concurrent) break;
      }
    }
    return batch.schedule.slice(start, end);
  }


  /***** View Display Methods *****/

  /**
   * Check if the selected batch has been populated
   *
   * @params: none
   *
   * @return: true if the selected batch has been changed from null
  **/
  isBatchLoaded(): boolean {
    return this.selectedBatch !== null;
  }

  /**
   * Check if the current view step is a manual step
   *
   * @params: none
   *
   * @return: true if view step is a manual step
  **/
  isManualStepView(): boolean {
    return this.getStepData().type === 'manual';
  }

  /**
   * Check if the current view step is a timer step
   *
   * @params: none
   *
   * @return: true if view step is a timer step
  **/
  isTimerStepView(): boolean {
    return this.getStepData().type === 'timer';
  }

  /**
   * Check if the current view step is a calendar step
   *
   * @params: none
   *
   * @return: true if view step is a calendar step
  **/
  isCalendarStepView(): boolean {
    return this.getStepData().type === 'calendar';
  }

  /**
   * Check if the current view is also the current step or a preview
   *
   * @params: none
   *
   * @return: true if the view index is not the current step index
  **/
  isPreview(): boolean {
    return this.selectedBatch.currentStep !== this.viewStepIndex;
  }

  /***** End View Display Methods *****/


  /***** View Navigation Methods *****/

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
      this.viewStepIndex = nextIndex;
    }
  }

  /**
   * Complete the current process step and proceed to next step,
   * update the server with the next step index, if on last step, end the
   * process, update the server, then nav back
   *
   * @params: none
   * @return: none
  **/
  completeStep(): void {
    const nextIndex = this.getStep(true);
    const isFinished = nextIndex === -1;

    this.processService.incrementCurrentStep(this.selectedBatch, nextIndex)
      .pipe(take(1))
      .subscribe(
        () => {
          if (isFinished) {
            const batchId = this.selectedBatch.cid;
            this.selectedBatch = null;
            this.timerService.removeBatchTimer(batchId);
            this.updateRecipeMasterActive(false);
            this.toastService.presentToast('Enjoy!', 1000, 'bright-toast');
            this.events.publish('update-nav-header', {caller: 'process page', other: 'batch-end'});
          } else {
            this.selectedBatch.currentStep = nextIndex;
            this.viewStepIndex = nextIndex;
          }
        },
        error => {
          // TODO handle increment step error
          this.toastService.presentToast(error);
        });
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
   * Change view index to the currently active step
   *
   * @params: none
   * @return: none
  **/
  goToActiveStep(): void {
    this.viewStepIndex = this.selectedBatch.currentStep;
  }

  /***** End View Navigation Methods *****/


  /***** Calendar Specific Methods *****/

  /**
   * Handle change date event from calendar
   *
   * @params: none
   * @return: none
  **/
  changeDateEventHandler(): void {
    this.toastService.presentToast('Select new dates', 2000, 'top');
    delete this.selectedBatch.schedule[this.selectedBatch.currentStep].startDatetime;
    this.clearAlertsForCurrentStep();
  }

  /**
   * Remove alerts for the current step
   *
   * @params: none
   * @return: none
  **/
  clearAlertsForCurrentStep(): void {
    this.selectedBatch.alerts = this.selectedBatch.alerts.filter(alert => {
      return alert.title !== this.selectedBatch.schedule[this.selectedBatch.currentStep].name;
    });
  }

  /**
   * Check if the current calendar is in progress
   *
   * @params: none
   *
   * @return: true if current step has a startDatetime property
  **/
  isCalendarInProgress(): boolean {
    return  this.selectedBatch.currentStep < this.selectedBatch.schedule.length
            && this.selectedBatch.schedule[this.selectedBatch.currentStep].hasOwnProperty('startDatetime');
  }

  /**
   * Set the start of a calendar step
   *
   * @params: none
   * @return: none
  **/
  startCalendar(): void {
    const values = this.calendarRef.startCalendar();
    this.processService.patchBatchStepById(this.selectedBatch, values['id'], values['update'])
      .pipe(take(1))
      .subscribe(() => {
        console.log('Started calendar');
      });
  }

  /***** End Calendar Specific Methods *****/


  /***** Other *****/

  /**
   * Handle header nav pop event
   *
   * @params: none
   * @return: none
  **/
  headerNavPopEventHandler(): void {
    this.navCtrl.pop();
  }

  /**
   * Update recipe master active batch property on server
   *
   * @params: start - true if recipe master has an active batch
   *
   * @return: none
  **/
  updateRecipeMasterActive(start: boolean): void {
    this.recipeService.patchRecipeMasterById(getId(this.master), {hasActiveBatch: start})
      .pipe(take(1))
      .subscribe(
        master => {
          console.log('Recipe master has active batch: ', master.hasActiveBatch);
        },
        error => {
          console.log(error);
        }
      );
  }

  /***** End Other *****/

}
