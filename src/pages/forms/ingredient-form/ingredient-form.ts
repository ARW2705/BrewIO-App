/* Module imports */
import { Component, OnInit } from '@angular/core';
import { NavParams, ViewController, Toggle } from 'ionic-angular';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

/* Constant imports */
import * as Units from '../../../shared/constants/units';

/* Utility imports */
import { roundToDecimalPlace } from '../../../shared/utility-functions/utilities';

/* Interface imports */
import { SelectedUnits } from '../../../shared/interfaces/units';

/* Provider imports */
import { CalculationsProvider } from '../../../providers/calculations/calculations';
import { FormValidatorProvider } from '../../../providers/form-validator/form-validator';
import { PreferencesProvider } from '../../../providers/preferences/preferences';


@Component({
  selector: 'page-ingredient-form',
  templateUrl: 'ingredient-form.html',
})
export class IngredientFormPage implements OnInit {
  formType: string;
  hasSubQuantity: boolean = false;
  ingredientForm: FormGroup = null;
  ingredientLibrary: any = null;
  ingredientPlaceholder: string = '';
  ingredientType: string = '';
  requiresConversionLarge: boolean = false;
  requiresConversionSmall: boolean = false;
  selection: any = null;
  showTextArea: boolean = false;
  title: string = '';
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
    this.units = this.preferenceService.getSelectedUnits();
    this.requiresConversionLarge = this.calculator
      .requiresConversion('weightLarge', this.units);
    this.requiresConversionSmall = this.calculator
      .requiresConversion('weightSmall', this.units);

    const data: any = this.navParams.get('data');

    if (!data) {
      this.dismissOnError(data);
      return;
    }

    if (data.library) {
      this.ingredientLibrary = data.library;
    }

    this.ingredientType = data.ingredientType;

    if (data.ingredientType === 'otherIngredients') {
      this.title = 'Add Other';
    } else {
      this.title = `Add ${data.ingredientType}`;
    }

