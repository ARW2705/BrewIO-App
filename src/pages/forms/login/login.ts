import { Component } from '@angular/core';
import { NavController, NavParams, ViewController } from 'ionic-angular';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import { AuthenticationProvider } from '../../../providers/authentication/authentication';
import { UserProvider } from '../../../providers/user/user';
import { ToastProvider } from '../../../providers/toast/toast';

@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
})
export class LoginPage {
  private loginForm: FormGroup;
  private showPassword: boolean = true;

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    private viewCtrl: ViewController,
    private formBuilder: FormBuilder,
    private userService: UserProvider,
    private toastService: ToastProvider,
    private authService: AuthenticationProvider) {
    this.initForm();
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }

  initForm() {
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      remember: false
    });
  }

  onSubmit() {
    this.userService.logIn(this.loginForm.value)
      .subscribe(
        response => {
          if (this.userService.getLoginStatus()) {
            this.toastService.presentToast(`Welcome ${response}!`, 1000, 'middle', 'bright-toast');
            this.viewCtrl.dismiss(response);
          }
        },
        error => {
          this.toastService.presentToast(error, 5000, 'bottom');
        }
      );
  }

  togglePasswordVisible() {
    this.showPassword = !this.showPassword;
  }

}
