/* Module imports */
import { Component, OnInit } from '@angular/core';
import { NavController, NavParams, ViewController } from 'ionic-angular';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';


@Component({
  selector: 'page-process-form',
  templateUrl: 'process-form.html',
})
export class ProcessFormPage implements OnInit {
  title: string = '';
  myDate = (new Date()).toISOString();
  stepType: string;
  processForm: FormGroup;
  formMode: string;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public formBuilder: FormBuilder,
    public viewCtrl: ViewController) { }

  /***** Lifecycle Hooks *****/

  ngOnInit() {
    this.stepType = this.navParams.get('processType');
    this.formMode = this.navParams.get('formMode');
    this.title = `${this.formMode} ${this.stepType}`;
    this.initForm(this.navParams.get('update'));
  }

  /***** End Lifecycle Hooks *****/


  /***** Form Methods *****/

  /**
   * Call ViewController dismiss method with deletion flag
   *
   * @params: none
   * @return: none
  **/
  deleteStep(): void {
    this.viewCtrl.dismiss({delete: true});
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
   * Initialize form base on process type
   * If data passed to form, map data to form fields
   *
   * @params: [data] - provided form field values to start with
   *
   * @return: none
  **/
  initForm(data: any): void {
    this.processForm = this.formBuilder.group({
      type: this.stepType,
      name: ['', [Validators.minLength(2), Validators.maxLength(25), Validators.required]],
      description: ['']
    });

    // Add step type specific form controls
    if (this.stepType === 'manual') {
      this.processForm.addControl('expectedDuration', new FormControl());
    } else {
      if (this.stepType === 'timer') {
        this.processForm.addControl('concurrent', new FormControl(false));
        this.processForm.addControl('splitInterval', new FormControl(1));
      }
      this.processForm.addControl('duration', new FormControl());
    }

    // Populate form fields with provided data, if available
    if (data) {
      const control = this.processForm.controls;
      control.name.setValue(data.name);
      control.description.setValue(data.description);
      if (data.type === 'manual') {
        control.expectedDuration.setValue(data.expectedDuration);
      } else {
        if (data.type === 'timer') {
          control.concurrent.setValue(data.concurrent);
          control.splitInterval.setValue(data.splitInterval);
        }
        control.duration.setValue(data.duration);
      }
    }
  }

  /**
   * Call ViewController dismiss with form data
   *
   * @params: none
   * @return: none
  **/
  onSubmit(): void {
    if (this.formMode === 'create') {
      this.viewCtrl.dismiss(this.processForm.value);
    } else {
      this.viewCtrl.dismiss({update: this.processForm.value});
    }
  }

  /***** End Form Methods *****/

}
