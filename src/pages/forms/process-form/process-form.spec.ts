/* Module imports */
import { TestBed, getTestBed, ComponentFixture } from '@angular/core/testing';
import { IonicModule, NavParams, ViewController } from 'ionic-angular';
import { AbstractControl, FormGroup, FormControl } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';

/* Test configuration imports */
import { configureTestBed } from '../../../../test-config/configureTestBed';

/* Mock imports */
import { NavParamsMock, ViewControllerMock } from '../../../../test-config/mocks-ionic';

/* Interface imports */
import { Process } from '../../../shared/interfaces/process';

/* Page imports */
import { ProcessFormPage } from './process-form';


describe('Process Form Page', () => {
  let fixture: ComponentFixture<ProcessFormPage>;
  let processPage: ProcessFormPage;
  let injector: TestBed;
  let viewCtrl: ViewController;
  let originalNgOnInit: () => void;
  configureTestBed();

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      declarations: [
        ProcessFormPage
      ],
      imports: [
        IonicModule.forRoot(ProcessFormPage)
      ],
      providers: [
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

  beforeEach(() => {
    fixture = TestBed.createComponent(ProcessFormPage);
    processPage = fixture.componentInstance;

    injector = getTestBed();
    viewCtrl = injector.get(ViewController);

    originalNgOnInit = processPage.ngOnInit;
    processPage.ngOnInit = jest
      .fn();
  });

  describe('Form creation', () => {

    test('should create the component', () => {
      NavParamsMock.setParams('processType', 'manual');
      NavParamsMock.setParams('formMode', 'create');

      processPage.ngOnInit = originalNgOnInit;

      processPage.initForm = jest
        .fn();

      fixture.detectChanges();

      expect(processPage).toBeDefined();
    }); // end 'should create the component' test

    test('should call view controller dismiss with deletion flag', () => {
      fixture.detectChanges();

      const viewSpy: jest.SpyInstance = jest.spyOn(viewCtrl, 'dismiss');

      processPage.deleteStep();

      expect(viewSpy).toHaveBeenCalledWith({delete: true});
    }); // end 'should call view controller dismiss with deletion flag' test

    test('should call view controller dismiss without args', () => {
      fixture.detectChanges();

      const viewSpy: jest.SpyInstance = jest.spyOn(viewCtrl, 'dismiss');

      processPage.dismiss();

      expect(viewSpy).toHaveBeenCalled();
    }); // end 'should call view controller dismiss without args' test

    test('should initialize a manual step creation form', () => {
      processPage.stepType = 'manual';

      fixture.detectChanges();

      processPage.initForm(undefined);

      expect(processPage.processForm.value).toStrictEqual({
        type: 'manual',
        name: '',
        description: '',
        expectedDuration: null
      });
    }); // end 'should initialize a manual step creation form' test

    test('should initialize a timer step creation form', () => {
      processPage.stepType = 'timer';

      fixture.detectChanges();

      processPage.initForm(undefined);

      expect(processPage.processForm.value).toStrictEqual({
        type: 'timer',
        name: '',
        description: '',
        concurrent: false,
        splitInterval: 1,
        duration: ''
      });
    }); // end 'should initialize a timer step creation form' test

    test('should initialize a calendar step creation form', () => {
      processPage.stepType = 'calendar';

      fixture.detectChanges();

      processPage.initForm(undefined);

      expect(processPage.processForm.value).toStrictEqual({
        type: 'calendar',
        name: '',
        description: '',
        duration: ''
      });
    }); //  end 'should initialize a calendar step creation form' test

    test('should submit a creation form', () => {
      processPage.stepType = 'manual';
      processPage.formMode = 'create';
      processPage.processForm = new FormGroup({
        name: new FormControl('test-name'),
        type: new FormControl('manual'),
        description: new FormControl('test description'),
        expectedDuration: new FormControl(10)
      });

      const viewSpy: jest.SpyInstance = jest.spyOn(viewCtrl, 'dismiss');

      fixture.detectChanges();

      processPage.onSubmit();

      expect(viewSpy).toHaveBeenCalledWith({
        name: 'test-name',
        type: 'manual',
        description: 'test description',
        expectedDuration: 10
      });
    }); // end 'should submit a creation form' test

  }); // end 'Form creation' section


  describe('Form update', () => {

    test('should initialize a manual step form with values to update', () => {
      processPage.stepType = 'manual';
      processPage.formMode = 'create';

      fixture.detectChanges();

      const formValue: Process = {
        name: 'a manual step',
        type: 'manual',
        description: 'manual step',
        expectedDuration: 15,
        cid: '0'
      };

      processPage.initForm(formValue);

      expect(processPage.processForm.value).toStrictEqual({
        type: formValue.type,
        name: formValue.name,
        description: formValue.description,
        expectedDuration: formValue.expectedDuration
      });
    }); // end 'should initialize a manual step form with values to update' test

    test('should initialize a timer step form with values to update', () => {
      fixture.detectChanges();

      processPage.stepType = 'timer';

      processPage.initForm({
        cid: '0',
        name: 'a timer step',
        type: 'timer',
        description: 'timer step to update',
        concurrent: false,
        splitInterval: 1
      });

      const formControls: { [key: string]: AbstractControl }
        = processPage.processForm.controls;

      expect(formControls.concurrent.value).toBe(false);
      expect(formControls.splitInterval.value).toBe(1);
      expect(formControls.name.value).toMatch('a timer step');
    }); // end 'should initialize a timer step form with values to update' test

    test('should initialize a calendar step form with values to update', () => {
      fixture.detectChanges();

      processPage.stepType = 'calendar';

      processPage.initForm({
        cid: '1',
        name: 'a calendar step',
        type: 'calendar',
        description: 'calendar step to update',
        duration: 14
      });

      const formControls: { [key: string]: AbstractControl }
        = processPage.processForm.controls;

      expect(formControls.duration.value).toBe(14);
      expect(formControls.name.value).toMatch('a calendar step');
    }); // end 'should initialize a calendar step form with values to update' test

    test('should submit an update form', () => {
      processPage.stepType = 'manual';
      processPage.formMode = 'update';

      processPage.processForm = new FormGroup({
        name: new FormControl('test name'),
        type: new FormControl('manual'),
        description: new FormControl(''),
        expectedDuration: new FormControl(10)
      });

      const viewSpy: jest.SpyInstance = jest.spyOn(viewCtrl, 'dismiss');

      fixture.detectChanges();

      processPage.onSubmit();

      expect(viewSpy).toHaveBeenCalledWith({
        update: {
          name: 'test name',
          type: 'manual',
          description: '',
          expectedDuration: 10
        }
      });
    }); // end 'should submit an update form' test

  }); // end 'Form update' section

});
