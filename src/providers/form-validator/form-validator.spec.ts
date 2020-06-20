/* Module imports */
import { TestBed, getTestBed, async } from '@angular/core/testing';
import { FormControl, FormGroup, ValidatorFn } from '@angular/forms';

/* Provider imports */
import { FormValidatorProvider } from './form-validator';

describe('Custom form validator service', () => {
  let injector: TestBed;
  let validator: FormValidatorProvider;
  let matchValidator: ValidatorFn;
  let patternValidator: ValidatorFn;
  let errorGetter: any;

  beforeAll(async(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        FormValidatorProvider
      ]
    });
    injector = getTestBed();
    validator = injector.get(FormValidatorProvider);
    matchValidator = FormValidatorProvider.PasswordMatch();
    patternValidator = FormValidatorProvider.PasswordPattern();
    errorGetter = FormValidatorProvider.GetErrorMessage;
  }));

  describe('Validates password confimration', () => {

    test('should match password and confirmation', () => {
      const formGroup = new FormGroup({
        'password': new FormControl('abcDEF123!@#'),
        'passwordConfirmation': new FormControl('abcDEF123!@#')
      });
      expect(matchValidator(formGroup)).toBe(null);
    }); // end 'should match password and confirmation' test

    test('should fail matching: missing confirmation', () => {
      const formGroup = new FormGroup({
        'password': new FormControl('abcDEF123!@#'),
        'passwordConfirmation': new FormControl('')
      });
      matchValidator(formGroup);
      expect(formGroup.controls.passwordConfirmation.getError('required')).toBe(true);
    }); // end 'should fail matching: missing confirmation' test

    test('should fail matching: mismatch', () => {
      const formGroup = new FormGroup({
        'password': new FormControl('abcDEF123!@#'),
        'passwordConfirmation': new FormControl('abc')
      });
      matchValidator(formGroup);
      expect(formGroup.controls.passwordConfirmation.getError('mismatch')).toBe(true);
    }); // end 'should fail matching: mismatch' test

  }); // end 'Validates password confimration' section

  describe('Validates password pattern', () => {

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

  }); // end 'Validates password pattern' section

  describe('Gets validator error messages', () => {

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

  }); // end 'Gets validator error messages' section

});
