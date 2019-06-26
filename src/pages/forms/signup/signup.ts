import { Component } from '@angular/core';
import { NavController, NavParams, ViewController } from 'ionic-angular';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import { FormValidatorProvider } from '../../../providers/form-validator/form-validator';
import { UserProvider } from '../../../providers/user/user';
import { ToastProvider } from '../../../providers/toast/toast';

@Component({
  selector: 'page-signup',
  templateUrl: 'signup.html',
})
export class SignupPage {
  signupForm: FormGroup;
  showPassword: boolean = true;

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    public viewCtrl: ViewController,
    public formBuilder: FormBuilder,
    public userService: UserProvider,
    public toastService: ToastProvider) {
      this.initForm();
  }

  dismiss(): void {
    this.viewCtrl.dismiss();
  }

  /**
   * Get all error messages for given control
   *
   * @params: control - the form control to check
  **/
  getFormErrors(control: string): Array<string> {
    const result = [];
    for (const key in this.signupForm.controls[control].errors) {
      result.push(FormValidatorProvider.GetErrorMessage(control, key));
    }
    return result;
  }

  /**
   * Check if given control is touched and has at least one error
   *
   * @params: control - the form control to check
  **/
  hasFormError(control: string): boolean {
    if (this.signupForm.controls[control].touched) {
      for (const key in this.signupForm.controls[control].errors) {
        if (this.signupForm.controls[control].errors.hasOwnProperty(key)) {
          return true;
        }
      }
    }
    return false;
  }

  initForm(): void {
    this.signupForm = this.formBuilder.group({
      username: ['', [Validators.minLength(6), Validators.maxLength(20), Validators.required]],
      password: ['', [Validators.minLength(8), Validators.maxLength(20), Validators.required, FormValidatorProvider.PasswordPattern()]],
      passwordConfirmation: ['', [Validators.required]],
      email: ['', [Validators.email, Validators.required]],
      firstname: ['', [Validators.maxLength(25)]],
      lastname: ['', [Validators.maxLength(25)]]
    }, {
      validator: FormValidatorProvider.PasswordMatch()
    });
  }

  onSubmit(): void {
    this.userService.signUp(this.signupForm.value)
      .subscribe(
        response => {
          console.log(response);
          this.toastService.presentToast('Sign up complete!', 1500, 'bright-toast');
          this.viewCtrl.dismiss(response);
        },
        error => {
          this.toastService.presentToast(error.error.error.message, 2000);
        }
      );
  }

  togglePasswordVisible(): void {
    this.showPassword = !this.showPassword;
  }

}
