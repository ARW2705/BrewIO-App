/* Module imports */
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ViewController } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs/Subject';
import { take } from 'rxjs/operators/take';

/* Provider imports */
import { FormValidatorProvider } from '../../../providers/form-validator/form-validator';
import { ToastProvider } from '../../../providers/toast/toast';
import { UserProvider } from '../../../providers/user/user';


@Component({
  selector: 'page-signup',
  templateUrl: 'signup.html',
})
export class SignupPage implements OnInit, OnDestroy {
  destroy$: Subject<boolean> = new Subject<boolean>();
  preferredUnits: string = 'EN';
  showPassword: boolean = false;
  signupForm: FormGroup = null;

  constructor(
    public formBuilder: FormBuilder,
    public viewCtrl: ViewController,
    public formValidator: FormValidatorProvider,
    public toastService: ToastProvider,
    public userService: UserProvider
  ) { }

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
   * Call ViewController dismiss method with no data
   *
   * @params: none
   *
   * @return: none
  **/
  dismiss(): void {
    this.viewCtrl.dismiss();
  }

  /**
   * Create the form
   *
   * @params: none
   *
   * @return: none
  **/
  initForm(): void {
    this.signupForm = this.formBuilder.group({
      username: [
        '',
        [
          Validators.minLength(6),
          Validators.maxLength(20),
          Validators.required
        ]
      ],
      password: [
        '',
        [
          Validators.minLength(8),
          Validators.maxLength(20),
          Validators.required,
          this.formValidator.passwordPattern()
        ]
      ],
      passwordConfirmation: [
        '',
        [
          Validators.required
        ]
      ],
      email: [
        '',
        [
          Validators.email,
          Validators.required
        ]
      ],
      firstname: [
        '',
        [
          Validators.maxLength(25)
        ]
      ],
      lastname: [
        '',
        [
          Validators.maxLength(25)
        ]
      ]
    }, {
      validator: this.formValidator.passwordMatch()
    });
  }

  /**
   * Submit user signup form to user service, provide feedback on response
   *
   * @params: none
   * @return: none
  **/
  onSubmit(): void {
    this.userService.signUp(this.signupForm.value)
      .pipe(take(1))
      .subscribe(
        () => {
          this.toastService.presentToast(
            'Sign up complete!',
            1500,
            'middle',
            'toast-bright'
          );
          this.viewCtrl.dismiss();
        },
        error => this.toastService.presentToast(error, 2000)
      );
  }

  /**
   * Toggle whether password is in plain text or hidden
   *
   * @params: none
   * @return: none
  **/
  togglePasswordVisible(): void {
    this.showPassword = !this.showPassword;
  }

  /***** End Lifecycle Hooks *****/

}
