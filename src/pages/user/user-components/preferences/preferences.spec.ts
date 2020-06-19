/* Module imports */
import { ComponentFixture, TestBed, getTestBed, async } from '@angular/core/testing';
import { IonicModule } from 'ionic-angular';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';

/* Test Configuration imports */
import { configureTestBed } from '../../../../../test-config/configureTestBed';

/* Mock imports */
import { mockUser } from '../../../../../test-config/mockmodels/mockUser';

/* Interface imports */
import { User } from '../../../../shared/interfaces/user';

/* Component imports */
import { PreferencesComponent } from './preferences';

/* Provider imports */
import { UserProvider } from '../../../../providers/user/user';
import { PreferencesProvider } from '../../../../providers/preferences/preferences';


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
        { provide: UserProvider, useValue: {} },
        { provide: PreferencesProvider, useValue: {} }
      ],
      schemas: [
        NO_ERRORS_SCHEMA
      ]
    });
    await TestBed.compileComponents();
  })()
  .then(done)
  .catch(done.fail));

  beforeEach(async(() => {
    injector = getTestBed();
    userService = injector.get(UserProvider);
    preferenceService = injector.get(PreferencesProvider);

    userService.getUser = jest
      .fn()
      .mockReturnValue(new BehaviorSubject<User>(mockUser()));

    preferenceService.setUnits = jest
      .fn();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PreferencesComponent);
    prefPage = fixture.componentInstance;
  });

  test('should create the component', () => {
    const initSpy = jest.spyOn(prefPage, 'initForm');
    const listenSpy = jest.spyOn(prefPage, 'listenForChanges');

    fixture.detectChanges();

    expect(prefPage).toBeDefined();

    expect(initSpy).toHaveBeenCalled();
    expect(listenSpy).toHaveBeenCalled();
  }); // end 'should create the component' test

  test('should fail to load a user', () => {
    userService.getUser = jest
      .fn()
      .mockReturnValue(new ErrorObservable({}));

    const consoleSpy = jest.spyOn(console, 'log');

    fixture.detectChanges();

    expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0]).toMatch('Error loading user');
  }); // end 'should fail to load a user' test

  test('should initialize the form', () => {
    fixture.detectChanges();

    expect(prefPage.preferencesForm).not.toBeNull();
    expect(prefPage.preferencesForm.value.preferredUnits).toBe(true);
  }); // end 'should initialize the form' test

  test('should detect form changes', () => {
    const prefSpy = jest.spyOn(preferenceService, 'setUnits');

    fixture.detectChanges();

    const control = prefPage.preferencesForm.controls.preferredUnits;

    control.setValue(false);

    expect(prefSpy).toHaveBeenCalledWith(false);

    control.setValue(true);

    expect(prefSpy).toHaveBeenCalledWith(true);
  }); // end 'should detect form changes' test

});
