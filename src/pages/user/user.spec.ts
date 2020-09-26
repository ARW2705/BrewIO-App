/* Module imports */
import { ComponentFixture, TestBed, getTestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { IonicModule } from 'ionic-angular';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

/* Test configuration imports */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Mock imports */
import { mockUser } from '../../../test-config/mockmodels/mockUser';

/* Interface imports */
import { User } from '../../shared/interfaces/user';

/* Page imports */
import { UserPage } from './user';

/* Provider imports */
import { ModalProvider } from '../../providers/modal/modal';
import { UserProvider } from '../../providers/user/user';


describe('User Page', () => {
  let userPage: UserPage;
  let fixture: ComponentFixture<UserPage>;
  let injector: TestBed;
  let userService: UserProvider;
  let modalService: ModalProvider;
  configureTestBed();

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      declarations: [
        UserPage
      ],
      imports: [
        IonicModule.forRoot(UserPage)
      ],
      providers: [
        { provide: UserProvider, useValue: {} },
        { provide: ModalProvider, useValue: {} }
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
    fixture = TestBed.createComponent(UserPage);
    userPage = fixture.componentInstance;

    injector = getTestBed();
    userService = injector.get(UserProvider);
    modalService = injector.get(ModalProvider);

    const _mockUser: BehaviorSubject<User> = new BehaviorSubject<User>(mockUser());
    userService.getUser = jest
      .fn()
      .mockReturnValue(_mockUser);
    userService.isLoggedIn = jest
      .fn();

    modalService.openLogin = jest
      .fn();
    modalService.openSignup = jest
      .fn();
  });

  test('should create the component', () => {
    fixture.detectChanges();

    expect(userPage).toBeDefined();
  }); // end 'should create the component' test

  test('should toggle a section', () => {
    fixture.detectChanges();

    expect(userPage.expandedContent.length).toBe(0);

    userPage.toggleExpandContent('preferences');

    expect(userPage.expandedContent).toMatch('preferences');

    userPage.toggleExpandContent('preferences');

    expect(userPage.expandedContent.length).toBe(0);
  }); // end 'should toggle a section' test

  test('should open the login modal', () => {
    fixture.detectChanges();

    const modalSpy: jest.SpyInstance = jest
      .spyOn(userPage.modalService, 'openLogin');

    userPage.openLogin();

    expect(modalSpy).toHaveBeenCalled();
  }); // end 'should open the login modal' test

  test('should open the signup modal', () => {
    fixture.detectChanges();

    const modalSpy: jest.SpyInstance = jest
      .spyOn(userPage.modalService, 'openSignup');

    userPage.openSignup();

    expect(modalSpy).toHaveBeenCalled();
  }); // end 'should open the signup modal' test

});