    this.initForm(data);
  }

  /***** End Lifecycle Hooks *****/


  /***** Form Methods *****/

  /**
   * Call ViewController dismiss method
   *
   * @params: none
   * @return: none
  **/
  dismiss(): void {
    this.viewCtrl.dismiss();
  }

  /**
   * Dismiss form with error message
   *
   * @params: error - error message
   *
   * @return: none
  **/
  dismissOnError(error: any): void {
    this.viewCtrl.dismiss({error: error});
  }

  /**
   * Format a form response for grains ingredient
   *
   * @params: result - unformatted form object
   *
   * @return: formatted response
  **/
  formatGrainsResponse(): object {
    const result: object = {};
    const formValues: object = this.ingredientForm.value;

    result['grainType'] = formValues['type'];

    let quantity: number
      = parseFloat(formValues['quantity']) || 0;
    let subQuantity: number
      = parseFloat(formValues['subQuantity']) || 0;

    if (quantity && subQuantity) {
      quantity = this.requiresConversionLarge
        ? this.calculator.convertWeight(quantity, true, true)
        : quantity;
      subQuantity = this.requiresConversionSmall
        ? this.calculator.convertWeight(subQuantity, false, true)
        : subQuantity;
      quantity += subQuantity / 16;
    } else if (quantity) {
      quantity = this.requiresConversionLarge
        ? this.calculator.convertWeight(quantity, true, true)
        : quantity;
    } else if (subQuantity) {
      subQuantity = this.requiresConversionSmall
        ? this.calculator.convertWeight(subQuantity, false, true)
        : subQuantity;
      quantity = subQuantity / 16;
    }

    result['quantity'] = quantity;

    if (formValues.hasOwnProperty('mill')) {
      result['mill'] = parseFloat(formValues['mill']);
    }

    delete result['type'];
    delete result['subQuantity'];

    return result;
  }

  /**
   * Format a form response for hops ingredient
   *
   * @params: result - unformatted form object
   *
   * @return: formatted response
  **/
  formatHopsResponse(): object {
    const result: object = {};
    const formValues: object = this.ingredientForm.value;

    result['hopsType'] = formValues['type'];

    let quantity: number = parseFloat(formValues['subQuantity']);
    result['quantity'] = this.requiresConversionSmall
      ? this.calculator.convertWeight(quantity, false, true)
      : quantity;

    result['addAt'] = parseFloat(formValues['addAt']);
    result['dryHop'] = formValues['dryHop'];

    delete result['type'];
    delete result['subQuantity'];

    return result;
  }

  /**
   * Format a form response for other ingredients
   *
   * @params: result - unformatted form object
   *
   * @return: formatted response
  **/
  formatOtherIngredientsResponse(): object {
    const result: object = {};
    const formValues: object = this.ingredientForm.value;

    result['quantity'] = parseFloat(formValues['quantity']);
    result['name'] = formValues['name'];
    result['description'] = formValues['description'];
    result['units'] = formValues['units'];
    result['type'] = formValues['type'];

    delete result['subQuantity'];

    return result;
  }

  /**
   * Format a form response for yeast ingredient
   *
   * @params: result - unformatted form object
   *
   * @return: formatted response
  **/
  formatYeastResponse(): object {
    const result: object = {};
    const formValues: object = this.ingredientForm.value;

    result['yeastType'] = formValues['type'];

    result['quantity'] = parseFloat(formValues['quantity']);
    result['requiresStarter'] = formValues['requiresStarter'];

    delete result['subQuantity'];
    delete result['type'];

    return result;
  }

  /**
   * Initialize form based on ingredient type
   * If form data is passed to page, map data to form
   *
   * @params: data - ingredient context data
   *
   * @return: none
  **/
  initForm(data: any): void {
    this.ingredientForm = this.formBuilder.group({
      quantity: null,
      subQuantity: null,
      type: ['', [Validators.required]]
    },{
      validator: this.formValidator
        .eitherOr(
          ['quantity', 'subQuantity'],
          { min: 0 }
        )
    });

    this.formType = data.update === undefined ? 'create': 'update';

    if (data.ingredientType === 'grains') {
      this.initGrainsFields(data);
    } else if (data.ingredientType === 'hops') {
      this.initHopsFields(data);
    } else if (data.ingredientType === 'yeast') {
      this.initYeastFields(data);
    } else if (data.ingredientType === 'otherIngredients') {
      this.initOtherIngredientsFields(data);
    }
  }

  /**
   * Fill in grains specific form controls
   *
   * @params: data - grains data
   *
   * @return: none
  **/
  initGrainsFields(data: any): void {
    const requiresConversion: boolean = this.calculator
      .requiresConversion('weightLarge', this.units);

    this.hasSubQuantity = !requiresConversion;

    if (data.update !== undefined) {
      this.ingredientPlaceholder = data.update.grainType.name;
    }

    this.ingredientForm.addControl('mill', new FormControl(null));

    if (data.update !== undefined) {
      let quantity: number = data.update.quantity;
      let subQuantity: number = null;

      if (requiresConversion) {
        quantity = this.calculator.convertWeight(quantity, true, false);
      } else {
        subQuantity = (quantity % 1);
        if (this.calculator.requiresConversion('weightSmall', this.units)) {
          subQuantity = this.calculator.convertWeight(subQuantity, false, false);
        } else {
          subQuantity *= 16;
        }
        quantity = Math.floor(quantity);
        this.ingredientForm.controls.subQuantity
          .setValue(roundToDecimalPlace(subQuantity, 2));
      }

      this.ingredientForm.controls.quantity
        .setValue(roundToDecimalPlace(quantity, 2));
      this.ingredientForm.controls.type.setValue(data.update.grainType);
      this.ingredientForm.controls.mill.setValue(data.update.mill);
    }
  }

  /**
   * Fill in hops specific form controls
   *
   * @params: data - hops data
   *
   * @return: none
  **/
  initHopsFields(data: any): void {
    if (data.update !== undefined) {
      this.ingredientPlaceholder = data.update.hopsType.name;
    }

    this.ingredientForm.addControl(
      'addAt', new FormControl(null, [Validators.required, Validators.min(0)])
    );
    this.ingredientForm.addControl('dryHop', new FormControl(false));

    if (data.update !== undefined) {
      let quantity: number = data.update.quantity;
      if (this.calculator.requiresConversion('weightSmall', this.units)) {
        quantity = this.calculator.convertWeight(quantity, false, false);
      }
      this.ingredientForm.controls
        .subQuantity.setValue(roundToDecimalPlace(quantity, 2));
      this.ingredientForm.controls.type.setValue(data.update.hopsType);
      this.ingredientForm.controls.addAt.setValue(data.update.addAt);
      this.ingredientForm.controls.dryHop.setValue(data.update.dryHop);
    }
  }

  /**
   * Fill in yeast specific form controls
   *
   * @params: data - yeast data
   *
   * @return: none
  **/
  initYeastFields(data: any): void {
    if (data.update !== undefined) {
      this.ingredientPlaceholder = data.update.yeastType.name;
    }

    this.ingredientForm.addControl('requiresStarter', new FormControl(false));

    if (data.update !== undefined) {
      this.ingredientForm.controls.type.setValue(data.update.yeastType);
      this.ingredientForm.controls.quantity.setValue(data.update.quantity);
      this.ingredientForm.controls.requiresStarter
        .setValue(data.update.requiresStarter);
    }
  }

  /**
   * Fill in other ingredient specific form controls
   *
   * @params: data - other ingredient data
   *
   * @return: none
  **/
  initOtherIngredientsFields(data: any): void {
    this.ingredientForm
      .addControl(
        'name',
        new FormControl(
          '',
          [
            Validators.minLength(2),
            Validators.maxLength(20),
            Validators.required
          ]
        )
      );
    this.ingredientForm
      .addControl(
        'description',
        new FormControl(
          '',
          [
            Validators.minLength(2),
            Validators.maxLength(120),
            Validators.required
          ]
        )
      );
    this.ingredientForm
      .addControl(
        'units',
        new FormControl(
          '',
          [
            Validators.minLength(1),
            Validators.maxLength(10),
            Validators.required
          ]
        )
      );

    if (data.update !== undefined) {
      this.ingredientForm.controls.type.setValue(data.update.type);
      this.ingredientForm.controls.name.setValue(data.update.name);
      this.ingredientForm.controls.description.setValue(data.update.description);
      this.ingredientForm.controls.quantity.setValue(data.update.quantity);
      this.ingredientForm.controls.units.setValue(data.update.units);
    }
  }

  /**
   * Dismiss with flag to delete the ingredient
   *
   * @params: none
   * @return: none
  **/
  onDeletion(): void {
    this.viewCtrl.dismiss({delete: true});
  }

  /**
   * Set addAt validators based on whether the hops instance is marked as
   * dry hop or not
   *
   * @params: dryHop - ion-toggle event
   *
   * @return: none
  **/
  onDryHopChange(dryHop: Toggle): void {
    if (dryHop.value) {
      this.ingredientForm.get('addAt').clearValidators();
    } else {
      this.ingredientForm.get('addAt')
        .setValidators([Validators.required, Validators.min(0)]);
    }
    this.ingredientForm.get('addAt').updateValueAndValidity();
  }

  /**
   * Format form data for result and dismiss with data
   *
   * @params: none
   * @return: none
  **/
  onSubmit(): void {
    let result: object;

    if (this.ingredientType === 'grains') {
      result = this.formatGrainsResponse();
    } else if (this.ingredientType === 'hops') {
      result = this.formatHopsResponse();
    } else if (this.ingredientType === 'yeast') {
      result = this.formatYeastResponse();
    } else if (this.ingredientType === 'otherIngredients') {
      result = this.formatOtherIngredientsResponse();
    }

    delete result['noteTextArea'];

    this.viewCtrl.dismiss(result);
  }

  /***** End Form Methods *****/

}
