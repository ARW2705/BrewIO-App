import { Injectable } from '@angular/core';
import { Events, ModalController } from 'ionic-angular';

import { LoginPage } from '../../pages/forms/login/login';
import { SignupPage } from '../../pages/forms/signup/signup';
import { NoteFormPage } from '../../pages/forms/note-form/note-form';

@Injectable()
export class ModalProvider {

  constructor(private events: Events,
    private modalCtrl: ModalController) {
      console.log('Hello ModalProvider Provider');
  }

  public openLogin(): void {
    const modal = this.modalCtrl.create(LoginPage);
    modal.onDidDismiss(data => {
      if (data) {
        this.events.publish('on-login', data);
      }
    });
    modal.present({keyboardClose: false});
  }

  public openSignup(): void {
    const modal = this.modalCtrl.create(SignupPage);
    modal.onDidDismiss(data => {
      if (data) {
        console.log('signup', data);
        this.events.publish('on-signup', data);
      }
    });
    modal.present({keyboardClose: false});
  }

}
