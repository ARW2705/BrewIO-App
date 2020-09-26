/* Module imports */
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Events, Modal, ModalController, NavController, NavParams, Platform, ViewController } from 'ionic-angular';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { Subject } from 'rxjs/Subject';
import { take } from 'rxjs/operators/take';
import { takeUntil } from 'rxjs/operators/takeUntil';

/* Interface imports */
import { Alert } from '../../shared/interfaces/alert';
import { Batch } from '../../shared/interfaces/batch';
import { PrimaryValues } from '../../shared/interfaces/primary-values';
import { Process } from '../../shared/interfaces/process';
import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { RecipeVariant } from '../../shared/interfaces/recipe-variant';

/* Utility function imports */
import { getId, hasId } from '../../shared/utility-functions/id-helpers';
import { normalizeErrorObservableMessage } from '../../shared/utility-functions/observable-helpers';

/* Component imports */
import { CalendarProcessComponent } from './process-components/calendar-process/calendar-process';

/* Page imports */
import { InventoryWrapperPage } from '../extras/extras-components/inventory-wrapper/inventory-wrapper';
import { ProcessMeasurementsFormPage } from '../forms/process-measurements-form/process-measurements-form';

/* Provider imports */
import { ProcessProvider } from '../../providers/process/process';
import { TimerProvider } from '../../providers/timer/timer';
import { ToastProvider } from '../../providers/toast/toast';
import { UserProvider } from '../../providers/user/user';


@Component({
  selector: 'page-process',
  templateUrl: 'process.html'
})
export class ProcessPage implements OnInit, OnDestroy {
  @ViewChild('calendar') calendarRef: CalendarProcessComponent;
  alerts: Alert[] = [];
  atViewEnd: boolean = false;
  atViewStart: boolean = true;
  batchId: string = null;
  destroy$: Subject<boolean> = new Subject<boolean>();
  isCalendarInProgress: boolean = false;
  isConcurrent: boolean = false;
  recipeMaster: RecipeMaster = null;
  recipeVariant: RecipeVariant = null;
  requestedUserId: string = null;
  selectedBatch: Batch = null;
  selectedBatch$: BehaviorSubject<Batch> = null;
  stepData: any = null;
  stepType: string = '';
  viewStepIndex: number = 0;
  _changeDate: any;
  _headerNavPop: any;

  constructor(
    public events: Events,
    public modalCtrl: ModalController,
    public navCtrl: NavController,
    public navParams: NavParams,
    public viewCtrl: ViewController,
    public platform: Platform,
    public processService: ProcessProvider,
    public timerService: TimerProvider,
    public toastService: ToastProvider,
    public userService: UserProvider
  ) {
    this._headerNavPop = this.headerNavPopEventHandler.bind(this);
    this._changeDate = this.changeDateEventHandler.bind(this);
  }

  /***** Lifecycle Hooks *****/

