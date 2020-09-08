/* Module imports */
import { TestBed, getTestBed, async } from '@angular/core/testing';
import { ModalController } from 'ionic-angular';

/* Configure test import */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Mock import */
import { ModalControllerMock } from '../../../test-config/mocks-ionic';

/* Page imports */
import { LoginPage } from '../../pages/forms/login/login';
import { SignupPage } from '../../pages/forms/signup/signup';

/* Provider imports */
import { ModalProvider } from './modal';


describe('Modal Provider', () => {
  let injector: TestBed;
  let modalService: ModalProvider;
  let modalCtrl: ModalController;
  configureTestBed();

  beforeAll(async(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        ModalProvider,
        { provide: ModalController, useClass: ModalControllerMock }
      ]
    });
  }));

  beforeEach(() => {
    injector = getTestBed();
    modalService = injector.get(ModalProvider);
    modalCtrl = injector.get(ModalController);
  });

  test('should create and open login modal', () => {
    const modalSpy: jest.SpyInstance = jest.spyOn(modalCtrl, 'create');

    modalService.openLogin();

    expect(modalSpy).toHaveBeenCalledWith(LoginPage);
  }); // end 'should create and open login modal' test

  test('should create and open signup modal', () => {
    const modalSpy: jest.SpyInstance = jest.spyOn(modalCtrl, 'create');

    modalService.openSignup();

    expect(modalSpy).toHaveBeenCalledWith(SignupPage);
  }); // end 'should create and open signup modal' test

});
