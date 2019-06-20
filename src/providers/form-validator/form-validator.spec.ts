import { FormControl, FormGroup, ValidatorFn } from '@angular/forms';

import { FormValidatorProvider } from './form-validator';

let matchValidator: ValidatorFn;
let patternValidator: ValidatorFn;
let errorGetter: any;

describe('Custom form validator service', () => {

  describe('Validates password confimration', () => {

    beforeAll(() => {
      matchValidator = FormValidatorProvider.PasswordMatch();
    });

    test('should match password and confirmation', () => {
      const formGroup = new FormGroup({
        'password': new FormControl('abcDEF123!@#'),
        'passwordConfirmation': new FormControl('abcDEF123!@#')
      });
      expect(matchValidator(formGroup)).toBe(null);
    });

    test('should fail matching: missing confirmation', () => {
      const formGroup = new FormGroup({
        'password': new FormControl('abcDEF123!@#'),
        'passwordConfirmation': new FormControl('')
      });
      matchValidator(formGroup);
      expect(formGroup.controls.passwordConfirmation.getError('required')).toBe(true);
    });

    test('should fail matching: mismatch', () => {
      const formGroup = new FormGroup({
        'password': new FormControl('abcDEF123!@#'),
        'passwordConfirmation': new FormControl('abc')
      });
      matchValidator(formGroup);
      expect(formGroup.controls.passwordConfirmation.getError('mismatch')).toBe(true);
    });

  });

  describe('Validates password pattern', () => {

    beforeAll(() => {
      patternValidator = FormValidatorProvider.PasswordPattern();
    });

    test('should match password pattern', () => {
      expect(patternValidator(new FormControl('abcDEF123!@#'))).toBe(null);
    });

    test('should fail password pattern: missing lowercase letter', () => {
      expect(patternValidator(new FormControl('ABCDEF123!@#')).passwordInvalid).toBe(true);
    });

    test('should fail password pattern: missing uppercase letter', () => {
      expect(patternValidator(new FormControl('abcdef123!@#')).passwordInvalid).toBe(true);
    });

    test('should fail password pattern: missing number', () => {
      expect(patternValidator(new FormControl('abcDEFghi!@#')).passwordInvalid).toBe(true);
    });

    test('should fail password pattern: missing special character', () => {
      expect(patternValidator(new FormControl('abcDEF123456')).passwordInvalid).toBe(true);
    });

  });

  describe('Gets validator error messages', () => {

    beforeAll(() => {
      errorGetter = FormValidatorProvider.GetErrorMessage;
    });

    test('should get username is required error', () => {
      expect(errorGetter('username', 'required')).toMatch('Username is required');
    });

    test('should get username is too short error', () => {
      expect(errorGetter('username', 'minlength')).toMatch('Username must be at least 6 characters');
    });

    test('should get username is too long error', () => {
      expect(errorGetter('username', 'maxlength')).toMatch('Username is limited to 20 characters');
    });

    test('should get password is required error', () => {
      expect(errorGetter('password', 'required')).toMatch('Password is required');
    });

    test('should get password is too short error', () => {
      expect(errorGetter('password', 'minlength')).toMatch('Password must be at least 8 characters');
    });

    test('should get password is too long error', () => {
      expect(errorGetter('password', 'maxlength')).toMatch('Password is limited to 20 characters');
    });

    test('should get password pattern is invalid error', () => {
      expect(errorGetter('password', 'passwordInvalid')).toMatch('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character (!@#$%^&*)');
    });

    test('should get password confirmation required error', () => {
      expect(errorGetter('passwordConfirmation', 'required')).toMatch('Must confirm password');
    });

    test('should get password confirmation mismatch error', () => {
      expect(errorGetter('passwordConfirmation', 'mismatch')).toMatch('Passwords must match');
    });

    test('should get email is required error', () => {
      expect(errorGetter('email', 'required')).toMatch('Email address is required');
    });

    test('should get email pattern is invalid error', () => {
      expect(errorGetter('email', 'email')).toMatch('Email address is invalid');
    });

    test('should get first name is too long error', () => {
      expect(errorGetter('firstname', 'maxlength')).toMatch('First name is limited to 25 characters');
    });

    test('should get last name is too long error', () => {
      expect(errorGetter('lastname', 'maxlength')).toMatch('Last name is limited to 25 characters');
    });

  });

});
