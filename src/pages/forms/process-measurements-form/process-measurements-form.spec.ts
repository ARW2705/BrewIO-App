/* Module imports */
import { ComponentFixture, TestBed, getTestBed, async } from '@angular/core/testing';
import { IonicModule, NavParams, ViewController } from 'ionic-angular';
import { AbstractControl, FormGroup } from '@angular/forms';

/* Test configuration imports */
import { configureTestBed } from '../../../../test-config/configureTestBed';

/* Mock imports */
import { mockBatch } from '../../../../test-config/mockmodels/mockBatch';
import { NavParamsMock, ViewControllerMock } from '../../../../test-config/mocks-ionic';

/* Interface imports */
import { Batch } from '../../../shared/interfaces/batch';

/* Page imports */
import { ProcessMeasurementsFormPage } from './process-measurements-form';


describe('Recipe Form', () => {
  let fixture: ComponentFixture<ProcessMeasurementsFormPage>;
  let measurementsPage: ProcessMeasurementsFormPage;
  let injector: TestBed;
  let viewCtrl: ViewController;
  let _mockCompareBatch: Batch;
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
        { provide: NavParams, useClass: NavParamsMock },
        { provide: ViewController, useClass: ViewControllerMock }
      ]
    });
    await TestBed.compileComponents();
  })()
  .then(done)
  .catch(done.fail));

  beforeAll(async(() => {
    injector = getTestBed();
    NavParamsMock.setParams('areAllRequired', false);
    NavParamsMock.setParams('batch', mockBatch());
    _mockCompareBatch = mockBatch();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProcessMeasurementsFormPage);
    measurementsPage = fixture.componentInstance;

    viewCtrl = injector.get(ViewController);
  });

  test('should create the component', () => {
    fixture.detectChanges();

    expect(measurementsPage).toBeDefined();
  }); // end 'should create the component' test

  test('should convert form values to number', () => {
    fixture.detectChanges();

    const form: FormGroup = measurementsPage.measurementsForm;
    const ogControl: AbstractControl = form.controls.originalGravity;
    const fgControl: AbstractControl = form.controls.finalGravity;

    expect(typeof ogControl.value).toMatch('string');
    expect(typeof fgControl.value).toMatch('string');

    const converted: object = measurementsPage.convertFormValuesToNumbers();

    expect(typeof converted['originalGravity']).toMatch('number');
    expect(typeof converted['finalGravity']).toMatch('number');
  }); // end 'should convert form values to number' test

  test('should dismiss the form with no data', () => {
    const dismissSpy: jest.SpyInstance = jest.spyOn(viewCtrl, 'dismiss');

    fixture.detectChanges();

    measurementsPage.dismiss();

    expect(dismissSpy.mock.calls[0].length).toEqual(0);
  }); // end 'should dismiss the form with no data' test

  test('should initialize the form with measured values', () => {
    fixture.detectChanges();

    const form: FormGroup = measurementsPage.measurementsForm;
    const measuredValues: object = _mockCompareBatch.annotations.measuredValues;

    const ogControl: AbstractControl = form.controls.originalGravity;
    expect(ogControl.value)
      .toMatch(measuredValues['originalGravity'].toString());

    const fgControl: AbstractControl = form.controls.finalGravity;
    expect(fgControl.value).toMatch(measuredValues['finalGravity'].toString());

    const volumeControl: AbstractControl = form.controls.batchVolume;
    expect(volumeControl.value).toEqual(measuredValues['batchVolume']);
  }); // end 'should initialize the form with measured values' test

  test('should initialize the form with target values', () => {
    fixture.detectChanges();

    const _mockModifiedBatch: Batch = mockBatch();
    const measuredValues = _mockModifiedBatch.annotations.measuredValues;
    measuredValues.originalGravity = -1;
    measuredValues.finalGravity = -1;
    measuredValues.batchVolume = -1;

    measurementsPage.batch = _mockModifiedBatch;

    measurementsPage.initForm();

    const form: FormGroup = measurementsPage.measurementsForm;
    const targetValues: object = _mockCompareBatch.annotations.targetValues;

    const ogControl: AbstractControl = form.controls.originalGravity;
    expect(ogControl.value)
      .toMatch(targetValues['originalGravity'].toString());

    const fgControl: AbstractControl = form.controls.finalGravity;
    expect(fgControl.value).toMatch(targetValues['finalGravity'].toString());

    const volumeControl: AbstractControl = form.controls.batchVolume;
    expect(volumeControl.value).toEqual(targetValues['batchVolume']);
  }); // end 'should initialize the form with target values' test

  test('should listen for form changes', () => {
    fixture.detectChanges();

    const form: FormGroup = measurementsPage.measurementsForm;
    const ogControl: AbstractControl = form.controls.originalGravity;
    const fgControl: AbstractControl = form.controls.finalGravity;

    const measuredValues: object = _mockCompareBatch.annotations.measuredValues;
    const measuredOG: number = measuredValues['originalGravity'];
    const measuredFG: number = measuredValues['finalGravity'];

    expect(ogControl.value).toMatch(measuredOG.toString());
    ogControl.setValue('1.05501');
    expect(ogControl.value).toMatch(measuredOG.toString());

    expect(fgControl.value).toMatch(measuredFG.toString());
    fgControl.setValue('1.012000');
    expect(fgControl.value).toMatch(measuredFG.toString());
  }); // end 'should listen for form changes' test

  test('should submit the form with values', () => {
    const dismissSpy: jest.SpyInstance = jest.spyOn(viewCtrl, 'dismiss');

    fixture.detectChanges();

    measurementsPage.onSubmit();

    expect(dismissSpy).toHaveBeenCalledWith({
      originalGravity: 1.055,
      finalGravity: 1.012,
      batchVolume: 5
    });
  }); // end 'should submit the form with values' test

});
