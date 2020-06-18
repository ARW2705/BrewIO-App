/* Module imports */
import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavController, NavParams, ViewController } from 'ionic-angular';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Subject } from 'rxjs/Subject';
import { takeUntil } from 'rxjs/operators/takeUntil';

/* Provider imports */
import { UserProvider } from '../../../providers/user/user';
import { ToastProvider } from '../../../providers/toast/toast';


@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
})
export class LoginPage implements OnInit, OnDestroy {
  loginForm: FormGroup;
  showPassword: boolean = false;
  destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    public viewCtrl: ViewController,
    public formBuilder: FormBuilder,
    public userService: UserProvider,
    public toastService: ToastProvider) { }

  /***** Lifecycle Hooks *****/

  ngOnInit() {
    this.initForm();
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
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
    this.userService.logIn(this.loginForm.value, false)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        user => {
          this.toastService.presentToast(`Welcome ${user.username}!`, 1000, 'middle', 'bright-toast');
          this.viewCtrl.dismiss(user);
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

  /***** End Form Methods *****/

}
