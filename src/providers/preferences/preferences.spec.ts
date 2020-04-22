/* Module imports */
import { TestBed, getTestBed, async } from '@angular/core/testing';

/* Test configuration imports */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Provider imports */
import { PreferencesProvider } from './preferences';


describe('Preferences Provider', () => {
  let injector: TestBed;
  let preferenceService: PreferencesProvider;
  configureTestBed();

  beforeAll(async(() => {
    TestBed.configureTestingModule({
      declarations: [],
      imports: [],
      providers: [
        PreferencesProvider
      ]
    });

    injector = getTestBed();
    preferenceService = injector.get(PreferencesProvider);
  }));

  test('should set the units system', () => {
    expect(preferenceService.units).toMatch('e');
    preferenceService.setUnits('m');
    expect(preferenceService.units).toMatch('m');
  });

  test('should throw error with unknown system type', () => {
    expect(() => {
      preferenceService.setUnits('error type');
    })
    .toThrowError('Invalid unit type: error type');
  });

});
