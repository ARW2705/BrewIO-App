/* Module imports */
import { Component, OnInit } from '@angular/core';
import { ViewController } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs/Subject';
import { take } from 'rxjs/operators/take';

/* Provider imports */
import { ToastProvider } from '../../../providers/toast/toast';
import { UserProvider } from '../../../providers/user/user';


@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
})
export class LoginPage implements OnInit {
  destroy$: Subject<boolean> = new Subject<boolean>();
  loginForm: FormGroup = null;
  showPassword: boolean = false;

  constructor(
    public formBuilder: FormBuilder,
    public viewCtrl: ViewController,
    public toastService: ToastProvider,
    public userService: UserProvider
  ) { }

  /***** Lifecycle Hooks *****/

  ngOnInit() {
    this.initForm();
  }

  /***** End Lifecycle Hooks *****/


  /***** Form Methods *****/

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
      password: ['', Validators.required],
      remember: false,
      username: ['', Validators.required]
    });
  }

  /**
   * Submit log in form and provide feedback toast on response
   *
   * @params: none
   * @return: none
  **/
  onSubmit() {
    this.userService.logIn(this.loginForm.value, false)
      .pipe(take(1))
      .subscribe(
        user => {
          this.toastService.presentToast(
            `Welcome ${user.username}!`,
            2000,
            'middle',
            'toast-bright'
          );
          this.viewCtrl.dismiss(user);
        },
        error => {
          this.toastService.presentToast(
            error,
            6000,
            'bottom',
            'toast-error'
          );
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

  /***** End Form Methods *****/

}
