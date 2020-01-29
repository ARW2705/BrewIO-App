/* Module imports */
import { Component } from '@angular/core';
import { NavController, NavParams, ViewController } from 'ionic-angular';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

/* Interface imports */
import { User } from '../../../shared/interfaces/user';

/* Provider imports */
import { UserProvider } from '../../../providers/user/user';
import { ToastProvider } from '../../../providers/toast/toast';

@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
})
export class LoginPage {
  public loginForm: FormGroup;
  public showPassword: boolean = true;
  public user$: Observable<User> = null;

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    public viewCtrl: ViewController,
    public formBuilder: FormBuilder,
    public userService: UserProvider,
    public toastService: ToastProvider) {
      this.user$ = this.userService.getUser();
      this.initForm();
  }

  /**
   * Call ViewController dismiss method
   *
   * @params: none
   * @return: none
  **/
  dismiss(): void {
    this.viewCtrl.dismiss();
  }

  /**
   * Create the form
   *
   * @params: none
   * @return: none
  **/
  initForm() {
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      remember: false
    });
  }

  /**
   * Submit log in form and provide feedback toast on response
   *
   * @params: none
   * @return: none
  **/
  onSubmit() {
    this.userService.logIn(this.loginForm.value)
      .subscribe(
        response => {
          if (response.success) {
            this.toastService.presentToast(`Welcome ${response.user.username}!`, 1000, 'middle', 'bright-toast');
            this.viewCtrl.dismiss(response);
          }
        },
        error => {
          this.toastService.presentToast(error, 5000, 'bottom');
        }
      );
  }

  /**
   * Toggle whether password is in plain text or hidden
   *
   * @params: none
   * @return: none
  **/
  togglePasswordVisible() {
    this.showPassword = !this.showPassword;
  }

}
