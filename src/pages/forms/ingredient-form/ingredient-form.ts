/* Module imports */
import { Component, OnInit } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';


@Component({
  selector: 'page-ingredient-form',
  templateUrl: 'ingredient-form.html',
})
export class IngredientFormPage implements OnInit {
  formType: string;
  ingredientForm: FormGroup = null;
  ingredientLibrary: any = null;
  ingredientPlaceholder: string = '';
  ingredientType: string = '';
  notes: string[] = [];
  selection: any = null;
  showTextArea: boolean = false;
  title: string = '';

  constructor(
    public formBuilder: FormBuilder,
    public navParams: NavParams,
    public viewCtrl: ViewController
  ) { }

  /***** Lifecycle Hooks *****/

  ngOnInit() {
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
   * Initialize form based on ingredient type
   * If form data is passed to page, map data to form
   *
   * @params: data - ingredient context data
   *
   * @return: none
  **/
  initForm(data: any): void {
    this.ingredientForm = this.formBuilder.group({
      notes: this.formBuilder.array([]),
      noteTextArea: [''],
      quantity: [null, [Validators.required]],
      type: ['', [Validators.required]]
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
    if (data.update !== undefined) {
      this.ingredientPlaceholder = data.update.grainType.name;
    }

    this.ingredientForm.addControl('mill', new FormControl(null));

    if (data.update !== undefined) {
      this.ingredientForm.controls.type.setValue(data.update.grainType);
      this.ingredientForm.controls.quantity.setValue(data.update.quantity);
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
      'addAt', new FormControl(null, [Validators.required])
    );
    this.ingredientForm.addControl('dryHop', new FormControl(false));

    if (data.update !== undefined) {
      this.ingredientForm.controls.type.setValue(data.update.hopsType);
      this.ingredientForm.controls.quantity.setValue(data.update.quantity);
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
      this.ingredientForm.controls.requiresStarter.setValue(data.update.requiresStarter);
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
    this.ingredientForm.removeControl('notes');
    this.ingredientForm.addControl('name', new FormControl('', [Validators.minLength(2), Validators.maxLength(20), Validators.required]));
    this.ingredientForm.addControl('description', new FormControl('', [Validators.minLength(2), Validators.maxLength(120), Validators.required]));
    this.ingredientForm.addControl('units', new FormControl('', [Validators.minLength(1), Validators.maxLength(10), Validators.required]));
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
   * Format form data for result and dismiss with data
   *
   * @params: none
   * @return: none
  **/
  onSubmit(): void {
    const result: object = this.ingredientForm.value;
    // convert generic ingredient type to named ingredient type
    if (this.ingredientType === 'grains') {
      result['grainType'] = result['type'];
      delete result['type'];
    } else if (this.ingredientType === 'hops') {
      result['hopsType'] = result['type'];
      delete result['type'];
    } else if (this.ingredientType === 'yeast') {
      result['yeastType'] = result['type'];
      delete result['type'];
    }

    delete result['noteTextArea'];

    if (result['quantity']) {
      result['quantity'] = parseFloat(this.ingredientForm.value.quantity);
    }
    if (result['mill']) {
      result['mill'] = parseFloat(this.ingredientForm.value.mill);
    }
    if (result['addAt']) {
      result['addAt'] = parseFloat(this.ingredientForm.value.addAt);
    }

    this.viewCtrl.dismiss(result);
  }

  /***** End Form Methods *****/

}
