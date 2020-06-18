/* Module imports */
import { Component, OnInit } from '@angular/core';
import { NavController, NavParams, ViewController } from 'ionic-angular';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';

/* Interface imports */
import { Style } from '../../../shared/interfaces/library';

@Component({
  selector: 'page-general-form',
  templateUrl: 'general-form.html',
})
export class GeneralFormPage implements OnInit {
  generalForm: FormGroup = null;
  formType: string = '';
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

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public viewCtrl: ViewController,
    public formBuilder: FormBuilder
  ) { }

  /***** Lifecycle Hooks *****/

  ngOnInit() {
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
   * ion-input stores numbers as strings - must be submitted as numbers
   *
   * @params: none
   * @return: none
  **/
  convertFormValuesToNumbers(): void {
    this.controlsToConvert.forEach(key => {
      this.generalForm.controls[key].setValue(parseFloat(this.generalForm.value[key]));
    });
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
      new FormControl('', [Validators.minLength(2), Validators.maxLength(30), Validators.required])
    );

    // If form data was passed to page, map that data to form
    if (data) {
      for (const key in data) {
        this.generalForm.controls[key].setValue(data[key]);
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
    this.convertFormValuesToNumbers();
    this.viewCtrl.dismiss(this.generalForm.value);
  }

  /***** End Form Methods *****/

}
