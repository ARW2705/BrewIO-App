/* Module imports */
import { TestBed, getTestBed, async } from '@angular/core/testing';

/* Test configuration imports */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Provider imports */
import { ClientIdProvider } from './client-id';


describe('Client ID Provider', () => {
  let injector: TestBed;
  let clientIdService: ClientIdProvider;
  configureTestBed();

  beforeAll(async(() => {
    TestBed.configureTestingModule({
      imports: [ ],
      providers: [
        ClientIdProvider
      ]
    });
  }));

  beforeAll(() => {
    injector = getTestBed();
    clientIdService = injector.get(ClientIdProvider);
  });

  test('should initialize with unix timestamp', () => {
    expect(clientIdService.cid % (10 * 1000 * 1000 * 1000 * 1000)).toBeGreaterThan(0);
  }); // end 'should initialize with unix timestamp' test

  test('should get different ids', () => {
    const id1 = clientIdService.getNewId();
    const id2 = clientIdService.getNewId();
    const id3 = clientIdService.getNewId();

    expect(id1).toMatch(RegExp(/^[\d]{13,23}$/g));
    expect(id2).toMatch(RegExp(/^[\d]{13,23}$/g));
    expect(id3).toMatch(RegExp(/^[\d]{13,23}$/g));

    expect(id1).not.toMatch(id2);
    expect(id1).not.toMatch(id3);
    expect(id2).not.toMatch(id3);
  }); // end 'should get different ids' test
});
