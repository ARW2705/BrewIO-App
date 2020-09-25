/* Module imports */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from 'ionic-angular';

/* Test configuration imports */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Constant imports */
import { FORM_ERROR_MESSAGES } from '../../shared/constants/form-error-messages';

/* Component imports */
import { FormErrorComponent } from './form-error';


describe('Form Error Component', () => {
  let fixture: ComponentFixture<FormErrorComponent>;
  let errorCmp: FormErrorComponent;
  configureTestBed();

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      declarations: [
        FormErrorComponent
      ],
      imports: [
        IonicModule
      ]
    });
    await TestBed.compileComponents();
  })()
  .then(done)
  .catch(done.fail));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormErrorComponent);
    errorCmp = fixture.componentInstance;

    errorCmp.formName = 'general';
    errorCmp.controlName = 'name';
    errorCmp.controlErrors = null;
  });

  test('should create the component', () => {
    fixture.detectChanges();

    expect(errorCmp).toBeDefined();
    expect(errorCmp.errors.length).toEqual(0);
  }); // end 'should create the component' test

  test('should populate error messages on changes', () => {
    fixture.detectChanges();

    expect(errorCmp.errors.length).toEqual(0);

    errorCmp.controlErrors = {
      required: true,
      minlength: {
        minlength: 2,
        actual: 1
      }
    };

    errorCmp.ngOnChanges();

    expect(errorCmp.errors.length).toEqual(2);
    expect(errorCmp.errors[0])
      .toMatch(FORM_ERROR_MESSAGES['general']['name']['required']);
    expect(errorCmp.errors[1])
      .toMatch(FORM_ERROR_MESSAGES['general']['name']['minlength']);

    errorCmp.controlErrors = { required: true };

    errorCmp.ngOnChanges();

    expect(errorCmp.errors.length).toEqual(1);
    expect(errorCmp.errors[0])
      .toMatch(FORM_ERROR_MESSAGES['general']['name']['required']);
  }); // end 'should populate error messages on changes' test

});
