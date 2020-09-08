/* Module imports */
import { TestBed, async, getTestBed, ComponentFixture } from '@angular/core/testing';
import { IonicModule, NavParams, ViewController } from 'ionic-angular';
import { AbstractControl } from '@angular/forms';

/* Test configuration imports */
import { configureTestBed } from '../../../../test-config/configureTestBed';

/* Mock imports */
import { NavParamsMock, ViewControllerMock } from '../../../../test-config/mocks-ionic';

/* Page imports */
import { ProcessFormPage } from './process-form';


describe('Process Form Page', () => {
  let fixture: ComponentFixture<ProcessFormPage>;
  let processPage: ProcessFormPage;
  let injector: TestBed;
  let viewCtrl: ViewController;
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
  });

  describe('Form creation', () => {
    beforeAll(async(() => {
      NavParamsMock.setParams('processType', 'manual');
      NavParamsMock.setParams('formMode', 'create');
    }));

    test('should create the component', () => {
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
      fixture.detectChanges();

      expect(processPage.processForm).toBeDefined();
      expect(processPage.processForm.controls.expectedDuration).toBeDefined();
    }); // end 'should initialize a manual step creation form' test

    test('should initialize a timer step creation form', () => {
      fixture.detectChanges();

      processPage.stepType = 'timer';

      processPage.initForm(null);

      expect(processPage.processForm.controls.concurrent).toBeDefined();
      expect(processPage.processForm.controls.splitInterval).toBeDefined();
    }); // end 'should initialize a timer step creation form' test

    test('should initialize a calendar step creation form', () => {
      fixture.detectChanges();

      processPage.stepType = 'calendar';

      processPage.initForm(null);

      expect(processPage.processForm.controls.duration).toBeDefined();
    }); //  end 'should initialize a calendar step creation form' test

    test('should submit a creation form', () => {
      fixture.detectChanges();

      processPage.processForm.controls.name.setValue('test name');
      processPage.processForm.controls.expectedDuration.setValue(10);

      const viewSpy: jest.SpyInstance = jest.spyOn(viewCtrl, 'dismiss');

      processPage.onSubmit();

      expect(viewSpy).toHaveBeenCalledWith(processPage.processForm.value);
    }); // end 'should submit a creation form' test

  }); // end 'Form creation' section


  describe('Form update', () => {
    beforeAll(async(() => {
      NavParamsMock.setParams('processType', 'manual');
      NavParamsMock.setParams('formMode', 'update');
      NavParamsMock.setParams('update', {
        name: 'a manual step',
        type: 'manual',
        description: 'manual step to update',
        expectedDuration: 15
      });
    }));

    test('should initialize a manual step form with values to update', () => {
      fixture.detectChanges();

      const formControls: { [key: string]: AbstractControl }
      = processPage.processForm.controls;

      expect(formControls.expectedDuration.value).toBe(15);
      expect(formControls.name.value).toMatch('a manual step');
      expect(formControls.description.value).toMatch('manual step to update');
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
      fixture.detectChanges();

      const formControls: { [key: string]: AbstractControl }
        = processPage.processForm.controls;
      formControls.name.setValue('updated name');

      const viewSpy: jest.SpyInstance = jest.spyOn(viewCtrl, 'dismiss');

      processPage.onSubmit();

      expect(viewSpy.mock.calls[0][0].update.name).toMatch('updated name');
    }); // end 'should submit an update form' test

  }); // end 'Form update' section

});
