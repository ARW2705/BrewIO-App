/* Module imports */
import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs/Subject';

/* Interface imports */
import { Batch, BatchAnnotations } from '../../../shared/interfaces/batch';
import { PrimaryValues } from '../../../shared/interfaces/primary-values';
import { SelectedUnits } from '../../../shared/interfaces/units';

/* Utility imports */
import { roundToDecimalPlace } from '../../../shared/utility-functions/utilities';

/* Provider imports */
import { CalculationsProvider } from '../../../providers/calculations/calculations';
import { FormValidatorProvider } from '../../../providers/form-validator/form-validator';
import { PreferencesProvider } from '../../../providers/preferences/preferences';


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
  requiresVolumeConversion: boolean = false;
  requiresDensityConversion: boolean = false;
  units: SelectedUnits = null;

  constructor(
    public formBuilder: FormBuilder,
    public navParams: NavParams,
    public viewCtrl: ViewController,
    public calculator: CalculationsProvider,
    public formValidator: FormValidatorProvider,
    public preferenceService: PreferencesProvider
  ) { }

  /***** Lifecycle Hooks *****/

  ngOnInit() {
    this.areAllRequired = this.navParams.get('areAllRequired');
    this.batch = this.navParams.get('batch');
    this.units = this.preferenceService.getSelectedUnits();
    this.requiresVolumeConversion = this.calculator
      .requiresConversion('volumeLarge', this.units);
    this.requiresDensityConversion = this.calculator
      .requiresConversion('density', this.units);
    this.initForm();
    this.listenForChanges();
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  /***** End Lifecycle Hooks *****/


  /**
   * Convert form number inputs from strings back to numbers; Expect all inputs
   * to be digits only
   *
   * @params: formValues - object of form inputs
   *
   * @return: formValues with strings parsed to numbers
  **/
  convertFormValuesToNumbers(formValues: object): void {
    for (const key in formValues) {
      if (typeof formValues[key] === 'string') {
        const parsed: number = parseFloat(formValues[key]);
        if (!isNaN(parsed)) {
          formValues[key] = parsed;
        }
      }
    }
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
   * Convert density to english standard
   *
   * @params: formValues - form values pending submission
   *
   * @return: none
  **/
  formatDensityValues(formValues: object): void {
    if (this.requiresDensityConversion) {
      formValues['originalGravity'] = this.calculator
        .convertDensity(
          formValues['originalGravity'],
          this.units.density.longName,
          'specificGravity'
        );
      formValues['finalGravity'] = this.calculator
        .convertDensity(
          formValues['finalGravity'],
          this.units.density.longName,
          'specificGravity'
        );
    }
  }

  /**
   * Convert volume to english standard
   *
   * @params: formValues - form values pending submission
   *
   * @return: none
  **/
  formatVolumeValues(formValues: object): void {
    if (this.requiresVolumeConversion) {
      formValues['batchVolume'] = this.calculator
        .convertVolume(formValues['batchVolume'], true, true);
    }
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

    let originalGravity: number
      = measuredValues.originalGravity !== this.measuredSentinel
        ? measuredValues.originalGravity
        : targetValues.originalGravity;
    let finalGravity: number
      = measuredValues.finalGravity !== this.measuredSentinel
        ? measuredValues.finalGravity
        : targetValues.finalGravity;

    if (this.requiresDensityConversion) {
      originalGravity = this.calculator
        .convertDensity(
          originalGravity,
          'specificGravity',
          this.units.density.longName
        );
      finalGravity = this.calculator
        .convertDensity(
          finalGravity,
          'specificGravity',
          this.units.density.longName
        );
    }

    let batchVolume: number
      = measuredValues.batchVolume !== this.measuredSentinel
        ? measuredValues.batchVolume
        : targetValues.batchVolume;

    if (this.requiresVolumeConversion) {
      batchVolume = this.calculator.convertVolume(batchVolume, true, false);
    }

    batchVolume = roundToDecimalPlace(batchVolume, 2);

    this.measurementsForm = this.formBuilder.group({
      originalGravity: [
        originalGravity.toFixed(this.requiresDensityConversion ? 1: 3),
        [
          Validators.min(0),
          this.formValidator.requiredIfValidator(this.areAllRequired)
        ]
      ],
      finalGravity: [
        finalGravity.toFixed(this.requiresDensityConversion ? 1: 3),
        [
          Validators.min(0),
          this.formValidator.requiredIfValidator(this.areAllRequired)
        ]
      ],
      batchVolume: [
        batchVolume,
        [
          Validators.min(0),
          this.formValidator.requiredIfValidator(this.areAllRequired)
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
    const formValues: object = this.measurementsForm.value;
    this.convertFormValuesToNumbers(formValues);

    this.formatDensityValues(formValues);
    this.formatVolumeValues(formValues);

    this.viewCtrl.dismiss(formValues);
  }

}
