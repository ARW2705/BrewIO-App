/* Module imports */
import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { IonicModule, NavParams, ViewController } from 'ionic-angular';
import { FormGroup } from '@angular/forms';

/* Test configuration imports */
import { configureTestBed } from '../../../../test-config/configureTestBed';

/* Mock imports */
import { mockGrains } from '../../../../test-config/mockmodels/mockGrains';
import { mockHops } from '../../../../test-config/mockmodels/mockHops';
import { mockYeast } from '../../../../test-config/mockmodels/mockYeast';
import { mockOtherIngredient } from '../../../../test-config/mockmodels/mockOtherIngredient';
import { NavParamsMock, ViewControllerMock } from '../../../../test-config/mocks-ionic';

/* Interface imports */
import { OtherIngredients } from '../../../shared/interfaces/other-ingredients';

/* Page imports */
import { IngredientFormPage } from './ingredient-form';


describe('Ingredient Form', () => {
  let fixture: ComponentFixture<IngredientFormPage>;
  let ingredientPage: IngredientFormPage;
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
        { provide: NavParams, useClass: NavParamsMock },
        { provide: ViewController, useClass: ViewControllerMock }
      ]
    });
    await TestBed.compileComponents();
  })()
  .then(done)
  .catch(done.fail));

  beforeEach(() => {
    fixture = TestBed.createComponent(IngredientFormPage);
    ingredientPage = fixture.componentInstance;
  });

  describe('New instance', () => {
    beforeAll(async(() => {
      NavParamsMock.setParams('data', {
        ingredientType: 'grains',
        update: undefined,
        library: mockGrains()
      });
    }));

    test('should create the component configured to add a grains instance', () => {
      fixture.detectChanges();

      expect(ingredientPage).toBeDefined();
      expect(ingredientPage.title).toMatch('Add grains');
    }); // end 'should create the component configured to add a grains instance' test

    test('should configure form for a grains instance', () => {
      fixture.detectChanges();

      expect(ingredientPage.formType).toMatch('create');

      const form: FormGroup = ingredientPage.ingredientForm;

      expect(form.controls.hasOwnProperty('mill')).toBe(true);
    }); // end 'should configure form for a grains instance' test

    test('should submit a grains instance', () => {
      fixture.detectChanges();

      const form: FormGroup = ingredientPage.ingredientForm;
      form.controls.type.setValue(mockGrains()[0]);
      form.controls.quantity.setValue('5');
      form.controls.mill.setValue('0.5');

      const viewSpy: jest.SpyInstance = jest
        .spyOn(ingredientPage.viewCtrl, 'dismiss');

      ingredientPage.onSubmit();

      expect(viewSpy).toHaveBeenCalledWith({
        grainType: mockGrains()[0],
        quantity: 5,
        notes: [],
        mill: 0.5
      });
    }); // end 'should submit a grains instance' test

    test('should call dismiss without sending data', () => {
      fixture.detectChanges();

      const viewSpy: jest.SpyInstance = jest
        .spyOn(ingredientPage.viewCtrl, 'dismiss');

      ingredientPage.dismiss();

      expect(viewSpy).toHaveBeenCalled();
    }); // end 'should call dismiss without sending data' test

    test('should call dismiss with error if data not provided', () => {
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
    beforeAll(async(() => {
      NavParamsMock.setParams('data', {
        ingredientType: 'grains',
        update: {
          grainType: mockGrains()[0],
          quantity: 10,
          mill: 0.25
        },
        library: mockGrains()
      });
    }));

    test('should configure form to update a grains instance', () => {
      fixture.detectChanges();

      const form: FormGroup = ingredientPage.ingredientForm;

      expect(ingredientPage.formType).toMatch('update');
      expect(form.controls.type.value).toStrictEqual(mockGrains()[0]);
      expect(form.controls.quantity.value).toBe(10);
      expect(form.controls.mill.value).toBe(0.25);
    }); // end 'should configure form to update a grains instance' test

    test('should submit a grains update', () => {
      fixture.detectChanges();

      const viewSpy: jest.SpyInstance = jest
        .spyOn(ingredientPage.viewCtrl, 'dismiss');

      ingredientPage.onSubmit();

      expect(viewSpy).toHaveBeenCalledWith({
        grainType: mockGrains()[0],
        quantity: 10,
        notes: [],
        mill: 0.25
      });
    }); // end 'should submit a grains update' test

    test('should dismiss modal with delete flag', () => {
      fixture.detectChanges();

      const viewSpy: jest.SpyInstance = jest
        .spyOn(ingredientPage.viewCtrl, 'dismiss');

      ingredientPage.onDeletion();

      expect(viewSpy).toHaveBeenCalledWith({delete: true});
    }); // end 'should dismiss modal with delete flag' test

  }); // end 'Update grains' section


  describe('Update hops', () => {
    beforeAll(async(() => {
      NavParamsMock.setParams('data', {
        ingredientType: 'hops',
        update: {
          hopsType: mockHops()[1],
          quantity: 1,
          addAt: 60,
          dryHop: false
        },
        library: mockHops()
      });
    }));

    test('should configure form to update a hops instance', () => {
      fixture.detectChanges();

      const form: FormGroup = ingredientPage.ingredientForm;

      expect(form.controls.type.value).toStrictEqual(mockHops()[1]);
      expect(form.controls.quantity.value).toBe(1);
      expect(form.controls.addAt.value).toBe(60);
      expect(form.controls.dryHop.value).toBe(false);
    }); // end 'should configure form to update a hops instance' test

    test('should submit a hops update', () => {
      fixture.detectChanges();

      const viewSpy: jest.SpyInstance = jest
        .spyOn(ingredientPage.viewCtrl, 'dismiss');

      ingredientPage.onSubmit();

      expect(viewSpy).toHaveBeenCalledWith({
        hopsType: mockHops()[1],
        quantity: 1,
        addAt: 60,
        dryHop: false,
        notes: []
      });
    }); // end 'should submit a hops update' test

  });// end 'Update hops' section


  describe('Update yeast', () => {
    beforeAll(async(() => {
      NavParamsMock.setParams('data', {
        ingredientType: 'yeast',
        update: {
          yeastType: mockYeast()[1],
          quantity: 1,
          requiresStarter: true
        },
        library: mockYeast()
      });
    }));

    test('should configure form to update a yeast instance', () => {
      fixture.detectChanges();

      const form: FormGroup = ingredientPage.ingredientForm;

      expect(form.controls.type.value).toStrictEqual(mockYeast()[1]);
      expect(form.controls.quantity.value).toBe(1);
      expect(form.controls.requiresStarter.value).toBe(true);
    }); // end 'should configure form to update a yeast instance' test

    test('should submit a yeast update', () => {
      fixture.detectChanges();

      const viewSpy: jest.SpyInstance = jest
        .spyOn(ingredientPage.viewCtrl, 'dismiss');

      ingredientPage.onSubmit();

      expect(viewSpy).toHaveBeenCalledWith({
        yeastType: mockYeast()[1],
        quantity: 1,
        requiresStarter: true,
        notes: []
      });
    }); // end 'should submit a yeast update' test

  }); // end 'Update yeast' test


  describe('Update other ingredient', () => {
    beforeAll(async(() => {
      const _mockOtherIngredient: OtherIngredients = mockOtherIngredient()[0];

      NavParamsMock.setParams('data', {
        ingredientType: 'otherIngredients',
        update: {
          type: _mockOtherIngredient.type,
          name: _mockOtherIngredient.name,
          description: _mockOtherIngredient.description,
          quantity: 1,
          units: _mockOtherIngredient.units
        }
      });
    }));

    test('should configure form to update an \'other\' ingredient instance', () => {
      fixture.detectChanges();

      const form: FormGroup = ingredientPage.ingredientForm;

      const _mockOtherIngredient: OtherIngredients = mockOtherIngredient()[0];

      expect(form.controls.type.value).toMatch(_mockOtherIngredient.type);
      expect(form.controls.name.value).toMatch(_mockOtherIngredient.name);
      expect(form.controls.description.value)
        .toMatch(_mockOtherIngredient.description);
      expect(form.controls.quantity.value).toBe(1);
      expect(form.controls.units.value).toMatch(_mockOtherIngredient.units);
      expect(form.controls.hasOwnProperty('notes')).toBe(false);
    }); // end 'should configure form to update an \'other\' ingredient instance' test

    test('should submit an \'other\' ingredient update', () => {
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

  }); // end 'Update other ingredient' section

});
