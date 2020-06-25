/* Module imports */
import { TestBed, getTestBed, async } from '@angular/core/testing';
import { Platform, Events } from 'ionic-angular';
import { Network } from '@ionic-native/network/ngx';

/* Test configuration import */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Mock imports */
import { EventsMock, NetworkMockDev, NetworkMockCordova, PlatformMockDev, PlatformMockCordova } from '../../../test-config/mocks-ionic';

/* Provider imports */
import { ConnectionProvider } from './connection';


describe('Connection Provider', () => {

  describe('Connection in dev mode', () => {
    let injector: TestBed;
    let connectionService: ConnectionProvider;
    configureTestBed();

    beforeAll(async(() => {
      TestBed.configureTestingModule({
        declarations: [],
        imports: [],
        providers: [
          ConnectionProvider,
          { provide: Events, useClass: EventsMock },
          { provide: Platform, useClass: PlatformMockDev },
          { provide: Network, useClass: NetworkMockDev }
        ]
      })
    }));

    beforeEach(() => {
      injector = getTestBed();
      connectionService = injector.get(ConnectionProvider);
    });

    test('should start connection in dev mode', () => {
      expect(connectionService.connection).toBe(true);
    }); // end 'should start conneciton in dev mode' test

    test('should activate offline mode', () => {
      expect(connectionService.connection).toBe(true);
      connectionService.setOfflineMode(true);
      expect(connectionService.connection).toBe(false);
    }); // end 'should activate offline mode' test

    test('should get the connection status', () => {
      expect(connectionService.isConnected()).toBe(true);
    }); // end 'should get the connection status' test

  }); // end 'Connection in dev mode' section

  describe('Connection in device mode', () => {
    let injector: TestBed;
    let connectionService: ConnectionProvider;
    let consoleSpy;
    configureTestBed();

    beforeAll(async(() => {
      TestBed.configureTestingModule({
        declarations: [],
        imports: [],
        providers: [
          ConnectionProvider,
          { provide: Events, useClass: EventsMock },
          { provide: Platform, useClass: PlatformMockCordova },
          { provide: Network, useClass: NetworkMockCordova }
        ]
      });
    }));

    beforeEach(() => {
      injector = getTestBed();
      consoleSpy = jest.spyOn(console, 'log');
      connectionService = injector.get(ConnectionProvider);
    });

    test('should start in cordova', () => {
      expect(consoleSpy.mock.calls[0][0]).toMatch('Begin monitoring');
    }); // end 'should start in cordova' test

    test('should get connection event in cordova', done => {
      setTimeout(() => {
        const callCount = consoleSpy.mock.calls.length;
        expect(consoleSpy.mock.calls[callCount - 1][0]).toMatch('on connect');
        expect(connectionService.connection).toBe(true);
        done();
      }, 20);
    }); // end 'should get connection event in cordova' test

    test('should get disconnect event in cordova', done => {
      setTimeout(() => {
        const callCount = consoleSpy.mock.calls.length;
        expect(consoleSpy.mock.calls[callCount - 1][0]).toMatch('on disconnect');
        expect(connectionService.connection).toBe(false);
        done();
      }, 40);
    }); // end 'should get disconnect event in cordova' test

  }); // end 'Connection in device mode' section

});
