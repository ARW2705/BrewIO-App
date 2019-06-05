import { Component } from '@angular/core';
import { NavController, NavParams, ViewController } from 'ionic-angular';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';

import { Style } from '../../../shared/interfaces/library';

@Component({
  selector: 'page-general-form',
  templateUrl: 'general-form.html',
})
export class GeneralFormPage {
  private generalForm: FormGroup = null;
  private formType: string = '';
  private mode: string = '';
  private docMethod: string = '';
  private styles: Array<Style> = null;
  private styleSelection;
  private controlsToConvert: Array<string> = [
    'efficiency',
    'batchVolume',
    'boilVolume',
    'mashVolume',
    'boilDuration',
    'mashDuration'
  ];

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    private viewCtrl: ViewController,
    private formBuilder: FormBuilder) {
    this.formType = navParams.get('formType');
    this.mode = navParams.get('mode');
    this.docMethod = navParams.get('docMethod');
    this.styles = navParams.get('styles');
    this.initForm(navParams.get('data'));
  }

  private compareWithFn(o1, o2) {
    return o1 && o2 ? o1._id === o2._id: o1 === o2;
  }

  private convertFormValuesToNumbers() {
    this.controlsToConvert.forEach(key => {
      this.generalForm.controls[key].setValue(parseFloat(this.generalForm.value[key]));
    });
  }

  private dismiss() {
    this.viewCtrl.dismiss();
  }

  private initForm(data?: any) {
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
    this.generalForm.addControl(
      this.formType == 'master' ? 'name': 'variantName',
      new FormControl('', [Validators.minLength(2), Validators.maxLength(20), Validators.required])
    );
    if (data) {
      for (const key in data) {
        this.generalForm.controls[key].setValue(data[key]);
      }
      this.styleSelection = data.style;
    }
  }

  private onStyleSelection(style) {
    this.styleSelection = style;
  }

  private onSubmit() {
    this.convertFormValuesToNumbers();
    this.viewCtrl.dismiss(this.generalForm.value);
  }

}
