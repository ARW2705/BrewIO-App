/* Module imports */
import { ComponentFixture, TestBed, getTestBed, async } from '@angular/core/testing';
import { IonicModule, NavParams, ViewController } from 'ionic-angular';
import { FormGroup, FormControl } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';

/* Test configuration imports */
import { configureTestBed } from '../../../../test-config/configureTestBed';

/* Mock imports */
import { mockBatch } from '../../../../test-config/mockmodels/mockBatch';
import { mockEnglishUnits } from '../../../../test-config/mockmodels/mockUnits';
import { NavParamsMock, ViewControllerMock } from '../../../../test-config/mocks-ionic';

/* Interface imports */
import { Batch } from '../../../shared/interfaces/batch';
import { PrimaryValues } from '../../../shared/interfaces/primary-values';
import { SelectedUnits } from '../../../shared/interfaces/units';

/* Page imports */
import { ProcessMeasurementsFormPage } from './process-measurements-form';

/* Provider imports */
import { CalculationsProvider } from '../../../providers/calculations/calculations';
import { FormValidatorProvider } from '../../../providers/form-validator/form-validator';
import { PreferencesProvider } from '../../../providers/preferences/preferences';


describe('Recipe Form', () => {
  let fixture: ComponentFixture<ProcessMeasurementsFormPage>;
  let measurementsPage: ProcessMeasurementsFormPage;
  let injector: TestBed;
  let viewCtrl: ViewController;
  let calculator: CalculationsProvider;
  let formValidator: FormValidatorProvider;
  let preferenceService: PreferencesProvider;
  const staticMockBatch: Batch = mockBatch();
  const staticEnglishUnits: SelectedUnits = mockEnglishUnits();
  let originalNgOnInit: () => void;
  let originalNgOnDestroy: () => void;
  configureTestBed();

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      declarations: [
        ProcessMeasurementsFormPage
      ],
      imports: [
        IonicModule.forRoot(ProcessMeasurementsFormPage)
      ],
      providers: [
        { provide: CalculationsProvider, useValue: {} },
        { provide: FormValidatorProvider, useValue: {} },
        { provide: PreferencesProvider, useValue: {} },
        { provide: NavParams, useClass: NavParamsMock },
        { provide: ViewController, useClass: ViewControllerMock }
      ],
      schemas: [
        NO_ERRORS_SCHEMA
      ]
    });
    await TestBed.compileComponents();
  })()
  .then(done)
  .catch(done.fail));

  beforeAll(async(() => {
    injector = getTestBed();
    calculator = injector.get(CalculationsProvider);
    formValidator = injector.get(FormValidatorProvider);
    preferenceService = injector.get(PreferencesProvider);

    calculator.requiresConversion = jest
      .fn()
      .mockReturnValue(false);

    formValidator.requiredIfValidator = jest
      .fn()
      .mockReturnValue((isRequired: boolean): { [key:string]: any} => {
        return null;
      });

    preferenceService.getSelectedUnits = jest
      .fn()
      .mockReturnValue(mockEnglishUnits());
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProcessMeasurementsFormPage);
    measurementsPage = fixture.componentInstance;

    viewCtrl = injector.get(ViewController);

    originalNgOnInit = measurementsPage.ngOnInit;
    measurementsPage.units = staticEnglishUnits;
    measurementsPage.ngOnInit = jest
      .fn();
    originalNgOnDestroy = measurementsPage.ngOnDestroy;
    measurementsPage.ngOnDestroy = jest
      .fn();
  });

  test('should create the component', () => {
    NavParamsMock.setParams('areAllRequired', false);
    NavParamsMock.setParams('batch', staticMockBatch);

    measurementsPage.ngOnInit = originalNgOnInit;
    measurementsPage.ngOnDestroy = originalNgOnDestroy;

    measurementsPage.initForm = jest
      .fn();
    measurementsPage.listenForChanges = jest
      .fn();

    fixture.detectChanges();

    expect(measurementsPage).toBeDefined();
  }); // end 'should create the component' test

  test('should convert form values to number', () => {
    fixture.detectChanges();

    const formValues: object = {
      originalGravity: '1.050',
      finalGravity: '1.015',
      batchVolume: 3
    };

    measurementsPage.convertFormValuesToNumbers(formValues);

    expect(formValues).toStrictEqual({
      originalGravity: 1.050,
      finalGravity: 1.015,
      batchVolume: 3
    });
  }); // end 'should convert form values to number' test

  test('should dismiss the form with no data', () => {
    const dismissSpy: jest.SpyInstance = jest.spyOn(viewCtrl, 'dismiss');

    fixture.detectChanges();

    measurementsPage.dismiss();

    expect(dismissSpy.mock.calls[0].length).toEqual(0);
  }); // end 'should dismiss the form with no data' test

  test('should convert form density values', () => {
    measurementsPage.requiresDensityConversion = true;

    calculator.convertDensity = jest
      .fn()
      .mockReturnValueOnce(1.05)
      .mockReturnValueOnce(1.012);

    fixture.detectChanges();

    const formValues: object = {
      originalGravity: 30,
      finalGravity: 3,
      batchVolume: 3
    };

    measurementsPage.formatDensityValues(formValues);

    expect(formValues['originalGravity']).toEqual(1.05);
    expect(formValues['finalGravity']).toEqual(1.012);
  }); // end 'should convert form density values' test

  test('should convert form volume values', () => {
    measurementsPage.requiresVolumeConversion = true;

    calculator.convertVolume = jest
      .fn()
      .mockReturnValue(3.0151);

    fixture.detectChanges();

    const formValues: object = {
      originalGravity: 0,
      finalGravity: 0,
      batchVolume: 12
    };

    measurementsPage.formatVolumeValues(formValues);

    expect(formValues['batchVolume']).toEqual(3.0151);
  }); // end 'should convert form volume values' test

  test('should initialize the form with measured values', () => {
    measurementsPage.batch = staticMockBatch;
    measurementsPage.requiresDensityConversion = false;
    measurementsPage.requiresVolumeConversion = false;
    measurementsPage.areAllRequired = false;

    fixture.detectChanges();

    measurementsPage.initForm();

    expect(measurementsPage.measurementsForm.value).toStrictEqual({
      originalGravity:
        staticMockBatch.annotations.measuredValues.originalGravity.toString(),
      finalGravity:
        staticMockBatch.annotations.measuredValues.finalGravity.toString(),
      batchVolume: staticMockBatch.annotations.measuredValues.batchVolume
    });
  }); // end 'should initialize the form with measured values' test

  test('should initialize the form with target values', () => {
    const _mockBatch: Batch = mockBatch();
    const measuredValues: PrimaryValues = _mockBatch.annotations.measuredValues;
    const targetValues: PrimaryValues = _mockBatch.annotations.targetValues;

    measuredValues.originalGravity = -1;
    measuredValues.finalGravity = -1;
    measuredValues.batchVolume = -1;
    targetValues.originalGravity = 10;
    targetValues.finalGravity = 3;
    targetValues.batchVolume = 12;

    measurementsPage.batch = _mockBatch;
    measurementsPage.requiresDensityConversion = true;
    measurementsPage.requiresVolumeConversion = true;
    measurementsPage.areAllRequired = false;

    calculator.convertDensity = jest
      .fn()
      .mockReturnValueOnce(15)
      .mockReturnValueOnce(3.3);
    calculator.convertVolume = jest
      .fn()
      .mockReturnValue(12);

    fixture.detectChanges();

    measurementsPage.initForm();

    expect(measurementsPage.measurementsForm.value).toStrictEqual({
      originalGravity: '15.0',
      finalGravity: '3.3',
      batchVolume: 12
    });
  }); // end 'should initialize the form with target values' test

  test('should listen for form changes', () => {
    measurementsPage.measurementsForm = new FormGroup({
      originalGravity: new FormControl(1.05),
      finalGravity: new FormControl(1.01),
      batchVolume: new FormControl(3)
    });

    fixture.detectChanges();

    measurementsPage.listenForChanges();

    const form: FormGroup = measurementsPage.measurementsForm;

    form.controls.originalGravity.setValue('1.0601');
    expect(form.value.originalGravity).toMatch('1.060');
    form.controls.finalGravity.setValue('1.0150');
    expect(form.value.finalGravity).toMatch('1.015');
  }); // end 'should listen for form changes' test

  test('should submit the form with values', () => {
    measurementsPage.measurementsForm = new FormGroup({
      originalGravity: new FormControl(1.05),
      finalGravity: new FormControl(1.01),
      batchVolume: new FormControl(3)
    });

    measurementsPage.convertFormValuesToNumbers = jest
      .fn();
    measurementsPage.formatDensityValues = jest
      .fn();
    measurementsPage.formatVolumeValues = jest
      .fn();

    const dismissSpy: jest.SpyInstance = jest.spyOn(viewCtrl, 'dismiss');

    fixture.detectChanges();

    measurementsPage.onSubmit();

    expect(dismissSpy).toHaveBeenCalledWith({
      originalGravity: 1.05,
      finalGravity: 1.01,
      batchVolume: 3
    });
  }); // end 'should submit the form with values' test

});
