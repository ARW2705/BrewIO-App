/* Module imports */
import { ComponentFixture, TestBed, getTestBed, async } from '@angular/core/testing';
import { IonicModule, Events, NavController, NavParams } from 'ionic-angular';
import { NO_ERRORS_SCHEMA } from '@angular/core';

/* Test configuration imports */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Mock imports */
import { EventsMock, NavMock, NavParamsMock } from '../../../test-config/mocks-ionic';

/* Page imports */
import { ExtrasPage } from './extras';
import { InventoryWrapperPage } from './extras-components/inventory-wrapper/inventory-wrapper';


describe('Extras Component', () => {
  let fixture: ComponentFixture<ExtrasPage>;
  let extrasPage: ExtrasPage;
  let injector: TestBed;
  let eventService: Events;
  let navCtrl: NavController;
  configureTestBed();

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      declarations: [
        ExtrasPage
      ],
      imports: [
        IonicModule.forRoot(ExtrasPage)
      ],
      providers: [
        { provide: Events, useClass: EventsMock },
        { provide: NavController, useClass: NavMock },
        { provide: NavParams, useClass: NavParamsMock }
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
    fixture = TestBed.createComponent(ExtrasPage);
    extrasPage = fixture.componentInstance;

    eventService = injector.get(Events);
    navCtrl = injector.get(NavController);
  });

  test('should create the component', () => {
    fixture.detectChanges();

    expect(extrasPage).toBeDefined();
  }); // end 'should create the component' test

  test('should navigate to a component', () => {
    fixture.detectChanges();

    navCtrl.push = jest
      .fn();
    extrasPage.updateHeader = jest
      .fn();

    const navSpy: jest.SpyInstance = jest.spyOn(navCtrl, 'push');

    extrasPage.navTo(1);

    expect(navSpy).toHaveBeenCalledWith(InventoryWrapperPage);
  }); // end 'should navigate to a component' test

  test('should emit event to update header', () => {
    fixture.detectChanges();

    eventService.publish = jest
      .fn();

    const eventSpy: jest.SpyInstance = jest.spyOn(eventService, 'publish');

    extrasPage.updateHeader(2);

    expect(eventSpy).toHaveBeenCalledWith(
      'update-nav-header',
      {
        caller: 'extras tab',
        dest: 'preferences',
        destType: 'page',
        destTitle: 'Preferences',
        origin: 'mock-active-name'
      }
    );
  }); // end 'should emit event to update header' test

});
