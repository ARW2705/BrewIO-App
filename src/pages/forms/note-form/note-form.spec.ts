/* Module imports */
import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { IonicModule, NavController, NavParams, ViewController } from 'ionic-angular';

/* Mock imports */
import { NavMock, NavParamsMock, ViewControllerMock } from '../../../../test-config/mocks-ionic';

/* Page imports */
import { NoteFormPage } from './note-form';


describe('Note Form', () => {

  describe('Note creation', () => {
    let fixture: ComponentFixture<NoteFormPage>;
    let notePage: NoteFormPage;

    beforeEach(async(() => {
      NavParamsMock.setParams('formMethod', 'create');
      NavParamsMock.setParams('noteType', 'recipe');
    }));

    beforeEach(async(() => {
      TestBed.configureTestingModule({
        declarations: [
          NoteFormPage
        ],
        imports: [
          IonicModule.forRoot(NoteFormPage)
        ],
        providers: [
          { provide: NavController, useClass: NavMock },
          { provide: NavParams, useClass: NavParamsMock },
          { provide: ViewController, useClass: ViewControllerMock }
        ]
      })
      .compileComponents();
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(NoteFormPage);
      notePage = fixture.componentInstance;
    });

    test('should create component', () => {
      fixture.detectChanges();
      expect(notePage).toBeDefined();
      expect(notePage.title).toMatch('recipe');
    }); // end 'should create component'

    test('should dismiss modal', () => {
      fixture.detectChanges();
      const viewSpy = jest.spyOn(notePage.viewCtrl, 'dismiss');
      notePage.dismiss();
      expect(viewSpy).toHaveBeenCalled();
    }); // end 'should dimiss modal'

    test('should dimiss modal with note data', () => {
      fixture.detectChanges();
      const viewSpy = jest.spyOn(notePage.viewCtrl, 'dismiss');
      notePage.note.setValue('a test note');
      notePage.onSubmit();
      expect(viewSpy).toHaveBeenCalledWith({
        method: 'create',
        note: 'a test note'
      });
    }); // end 'should dimiss modal with note data' test

  }); // end 'Note creation' section


  describe('Note update', () => {
    let fixture: ComponentFixture<NoteFormPage>;
    let notePage: NoteFormPage;

    beforeEach(async(() => {
      NavParamsMock.setParams('formMethod', 'update');
      NavParamsMock.setParams('noteType', 'recipe');
      NavParamsMock.setParams('toUpdate', 'note to update');
    }));

    beforeEach(async(() => {
      TestBed.configureTestingModule({
        declarations: [
          NoteFormPage
        ],
        imports: [
          IonicModule.forRoot(NoteFormPage)
        ],
        providers: [
          { provide: NavController, useClass: NavMock },
          { provide: NavParams, useClass: NavParamsMock },
          { provide: ViewController, useClass: ViewControllerMock }
        ]
      })
      .compileComponents();
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(NoteFormPage);
      notePage = fixture.componentInstance;
    });

    test('should have note content to update', () => {
      fixture.detectChanges();
      expect(notePage.note.value).toBe('note to update');
    }); // end 'should have note content to update' test

    test('should dismiss modal with delete flag', () => {
      fixture.detectChanges();
      const viewSpy = jest.spyOn(notePage.viewCtrl, 'dismiss');
      notePage.onDelete();
      expect(viewSpy).toHaveBeenCalledWith({method: 'delete'});
    }); // end 'should dismiss modal with delete flag' test

  }); // end 'Note update' section

});
