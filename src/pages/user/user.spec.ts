/* Module imports */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { IonicModule, ModalController, ToastController } from 'ionic-angular';
import { IonicStorageModule } from '@ionic/storage';
import { UserComponentsModule } from './user-components/user.components.module';

/* Test configuration imports */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Mock imports */
import { ModalControllerMock, ToastControllerMock } from '../../../test-config/mocks-ionic';

/* Page imports */
import { UserPage } from './user';

/* Provider imports */
import { ModalProvider } from '../../providers/modal/modal';
import { PreferencesProvider } from '../../providers/preferences/preferences';
import { UserProvider } from '../../providers/user/user';
import { ToastProvider } from '../../providers/toast/toast';
import { ProcessHttpErrorProvider } from '../../providers/process-http-error/process-http-error';
import { StorageProvider } from '../../providers/storage/storage';
import { ConnectionProvider } from '../../providers/connection/connection';


describe('User Page', () => {
  let userPage: UserPage;
  let fixture: ComponentFixture<UserPage>;
  configureTestBed();

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      declarations: [
        UserPage
      ],
      imports: [
        IonicModule.forRoot(UserPage),
        UserComponentsModule,
        HttpClientTestingModule,
        IonicStorageModule
      ],
      providers: [
        UserProvider,
        ModalProvider,
        ToastProvider,
        { provide: ConnectionProvider, useValue: {} },
        { provide: StorageProvider, useValue: {} },
        { provide: ProcessHttpErrorProvider, useValue: {} },
        { provide: PreferencesProvider, useValue: {} },
        { provide: ModalController, useClass: ModalControllerMock },
        { provide: ToastController, useClass: ToastControllerMock }
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

  test('should return if content should be expanded', () => {
    fixture.detectChanges();
    expect(userPage.showExpandedContent('should be false')).toBe(false);
    userPage.expandedContent = 'should be true';
    expect(userPage.showExpandedContent('should be true')).toBe(true);
  }); // end 'should return if content should be expanded' test

  test('should open the login modal', () => {
    fixture.detectChanges();
    const modalSpy = jest.spyOn(userPage.modalService, 'openLogin');
    userPage.openLogin();
    expect(modalSpy).toHaveBeenCalled();
  }); // end 'should open the login modal' test

  test('should open the signup modal', () => {
    fixture.detectChanges();
    const modalSpy = jest.spyOn(userPage.modalService, 'openSignup');
    userPage.openSignup();
    expect(modalSpy).toHaveBeenCalled();
  }); // end 'should open the signup modal' test

});
