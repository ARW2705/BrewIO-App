/* Module imports */
import { Component, OnInit } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';
import { FormControl, Validators } from '@angular/forms';


@Component({
  selector: 'page-note-form',
  templateUrl: 'note-form.html',
})
export class NoteFormPage implements OnInit {
  formMethod: string = '';
  note: FormControl = null;
  noteType: string = '';
  title: string = '';

  constructor(
    public navParams: NavParams,
    public viewCtrl: ViewController
  ) { }

  /***** Lifecycle Hooks *****/

  ngOnInit() {
    this.formMethod = this.navParams.get('formMethod');
    this.noteType = this.navParams.get('noteType');
    this.title = this.noteType;
    this.note = new FormControl(
      this.navParams.get('toUpdate'), [Validators.maxLength(120)]
    );
  }

  /***** End Lifecycle Hooks *****/


  /***** Form Methods *****/

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

  /***** End Form Methods *****/

}
