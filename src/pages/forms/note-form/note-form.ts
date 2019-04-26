import { Component } from '@angular/core';
import { NavController, NavParams, ViewController } from 'ionic-angular';
import { FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'page-note-form',
  templateUrl: 'note-form.html',
})
export class NoteFormPage {
  private title: string = '';
  private note: FormControl = null;
  private formMethod: string = '';
  private noteType: string = '';

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    private viewCtrl: ViewController) {
      this.formMethod = navParams.get('formMethod');
      this.noteType = navParams.get('noteType');
      this.title = this.noteType;
      this.note = new FormControl(navParams.get('toUpdate'), [Validators.maxLength(120)]);
  }

  private dismiss(): void {
    this.viewCtrl.dismiss();
  }

  private onDelete(): void {
    this.viewCtrl.dismiss({method: 'delete'});
  }

  private onSubmit(): void {
    this.viewCtrl.dismiss({
      method: this.formMethod,
      note: this.note.value
    });
  }

}
