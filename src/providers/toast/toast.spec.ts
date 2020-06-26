/* Module imports */
import { TestBed, getTestBed, async } from '@angular/core/testing';
import { ToastController } from 'ionic-angular';

/* Configure test import */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Mock imports */
import { ToastControllerMock } from '../../../test-config/mocks-ionic';

/* Provider imports */
import { ToastProvider } from './toast';


describe('Toast Provider', () => {
  let injector: TestBed;
  let toastService: ToastProvider;
  let toastCtrl: ToastController;
  configureTestBed();

  beforeAll(async(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        ToastProvider,
        { provide: ToastController, useClass: ToastControllerMock }
      ]
    });
  }));

  beforeEach(() => {
    injector = getTestBed();
    toastService = injector.get(ToastProvider);
    toastCtrl = injector.get(ToastController);
  });

  test('should present a toast with default options', () => {
    const toastSpy = jest.spyOn(toastCtrl, 'create');

    toastService.presentToast('my message');

    expect(toastSpy).toHaveBeenCalledWith({
      message: 'my message',
      duration: 2000,
      position: 'bottom',
      cssClass: 'main-toast',
      showCloseButton: false,
      closeButtonText: 'Close',
      dismissOnPageChange: false
    });
  }); // end 'should present a toast with default options' test

  test('should present toast with given options', () => {
    const toastSpy = jest.spyOn(toastCtrl, 'create');

    toastService.presentToast(
      'my message',
      3000,
      'top',
      'custom',
      true,
      'X',
      true
    );

    expect(toastSpy).toHaveBeenCalledWith({
      message: 'my message',
      duration: 3000,
      position: 'top',
      cssClass: 'main-toast custom',
      showCloseButton: true,
      closeButtonText: 'X',
      dismissOnPageChange: true
    });
  }); // end 'should present toast with given options' test

});
