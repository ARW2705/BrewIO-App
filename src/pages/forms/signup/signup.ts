/* Module imports */
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ViewController } from 'ionic-angular';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
  signupForm: FormGroup;

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
   * Get all error messages for given control
   *
   * @params: control - the form control to check
   *
   * @return: array of error messages
  **/
  getFormErrors(control: string): string[] {
    const result: string[] = [];
    for (const key in this.signupForm.controls[control].errors) {
      result.push(FormValidatorProvider.GetErrorMessage(control, key));
    }
    return result;
  }

  /**
   * Check if given control is touched and has at least one error
   *
   * @params: control - the form control to check
   *
   * @return: true if a control is dirty and has at least one error present
  **/
  hasFormError(control: string): boolean {
    const formControl: AbstractControl = this.signupForm.controls[control];
    return formControl.touched && formControl.errors !== null;
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
          FormValidatorProvider.PasswordPattern()
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
      ],
      // preferredUnits: true
    }, {
      validator: FormValidatorProvider.PasswordMatch()
    });
  }

  /**
   * Submit user signup form to user service, provide feedback on response
   *
   * @params: none
   * @return: none
  **/
  onSubmit(): void {
    const signupData: object = this.signupForm.value;
    // signupData.preferredUnits = signupData.preferredUnits ? 'm': 'e';
    this.userService.signUp(signupData)
      .pipe(take(1))
      .subscribe(
        () => {
          this.toastService.presentToast(
            'Sign up complete!',
            1500,
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
