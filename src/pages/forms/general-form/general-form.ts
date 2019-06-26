import { Component } from '@angular/core';
import { NavController, NavParams, ViewController } from 'ionic-angular';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';

import { Style } from '../../../shared/interfaces/library';

@Component({
  selector: 'page-general-form',
  templateUrl: 'general-form.html',
})
export class GeneralFormPage {
  generalForm: FormGroup = null;
  formType: string = '';
  mode: string = '';
  docMethod: string = '';
  styles: Array<Style> = null;
  styleSelection;
  controlsToConvert: Array<string> = [
    'efficiency',
    'batchVolume',
    'boilVolume',
    'mashVolume',
    'boilDuration',
    'mashDuration'
  ];

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    public viewCtrl: ViewController,
    public formBuilder: FormBuilder) {
      this.formType = navParams.get('formType');
      this.mode = navParams.get('mode');
      this.docMethod = navParams.get('docMethod');
      this.styles = navParams.get('styles');
      this.initForm(navParams.get('data'));
  }

  // ion-select comparison function - allows objects as values
  compareWithFn(o1, o2) {
    return o1 && o2 ? o1._id === o2._id: o1 === o2;
  }

  // ion-input stores numbers as strings - must be submitted as numbers
  convertFormValuesToNumbers() {
    this.controlsToConvert.forEach(key => {
      this.generalForm.controls[key].setValue(parseFloat(this.generalForm.value[key]));
    });
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }

  // Initialize general form - apply current values passed to form if form is to be updated
  initForm(data?: any) {
    this.generalForm = this.formBuilder.group({
      style: ['', [Validators.required]],
      brewingType: ['', [Validators.required]],
      efficiency: 70,
      mashDuration: 60,
      boilDuration: 60,
      batchVolume: [null, [Validators.required]],
      boilVolume: [null, [Validators.required]],
      mashVolume: [null, [Validators.required]],
      isFavorite: false,
      isMaster: false
    });

    // Set form control name based on formType
    this.generalForm.addControl(
      this.formType === 'master' ? 'name': 'variantName',
      new FormControl('', [Validators.minLength(2), Validators.maxLength(20), Validators.required])
    );

    // If form data was passed to page, map that data to form
    if (data) {
      for (const key in data) {
        this.generalForm.controls[key].setValue(data[key]);
      }
      this.styleSelection = data.style;
    }
  }

  onStyleSelection(style): void {
    this.styleSelection = style;
  }

  onSubmit(): void {
    this.convertFormValuesToNumbers();
    this.viewCtrl.dismiss(this.generalForm.value);
  }

}
