/* Module imports */
import { ComponentFixture, TestBed, getTestBed, async } from '@angular/core/testing';
import { IonicModule, NavParams, Toggle, ViewController } from 'ionic-angular';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';

/* Test configuration imports */
import { configureTestBed } from '../../../../test-config/configureTestBed';

/* Mock imports */
import { mockEnglishUnits } from '../../../../test-config/mockmodels/mockUnits';
import { mockGrains } from '../../../../test-config/mockmodels/mockGrains';
import { mockHops } from '../../../../test-config/mockmodels/mockHops';
import { mockYeast } from '../../../../test-config/mockmodels/mockYeast';
import { mockOtherIngredient } from '../../../../test-config/mockmodels/mockOtherIngredient';
import { NavParamsMock, ViewControllerMock } from '../../../../test-config/mocks-ionic';

/* Interface imports */
import { Grains } from '../../../shared/interfaces/library';
import { Hops } from '../../../shared/interfaces/library';
import { Yeast } from '../../../shared/interfaces/library';
import { OtherIngredients } from '../../../shared/interfaces/other-ingredients';

/* Page imports */
import { IngredientFormPage } from './ingredient-form';

/* Provider imports */
import { CalculationsProvider } from '../../../providers/calculations/calculations';
import { FormValidatorProvider } from '../../../providers/form-validator/form-validator';
import { PreferencesProvider } from '../../../providers/preferences/preferences';


