/* Module imports */
import { ComponentFixture, TestBed, getTestBed } from '@angular/core/testing';
import { IonicModule, NavParams, ViewController } from 'ionic-angular';
import { FormControl } from '@angular/forms';

/* Test configuration imports */
import { configureTestBed } from '../../../../test-config/configureTestBed';

/* Mock imports */
import { NavParamsMock, ViewControllerMock } from '../../../../test-config/mocks-ionic';

/* Page imports */
import { NoteFormPage } from './note-form';


describe('Note Form', () => {
  let fixture: ComponentFixture<NoteFormPage>;
  let injector: TestBed;
  let notePage: NoteFormPage;
  let viewCtrl: ViewController;
  let originalNgOnInit: () => void;
  configureTestBed();

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      declarations: [
        NoteFormPage
      ],
      imports: [
        IonicModule.forRoot(NoteFormPage)
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
    fixture = TestBed.createComponent(NoteFormPage);
    notePage = fixture.componentInstance;

    injector = getTestBed();
    viewCtrl = injector.get(ViewController);

    originalNgOnInit = notePage.ngOnInit;
    notePage.ngOnInit = jest
      .fn();
  });

  describe('Note creation', () => {

    test('should create component', () => {
      NavParamsMock.setParams('formMethod', 'create');
      NavParamsMock.setParams('noteType', 'recipe');

      notePage.ngOnInit = originalNgOnInit;

      fixture.detectChanges();

      expect(notePage).toBeDefined();
      expect(notePage.title).toMatch('recipe');
    }); // end 'should create component'

    test('should dismiss modal', () => {
      fixture.detectChanges();

      const viewSpy = jest.spyOn(viewCtrl, 'dismiss');

      notePage.dismiss();

      expect(viewSpy).toHaveBeenCalled();
    }); // end 'should dimiss modal'

    test('should dimiss modal with note data', () => {
      notePage.formMethod = 'create';
      notePage.note = new FormControl('a test note');

      fixture.detectChanges();

      const viewSpy = jest.spyOn(viewCtrl, 'dismiss');

      notePage.onSubmit();

      expect(viewSpy).toHaveBeenCalledWith({
        method: 'create',
        note: 'a test note'
      });
    }); // end 'should dimiss modal with note data' test

  }); // end 'Note creation' section


  describe('Note update', () => {

    test('should have note content to update', () => {
      NavParamsMock.setParams('formMethod', 'update');
      NavParamsMock.setParams('noteType', 'recipe');
      NavParamsMock.setParams('toUpdate', 'note to update');

      notePage.ngOnInit = originalNgOnInit;

      fixture.detectChanges();

      expect(notePage.note.value).toBe('note to update');
    }); // end 'should have note content to update' test

    test('should dismiss modal with delete flag', () => {
      fixture.detectChanges();

      const viewSpy = jest.spyOn(viewCtrl, 'dismiss');

      notePage.onDelete();

      expect(viewSpy).toHaveBeenCalledWith({method: 'delete'});
    }); // end 'should dismiss modal with delete flag' test

  }); // end 'Note update' section

});
