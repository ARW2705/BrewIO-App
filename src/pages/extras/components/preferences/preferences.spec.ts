/* Module imports */
import { ComponentFixture, TestBed, getTestBed, async } from '@angular/core/testing';
import { IonicModule } from 'ionic-angular';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { of } from 'rxjs/observable/of';

/* Test Configuration imports */
import { configureTestBed } from '../../../../../test-config/configureTestBed';

/* Mock imports */
import { mockUser } from '../../../../../test-config/mockmodels/mockUser';

/* Constant imports */
import * as UNITS from '../../../../shared/constants/units';

/* Interface imports */
import { User } from '../../../../shared/interfaces/user';

/* Default imports */
import { defaultEnglish, defaultMetric } from '../../../../shared/defaults/default-units';

/* Utility imports */
import { clone } from '../../../../shared/utility-functions/clone';

/* Component imports */
import { PreferencesComponent } from './preferences';

/* Provider imports */
import { PreferencesProvider } from '../../../../providers/preferences/preferences';
import { UserProvider } from '../../../../providers/user/user';


describe('Preferences Component', () => {
  let injector: TestBed;
  let fixture: ComponentFixture<PreferencesComponent>;
  let prefPage: PreferencesComponent;
  let userService: UserProvider;
  let preferenceService; PreferencesProvider;
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
        {
          provide: PreferencesProvider,
          useValue: {
            preferredUnitSystem: 'english standard',
            units: clone(defaultEnglish)
          }
        },
        { provide: UserProvider, useValue: {} }
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
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PreferencesComponent);
    prefPage = fixture.componentInstance;

    userService = injector.get(UserProvider);
    preferenceService = injector.get(PreferencesProvider);

    preferenceService.setUnits = jest
      .fn();

    userService.getUser = jest
      .fn()
      .mockReturnValue(new BehaviorSubject<User>(mockUser()));
  });

  test('should create the component', done => {
    const initSpy: jest.SpyInstance = jest.spyOn(prefPage, 'initForm');
    const listenSpy: jest.SpyInstance = jest.spyOn(prefPage, 'listenForChanges');

    fixture.detectChanges();

    expect(prefPage).toBeDefined();

    setTimeout(() => {
      expect(initSpy).toHaveBeenCalled();
      expect(listenSpy).toHaveBeenCalled();
      done();
    }, 10);
  }); // end 'should create the component' test

  test('should not load a form if missing preferred units', done => {
    const initSpy: jest.SpyInstance = jest.spyOn(prefPage, 'initForm');
    const listenSpy: jest.SpyInstance = jest.spyOn(prefPage, 'listenForChanges');
    const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

    preferenceService.preferredUnitSystem = '';
    preferenceService.units = null;

    fixture.detectChanges();

    setTimeout(() => {
      expect(initSpy).not.toHaveBeenCalled();
      expect(listenSpy).not.toHaveBeenCalled();
      const spyCount: number = consoleSpy.mock.calls.length;
      expect(consoleSpy.mock.calls[spyCount - 1][0])
        .toMatch('Preferences data error');
      expect(consoleSpy.mock.calls[spyCount - 1][1].length).toEqual(0);
      expect(consoleSpy.mock.calls[spyCount - 1][2]).toBeNull();
      done();
    }, 10);
  }); // end 'should not load a form if missing preferred units' test

  test('should fail to load a form due to user error', done => {
    const initSpy: jest.SpyInstance = jest.spyOn(prefPage, 'initForm');
    const listenSpy: jest.SpyInstance = jest.spyOn(prefPage, 'listenForChanges');
    const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

    userService.getUser = jest
      .fn()
      .mockReturnValue(new ErrorObservable('user error'));

    fixture.detectChanges();

    setTimeout(() => {
      expect(initSpy).not.toHaveBeenCalled();
      expect(listenSpy).not.toHaveBeenCalled();
      expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0])
        .toMatch('Error loading user: user error');
      done();
    }, 10);
  }); // end 'should fail to load a form due to user error' test

  test('should format the form data on submit', () => {
    preferenceService.preferredUnitSystem = 'metric',
    preferenceService.units = clone(defaultMetric);

    preferenceService.setUnits = jest
      .fn();
    userService.updateUserProfile = jest
      .fn()
      .mockReturnValue(of({}));

    const updateSpy: jest.SpyInstance = jest
      .spyOn(preferenceService, 'setUnits');

    fixture.detectChanges();

    prefPage.preferencesForm.controls.weightLarge.setValue(true);
    prefPage.preferencesForm.controls.volumeLarge.setValue(true);

    prefPage.onSubmit();

    expect(updateSpy).toHaveBeenCalledWith(
      'metric',
      {
        system: 'metric',
        weightSmall: UNITS.WEIGHT_METRIC_SMALL,
        weightLarge: UNITS.WEIGHT_ENGLISH_LARGE,
        volumeSmall: UNITS.VOLUME_METRIC_SMALL,
        volumeLarge: UNITS.VOLUME_ENGLISH_LARGE,
        temperature: UNITS.TEMPERATURE_METRIC,
        density: UNITS.SPECIFIC_GRAVITY
      }
    );

    prefPage.preferencesForm.controls.weightSmall.setValue(true);
    prefPage.preferencesForm.controls.volumeSmall.setValue(true);
    prefPage.preferencesForm.controls.temperature.setValue(true);
    prefPage.preferencesForm.controls.density.setValue('plato');

    prefPage.onSubmit();

    expect(updateSpy).toHaveBeenCalledWith(
      'metric',
      {
        system: 'metric',
        weightSmall: UNITS.WEIGHT_ENGLISH_SMALL,
        weightLarge: UNITS.WEIGHT_ENGLISH_LARGE,
        volumeSmall: UNITS.VOLUME_ENGLISH_SMALL,
        volumeLarge: UNITS.VOLUME_ENGLISH_LARGE,
        temperature: UNITS.TEMPERATURE_ENGLISH,
        density: UNITS.PLATO
      }
    );
  }); // end 'should format the form data on submit' test

  test('should get error on submit', done => {
    preferenceService.preferredUnitSystem = 'metric',
    preferenceService.units = clone(defaultMetric);
    preferenceService.units.density = 'brix';

    preferenceService.setUnits = jest
      .fn();
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
    preferenceService.units = clone(defaultEnglish);

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
