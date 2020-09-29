/* Module imports */
import { ComponentFixture, TestBed, getTestBed } from '@angular/core/testing';
import { IonicModule, NavParams, ViewController } from 'ionic-angular';

/* Test configuration imports */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Mock imports */
import { NavParamsMock, ViewControllerMock } from '../../../test-config/mocks-ionic';

/* Page imports */
import { ConfirmationPage } from './confirmation';


describe('Confirmation Page', () => {
  let fixture: ComponentFixture<ConfirmationPage>;
  let confirmPage: ConfirmationPage;
  let injector: TestBed;
  let viewCtrl: ViewController;
  let originalNgOnInit: () => void;
  configureTestBed();

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      declarations: [
        ConfirmationPage
      ],
      imports: [
        IonicModule.forRoot(ConfirmationPage)
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

  beforeAll(() => {
    injector = getTestBed();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmationPage);
    confirmPage = fixture.componentInstance;

    viewCtrl = injector.get(ViewController);

    originalNgOnInit = confirmPage.ngOnInit;
    confirmPage.ngOnInit = jest
      .fn();
  });

  test('should create the component', () => {
    const testTitle: string = 'test title';
    const testMessage: string = 'test message';
    const testSubMessage: string = 'test sub-message';

    NavParamsMock.setParams('title', testTitle);
    NavParamsMock.setParams('message', testMessage);
    NavParamsMock.setParams('subMessage', testSubMessage);

    confirmPage.ngOnInit = originalNgOnInit;

    fixture.detectChanges();

    expect(confirmPage).toBeDefined();
    expect(confirmPage.title).toMatch(testTitle);
    expect(confirmPage.message).toMatch(testMessage);
    expect(confirmPage.subMessage).toMatch(testSubMessage);
  }); // end 'should create the component' test

  test('should submit confirmation', () => {
    const viewSpy: jest.SpyInstance = jest.spyOn(viewCtrl, 'dismiss');

    fixture.detectChanges();

    confirmPage.confirm();

    expect(viewSpy).toHaveBeenCalledWith(true);
  }); // end 'should submit confirmation' test

  test('should submit cancellation', () => {
    const viewSpy: jest.SpyInstance = jest.spyOn(viewCtrl, 'dismiss');

    fixture.detectChanges();

    confirmPage.dismiss();

    expect(viewSpy).toHaveBeenCalledWith(false);
  }); // end 'should submit cancellation' test

});
