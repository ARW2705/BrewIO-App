/* Module imports */
import { ComponentFixture, TestBed, getTestBed, async } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { IonicModule, NavController, Events } from 'ionic-angular';

/* Mock imports */
import { NavMock } from '../../../test-config/mocks-ionic';

/* Page imports */
import { TabsPage } from './tabs';


describe('Tabs page', () => {

  describe('Component creation', () => {
    let tabsPage: TabsPage;
    let fixture: ComponentFixture<TabsPage>;

    beforeEach(async(() => {
      TestBed.configureTestingModule({
        declarations: [
          TabsPage
        ],
        imports: [
          IonicModule.forRoot(TabsPage)
        ],
        providers: [ ],
        schemas: [
          NO_ERRORS_SCHEMA
        ]
      })
      .compileComponents();
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(TabsPage);
      tabsPage = fixture.componentInstance;
      fixture.detectChanges();
    });

    test('should create component', () => {
      expect(tabsPage).toBeDefined();
    }); // end 'should create component' test

    test('should get the tab header', () => {
      expect(tabsPage.getCurrentTitle()).toMatch('BrewIO');
      tabsPage.currentIndex = 1;
      expect(tabsPage.getCurrentTitle()).toMatch('Recipes');
    }); // end 'should get the tab header' test

  }); // end 'Component creation' section

  describe('Tab navigation', () => {
    let tabsPage: TabsPage;
    let fixture: ComponentFixture<TabsPage>;

    beforeEach(async(() => {
      TestBed.configureTestingModule({
        declarations: [
          TabsPage
        ],
        imports: [
          IonicModule.forRoot(TabsPage)
        ],
        providers: [
          { provide: NavController, useClass: NavMock }
        ],
        schemas: [
          NO_ERRORS_SCHEMA
        ]
      })
      .compileComponents();
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(TabsPage);
      tabsPage = fixture.componentInstance;
      fixture.detectChanges();
    });

    test('should change the tab index', () => {
      const tabSpy = jest.spyOn(tabsPage.navTabs, 'select');
      setTimeout(() => {
        tabsPage.setIndex(1);
        expect(tabSpy).toHaveBeenCalled();
        expect(tabsPage.currentIndex).toBe(1);
      }, 100);
    }); // end 'should change the tab index' test

    test('should change tab navigation index', () => {
      const tabSpy = jest.spyOn(tabsPage, 'setIndex');
      const updateSpy = jest.spyOn(tabsPage, 'updateHeader');
      setTimeout(() => {
        tabsPage.onTabNavigation({index: 1});
        expect(tabSpy).toHaveBeenCalledWith(1);
        expect(updateSpy).toHaveBeenCalled();
        expect(tabsPage.currentIndex).toBe(1);
      }, 100);
    }); // end 'should change tab navigation index' test

  }); // end 'Tab navigation' section

  describe('Event handling', () => {
    let tabsPage: TabsPage;
    let fixture: ComponentFixture<TabsPage>;
    let injector: TestBed;
    let eventService: Events;

    beforeEach(async(() => {
      TestBed.configureTestingModule({
        declarations: [
          TabsPage
        ],
        imports: [
          IonicModule.forRoot(TabsPage)
        ],
        providers: [
          { provide: NavController, useClass: NavMock },
          Events
        ],
        schemas: [
          NO_ERRORS_SCHEMA
        ]
      })
      .compileComponents();
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(TabsPage);
      tabsPage = fixture.componentInstance;
      injector = getTestBed();
      eventService = injector.get(Events);
      fixture.detectChanges();
    });

    test('should update header after event', () => {
      const updateHeaderSpy = jest.spyOn(tabsPage, 'updateHeader');
      tabsPage.popHeaderNavEventHandler({origin: 'HomePage'});
      expect(updateHeaderSpy).toHaveBeenCalled();
    }); // end 'should update header after event' test

    test('should not update header after event', () => {
      const updateHeaderSpy = jest.spyOn(tabsPage, 'updateHeader');
      tabsPage.popHeaderNavEventHandler({origin: 'SomeOtherPage'});
      expect(updateHeaderSpy).not.toHaveBeenCalled();
    }); // end 'should not update header after event' test

    test('should emit a header update event', done => {
      eventService.subscribe('update-nav-header', data => {
        expect(data.dest).toMatch(tabsPage.tabs[tabsPage.currentIndex].title.toLowerCase());
        expect(data.destType).toMatch('tab');
        expect(data.destTitle).toMatch(tabsPage.tabs[tabsPage.currentIndex].header);
        done();
      });
      tabsPage.updateHeader();
    }); // end 'should emit a header update event' test

  }); // end 'Event handling' section

});
