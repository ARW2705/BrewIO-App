/* Module imports */
import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs/Subject';

/* Interface imports */
import { Batch, BatchAnnotations } from '../../../shared/interfaces/batch';
import { PrimaryValues } from '../../../shared/interfaces/primary-values';

/* Provider imports */
import { FormValidatorProvider } from '../../../providers/form-validator/form-validator';


@Component({
  selector: 'page-process-measurements-form',
  templateUrl: 'process-measurements-form.html',
})
export class ProcessMeasurementsFormPage implements OnInit, OnDestroy {
  areAllRequired: boolean = false;
  batch: Batch = null;
  destroy$: Subject<boolean> = new Subject<boolean>();
  readonly measuredSentinel: number = -1;
  measurementsForm: FormGroup = null;

  constructor(
    public formBuilder: FormBuilder,
    public navParams: NavParams,
    public viewCtrl: ViewController
  ) { }

  /***** Lifecycle Hooks *****/

  ngOnInit() {
    this.areAllRequired = this.navParams.get('areAllRequired');
    this.batch = this.navParams.get('batch');
    this.initForm();
    this.listenForChanges();
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  /***** End Lifecycle Hooks *****/


  /**
   * Convert form number inputs from strings back to numbers
   *
   * @params: formValues - object of form inputs
   *
   * @return: formValues with strings parsed to numbers
  **/
  convertFormValuesToNumbers(): object {
    const formValues: object = this.measurementsForm.value;
    for (const key in formValues) {
      if (typeof formValues[key] !== 'number') {
        formValues[key] = parseFloat(formValues[key]);
      }
    }
    return formValues;
  }

  /**
   * Call ViewController dismiss method with no data
   *
   * @params: none
   * @return: none
  **/
  dismiss(): void {
    this.viewCtrl.dismiss();
  }

  /**
   * Initialize form for measured values and yield; if data was passed to the
   * form, map data to form fields
   *
   * @params: [data] - provided form field values to start with
   *
   * @return: none
  **/
  initForm(): void {
    const annotations: BatchAnnotations = this.batch.annotations;
    const targetValues: PrimaryValues = annotations.targetValues;
    const measuredValues: PrimaryValues = annotations.measuredValues;
    const originalGravity: number
      = measuredValues.originalGravity !== this.measuredSentinel
      ? measuredValues.originalGravity
      : targetValues.originalGravity;
    const finalGravity: number
      = measuredValues.finalGravity !== this.measuredSentinel
      ? measuredValues.finalGravity
      : targetValues.finalGravity;
    const batchVolume: number
      = measuredValues.batchVolume !== this.measuredSentinel
      ? measuredValues.batchVolume
      : targetValues.batchVolume;

    this.measurementsForm = this.formBuilder.group({
      originalGravity: [
        originalGravity.toFixed(3),
        [
          Validators.min(0),
          FormValidatorProvider.RequiredIfValidator(this.areAllRequired)
        ]
      ],
      finalGravity: [
        finalGravity.toFixed(3),
        [
          Validators.min(0),
          FormValidatorProvider.RequiredIfValidator(this.areAllRequired)
        ]
      ],
      batchVolume: [
        batchVolume,
        [
          Validators.min(0),
          FormValidatorProvider.RequiredIfValidator(this.areAllRequired)
        ]
      ]
    });
  }

  /**
   * Listen for form changes; reformat gravity values to 3 decimal places
   *
   * @params: none
   * @return: none
  **/
  listenForChanges(): void {
    this.measurementsForm.valueChanges
      .takeUntil(this.destroy$)
      .subscribe(
        (formValues: { originalGravity: string, finalGravity: string }): void => {
          const controls: { [key: string]: AbstractControl }
            = this.measurementsForm.controls;

          if (formValues.originalGravity.length > 5) {
            controls.originalGravity.setValue(
              parseFloat(formValues.originalGravity).toFixed(3).toString()
            );
          }

          if (formValues.finalGravity.length > 5) {
            controls.finalGravity.setValue(
              parseFloat(formValues.finalGravity).toFixed(3).toString()
            );
          }
        }
      );
  }

  /**
   * Call view controller dimiss with form data
   *
   * @params: none
   * @return: none
  **/
  onSubmit(): void {
    this.viewCtrl.dismiss(this.convertFormValuesToNumbers());
  }

}
