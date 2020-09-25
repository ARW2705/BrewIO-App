/* Module imports */
import { ComponentFixture, TestBed, getTestBed, async } from '@angular/core/testing';
import { IonicModule, ToastController } from 'ionic-angular';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { of } from 'rxjs/observable/of';

/* Test Configuration imports */
import { configureTestBed } from '../../../../../test-config/configureTestBed';

/* Mock imports */
import { mockEnglishUnits, mockMetricUnits } from '../../../../../test-config/mockmodels/mockUnits';
import { mockUser } from '../../../../../test-config/mockmodels/mockUser';
import { ToastControllerMock } from '../../../../../test-config/mocks-ionic';

/* Constant imports */
import * as UNITS from '../../../../shared/constants/units';

/* Interface imports */
import { SelectedUnits } from '../../../../shared/interfaces/units';
import { User } from '../../../../shared/interfaces/user';

/* Default imports */
import { defaultEnglish, defaultMetric } from '../../../../shared/defaults/default-units';

/* Component imports */
import { PreferencesComponent } from './preferences';

/* Provider imports */
import { PreferencesProvider } from '../../../../providers/preferences/preferences';
import { ToastProvider } from '../../../../providers/toast/toast';
import { UserProvider } from '../../../../providers/user/user';


describe('Preferences Component', () => {
  let injector: TestBed;
  let fixture: ComponentFixture<PreferencesComponent>;
  let prefPage: PreferencesComponent;
  let userService: UserProvider;
  let preferenceService; PreferencesProvider;
  let toastService: ToastProvider;
  configureTestBed();

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      declarations: [
        PreferencesComponent
      ],
      imports: [
        IonicModule.forRoot(PreferencesComponent)
      ],
      providers: [
        { provide: PreferencesProvider, useValue: {} },
        { provide: UserProvider, useValue: {} },
        { provide: ToastProvider, useValue: {} },
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

  beforeAll(async(() => {
    injector = getTestBed();
    userService = injector.get(UserProvider);
    toastService = injector.get(ToastProvider);

    toastService.presentToast = jest
      .fn();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PreferencesComponent);
    prefPage = fixture.componentInstance;

    preferenceService = injector.get(PreferencesProvider);
    preferenceService.setUnits = jest
      .fn();
    preferenceService.getPreferredUnitSystem = jest
      .fn()
      .mockReturnValue('englishStandard');
    const _mockEnglishUnits: SelectedUnits = mockEnglishUnits();
    preferenceService.getSelectedUnits = jest
      .fn()
      .mockReturnValue(_mockEnglishUnits);

    const _mockUser: User = mockUser();
    userService.getUser = jest
      .fn()
      .mockReturnValue(new BehaviorSubject<User>(_mockUser));
    userService.updateUserProfile = jest
      .fn()
      .mockReturnValue(of({}));
  });

  test('should create the component', () => {
    const initSpy: jest.SpyInstance = jest.spyOn(prefPage, 'initForm');
    const listenSpy: jest.SpyInstance = jest.spyOn(prefPage, 'listenForChanges');

    fixture.detectChanges();

    expect(prefPage).toBeDefined();
    expect(initSpy).toHaveBeenCalled();
    expect(listenSpy).toHaveBeenCalled();
  }); // end 'should create the component' test

  test('should not load a form if missing preferred units', () => {
    const initSpy: jest.SpyInstance = jest.spyOn(prefPage, 'initForm');
    const listenSpy: jest.SpyInstance = jest.spyOn(prefPage, 'listenForChanges');
    const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

    preferenceService.getSelectedUnits = jest
      .fn()
      .mockReturnValue(null);

    fixture.detectChanges();

    expect(initSpy).not.toHaveBeenCalled();
    expect(listenSpy).not.toHaveBeenCalled();
    const spyCount: number = consoleSpy.mock.calls.length;
    expect(consoleSpy.mock.calls[spyCount - 1][0]).toMatch('Preferences data error');
    expect(consoleSpy.mock.calls[spyCount - 1][1]).toMatch('englishStandard');
    expect(consoleSpy.mock.calls[spyCount - 1][2]).toBeNull();
  }); // end 'should not load a form if missing preferred units' test

  test('should fail to load a form due to user error', () => {
    const initSpy: jest.SpyInstance = jest.spyOn(prefPage, 'initForm');
    const listenSpy: jest.SpyInstance = jest.spyOn(prefPage, 'listenForChanges');
    const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

    userService.getUser = jest
      .fn()
      .mockReturnValue(new ErrorObservable('user error'));

    fixture.detectChanges();

    expect(initSpy).not.toHaveBeenCalled();
    expect(listenSpy).not.toHaveBeenCalled();
    expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0])
      .toMatch('Error loading user: user error');
  }); // end 'should fail to load a form due to user error' test

  test('should format the form data on submit', () => {
    const updateSpy: jest.SpyInstance = jest
      .spyOn(preferenceService, 'setUnits');

    fixture.detectChanges();

    prefPage.preferencesForm.controls.weightLarge.setValue(false);
    prefPage.preferencesForm.controls.volumeLarge.setValue(false);

    prefPage.onSubmit();

    expect(updateSpy).toHaveBeenCalledWith(
      'englishStandard',
      {
        system: 'englishStandard',
        weightSmall: UNITS.WEIGHT_ENGLISH_SMALL,
        weightLarge: UNITS.WEIGHT_METRIC_LARGE,
        volumeSmall: UNITS.VOLUME_ENGLISH_SMALL,
        volumeLarge: UNITS.VOLUME_METRIC_LARGE,
        temperature: UNITS.TEMPERATURE_ENGLISH,
        density: UNITS.SPECIFIC_GRAVITY
      }
    );

    prefPage.preferencesForm.controls.weightSmall.setValue(false);
    prefPage.preferencesForm.controls.volumeSmall.setValue(false);
    prefPage.preferencesForm.controls.temperature.setValue(false);
    prefPage.preferencesForm.controls.density.setValue('plato');

    prefPage.onSubmit();

    expect(updateSpy).toHaveBeenCalledWith(
      'englishStandard',
      {
        system: 'englishStandard',
        weightSmall: UNITS.WEIGHT_METRIC_SMALL,
        weightLarge: UNITS.WEIGHT_METRIC_LARGE,
        volumeSmall: UNITS.VOLUME_METRIC_SMALL,
        volumeLarge: UNITS.VOLUME_METRIC_LARGE,
        temperature: UNITS.TEMPERATURE_METRIC,
        density: UNITS.PLATO
      }
    );
  }); // end 'should format the form data on submit' test

  test('should get error on submit', done => {
    preferenceService.setUnits = jest
      .fn();
    preferenceService.getPreferredUnitSystem = jest
      .fn()
      .mockReturnValue('metric');
    const _mockMetricUnits = mockMetricUnits();
    _mockMetricUnits.density = UNITS.BRIX;
    preferenceService.getSelectedUnits = jest
      .fn()
      .mockReturnValue(_mockMetricUnits);
    userService.updateUserProfile = jest
      .fn()
      .mockReturnValue(new ErrorObservable('user update error'));

    const updateSpy: jest.SpyInstance = jest
      .spyOn(preferenceService, 'setUnits');
    const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

    fixture.detectChanges();

    prefPage.onSubmit();

    expect(updateSpy).toHaveBeenCalledWith(
      'metric',
      {
        system: 'metric',
        weightSmall: UNITS.WEIGHT_METRIC_SMALL,
        weightLarge: UNITS.WEIGHT_METRIC_LARGE,
        volumeSmall: UNITS.VOLUME_METRIC_SMALL,
        volumeLarge: UNITS.VOLUME_METRIC_LARGE,
        temperature: UNITS.TEMPERATURE_METRIC,
        density: UNITS.BRIX
      }
    );

    setTimeout(() => {
      expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0])
        .toMatch('Preferences submit error: user update error');
      done();
    }, 10);
  }); // end 'should get error on submit' test

  test('should listen for form changes', () => {
    preferenceService.preferredUnitSystem = 'english standard',
    preferenceService.units = defaultEnglish();

    const listenSpy: jest.SpyInstance = jest.spyOn(prefPage, 'listenForChanges');

    fixture.detectChanges();

    expect(listenSpy).toHaveBeenCalled();

    expect(prefPage.setUnits.volumeSmall)
      .toStrictEqual(UNITS.VOLUME_ENGLISH_SMALL);
    prefPage.preferencesForm.controls.volumeSmall.setValue(false);
    expect(prefPage.setUnits.volumeSmall)
      .toStrictEqual(UNITS.VOLUME_METRIC_SMALL);

    expect(prefPage.setUnits.weightLarge)
      .toStrictEqual(UNITS.WEIGHT_ENGLISH_LARGE);
    prefPage.preferencesForm.controls.weightLarge.setValue(false);
    expect(prefPage.setUnits.weightLarge)
      .toStrictEqual(UNITS.WEIGHT_METRIC_LARGE);
    prefPage.preferencesForm.controls.weightLarge.setValue(true);
    expect(prefPage.setUnits.weightLarge)
      .toStrictEqual(UNITS.WEIGHT_ENGLISH_LARGE);
  }); // end 'should listen for form changes' test

});
