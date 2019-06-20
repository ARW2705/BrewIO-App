import { Component } from '@angular/core';
import { ViewController, NavController, NavParams } from 'ionic-angular';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'page-ingredient-form',
  templateUrl: 'ingredient-form.html',
})
export class IngredientFormPage {
  title: string = '';
  ingredientForm: FormGroup;
  ingredientLibrary: any = null;
  ingredientType: string = '';
  selection: any = null;
  showTextArea: boolean = false;
  notes: Array<string> = [];
  formType: string;

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    public viewCtrl: ViewController,
    public formBuilder: FormBuilder) {
      const data = navParams.get('data');
      if (!data) this.dismissOnError(data);
      if (data.library) this.ingredientLibrary = data.library;
      this.ingredientType = data.ingredientType;
      if (data.ingredientType === 'otherIngredients') {
        this.title = 'Add Other';
      } else {
        this.title = `Add ${data.ingredientType}`;
      }
      this.initForm(data);
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }

  dismissOnError(error: any) {
    this.viewCtrl.dismiss({error: error});
  }

  initForm(data: any) {
    this.ingredientForm = this.formBuilder.group({
      type: ['', [Validators.required]],
      quantity: [null, [Validators.required]],
      notes: this.formBuilder.array([]),
      noteTextArea: ['']
    });

    this.formType = data.update ? 'update': 'create';

    if (data.ingredientType === 'grains') {
      this.ingredientForm.addControl('mill', new FormControl(null));
      if (data.update !== undefined) {
        this.ingredientForm.controls.type.setValue(data.update.grainType);
        this.ingredientForm.controls.quantity.setValue(data.update.quantity);
        this.ingredientForm.controls.mill.setValue(data.update.mill);
      }
    } else if (data.ingredientType === 'hops') {
      this.ingredientForm.addControl('addAt', new FormControl(null, [Validators.required]));
      this.ingredientForm.addControl('dryHop', new FormControl(false));
      if (data.update !== undefined) {
        this.ingredientForm.controls.type.setValue(data.update.hopsType);
        this.ingredientForm.controls.quantity.setValue(data.update.quantity);
        this.ingredientForm.controls.addAt.setValue(data.update.addAt);
        this.ingredientForm.controls.dryHop.setValue(data.update.dryHop);
      }
    } else if (data.ingredientType === 'yeast') {
      this.ingredientForm.addControl('requiresStarter', new FormControl(false));
      if (data.update !== undefined) {
        this.ingredientForm.controls.type.setValue(data.update.yeastType);
        this.ingredientForm.controls.quantity.setValue(data.update.quantity);
        this.ingredientForm.controls.requiresStarter.setValue(data.update.requiresStarter);
      }
    } else if (data.ingredientType === 'otherIngredients') {
      this.ingredientForm.removeControl('notes');
      this.ingredientForm.addControl('name', new FormControl('', [Validators.minLength(2), Validators.maxLength(20), Validators.required]));
      this.ingredientForm.addControl('description', new FormControl('', [Validators.minLength(2), Validators.maxLength(120), Validators.required]));
      this.ingredientForm.addControl('units', new FormControl('', [Validators.minLength(1), Validators.maxLength(10), Validators.required]));
      if (data.update !== undefined) {
        this.ingredientForm.controls.name.setValue(data.update.name);
        this.ingredientForm.controls.description.setValue(data.update.description);
        this.ingredientForm.controls.quantity.setValue(data.update.quantity);
        this.ingredientForm.controls.units.setValue(data.update.units);
      }
    }
  }

  onSubmit() {
    const result = this.ingredientForm.value;
    if (this.ingredientType === 'grains') {
      result['grainType'] = result.type;
      delete result.type;
    } else if (this.ingredientType === 'hops') {
      result['hopsType'] = result.type;
      delete result.type;
    } else if (this.ingredientType === 'yeast') {
      result['yeastType'] = result.type;
      delete result.type;
    }
    delete result.noteTextArea;
    if (result.quantity) result.quantity = this.toNumber('quantity');
    if (result.mill) result.mill = this.toNumber('mill');
    if (result.addAt) result.addAt = this.toNumber('addAt');
    this.viewCtrl.dismiss(result);
  }

  toNumber(controlName: string): number {
    return parseFloat(this.ingredientForm.value[controlName]);
  }

  onDeletion() {
    this.viewCtrl.dismiss({delete: true});
  }

}