describe('Ingredient Form', () => {
  let fixture: ComponentFixture<IngredientFormPage>;
  let ingredientPage: IngredientFormPage;
  let injector: TestBed;
  let calculator: CalculationsProvider;
  let formValidator: FormValidatorProvider;
  let preferenceService: PreferencesProvider;
  let originalNgOnInit: any;
  const staticMockGrains: Grains[] = mockGrains();
  const staticMockHops: Hops[] = mockHops();
  const staticMockYeast: Yeast[] = mockYeast();
  const staticMockOther: OtherIngredients[] = mockOtherIngredient();
  const staticIngredientFormGrains: FormGroup = new FormGroup({
    quantity: new FormControl(0),
    subQuantity: new FormControl(0),
    type: new FormControl(staticMockGrains[0]),
    mill: new FormControl(0)
  });
  const staticIngredientFormOther: FormGroup = new FormGroup({
    quantity: new FormControl(staticMockOther[0].quantity),
    type: new FormControl(staticMockOther[0].type),
    name: new FormControl(staticMockOther[0].name),
    description: new FormControl(staticMockOther[0].description),
    units: new FormControl(staticMockOther[0].units)
  });
  configureTestBed();

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      declarations: [
        IngredientFormPage
      ],
      imports: [
        IonicModule.forRoot(IngredientFormPage)
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

    formValidator.eitherOr = jest
      .fn()
      .mockReturnValue((group: FormGroup): { [key: string]: any } | null => {
        return null;
      });

    preferenceService.getSelectedUnits = jest
      .fn()
      .mockReturnValue(mockEnglishUnits());
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IngredientFormPage);
    ingredientPage = fixture.componentInstance;

    originalNgOnInit = ingredientPage.ngOnInit;
    ingredientPage.ngOnInit = jest
      .fn();
  });

  describe('New instance', () => {
    beforeAll(async(() => {
      NavParamsMock.setParams('data', {
        ingredientType: 'grains',
        update: undefined,
        library: staticMockGrains
      });
    }));

    test('should create the component configured to add a grains instance', () => {
      ingredientPage.ngOnInit = originalNgOnInit;
      ingredientPage.initForm = jest
        .fn();

      fixture.detectChanges();

      expect(ingredientPage).toBeDefined();
      expect(ingredientPage.title).toMatch('Add grains');
    }); // end 'should create the component configured to add a grains instance' test

    test('should configure form for a grains instance', () => {
      ingredientPage.ngOnInit = originalNgOnInit

      ingredientPage.ingredientType = 'grains';

      fixture.detectChanges();

      expect(ingredientPage.formType).toMatch('create');

      const form: FormGroup = ingredientPage.ingredientForm;

      expect(form.controls.hasOwnProperty('mill')).toBe(true);
    }); // end 'should configure form for a grains instance' test

    test('should configure form for a hops instance', () => {
      ingredientPage.ngOnInit = originalNgOnInit

      NavParamsMock.setParams('data', {
        ingredientType: 'hops',
        update: undefined,
        library: staticMockHops
      });

      fixture.detectChanges();

      expect(ingredientPage.formType).toMatch('create');

      const form: FormGroup = ingredientPage.ingredientForm;

      expect(form.controls.hasOwnProperty('duration')).toBe(true);
    }); // end 'should configure form for a hops instance' test

    test('should configure form for a yeast instance', () => {
      ingredientPage.ngOnInit = originalNgOnInit

      NavParamsMock.setParams('data', {
        ingredientType: 'yeast',
        update: undefined,
        library: staticMockYeast
      });

      fixture.detectChanges();

      expect(ingredientPage.formType).toMatch('create');

      const form: FormGroup = ingredientPage.ingredientForm;

      expect(form.controls.hasOwnProperty('requiresStarter')).toBe(true);
    }); // end 'should configure form for a yeast instance' test

    test('should configure form for a otherIngredients instance', () => {
      ingredientPage.ngOnInit = originalNgOnInit

      NavParamsMock.setParams('data', {
        ingredientType: 'otherIngredients',
        update: undefined,
        library: staticMockOther
      });

      fixture.detectChanges();

      expect(ingredientPage.formType).toMatch('create');

      const form: FormGroup = ingredientPage.ingredientForm;

      expect(form.controls.hasOwnProperty('description')).toBe(true);
    }); // end 'should configure form for a otherIngredients instance' test

    test('should submit a grains instance', () => {
      ingredientPage.ingredientType = 'grains';

      ingredientPage.formatGrainsResponse = jest
        .fn()
        .mockReturnValue({
          type: staticMockGrains[0],
          quantity: 5,
          mill: 0.5
        });

      const viewSpy: jest.SpyInstance = jest
        .spyOn(ingredientPage.viewCtrl, 'dismiss');

      fixture.detectChanges();

      ingredientPage.onSubmit();

      expect(viewSpy).toHaveBeenCalledWith({
        type: staticMockGrains[0],
        quantity: 5,
        mill: 0.5
      });
    }); // end 'should submit a grains instance' test

    test('should call dismiss without sending data', () => {
      ingredientPage.ingredientForm = staticIngredientFormGrains;
      ingredientPage.initForm = jest
        .fn();

      fixture.detectChanges();

      const viewSpy: jest.SpyInstance = jest
        .spyOn(ingredientPage.viewCtrl, 'dismiss');

      ingredientPage.dismiss();

      expect(viewSpy).toHaveBeenCalled();
    }); // end 'should call dismiss without sending data' test

    test('should call dismiss with error if data not provided', () => {
      ingredientPage.ngOnInit = originalNgOnInit;

      NavParamsMock.setParams('data', undefined);

      ingredientPage.dismissOnError = jest
        .fn();

      const dismissSpy: jest.SpyInstance = jest
        .spyOn(ingredientPage, 'dismissOnError');

      fixture.detectChanges();

      expect(dismissSpy).toHaveBeenCalledWith(undefined);
    }); // end 'should call dismiss with error if data not provided' test

    test('should call dismiss with error', () => {
      fixture.detectChanges();

      const viewSpy: jest.SpyInstance = jest
        .spyOn(ingredientPage.viewCtrl, 'dismiss');

      ingredientPage.dismissOnError('error message');

      expect(viewSpy).toHaveBeenCalledWith({error: 'error message'});
    }); // end 'should call dismiss with error' test

  }); // end 'New instance' section


  describe('Update grains', () => {

    test('should init grains fields with data that does not require conversion', () => {
      ingredientPage.ingredientForm = new FormGroup({
        quantity: new FormControl(null),
        subQuantity: new FormControl(null),
        type: new FormControl('')
      });

      calculator.requiresConversion = jest
        .fn()
        .mockReturnValue(false);
      calculator.convertWeight = jest
        .fn()
        .mockImplementation((input: number): number => {
          return input * 2;
        });

      fixture.detectChanges();

      const update: object = {
        quantity: 10.5,
        grainType: staticMockGrains[0],
        mill: 0.5
      };

      ingredientPage.initGrainsFields({ update: update });

      const form: object = ingredientPage.ingredientForm.value;

      expect(ingredientPage.ingredientPlaceholder)
        .toMatch(staticMockGrains[0].name);
      expect(form['quantity']).toEqual(10);
      expect(form['subQuantity']).toEqual(8);
      expect(form['mill']).toEqual(0.5);
    }); // end 'should init grains fields with data that does not require conversion' test

    test('should init grains fields with data that does require conversion', () => {
      ingredientPage.ingredientForm = new FormGroup({
        quantity: new FormControl(null),
        subQuantity: new FormControl(null),
        type: new FormControl('')
      });

      calculator.requiresConversion = jest
        .fn()
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);
      calculator.convertWeight = jest
        .fn()
        .mockImplementation((input: number): number => {
          return input * 2;
        });

      fixture.detectChanges();

      const update: object = {
        quantity: 10.5,
        grainType: staticMockGrains[0],
        mill: 0.5
      };

      ingredientPage.initGrainsFields({ update: update });

      let form: object = ingredientPage.ingredientForm.value;

      expect(ingredientPage.ingredientPlaceholder)
        .toMatch(staticMockGrains[0].name);
      expect(form['quantity']).toEqual(21);
      expect(form['subQuantity']).toBeNull();
      expect(form['mill']).toEqual(0.5);

      ingredientPage.initGrainsFields({ update: update });

      form = ingredientPage.ingredientForm.value;

      expect(form['quantity']).toEqual(10);
      expect(form['subQuantity']).toEqual(1);
      expect(form['mill']).toEqual(0.5);
    }); // end 'should init grains fields with data that does require conversion' test

    test('should submit an update', () => {
      ingredientPage.ingredientType = 'grains';

      ingredientPage.formatGrainsResponse = jest
        .fn()
        .mockReturnValue({
          type: staticMockGrains[0],
          subQuantity: 0,
          quantity: 0,
          mill: 0
        });

      ingredientPage.ingredientForm = staticIngredientFormGrains;

      const viewSpy: jest.SpyInstance = jest
        .spyOn(ingredientPage.viewCtrl, 'dismiss');

      fixture.detectChanges();

      ingredientPage.onSubmit();

      expect(viewSpy).toHaveBeenCalledWith({
        type: staticMockGrains[0],
        subQuantity: 0,
        quantity: 0,
        mill: 0
      });
    }); // end 'should submit an update' test

    test('should dismiss modal with delete flag', () => {
      fixture.detectChanges();

      const viewSpy: jest.SpyInstance = jest
        .spyOn(ingredientPage.viewCtrl, 'dismiss');

      ingredientPage.onDeletion();

      expect(viewSpy).toHaveBeenCalledWith({delete: true});
    }); // end 'should dismiss modal with delete flag' test

    test('should update form validation on dry hop change', () => {
      ingredientPage.ingredientForm = new FormGroup({
        subQuantity: new FormControl(''),
        type: new FormControl(staticMockHops[0]),
        duration: new FormControl(null, [Validators.required, Validators.min(0)]),
        dryHop: new FormControl(false)
      });

      fixture.detectChanges();

      expect(ingredientPage.ingredientForm.get('duration').validator)
        .not
        .toBeNull();
      expect(ingredientPage.ingredientForm.get('duration').errors)
      .toStrictEqual({ required: true });

      ingredientPage.onDryHopChange(<Toggle>{ value: true });

      expect(ingredientPage.ingredientForm.get('duration').validator).toBeNull();
      expect(ingredientPage.ingredientForm.get('duration').errors).toBeNull();

      ingredientPage.onDryHopChange(<Toggle>{ value: false });

      expect(ingredientPage.ingredientForm.get('duration').validator)
        .not
        .toBeNull();
      expect(ingredientPage.ingredientForm.get('duration').errors)
        .toStrictEqual({ required: true });
    }); // end ('should update form validation on dry hop change' test

    test('should format grains values for submission', () => {
      ingredientPage.ingredientForm = new FormGroup({
        quantity: new FormControl('5'),
        subQuantity: new FormControl('8'),
        mill: new FormControl('0'),
        type: new FormControl(staticMockGrains[0])
      });

      fixture.detectChanges();

      // Quantity and subQuantity
      const formattedQAS: object = ingredientPage.formatGrainsResponse();

      expect(formattedQAS).toStrictEqual({
        grainType: staticMockGrains[0],
        quantity: 5.5,
        mill: 0
      });

      // Quantity only
      ingredientPage.ingredientForm = new FormGroup({
        quantity: new FormControl('5'),
        mill: new FormControl('0'),
        type: new FormControl(staticMockGrains[0])
      });

      const formattedQ: object = ingredientPage.formatGrainsResponse();

      expect(formattedQ).toStrictEqual({
        grainType: staticMockGrains[0],
        quantity: 5,
        mill: 0
      });


      // SubQuantity only
      ingredientPage.ingredientForm = new FormGroup({
        subQuantity: new FormControl('8'),
        mill: new FormControl('0'),
        type: new FormControl(staticMockGrains[0])
      });

      const formattedS: object = ingredientPage.formatGrainsResponse();

      expect(formattedS).toStrictEqual({
        grainType: staticMockGrains[0],
        quantity: 0.5,
        mill: 0
      });
    }); // end 'should format grains values for submission' test

    test('should format grains values for submission that require conversion', () => {
      ingredientPage.ingredientForm = new FormGroup({
        quantity: new FormControl('5'),
        subQuantity: new FormControl('8'),
        mill: new FormControl('0'),
        type: new FormControl(staticMockGrains[0])
      });

      calculator.convertWeight = jest
        .fn()
        .mockImplementation(
          (input: number, isLarge: boolean, toEn: boolean): number => {
            return isLarge ? input * 4: input * 2;
          }
        );

      ingredientPage.requiresConversionLarge = true;
      ingredientPage.requiresConversionSmall = true;

      fixture.detectChanges();

      // Quantity and subQuantity
      const formattedQAS: object = ingredientPage.formatGrainsResponse();

      expect(formattedQAS).toStrictEqual({
        grainType: staticMockGrains[0],
        quantity: 21,
        mill: 0
      });

      // Quantity only
      ingredientPage.ingredientForm = new FormGroup({
        quantity: new FormControl('5'),
        mill: new FormControl('0'),
        type: new FormControl(staticMockGrains[0])
      });

      const formattedQ: object = ingredientPage.formatGrainsResponse();

      expect(formattedQ).toStrictEqual({
        grainType: staticMockGrains[0],
        quantity: 20,
        mill: 0
      });

      // SubQuantity only
      ingredientPage.ingredientForm = new FormGroup({
        subQuantity: new FormControl('8'),
        mill: new FormControl('0'),
        type: new FormControl(staticMockGrains[0])
      });

      const formattedS: object = ingredientPage.formatGrainsResponse();

      expect(formattedS).toStrictEqual({
        grainType: staticMockGrains[0],
        quantity: 1,
        mill: 0
      });
    }); // end 'should format grains values for submission that require conversion' test

  }); // end 'Update grains' section


  describe('Update hops', () => {

    test('should init hops fields with data that does not require conversion', () => {
      ingredientPage.ingredientForm = new FormGroup({
        quantity: new FormControl(null),
        subQuantity: new FormControl(null),
        type: new FormControl('')
      });

      calculator.requiresConversion = jest
        .fn()
        .mockReturnValue(false);

      fixture.detectChanges();

      const update: object = {
        quantity: 1,
        hopsType: staticMockHops[0],
        duration: 45,
        dryHop: false
      };

      ingredientPage.initHopsFields({ update: update });

      const form: object = ingredientPage.ingredientForm.value;

      expect(ingredientPage.ingredientPlaceholder)
        .toMatch(staticMockHops[0].name);
      expect(form['quantity']).toBeNull();
      expect(form['subQuantity']).toEqual(1);
      expect(form['duration']).toEqual(45);
      expect(form['dryHop']).toBe(false);
    }); // end 'should init hops fields with data that does not require conversion' test

    test('should init hops fields with data that does require conversion', () => {
      ingredientPage.ingredientForm = new FormGroup({
        quantity: new FormControl(null),
        subQuantity: new FormControl(null),
        type: new FormControl('')
      });

      calculator.requiresConversion = jest
        .fn()
        .mockReturnValue(true);
      calculator.convertWeight = jest
        .fn()
        .mockImplementation((input: number): number => {
          return input * 2;
        });

      fixture.detectChanges();

      const update: object = {
        quantity: 1,
        hopsType: staticMockHops[0],
        duration: 45,
        dryHop: false
      };

      ingredientPage.initHopsFields({ update: update });

      const form: object = ingredientPage.ingredientForm.value;

      expect(ingredientPage.ingredientPlaceholder)
        .toMatch(staticMockHops[0].name);
      expect(form['quantity']).toBeNull();
      expect(form['subQuantity']).toEqual(2);
      expect(form['duration']).toEqual(45);
      expect(form['dryHop']).toBe(false);
    }); // end 'should init hops fields with data that does require conversion' test

    test('should submit a hops update', () => {
      ingredientPage.ingredientType = 'hops';

      ingredientPage.formatHopsResponse = jest
        .fn()
        .mockReturnValue({
          type: staticMockHops[1],
          subQuantity: 0,
          duration: 0,
          dryHop: false
        });

      fixture.detectChanges();

      const viewSpy: jest.SpyInstance = jest
        .spyOn(ingredientPage.viewCtrl, 'dismiss');

      ingredientPage.onSubmit();

      expect(viewSpy).toHaveBeenCalledWith({
        type: staticMockHops[1],
        subQuantity: 0,
        duration: 0,
        dryHop: false
      });
    }); // end 'should submit a hops update' test

    test('should format hops values for submission', () => {
      ingredientPage.ingredientForm = new FormGroup({
        subQuantity: new FormControl('1'),
        duration: new FormControl('30'),
        dryHop: new FormControl(false),
        type: new FormControl(staticMockHops[1])
      });

      fixture.detectChanges();

      const formatted: object = ingredientPage.formatHopsResponse();

      expect(formatted).toStrictEqual({
        quantity: 1,
        duration: 30,
        dryHop: false,
        hopsType: staticMockHops[1]
      });
    }); // end 'should format hops values for submission' test

  });// end 'Update hops' section


  describe('Update yeast', () => {

    test('should init yeast fields with data', () => {
      ingredientPage.ingredientForm = new FormGroup({
        quantity: new FormControl(null),
        subQuantity: new FormControl(null),
        type: new FormControl('')
      });

      fixture.detectChanges();

      const update: object = {
        quantity: 1,
        yeastType: staticMockYeast[0],
        requiresStarter: false
      };

      ingredientPage.initYeastFields({ update: update });

      const form: object = ingredientPage.ingredientForm.value;

      expect(ingredientPage.ingredientPlaceholder)
        .toMatch(staticMockYeast[0].name);
      expect(form['quantity']).toEqual(1);
      expect(form['requiresStarter']).toBe(false);
    }); // end 'should init yeast fields with data' test

    test('should submit a yeast update', () => {
      ingredientPage.ingredientType = 'yeast';

      ingredientPage.formatYeastResponse = jest
        .fn()
        .mockReturnValue({
          type: staticMockYeast[1],
          quantity: 0,
          requiresStarter: false
        });

      fixture.detectChanges();

      const viewSpy: jest.SpyInstance = jest
        .spyOn(ingredientPage.viewCtrl, 'dismiss');

      ingredientPage.onSubmit();

      expect(viewSpy).toHaveBeenCalledWith({
        type: staticMockYeast[1],
        quantity: 0,
        requiresStarter: false,
      });
    }); // end 'should submit a yeast update' test

    test('should format yeast values for submission', () => {
      ingredientPage.ingredientForm = new FormGroup({
        quantity: new FormControl('1'),
        requiresStarter: new FormControl(false),
        type: new FormControl(staticMockYeast[1])
      });

      fixture.detectChanges();

      const formatted: object = ingredientPage.formatYeastResponse();

      expect(formatted).toStrictEqual({
        quantity: 1,
        requiresStarter: false,
        yeastType: staticMockYeast[1]
      });
    }); // end 'should format yeast values for submission' test

  }); // end 'Update yeast' test


  describe('Update other ingredient', () => {

    test('should configure form to update an \'other\' ingredient instance', () => {
      ingredientPage.ingredientForm = staticIngredientFormOther;

      fixture.detectChanges();

      const form: FormGroup = ingredientPage.ingredientForm;

      expect(form.value.type).toMatch(staticMockOther[0].type);
      expect(form.value.name).toMatch(staticMockOther[0].name);
      expect(form.value.description)
        .toMatch(staticMockOther[0].description);
      expect(form.value.quantity).toBe(1);
      expect(form.value.units).toMatch(staticMockOther[0].units);
      expect(form.controls.hasOwnProperty('notes')).toBe(false);
    }); // end 'should configure form to update an \'other\' ingredient instance' test

    test('should init other ingredients fields with data', () => {
      ingredientPage.ingredientForm = new FormGroup({
        quantity: new FormControl(null),
        subQuantity: new FormControl(null),
        type: new FormControl('')
      });

      fixture.detectChanges();

      const update: object = {
        name: staticMockOther[0].name,
        description: staticMockOther[0].description,
        units: staticMockOther[0].units,
        quantity: 1,
        type: staticMockOther[0].type
      };

      ingredientPage.initOtherIngredientsFields({ update: update });

      const form: object = ingredientPage.ingredientForm.value;

      expect(form['type']).toMatch(staticMockOther[0].type);
      expect(form['name']).toMatch(staticMockOther[0].name);
      expect(form['description'])
        .toMatch(staticMockOther[0].description);
      expect(form['quantity']).toBe(1);
      expect(form['units']).toMatch(staticMockOther[0].units);
    }); // end 'should init other ingredients fields with data' test

    test('should submit an \'other\' ingredient update', () => {
      ingredientPage.ingredientType = 'otherIngredients';

      ingredientPage.formatOtherIngredientsResponse = jest
        .fn()
        .mockReturnValue({
          name: 'other1',
          type: 'flavor',
          description: 'other1 description',
          quantity: 1,
          units: 'unit1'
        });

      fixture.detectChanges();

      const viewSpy: jest.SpyInstance = jest
        .spyOn(ingredientPage.viewCtrl, 'dismiss');

      ingredientPage.onSubmit();

      expect(viewSpy).toHaveBeenCalledWith({
        name: 'other1',
        type: 'flavor',
        description: 'other1 description',
        quantity: 1,
        units: 'unit1'
      });
    }); // end 'should submit an \'other\' ingredient update' test

    test('should format other ingredients values for submission', () => {
      ingredientPage.ingredientForm = new FormGroup({
        quantity: new FormControl('1'),
        name: new FormControl(staticMockOther[0].name),
        description: new  FormControl(staticMockOther[0].description),
        units: new FormControl(staticMockOther[0].units),
        type: new FormControl(staticMockOther[0].type)
      });

      fixture.detectChanges();

      const formatted: object = ingredientPage.formatOtherIngredientsResponse();

      expect(formatted).toStrictEqual({
        quantity: 1,
        name: staticMockOther[0].name,
        description: staticMockOther[0].description,
        units: staticMockOther[0].units,
        type: staticMockOther[0].type
      });
    }); // end 'should format other ingredients values for submission' test

  }); // end 'Update other ingredient' section

});
