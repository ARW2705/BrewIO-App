/* Module imports */
import { ComponentFixture, TestBed, getTestBed, async } from '@angular/core/testing';
import { IonicModule, NavParams, ViewController } from 'ionic-angular';
import { AbstractControl, FormControl, FormGroup } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';

/* Test configuration imports */
import { configureTestBed } from '../../../../test-config/configureTestBed';

/* Mock imports */
import { mockEnglishUnits, mockMetricUnits } from '../../../../test-config/mockmodels/mockUnits';
import { mockStyles } from '../../../../test-config/mockmodels/mockStyles';
import { NavParamsMock, ViewControllerMock } from '../../../../test-config/mocks-ionic';

/* Interface imports */
import { SelectedUnits } from '../../../shared/interfaces/units';
import { Style } from '../../../shared/interfaces/library';

/* Page imports */
import { GeneralFormPage } from './general-form';

/* Provider imports */
import { CalculationsProvider } from '../../../providers/calculations/calculations';
import { PreferencesProvider } from '../../../providers/preferences/preferences';


describe('General Form', () => {
  let fixture: ComponentFixture<GeneralFormPage>;
  let generalPage: GeneralFormPage;
  let injector: TestBed;
  let calculator: CalculationsProvider;
  let preferenceService: PreferencesProvider;
  let originalNgOnInit: any;
  const staticEnglishUnits: SelectedUnits = mockEnglishUnits();
  const staticMetricUnits: SelectedUnits = mockMetricUnits();
  const staticGeneralForm: FormGroup = new FormGroup({
    name: new FormControl(''),
    style: new FormControl(mockStyles()[1]),
    brewingType: new FormControl('all-grain'),
    efficiency: new FormControl(80),
    mashDuration: new FormControl(90),
    boilDuration: new FormControl(90),
    batchVolume: new FormControl(3),
    boilVolume: new FormControl(4.2),
    mashVolume: new FormControl(3.75),
    isFavorite: new FormControl(true),
    isMaster: new FormControl(false)
  });
  configureTestBed();

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      declarations: [
        GeneralFormPage
      ],
      imports: [
        IonicModule.forRoot(GeneralFormPage)
      ],
      providers: [
        { provide: CalculationsProvider, useValue: {} },
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
    preferenceService = injector.get(PreferencesProvider);

    preferenceService.getSelectedUnits = jest
      .fn()
      .mockReturnValue(mockEnglishUnits());
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GeneralFormPage);
    generalPage = fixture.componentInstance;

    calculator = injector.get(CalculationsProvider);
    calculator.requiresConversion = jest
      .fn()
      .mockReturnValue(false);

    originalNgOnInit = generalPage.ngOnInit;
    generalPage.ngOnInit = jest
      .fn();
  });

  describe('Create form', () => {

    test('should create the component in creation mode', () => {
      generalPage.ngOnInit = originalNgOnInit;

      NavParamsMock.setParams('formType', 'master');
      NavParamsMock.setParams('docMethod', 'create');
      NavParamsMock.setParams('styles', mockStyles());

      fixture.detectChanges();

      expect(generalPage).toBeDefined();
    }); // end 'should create the component in creation mode' test

    test('should create the form with default values', () => {
      generalPage.units = staticEnglishUnits;
      generalPage.formType = 'master';
      generalPage.docMethod = 'create';
      generalPage.styles = [];
      generalPage.ngOnInit = originalNgOnInit;

      fixture.detectChanges();

      expect(generalPage.generalForm.value.style).toBeUndefined();
      expect(generalPage.generalForm.value.brewingType).toMatch('');
      expect(generalPage.generalForm.controls).toHaveProperty('name');
    }); // end 'should create the form with default values' test

    test('should compare ion-select items', () => {
      generalPage.generalForm = staticGeneralForm;

      fixture.detectChanges();

      const o1a: object = { _id: 1 };
      const o1b: object = { _id: 1 };
      const o2:  object = { _id: 2 };

      expect(generalPage.compareWithFn(o1a, o1b)).toBe(true);
      expect(generalPage.compareWithFn(o1a, o2)).toBe(false);
    }); // end 'should compare ion-select items' test

    test('should dismiss the modal', () => {
      generalPage.generalForm = staticGeneralForm;

      fixture.detectChanges();

      const viewSpy: jest.SpyInstance = jest
        .spyOn(generalPage.viewCtrl, 'dismiss');

      generalPage.dismiss();

      expect(viewSpy).toHaveBeenCalled();
    }); // end 'should dismiss the modal' test

    test('should convert form values for submission', () => {
      generalPage.units = mockEnglishUnits();
      generalPage.generalForm = new FormGroup({
        style: new FormControl(mockStyles()[1]),
        brewingType: new FormControl('all-grain'),
        efficiency: new FormControl('80'),
        mashDuration: new FormControl('90'),
        boilDuration: new FormControl('90'),
        batchVolume: new FormControl('3'),
        boilVolume: new FormControl('4.2'),
        mashVolume: new FormControl('3.75'),
        isFavorite: new FormControl(true),
        isMaster: new FormControl(false)
      });

      calculator.requiresConversion = jest
        .fn()
        .mockReturnValue(false);

      fixture.detectChanges();

      const converted: object = generalPage.convertForSubmission();

      expect(converted).toStrictEqual({
        style: mockStyles()[1],
        brewingType: 'all-grain',
        efficiency: 80,
        mashDuration: 90,
        boilDuration: 90,
        batchVolume: 3,
        boilVolume: 4.2,
        mashVolume: 3.75,
        isFavorite: true,
        isMaster: false
      });
    }); // end 'should convert form values for submission' test

    test('should convert form values (with metric conversion) for submission', () => {
      generalPage.units = mockEnglishUnits();
      generalPage.generalForm = new FormGroup({
        style: new FormControl(mockStyles()[1]),
        brewingType: new FormControl('all-grain'),
        efficiency: new FormControl('80'),
        mashDuration: new FormControl('90'),
        boilDuration: new FormControl('90'),
        batchVolume: new FormControl('3'),
        boilVolume: new FormControl('4.2'),
        mashVolume: new FormControl('3.75'),
        isFavorite: new FormControl(true),
        isMaster: new FormControl(false)
      });

      calculator.requiresConversion = jest
        .fn()
        .mockReturnValue(true);
      calculator.convertVolume = jest
        .fn()
        .mockReturnValue(12);

      fixture.detectChanges();

      const converted: object = generalPage.convertForSubmission();

      expect(converted).toStrictEqual({
        style: mockStyles()[1],
        brewingType: 'all-grain',
        efficiency: 80,
        mashDuration: 90,
        boilDuration: 90,
        batchVolume: 12,
        boilVolume: 12,
        mashVolume: 12,
        isFavorite: true,
        isMaster: false
      });
    }); // end 'should convert form values (with metric conversion) for submission' test

    test('should update the selected style', () => {
      generalPage.generalForm = staticGeneralForm;

      fixture.detectChanges();

      const _mockStyle: Style = mockStyles()[0];

      expect(generalPage.styleSelection).toBeUndefined();

      generalPage.onStyleSelection(_mockStyle);

      expect(generalPage.styleSelection).toBe(_mockStyle);
    }); // end 'should update the selected style' test

    test('should submit the form', () => {
      generalPage.generalForm = staticGeneralForm;
      generalPage.convertForSubmission = jest
        .fn()
        .mockReturnValue({});

      fixture.detectChanges();

      const viewSpy: jest.SpyInstance = jest
        .spyOn(generalPage.viewCtrl, 'dismiss');

      const form: { [key: string]: AbstractControl }
        = generalPage.generalForm.controls;
      const _mockStyle: Style = mockStyles()[0];
      form.name.setValue('some name');
      form.style.setValue(_mockStyle);
      form.brewingType.setValue('biab');
      form.batchVolume.setValue('5');
      form.boilVolume.setValue('5');
      form.mashVolume.setValue('5');

      generalPage.onSubmit();

      expect(viewSpy).toHaveBeenCalledWith({});
    }); // end 'should submit the form' test

  }); // end 'Form create' section


  describe('Form update', () => {

    beforeAll(async(() => {
      NavParamsMock.setParams('formType', 'recipe');
      NavParamsMock.setParams('docMethod', 'update');
      NavParamsMock.setParams('styles', mockStyles());
      NavParamsMock.setParams('data', {
        style: mockStyles()[1],
        brewingType: 'all-grain',
        efficiency: 80,
        mashDuration: 90,
        boilDuration: 90,
        batchVolume: 3,
        boilVolume: 4.2,
        mashVolume: 3.75,
        isFavorite: true,
        isMaster: false
      });
    }));

    test('should init form with given values', () => {
      generalPage.ngOnInit = originalNgOnInit;

      fixture.detectChanges();

      const fields: object = {
        variantName: '',
        style: mockStyles()[1],
        brewingType: 'all-grain',
        efficiency: 80,
        mashDuration: 90,
        boilDuration: 90,
        batchVolume: 3,
        boilVolume: 4.2,
        mashVolume: 3.75,
        isFavorite: true,
        isMaster: false
      };

      expect(generalPage.generalForm.value).toStrictEqual(fields);

      generalPage.docMethod = 'create';

      generalPage.initForm(fields);

      expect(generalPage.generalForm.value.isFavorite).toBe(false);
    }); // end 'should init form with given values' test

    test('should init form with metric volume units', () => {
      generalPage.ngOnInit = originalNgOnInit;
      generalPage.units = staticMetricUnits;

      calculator.requiresConversion = jest
        .fn()
        .mockReturnValue(true);
      calculator.convertVolume = jest
        .fn()
        .mockReturnValue(12);

      fixture.detectChanges();

      expect(generalPage.generalForm.value).toStrictEqual({
        variantName: '',
        style: mockStyles()[1],
        brewingType: 'all-grain',
        efficiency: 80,
        mashDuration: 90,
        boilDuration: 90,
        batchVolume: 12,
        boilVolume: 12,
        mashVolume: 12,
        isFavorite: true,
        isMaster: false
      });
    }); // end 'should init form with metric volume units' test

  }); // end 'Form update' test

});
