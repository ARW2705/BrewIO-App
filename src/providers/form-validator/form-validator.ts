/* Module imports */
import { Injectable } from '@angular/core';
import { AbstractControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';

/* Constants import */
import { PASSWORD_PATTERN } from '../../shared/constants/password-pattern';


@Injectable()
export class FormValidatorProvider {
  static formErrorMessages: object = {
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

  constructor() { }

  /**
   * Get the corresponding validator error message
   *
   * @params: control - form control name
   * @params: errorType - error type in the control
   *
   * @return: error message
  **/
  static GetErrorMessage(control: string, errorType: string): string {
    return FormValidatorProvider
      .formErrorMessages[control][errorType]
      .replace('{}', );
  }

  /**
   * Conditionally set required validator
   *
   * @params: isRequired - true if control should be required
   *
   * @return: ValidatorFn - @params control to attach validator
  **/
  static RequiredIfValidator(isRequired: boolean): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      return isRequired ? Validators.required(control): null;
    }
  }

  /**
   * Password and password confirmation matching validator
   *
   * @params: none
   *
   * @return: ValidatorFn - @params group to pull password and confirmation
   * strings
  **/
  static PasswordMatch(): ValidatorFn {
    return (group: FormGroup): {[key: string]: any} | null => {
      const password: AbstractControl = group.get('password');
      const confirmation: AbstractControl = group.get('passwordConfirmation');

      if (!confirmation.value) {
        confirmation.setErrors({required: true});
      } else if (password.value !== confirmation.value) {
        confirmation.setErrors({mismatch: true});
      }
      
      return null;
    }
  }

  /**
   * Password pattern checking
   *
   * @params: none
   *
   * @return: ValidatorFn - @params control to pull password string
  **/
  static PasswordPattern(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      return PASSWORD_PATTERN
        .test(control.value) ? null: {passwordInvalid: true};
    }
  }

}
