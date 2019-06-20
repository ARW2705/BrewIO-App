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

  dismiss(): void {
    this.viewCtrl.dismiss();
  }

  onDelete(): void {
    this.viewCtrl.dismiss({method: 'delete'});
  }

  onSubmit(): void {
    this.viewCtrl.dismiss({
      method: this.formMethod,
      note: this.note.value
    });
  }

}
