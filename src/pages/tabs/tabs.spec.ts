/* Module imports */
import { ComponentFixture, TestBed, getTestBed, async } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { IonicModule, Events } from 'ionic-angular';

/* Test configuration imports */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Mock imports */
import { EventsMock } from '../../../test-config/mocks-ionic';

/* Page imports */
import { TabsPage } from './tabs';


describe('Tabs page', () => {
  let tabsPage: TabsPage;
  let fixture: ComponentFixture<TabsPage>;
  let injector: TestBed;
  let eventService: Events;
  configureTestBed();

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      declarations: [
        TabsPage
      ],
      imports: [
        IonicModule.forRoot(TabsPage)
      ],
      providers: [
        { provide: Events, useClass: EventsMock }
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
    fixture = TestBed.createComponent(TabsPage);
    tabsPage = fixture.componentInstance;

    injector = getTestBed();
    eventService = injector.get(Events);
  });

  describe('Component creation', () => {
    test('should create component', () => {
      fixture.detectChanges();

      expect(tabsPage).toBeDefined();
    }); // end 'should create component' test

    test('should get the tab header', () => {
      fixture.detectChanges();

      expect(tabsPage.getCurrentTitle()).toMatch('BrewIO');

      tabsPage.currentIndex = 1;

      expect(tabsPage.getCurrentTitle()).toMatch('Recipes');
    }); // end 'should get the tab header' test

  }); // end 'Component creation' section

  describe('Tab navigation', () => {

    test('should change the tab index', () => {
      fixture.detectChanges();

      tabsPage.navTabs.select = jest
        .fn();
      tabsPage.slides.slideTo = jest
        .fn();

      tabsPage.setIndex(1);

      setTimeout(() => {
        expect(tabsPage.currentIndex).toBe(1);
      }, 10);
    }); // end 'should change the tab index' test

    test('shoul set the tab index', () => {
      fixture.detectChanges();

      tabsPage.navTabs.select = jest.fn();
      tabsPage.slides.slideTo = jest.fn();

      tabsPage.setIndex(1);

      expect(tabsPage.currentIndex).toBe(1);
    }); // end 'shoul set the tab index' test

    test('should change tab navigation index', done => {
      fixture.detectChanges();

      const tabSpy: jest.SpyInstance = jest.spyOn(tabsPage, 'setIndex');
      const updateSpy: jest.SpyInstance = jest.spyOn(tabsPage, 'updateHeader');

      tabsPage.navTabs.select = jest.fn();
      tabsPage.slides.slideTo = jest.fn();

      tabsPage.onTabNavigation({index: 1});

      setTimeout(() => {
        expect(tabSpy).toHaveBeenCalledWith(1);
        expect(updateSpy).toHaveBeenCalled();
        expect(tabsPage.currentIndex).toBe(1);
        done();
      }, 10);
    }); // end 'should change tab navigation index' test

  }); // end 'Tab navigation' section

  describe('Event handling', () => {

    test('should update header after event', () => {
      fixture.detectChanges();

      const updateHeaderSpy: jest.SpyInstance = jest
        .spyOn(tabsPage, 'updateHeader');

      tabsPage.popHeaderNavEventHandler({origin: 'HomePage'});

      expect(updateHeaderSpy).toHaveBeenCalled();
    }); // end 'should update header after event' test

    test('should not update header after event', () => {
      fixture.detectChanges();

      const updateHeaderSpy: jest.SpyInstance = jest
        .spyOn(tabsPage, 'updateHeader');

      tabsPage.popHeaderNavEventHandler({origin: 'SomeOtherPage'});

      expect(updateHeaderSpy).not.toHaveBeenCalled();
    }); // end 'should not update header after event' test

    test('should emit a header update event', () => {
      fixture.detectChanges();

      const eventSpy: jest.SpyInstance = jest.spyOn(eventService, 'publish');

      tabsPage.updateHeader();

      expect(eventSpy).toHaveBeenCalledWith(
        'update-nav-header',
        {
          caller: 'tabs component',
          dest: tabsPage.tabs[tabsPage.currentIndex].title.toLowerCase(),
          destType: 'tab',
          destTitle: tabsPage.tabs[tabsPage.currentIndex].header
        }
      );
    }); // end 'should emit a header update event' test

  }); // end 'Event handling' section

});
