/* Module imports */
import { Component, OnInit } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

/* Constant imports */
import * as Units from '../../../shared/constants/units';

/* Utility imports */
import { roundToDecimalPlace } from '../../../shared/utility-functions/utilities';

/* Interface imports */
import { SelectedUnits } from '../../../shared/interfaces/units';
import { Style } from '../../../shared/interfaces/library';

/* Provider imports */
import { CalculationsProvider } from '../../../providers/calculations/calculations';
import { PreferencesProvider } from '../../../providers/preferences/preferences';


@Component({
  selector: 'page-general-form',
  templateUrl: 'general-form.html',
})
export class GeneralFormPage implements OnInit {
  controlsToConvertToNumber: string[] = [
    'efficiency',
    'batchVolume',
    'boilVolume',
    'mashVolume',
    'boilDuration',
    'mashDuration'
  ];
  controlsToConvertUnits: string[] = [
    'batchVolume',
    'boilVolume',
    'mashVolume',
  ];
  docMethod: string = '';
  formType: string = '';
  generalForm: FormGroup = null;
  styles: Style[] = null;
  styleSelection: Style;
  units: SelectedUnits = null;

  constructor(
    public formBuilder: FormBuilder,
    public navParams: NavParams,
    public viewCtrl: ViewController,
    public calculator: CalculationsProvider,
    public preferenceService: PreferencesProvider
  ) { }

  /***** Lifecycle Hooks *****/

  ngOnInit() {
    this.units = this.preferenceService.getSelectedUnits();
    this.formType = this.navParams.get('formType');
    this.docMethod = this.navParams.get('docMethod');
    this.styles = this.navParams.get('styles');
    this.initForm(this.navParams.get('data'));
  }

  /***** End Lifecycle Hooks *****/


  /***** Form Methods *****/

  /**
   * ion-select comparison function - allows objects as values
   *
   * @params: o1 - comparison object
   * @params: o2 - comparison object
   *
   * @return: true if object ids match
  **/
  compareWithFn(o1: any, o2: any): boolean {
    return o1 && o2 ? o1._id === o2._id: o1 === o2;
  }

  /**
   * Convert numeric values to numbers and store units converted to english
   * standard
   *
   * @params: none
   *
   * @return: a submission ready object of form values
  **/
  convertForSubmission(): object {
    const formValues: object = {};
    for (const key in this.generalForm.value) {
      if (this.controlsToConvertToNumber.includes(key)) {
        formValues[key] = parseFloat(this.generalForm.value[key]);
      } else {
        formValues[key] = this.generalForm.value[key];
      }
      if (
        this.controlsToConvertUnits.includes(key)
        && this.calculator.requiresConversion('volumeLarge', this.units)
      ) {
        formValues[key] = this.calculator
          .convertVolume(formValues[key], true, true);
      }
    }
    return formValues;
  }

  /**
   * Call ViewController dismiss method
   *
   * @params: none
   * @return: none
  **/
  dismiss() {
    this.viewCtrl.dismiss();
  }

  /**
   * Initialize general form - apply current values passed to
   * form if form is to be updated
   *
   * @params: [data] - initial values to populate form
   *
   * @return: none
  **/
  initForm(data?: any): void {
    this.generalForm = this.formBuilder.group({
      style: ['', [Validators.required]],
      brewingType: ['', [Validators.required]],
      efficiency: [
        70,
        [
          Validators.required,
          Validators.min(0),
          Validators.max(100)
        ]
      ],
      mashDuration: [
        60,
        [
          Validators.required,
          Validators.min(0)
        ]
      ],
      boilDuration: [
        60,
        [
          Validators.required,
          Validators.min(0)
        ]
      ],
      batchVolume: [
        null,
        [
          Validators.required,
          Validators.min(0)
        ]
      ],
      boilVolume: [
        null,
        [
          Validators.required,
          Validators.min(0)
        ]
      ],
      mashVolume: [
        null,
        [
          Validators.required,
          Validators.min(0)
        ]
      ],
      isFavorite: false,
      isMaster: false
    });

    // Set form control name based on formType
    this.generalForm.addControl(
      this.formType === 'master' ? 'name': 'variantName',
      new FormControl(
        '',
        [
          Validators.minLength(2),
          Validators.maxLength(30),
          Validators.required
        ]
      )
    );

    // If form data was passed to page, map that data to form
    if (data) {
      for (const key in data) {
        if (
          this.docMethod !== 'create'
          || (key !== 'isFavorite'
              && key !== 'isMaster')
        ) {
          if (this.controlsToConvertUnits.includes(key)) {
            if (this.calculator.requiresConversion('volumeLarge', this.units)) {
              data[key] = this.calculator.convertVolume(data[key], true, false);
            }
            this.generalForm.controls[key]
              .setValue(roundToDecimalPlace(data[key], 2));
          } else {
            this.generalForm.controls[key].setValue(data[key]);
          }
        }
      }
      this.styleSelection = data.style;
    }
  }

  /**
   * Update style selection on form selection
   *
   * @params: style - form select result event
   *
   * @return: none
  **/
  onStyleSelection(style): void {
    this.styleSelection = style;
  }

  /**
   * Convert any numbers that are strings to their number types
   * then call ViewController dimiss and pass the form values
   *
   * @params: none
   * @return: none
  **/
  onSubmit(): void {
    this.viewCtrl.dismiss(this.convertForSubmission());
  }

  /***** End Form Methods *****/

}
