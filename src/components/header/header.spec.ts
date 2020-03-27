/* Module imports */
import { TestBed, getTestBed, async, ComponentFixture } from '@angular/core/testing';
import { IonicModule, NavController, ModalController, Events, Config, App } from 'ionic-angular';
import { IonicStorageModule } from '@ionic/storage';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { Network } from '@ionic-native/network/ngx';

/* Test configuration imports */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Mock imports */
import { mockUser } from '../../../test-config/mockmodels/mockUser';
import { NavMock, ModalControllerMock, StorageMock, ConfigMock, AppMock } from '../../../test-config/mocks-ionic';

/* Component imports */
import { HeaderComponent } from './header';

/* Provider imports */
import { UserProvider } from '../../providers/user/user';
import { ModalProvider } from '../../providers/modal/modal';
import { ProcessProvider } from '../../providers/process/process';
import { RecipeProvider } from '../../providers/recipe/recipe';
import { ProcessHttpErrorProvider } from '../../providers/process-http-error/process-http-error';
import { StorageProvider } from '../../providers/storage/storage';
import { ConnectionProvider } from '../../providers/connection/connection';


describe('Header Component', () => {

  describe('User not logged in', () => {
    let fixture: ComponentFixture<HeaderComponent>;
    let header: HeaderComponent;
    let injector: TestBed;
    let eventService: Events;
    configureTestBed();

    beforeAll(done => (async() => {
      TestBed.configureTestingModule({
        declarations: [
          HeaderComponent
        ],
        imports: [
          IonicModule,
          HttpClientTestingModule,
          IonicStorageModule.forRoot()
        ],
        providers: [
          UserProvider,
          ProcessProvider,
          RecipeProvider,
          StorageProvider,
          ModalProvider,
          Events,
          Network,
          ConnectionProvider,
          { provide: ProcessHttpErrorProvider, useValue: {} },
          { provide: NavController, useClass: NavMock },
          { provide: ModalController, useClass: ModalControllerMock },
          { provide: Config, useClass: ConfigMock },
          { provide: App, useClass: AppMock }
        ]
      });
      await TestBed.compileComponents();
    })()
    .then(done)
    .catch(done.fail));

    beforeEach(async(() => {
      injector = getTestBed();
      eventService = injector.get(Events);
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(HeaderComponent);
      header = fixture.componentInstance;
    });

    test('should create the component', () => {
      fixture.detectChanges();
      expect(header).toBeDefined();
    }); // end 'should create the component' test

    test('should handle a back navigation call with empty nav stack', done => {
      fixture.detectChanges();
      eventService.subscribe('pop-header-nav', data => {
        expect(data.origin).toMatch('');
        expect(header.isTabPage).toBe(true);
        done();
      });
      header.goBack();
    }); // end 'should handle a back navigation call with empty nav stack' test

    test('should handle a back navigation call with items in nav stack', done => {
      fixture.detectChanges();
      header.navStack = ['second-most-recent', 'most-recent'];
      header.isTabPage = false;
      eventService.subscribe('pop-header-nav', data => {
        expect(data.origin).toMatch('most-recent');
        expect(header.navStack.length).toBe(1);
        expect(header.isTabPage).toBe(false);
        done();
      });
      header.goBack();
    }); // end 'should handle a back navigation call with items in nav stack' test

    test('should push an origin to the nav stack', () => {
      fixture.detectChanges();
      expect(header.navStack.length).toBe(0);
      header.headerNavUpdateEventHandler({origin: 'new-origin'});
      expect(header.navStack.length).toBe(1);
      expect(header.navStack[0]).toMatch('new-origin');
    }); // end 'should push an origin to the nav stack' test

    test('should set the current tab name', () => {
      fixture.detectChanges();
      expect(header.currentTab).toMatch('');
      header.headerNavUpdateEventHandler({dest: 'new-nav'});
      expect(header.currentTab).toMatch('new-nav');
    }); // end 'should set the current tab name' test

    test('should set a tab destination', () => {
      fixture.detectChanges();
      header.navStack = ['second-most-recent', 'most-recent'];
      header.isTabPage = false;
      header.headerNavUpdateEventHandler({destType: 'tab'});
      expect(header.navStack.length).toBe(0);
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
      const navSpy = jest.spyOn(header, 'goBack');
      header.headerNavUpdateEventHandler({other: 'batch-end'});
      expect(navSpy).toHaveBeenCalled();
    }); // end 'should call goBack if a \'batch-end\' flag is set' test

    test('should call goBack if a \'form-submit-complete\' flag is set', () => {
      fixture.detectChanges();
      const navSpy = jest.spyOn(header, 'goBack');
      header.headerNavUpdateEventHandler({other: 'form-submit-complete'});
      expect(navSpy).toHaveBeenCalled();
    }); // end 'should call goBack if a \'form-submit-complete\' flag is set' test

    test('should check if current tab is the user tab', () => {
      fixture.detectChanges();
      expect(header.isUserTab()).toBe(false);
      header.currentTab = 'user';
      expect(header.isUserTab()).toBe(true);
    }); // end 'should check if current tab is the user tab' test

    test('should log out', () => {
      fixture.detectChanges();
      const userSpy = jest.spyOn(header.userService, 'logOut');
      header.logout();
      expect(userSpy).toHaveBeenCalled();
    }); // end 'should log out' test

    test('should open login modal', () => {
      fixture.detectChanges();
      const modalSpy = jest.spyOn(header.modalService, 'openLogin');
      header.openLogin();
      expect(modalSpy).toHaveBeenCalled();
    }); // end 'should open login modal' test

    test('should not have a back button if on a \'tab\' page', () => {
      fixture.detectChanges();
      const backButton = fixture.debugElement.query(By.css('.header-button-back'));
      expect(backButton).toBeNull();
    }); // end 'should not have a back button if on a \'tab\' page' test

    test('should have back button if not on a \'tab\' page', () => {
      header.isTabPage = false;
      fixture.detectChanges();
      const backButton = fixture.debugElement.query(By.css('.header-button-back'));
      expect(backButton).toBeTruthy();
    }); // end 'should have back button if not on a \'tab\' page' test

    test('should have a login button if not logged in', () => {
      fixture.detectChanges();
      const loginIconButton = fixture.debugElement.query(By.css('#log-in-icon'));
      expect(loginIconButton).toBeTruthy();
    }); // end 'should have a login button if not logged in' test

    test('should not have a logout button if not logged in', () => {
      fixture.detectChanges();
      const buttons = fixture.debugElement.queryAll(By.css('.header-button'));
      const logoutButton = buttons.find(button => {
        return (button.childNodes[0] as any).childNodes[2].name !== 'ion-icon';
      });
      expect(logoutButton).toBeUndefined();
    }); // end 'should not have a logout button if not logged in' test

  }); // end 'User not logged in' section


  describe('User logged in', () => {
    let fixture: ComponentFixture<HeaderComponent>;
    let header: HeaderComponent;
    let injector: TestBed;
    let userService: UserProvider;
    configureTestBed();

    beforeAll(done => (async() => {
      TestBed.configureTestingModule({
        declarations: [
          HeaderComponent
        ],
        imports: [
          IonicModule,
          HttpClientTestingModule,
          IonicStorageModule.forRoot()
        ],
        providers: [
          UserProvider,
          ProcessProvider,
          RecipeProvider,
          StorageProvider,
          ModalProvider,
          Events,
          Network,
          ConnectionProvider,
          { provide: ProcessHttpErrorProvider, useValue: {} },
          { provide: NavController, useClass: NavMock },
          { provide: ModalController, useClass: ModalControllerMock },
          { provide: Storage, useClass: StorageMock },
          { provide: Config, useClass: ConfigMock },
          { provide: App, useClass: AppMock }
        ]
      });
      await TestBed.compileComponents();
    })()
    .then(done)
    .catch(done.fail));

    beforeEach(async(() => {
      injector = getTestBed();
      userService = injector.get(UserProvider);
      userService.user$.next(mockUser());
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
      header.currentTab = 'user';
      fixture.detectChanges();
      const buttons = fixture.debugElement.queryAll(By.css('.header-button'));
      const logoutButton = buttons.find(button => {
        return !(button.childNodes[0] as any).childNodes.some(node => node.name === 'ion-icon');
      });
      expect(logoutButton).toBeDefined();
    }); // end 'should have a log out button' test

    test('should not have a log in button', () => {
      fixture.detectChanges();
      const loginIconButton = fixture.debugElement.query(By.css('#log-in-icon'));
      expect(loginIconButton).toBeNull();
    }); // end 'should not have a log in button' test

    test('should show username as logged in', () => {
      fixture.detectChanges();
      const loginMessage = fixture.debugElement.queryAll(By.css('.login-header-text'));
      expect(loginMessage.length).toBe(2);
    }); // end 'should show username as logged in' test

  }); //  end 'User logged in' section

});
