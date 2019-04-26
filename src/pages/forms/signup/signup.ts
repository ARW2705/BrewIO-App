import { Component, ChangeDetectorRef } from '@angular/core';
import { NavController, NavParams, ViewController } from 'ionic-angular';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import { FormValidatorProvider } from '../../../providers/form-validator/form-validator';
import { UserProvider } from '../../../providers/user/user';

@Component({
  selector: 'page-signup',
  templateUrl: 'signup.html',
})
export class SignupPage {
  private signupForm: FormGroup;
  private showPassword: boolean = true;
  errMsg: string = '';

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    private cdRef: ChangeDetectorRef,
    private viewCtrl: ViewController,
    private formBuilder: FormBuilder,
    private userService: UserProvider) {
      this.initForm();
  }

  private dismiss(): void {
    this.viewCtrl.dismiss();
  }

  private initForm(): void {
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

  private onSubmit(): void {
    this.userService.signUp(this.signupForm.value)
      .subscribe(response => {
        console.log(response);
        this.viewCtrl.dismiss(response);
      });
  }

  private togglePasswordVisible(): void {
    this.showPassword = !this.showPassword;
  }

  private hasFormError(control: string): boolean {
    if (this.signupForm.controls[control].touched) {
      for (const key in this.signupForm.controls[control].errors) {
        if (this.signupForm.controls[control].errors.hasOwnProperty(key)) {
          return true;
        }
      }
    }
    return false;
  }

  private getFormErrors(control: string): Array<string> {
    const result = [];
    for (const key in this.signupForm.controls[control].errors) {
      result.push(FormValidatorProvider.GetErrorMessage(control, key));
    }
    return result;
  }

}
