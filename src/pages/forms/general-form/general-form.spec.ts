/* Module imports */
import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { IonicModule, NavController, NavParams, ViewController } from 'ionic-angular';

/* Mock imports */
import { mockStyles } from '../../../../test-config/mockmodels/mockStyles';
import { NavMock, NavParamsMock, ViewControllerMock } from '../../../../test-config/mocks-ionic';

/* Page imports */
import { GeneralFormPage } from './general-form';


describe('General Form', () => {

  describe('Form create', () => {
    let fixture: ComponentFixture<GeneralFormPage>;
    let generalPage: GeneralFormPage;

    beforeEach(async(() => {
      NavParamsMock.setParams('formType', 'master');
      NavParamsMock.setParams('docMethod', 'create');
      NavParamsMock.setParams('styles', mockStyles());
    }));

    beforeEach(async(() => {
      TestBed.configureTestingModule({
        declarations: [
          GeneralFormPage
        ],
        imports: [
          IonicModule.forRoot(GeneralFormPage)
        ],
        providers: [
          { provide: NavController, useClass: NavMock },
          { provide: NavParams, useClass: NavParamsMock },
          { provide: ViewController, useClass: ViewControllerMock }
        ]
      })
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(GeneralFormPage);
      generalPage = fixture.componentInstance;
    });

    test('should create the component in creation mode', () => {
      fixture.detectChanges();
      expect(generalPage).toBeDefined();
    }); // end 'should create the component in creation mode' test

    test('should create the form with default values', () => {
      fixture.detectChanges();
      expect(generalPage.generalForm.value.style).toBeUndefined();
      expect(generalPage.generalForm.value.brewingType).toMatch('');
      expect(generalPage.generalForm.controls).toHaveProperty('name');
    }); // end 'should create the form with default values' test

    test('should compare ion-select items', () => {
      fixture.detectChanges();
      const o1a = {_id: 1};
      const o1b = {_id: 1};
      const o2 = {_id: 2};
      expect(generalPage.compareWithFn(o1a, o1b)).toBe(true);
      expect(generalPage.compareWithFn(o1a, o2)).toBe(false);
    }); // end 'should compare ion-select items' test

    test('should convert form numbers from strings to actual numbers', () => {
      fixture.detectChanges();
      const form = generalPage.generalForm.controls;
      form.efficiency.setValue('60')
      form.batchVolume.setValue('5');
      form.boilVolume.setValue('5');
      form.mashVolume.setValue('5');
      form.boilDuration.setValue('60');
      form.mashDuration.setValue('60');
      generalPage.convertFormValuesToNumbers();
      expect(form.efficiency.value).toBe(60);
      expect(form.batchVolume.value).toBe(5);
      expect(form.boilVolume.value).toBe(5);
      expect(form.mashVolume.value).toBe(5);
      expect(form.boilDuration.value).toBe(60);
      expect(form.mashDuration.value).toBe(60);
    }); // end 'should convert form numbers from strings to actual numbers' test

    test('should dismiss the modal', () => {
      fixture.detectChanges();
      const viewSpy = jest.spyOn(generalPage.viewCtrl, 'dismiss');
      generalPage.dismiss();
      expect(viewSpy).toHaveBeenCalled();
    }); // 'should dismiss the modal' test

    test('should update the selected style', () => {
      fixture.detectChanges();
      const _mockStyle = mockStyles()[0];
      expect(generalPage.styleSelection).toBeUndefined();
      generalPage.onStyleSelection(_mockStyle);
      expect(generalPage.styleSelection).toBe(_mockStyle);
    }); // end 'should update the selected style' test

    test('should submit the form', () => {
      fixture.detectChanges();
      const viewSpy = jest.spyOn(generalPage.viewCtrl, 'dismiss');
      const form = generalPage.generalForm.controls;
      const _mockStyle = mockStyles()[0];
      form.name.setValue('some name');
      form.style.setValue(_mockStyle);
      form.brewingType.setValue('biab');
      form.batchVolume.setValue('5');
      form.boilVolume.setValue('5');
      form.mashVolume.setValue('5');
      generalPage.onSubmit();
      expect(viewSpy).toHaveBeenCalledWith({
        name: 'some name',
        style: _mockStyle,
        brewingType: 'biab',
        efficiency: 70,
        mashDuration: 60,
        boilDuration: 60,
        batchVolume: 5,
        boilVolume: 5,
        mashVolume: 5,
        isFavorite: false,
        isMaster: false
      });
    }); // end 'should submit the form' test

  }); // end 'Form create' section


  describe('Form update', () => {
    let fixture: ComponentFixture<GeneralFormPage>;
    let generalPage: GeneralFormPage;

    beforeEach(async(() => {
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

    beforeEach(async(() => {
      TestBed.configureTestingModule({
        declarations: [
          GeneralFormPage
        ],
        imports: [
          IonicModule.forRoot(GeneralFormPage)
        ],
        providers: [
          { provide: NavController, useClass: NavMock },
          { provide: NavParams, useClass: NavParamsMock },
          { provide: ViewController, useClass: ViewControllerMock }
        ]
      })
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(GeneralFormPage);
      generalPage = fixture.componentInstance;
    });

    test('should init form with given values', () => {
      fixture.detectChanges();
      expect(generalPage.generalForm.value).toStrictEqual({
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
      });
    }); // end 'should init form with given values' test

  }); // end 'Form update' test

});