  ngOnInit() {
    this.recipeMaster = this.navParams.get('master');
    this.requestedUserId = this.navParams.get('requestedUserId');
    this.recipeVariant = this.recipeMaster.variants
      .find(variant => hasId(variant, this.navParams.get('selectedRecipeId')));
    this.batchId = this.navParams.get('selectedBatchId');
    this.events.subscribe('pop-header-nav', this._headerNavPop);
    this.events.subscribe('change-date', this._changeDate);

    if (this.navParams.get('origin') === 'RecipeDetailPage') {
      this.navCtrl.remove(this.navCtrl.length() - 2, 1);
    }

    if (!this.batchId) {
      // Start a new batch
      console.log('starting batch', this.requestedUserId);
      this.processService.startNewBatch(
        this.requestedUserId,
        getId(this.recipeMaster),
        getId(this.recipeVariant)
      )
      .pipe(take(1))
      .subscribe(
        (newBatch: Batch) => {
          this.selectedBatch$ = this.processService
            .getBatchById(getId(newBatch));

          if (!this.selectedBatch$) {
            this.toastService.presentToast(
              'Internal error: Batch not found',
              3000,
              'bottom'
            );
            setTimeout(() => {
              this.events.publish(
                'update-nav-header',
                {
                  caller: 'process page',
                  other: 'batch-end'
                }
              );
            }, 3000);
          } else {
            this.selectedBatch$
              .pipe(takeUntil(this.destroy$))
              .subscribe((selectedBatch: Batch) => {
                if (this.selectedBatch === null) {
                  console.log('starting batch and timer');
                  this.selectedBatch = selectedBatch;
                  this.batchId = getId(selectedBatch);
                  this.timerService.addBatchTimer(selectedBatch);
                }
                this.selectedBatch = selectedBatch;
                this.updateViewData();
              });
          }
        },
        (error: ErrorObservable): void => {
          // TODO change toast to error message in view, then call go back
          this.toastService.presentToast(
            normalizeErrorObservableMessage(error),
            3000,
            'toast-error'
          );
          this.events.publish(
            'update-nav-header',
            {
              caller: 'process page',
              other: 'batch-end'
            }
          );
      });
    } else {
      // Continue an existing batch
      console.log('continuing batch', this.batchId);
      this.selectedBatch$ = this.processService.getBatchById(this.batchId);

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
            this.events.publish(
              'update-nav-header',
              {
                caller: 'process page',
                other: 'batch-end'
              }
            );
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
  getAlerts(): Alert[] {
    return this.selectedBatch.process.alerts.filter((alert: Alert) => {
      return  alert.title === this.selectedBatch.process
        .schedule[this.selectedBatch.process.currentStep].name;
    });
  }

  /**
   * Get the timer step process steps starting at current view index
   *
   * @params: none
   *
   * @return: Array of processes
  **/
  getTimerStepData(): Process[] {
    const batch: Batch = this.selectedBatch;

    const start: number = this.viewStepIndex;
    let end: number = start + 1;

    if (batch.process.schedule[start].concurrent) {
      for (; end < batch.process.schedule.length; end++) {
        if (!batch.process.schedule[end].concurrent) break;
      }
    }

    return batch.process.schedule.slice(start, end);
  }

  /***** View Navigation Methods *****/

  /**
   * Change view index only, does not trigger step completion
   *
   * @params: direction - either 'prev' or 'next'
   *
   * @return: none
  **/
  changeStep(direction: string): void {
    const nextIndex: number = this.getStep(false, direction);
    if (nextIndex !== -1) {
      this.viewStepIndex = nextIndex;
    }
    this.updateViewData();
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
    const nextIndex: number = this.getStep(true);
    const isFinished: boolean = nextIndex === -1;

    this.processService.incrementCurrentStep(
      getId(this.selectedBatch),
      nextIndex
    )
    .pipe(take(1))
    .subscribe(
      (): void => {
        if (isFinished) {
          console.log('finishing batch');
          const batchId: string = this.selectedBatch.cid;
          this.selectedBatch = null;
          this.timerService.removeBatchTimer(batchId);
          this.navToInventory(batchId);
        } else {
          this.selectedBatch.process.currentStep = nextIndex;
          this.viewStepIndex = nextIndex;
          this.updateViewData();
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
    let nextIndex: number = -1;
    if (direction === 'next') {
      for (let i=startIndex; i < this.selectedBatch.process.schedule.length; i++) {
        if (!this.selectedBatch.process.schedule[i].concurrent) {
          nextIndex = i;
          break;
        }
      }
    } else {
      for (let i=startIndex - 1; i >= 0; i--) {
        if (!this.selectedBatch.process.schedule[i].concurrent) {
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
    let nextIndex: number = -1;
    const viewIndex: number = onComplete
      ? this.selectedBatch.process.currentStep
      : this.viewStepIndex;

    if (direction === 'next') {
      if (viewIndex < this.selectedBatch.process.schedule.length - 1) {
        if (this.selectedBatch.process.schedule[viewIndex].concurrent) {
          nextIndex = this.getIndexAfterSkippingConcurrent(direction, viewIndex);
        } else {
          nextIndex = viewIndex + 1;
        }
      }
    } else {
      if (viewIndex > 0) {
        if (this.selectedBatch.process.schedule[viewIndex].concurrent) {
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
    this.viewStepIndex = this.selectedBatch.process.currentStep;
    this.updateViewData();
  }

  /**
   * Set data to be displayed in current view
   *
   * @params: none
   * @return: none
  **/
  updateViewData(): void {
    const pendingStep: (Process | Process[])
      = this.selectedBatch.process.schedule[this.viewStepIndex];

    if (pendingStep.type === 'timer') {
      this.stepData = this.getTimerStepData();
      this.stepType = 'timer';
    } else {
      this.stepData = pendingStep;
      this.stepType = pendingStep.type;
      this.isCalendarInProgress = this.hasCalendarStarted();
    }

    this.alerts = this.getAlerts();
    this.atViewStart = this.viewStepIndex === 0;
    this.atViewEnd = this.viewStepIndex
      === this.selectedBatch.process.schedule.length - 1;
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
    delete this.selectedBatch
      .process
      .schedule[this.selectedBatch.process.currentStep]
      .startDatetime;
    this.isCalendarInProgress = false;
    this.clearAlertsForCurrentStep();
  }

  /**
   * Remove alerts for the current step
   *
   * @params: none
   * @return: none
  **/
  clearAlertsForCurrentStep(): void {
    this.selectedBatch.process.alerts = this.selectedBatch.process.alerts
      .filter(alert => {
        return alert.title !== this.selectedBatch
          .process
          .schedule[this.selectedBatch.process.currentStep]
          .name;
      });
  }

  /**
   * Check if the current calendar is in progress
   *
   * @params: none
   *
   * @return: true if current step has a startDatetime property
  **/
  hasCalendarStarted(): boolean {
    return (
        this.selectedBatch.process.currentStep
        < this.selectedBatch.process.schedule.length
      )
      && this.selectedBatch
        .process
        .schedule[this.selectedBatch.process.currentStep]
        .hasOwnProperty('startDatetime');
  }

  /**
   * Set the start of a calendar step
   *
   * @params: none
   * @return: none
  **/
  startCalendar(): void {
    const values: object = this.calendarRef.startCalendar();
    this.processService.patchStepById(getId(this.selectedBatch), values)
      .pipe(take(1))
      .subscribe((): void => {
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
  headerNavPopEventHandler(data?: any): void {
    if (
      data
      && data.origin
      && data.origin.toLowerCase().includes('wrapper')
    ) {
      this.navCtrl.pop();
    }
  }

  /**
   * Navigate to inventory page with id of batch
   *
   * @params: sourceBatchId - batch id to use in inventory
   *
   * @return: none
  **/
  navToInventory(sourceBatchId: string): void {
    console.log('nav to inventory');
    this.events.publish('update-nav-header', {
      caller: 'process page',
      destType: 'page',
      destTitle: 'Inventory',
      origin: this.navCtrl.getViews()[this.navCtrl.length() - 2].name
    });
    this.navCtrl.push(
      InventoryWrapperPage,
      {
        onInit: true,
        sourceBatchId: sourceBatchId
      }
    );
  }

  /**
   * Open batch measurements form
   *
   * @params: onBatchComplete - true if a complete form is required
   *
   * @return: none
  **/
  openMeasurementFormModal(onBatchComplete: boolean): void {
    const options: object = {
      areAllRequired: onBatchComplete,
      batch: this.selectedBatch
    };

    const modal: Modal = this.modalCtrl.create(
      ProcessMeasurementsFormPage,
      options
    );

    modal.onDidDismiss((update: PrimaryValues) => {
      if (update) {
        this.processService.patchMeasuredValues(
          !onBatchComplete,
          getId(this.selectedBatch),
          update
        )
        .pipe(take(1))
        .subscribe(
          (): void => {
            this.toastService.presentToast('Measured Values Updated');
          },
          (error: ErrorObservable): void => {
            console.log(
              `Measurement form error: ${normalizeErrorObservableMessage(error)}`
            );
          })
      }
    });

    modal.present();
  }

  /***** End Other *****/

}
