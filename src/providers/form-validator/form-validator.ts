import { Injectable } from '@angular/core';
import { AbstractControl, FormGroup, ValidatorFn } from '@angular/forms';

import { passwordPattern } from '../../shared/constants/password-pattern';

@Injectable()
export class FormValidatorProvider {
  static formErrorMessages = {
    username: {
      required: 'Username is required',
      minlength: 'Username must be at least 6 characters',
      maxlength: 'Username is limited to 20 characters'
    },
    password: {
      required: 'Password is required',
      minlength: 'Password must be at least 8 characters',
      maxlength: 'Password is limited to 20 characters',
      passwordInvalid: 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character (!@#$%^&*)'
    },
    passwordConfirmation: {
      required: 'Must confirm password',
      mismatch: 'Passwords must match'
    },
    email: {
      required: 'Email address is required',
      email: 'Email address is invalid'
    },
    firstname: {
      maxlength: 'First name is limited to 25 characters'
    },
    lastname: {
      maxlength: 'Last name is limited to 25 characters'
    }
  };

  constructor() {
    console.log('Hello FormValidatorProvider Provider');
  }

  static PasswordMatch(): ValidatorFn {
    return (group: FormGroup): {[key: string]: any} | null => {
      const password = group.get('password');
      const confirmation = group.get('passwordConfirmation');
      if (!confirmation.value) {
        confirmation.setErrors({required: true});
      } else if (password.value != confirmation.value) {
        confirmation.setErrors({mismatch: true});
      }
      return null;
    }
  }

  static PasswordPattern(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      return passwordPattern.test(control.value) ? null: {passwordInvalid: true};
    }
  }

  static GetErrorMessage(control: string, errorType: string): string {
    return FormValidatorProvider.formErrorMessages[control][errorType].replace('{}', );
  }

}
