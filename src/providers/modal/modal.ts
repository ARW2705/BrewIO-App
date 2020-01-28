/* Module imports */
import { Injectable } from '@angular/core';
import { Events, ModalController } from 'ionic-angular';

/* Page imports */
import { LoginPage } from '../../pages/forms/login/login';
import { SignupPage } from '../../pages/forms/signup/signup';

@Injectable()
export class ModalProvider {

  constructor(public events: Events,
    public modalCtrl: ModalController) { }

  /**
   * Open the login modal
   *
   * @params: none
   * @return: none
  **/
  openLogin(): void {
    const modal = this.modalCtrl.create(LoginPage);
    modal.present({keyboardClose: false});
  }

  /**
   * Open the signup modal
   *
   * @params: none
   * @return: none
  **/
  openSignup(): void {
    const modal = this.modalCtrl.create(SignupPage);
    modal.present({keyboardClose: false});
  }

}
