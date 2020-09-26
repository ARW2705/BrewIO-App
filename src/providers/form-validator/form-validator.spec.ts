/* Module imports */
import { TestBed, getTestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';

/* Provider imports */
import { FormValidatorProvider } from './form-validator';

describe('Custom form validator service', () => {
  let injector: TestBed;
  let formValidator: FormValidatorProvider;

  beforeAll(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        FormValidatorProvider
      ]
    });

    injector = getTestBed();
    formValidator = injector.get(FormValidatorProvider);
  });


  test('should match password and confirmation', () => {
    const formGroup: FormGroup = new FormGroup({
      'password': new FormControl('abcDEF123!@#'),
      'passwordConfirmation': new FormControl('abcDEF123!@#')
    });
    expect(formValidator.passwordMatch()(formGroup)).toBeNull();
  }); // end 'should match password and confirmation' test

  test('should fail matching: missing confirmation', () => {
    const formGroup: FormGroup = new FormGroup({
      'password': new FormControl('abcDEF123!@#'),
      'passwordConfirmation': new FormControl('')
    });
    formValidator.passwordMatch()(formGroup);
    expect(formGroup.controls.passwordConfirmation.getError('required'))
      .toBe(true);
  }); // end 'should fail matching: missing confirmation' test

  test('should fail matching: mismatch', () => {
    const formGroup: FormGroup = new FormGroup({
      'password': new FormControl('abcDEF123!@#'),
      'passwordConfirmation': new FormControl('abc')
    });
    formValidator.passwordMatch()(formGroup);
    expect(formGroup.controls.passwordConfirmation.getError('mismatch'))
      .toBe(true);
  }); // end 'should fail matching: mismatch' test

  test('should match the required password pattern', () => {
    const formControl: FormControl = new FormControl('abcDEF123');
    expect(formValidator.passwordPattern()(formControl)).toBeNull();
  }); // end 'should match the required password pattern' test

  test('should fail to match the required password pattern', () => {
    const formControl: FormControl = new FormControl('abcdef123');
    expect(formValidator.passwordPattern()(formControl))
      .toStrictEqual({ passwordInvalid: true });
  }); // end 'should fail to match the required password pattern' test

  test('should pass eitherOr validation with no additional validators', () => {
    const control1: FormControl = new FormControl('');
    const control2: FormControl = new FormControl('5');
    const control3: FormControl = new FormControl('');

    const formGroup: FormGroup = new FormGroup({
      control1: control1,
      control2: control2,
      control3: control3
    });

    formValidator.eitherOr(['control1', 'control2', 'control3'])(formGroup);

    expect(control1.errors).toBeNull();
    expect(control2.errors).toBeNull();
    expect(control3.errors).toBeNull();
  }); // end 'should pass eitherOr validation with no additional validators' test

  test('should pass eitherOr validation with additional validators', () => {
    const control1: FormControl = new FormControl('10');
    const control2: FormControl = new FormControl('5');
    const control3: FormControl = new FormControl('1');

    const formGroup: FormGroup = new FormGroup({
      control1: control1,
      control2: control2,
      control3: control3
    });

    formValidator
      .eitherOr(
        ['control1', 'control2', 'control3'],
        { required: true, min: 0 }
      )(formGroup);

    expect(control1.errors).toBeNull();
    expect(control2.errors).toBeNull();
    expect(control3.errors).toBeNull();
  }); // end 'should pass eitherOr validation with additional validators' test

  test('should fail eitherOr due to no controls having a value', () => {
    const control1: FormControl = new FormControl('');
    const control2: FormControl = new FormControl('');
    const control3: FormControl = new FormControl('');

    const formGroup: FormGroup = new FormGroup({
      control1: control1,
      control2: control2,
      control3: control3
    });

    formValidator.eitherOr(['control1', 'control2', 'control3'])(formGroup);

    expect(control1.errors).toStrictEqual({ eitherOr: true });
    expect(control2.errors).toStrictEqual({ eitherOr: true });
    expect(control3.errors).toStrictEqual({ eitherOr: true });
  }); // end 'should fail eitherOr due to no controls having a value' test

  test('should fail eitherOr due to failed additional min validation', () => {
    const control1: FormControl = new FormControl('0');
    const control2: FormControl = new FormControl('1');
    const control3: FormControl = new FormControl('2');

    const formGroup: FormGroup = new FormGroup({
      control1: control1,
      control2: control2,
      control3: control3
    });

    formValidator
      .eitherOr(
        ['control1', 'control2', 'control3'],
        { min: 3 }
      )(formGroup);

    expect(control1.errors)
      .toStrictEqual({ eitherOr: true, min: { min: 3, actual: 0 } });
    expect(control2.errors)
      .toStrictEqual({ eitherOr: true, min: { min: 3, actual: 1 } });
    expect(control3.errors)
      .toStrictEqual({ eitherOr: true, min: { min: 3, actual: 2 } });
  });

  test('should pass required validation if selected as such', () => {
    const formControl: FormControl = new FormControl('content');
    formValidator.requiredIfValidator(true)(formControl);
    expect(formControl.errors).toBeNull();
  }); // end 'should pass required validation if selected as such' test

  test('should pass validation if not required', () => {
    const formControl: FormControl = new FormControl('');
    formValidator.requiredIfValidator(false)(formControl);
    expect(formControl.errors).toBeNull();
  }); // end 'should pass validation if not required' test

  test('should fail required validation', () => {
    const formControl: FormControl = new FormControl(null);
    expect(formValidator.requiredIfValidator(true)(formControl))
      .toStrictEqual({ required: true });
  }); // end 'should fail required validation' test

});
