import { Component } from '@angular/core';
import { NavController, NavParams, ViewController } from 'ionic-angular';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'page-process-form',
  templateUrl: 'process-form.html',
})
export class ProcessFormPage {
  title: string = '';
  myDate = (new Date()).toISOString();
  private stepType: string;
  private processForm: FormGroup;
  private formMode: string;

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    private formBuilder: FormBuilder,
    private viewCtrl: ViewController) {
      this.stepType = navParams.get('processType');
      this.formMode = navParams.get('formMode');
      this.title = `${this.formMode} ${this.stepType}`;
      this.initForm(navParams.get('update'));
  }

  deleteStep() {
    this.viewCtrl.dismiss({delete: true});
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }

  /**
   * Initialize form base on process type
   * If data passed to form, map data to form fields
  **/
  initForm(data) {
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
    if (data) {
      const control = this.processForm.controls;
      control.name.setValue(data.name);
      control.description.setValue(data.description);
      if (data.type === 'manual') {
        control.expectedDuration.setValue(data.expectedDuration);
      } else {
        if (data.type === 'timer') {
          control.concurrent.setValue(data.concurrent);
          control.splitInterval.setValue(data.setInterval);
        }
        control.duration.setValue(data.duration);
      }
    }
  }

  onSubmit() {
    if (this.formMode === 'create') {
      this.viewCtrl.dismiss(this.processForm.value);
    } else {
      this.viewCtrl.dismiss({update: this.processForm.value});
    }
  }

}
