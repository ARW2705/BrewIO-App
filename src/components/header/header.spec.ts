/* Module imports */
import { TestBed, getTestBed, async, ComponentFixture } from '@angular/core/testing';
import { IonicModule, Events } from 'ionic-angular';
import { NO_ERRORS_SCHEMA, DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

/* Test configuration imports */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Mock imports */
import { mockUser } from '../../../test-config/mockmodels/mockUser';
import { EventsMock } from '../../../test-config/mocks-ionic';

/* Interface imports */
import { User } from '../../shared/interfaces/user';

/* Component imports */
import { HeaderComponent } from './header';

/* Provider imports */
import { UserProvider } from '../../providers/user/user';
import { ModalProvider } from '../../providers/modal/modal';


describe('Header Component', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let header: HeaderComponent;
  let injector: TestBed;
  let eventService: Events;
  let userService: UserProvider;
  let modalService: ModalProvider;
  let originalOnInit: any;
  let originalOnDestroy: any;
  configureTestBed();

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      declarations: [
        HeaderComponent
      ],
      imports: [
        IonicModule.forRoot(HeaderComponent)
      ],
      providers: [
        { provide: UserProvider, useValue: {} },
        { provide: ModalProvider, useValue: {} },
        { provide: Events, useClass: EventsMock }
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
    userService = injector.get(UserProvider);
    modalService = injector.get(ModalProvider);

    modalService.openLogin = jest
      .fn();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HeaderComponent);
    header = fixture.componentInstance;
    eventService = injector.get(Events);

    originalOnInit = header.ngOnInit;
    header.ngOnInit = jest
      .fn();

    originalOnDestroy = header.ngOnDestroy;
    header.ngOnDestroy = jest
      .fn();
  });

  describe('User not logged in', () => {

    beforeEach(async(() => {
      const _mockUser = mockUser();
      _mockUser.token = '';

      userService.getUser = jest
        .fn()
        .mockReturnValue(new BehaviorSubject<User>(null));
      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(false);
    }));

    test('should create the component', () => {
      header.ngOnInit = originalOnInit;
      header.ngOnDestroy = originalOnDestroy;

      fixture.detectChanges();

      expect(header).toBeDefined();
    }); // end 'should create the component' test

    test('should handle a back navigation call with empty nav stack', () => {
      fixture.detectChanges();

      const eventSpy: jest.SpyInstance = jest.spyOn(eventService, 'publish');

      header.goBack();

      expect(eventSpy).toHaveBeenCalledWith(
        'pop-header-nav',
        { origin: '' }
      );
    }); // end 'should handle a back navigation call with empty nav stack' test

    test('should handle a back navigation call with items in nav stack', () => {
      fixture.detectChanges();

      const eventSpy: jest.SpyInstance = jest.spyOn(eventService, 'publish');

      header.navStack = ['second-most-recent', 'most-recent'];
      header.isTabPage = false;

      header.goBack();

      expect(eventSpy).toHaveBeenCalledWith(
        'pop-header-nav',
        { origin: 'most-recent' }
      );
      expect(header.navStack.length).toBe(1);
      expect(header.isTabPage).toBe(false);
    }); // end 'should handle a back navigation call with items in nav stack' test

    test('should push an origin to the nav stack', () => {
      fixture.detectChanges();

      expect(header.navStack.length).toEqual(0);

      header.headerNavUpdateEventHandler({origin: 'new-origin'});

      expect(header.navStack.length).toEqual(1);
      expect(header.navStack[0]).toMatch('new-origin');
    }); // end 'should push an origin to the nav stack' test

    test('should set a destination view', () => {
      fixture.detectChanges();

      header.headerNavUpdateEventHandler({dest: 'process'});

      expect(header.currentView).toMatch('process');
    }); // end 'should set a destination view' test

    test('should set a tab destination', () => {
      fixture.detectChanges();

      header.navStack = ['second-most-recent', 'most-recent'];
      header.isTabPage = false;

      header.headerNavUpdateEventHandler({destType: 'tab'});

      expect(header.navStack.length).toEqual(0);
      expect(header.isTabPage).toBe(true);
    }); // end 'should set a tab destination' test

    test('should set a non-tab destination', () => {
      fixture.detectChanges();

      header.headerNavUpdateEventHandler({destType: 'not a tab'});

      expect(header.isTabPage).toBe(false);
    }); // end 'should set a non-tab destination' test

    test('should set a destination title', () => {
      fixture.detectChanges();

      header.title = 'init';

      header.headerNavUpdateEventHandler({destTitle: 'new-title'});

      expect(header.title).toMatch('new-title');
    }); // end 'should set a destination title' test

    test('should call goBack if a \'batch-end\' flag is set', () => {
      fixture.detectChanges();

      const navSpy: jest.SpyInstance = jest.spyOn(header, 'goBack');

      header.headerNavUpdateEventHandler({other: 'batch-end'});

      expect(navSpy).toHaveBeenCalled();
    }); // end 'should call goBack if a \'batch-end\' flag is set' test

    test('should call goBack if a \'form-submit-complete\' flag is set', () => {
      fixture.detectChanges();

      const navSpy: jest.SpyInstance = jest.spyOn(header, 'goBack');

      header.headerNavUpdateEventHandler({other: 'form-submit-complete'});

      expect(navSpy).toHaveBeenCalled();
    }); // end 'should call goBack if a \'form-submit-complete\' flag is set' test

    test('should open login modal', () => {
      fixture.detectChanges();

      const modalSpy: jest.SpyInstance = jest
        .spyOn(header.modalService, 'openLogin');

      header.openLogin();

      expect(modalSpy).toHaveBeenCalled();
    }); // end 'should open login modal' test

    test('should not have a back button if on a \'tab\' page', () => {
      fixture.detectChanges();

      const backButton: DebugElement = fixture
        .debugElement
        .query(By.css('.header-button-back'));

      expect(backButton).toBeNull();
    }); // end 'should not have a back button if on a \'tab\' page' test

    test('should have back button if not on a \'tab\' page', () => {
      header.isTabPage = false;

      fixture.detectChanges();

      const backButton: DebugElement = fixture
        .debugElement
        .query(By.css('.header-button-back'));

      expect(backButton).toBeDefined();
    }); // end 'should have back button if not on a \'tab\' page' test

    test('should have a login button if not logged in', () => {
      fixture.detectChanges();

      const loginIconButton: DebugElement = fixture
        .debugElement
        .query(By.css('#log-in-icon'));

      expect(loginIconButton).toBeDefined();
    }); // end 'should have a login button if not logged in' test

    test('should not have a logout button if not logged in', () => {
      header.currentView = 'user';

      fixture.detectChanges();

      const buttons: DebugElement[] = fixture
        .debugElement
        .queryAll(By.css('.header-button'));

      // Should only have one header button, only the login button has an ion-icon
      expect(buttons.length).toEqual(1);
      expect(buttons[0].childNodes[0]['childNodes'][1]['name'])
        .toMatch('ion-icon');
    }); // end 'should not have a logout button if not logged in' test

  }); // end 'User not logged in' section


  describe('User logged in', () => {

    beforeEach(async(() => {
      userService.getUser = jest
        .fn()
        .mockReturnValue(new BehaviorSubject<User>(mockUser()));
      userService.logOut = jest
        .fn();
      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(true);
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(HeaderComponent);
      header = fixture.componentInstance;
    });

    test('should have a user', () => {
      fixture.detectChanges();

      expect(header.user).not.toBeNull();
    }); // end 'should have a user' test

    test('should have a log out button', () => {
      header.currentView = 'user';

      fixture.detectChanges();

      const buttons: DebugElement[] = fixture
        .debugElement
        .queryAll(By.css('.header-button'));

      const logoutButton: DebugElement = buttons
        .find((button: DebugElement): boolean => {
          return !(<DebugElement>button.childNodes[0])
            .childNodes
            .some((node: DebugElement) => node.name === 'ion-icon');
        });

      expect(logoutButton).toBeDefined();
    }); // end 'should have a log out button' test

    test('should not have a log in button', () => {
      fixture.detectChanges();

      const loginIconButton: DebugElement = fixture
        .debugElement
        .query(By.css('#log-in-icon'));

      expect(loginIconButton).toBeNull();
    }); // end 'should not have a log in button' test

    test('should show username as logged in', () => {
      fixture.detectChanges();

      const loginMessage: DebugElement[] = fixture
        .debugElement
        .queryAll(By.css('.login-header-text'));

      expect(loginMessage.length).toEqual(2);
    }); // end 'should show username as logged in' test

    test('should log out', () => {
      fixture.detectChanges();

      const userSpy: jest.SpyInstance = jest.spyOn(userService, 'logOut');

      header.logout();

      expect(userSpy).toHaveBeenCalled();
    }); // end 'should log out' test

  }); //  end 'User logged in' section

});
