/* Module imports */
import { Component } from '@angular/core';
import { NavController, NavParams, ViewController } from 'ionic-angular';
import { FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'page-note-form',
  templateUrl: 'note-form.html',
})
export class NoteFormPage {
  title: string = '';
  note: FormControl = null;
  formMethod: string = '';
  noteType: string = '';

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    public viewCtrl: ViewController) {
      this.formMethod = navParams.get('formMethod');
      this.noteType = navParams.get('noteType');
      this.title = this.noteType;
      this.note = new FormControl(navParams.get('toUpdate'), [Validators.maxLength(120)]);
  }

  /**
   * Call ViewController dismiss method with no additional data
   *
   * @params: none
   * @return: none
  **/
  dismiss(): void {
    this.viewCtrl.dismiss();
  }

  /**
   * Call ViewController dismiss method with deletion flag
   *
   * @params: none
   * @return: none
  **/
  onDelete(): void {
    this.viewCtrl.dismiss({method: 'delete'});
  }

  /**
   * Call ViewController dismiss method with form data
   *
   * @params: none
   * @return: none
  **/
  onSubmit(): void {
    this.viewCtrl.dismiss({
      method: this.formMethod,
      note: this.note.value
    });
  }

}
