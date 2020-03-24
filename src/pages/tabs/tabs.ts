/* Module imports */
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Events, Tabs, Slides } from 'ionic-angular';

/* Page imports */
import { RecipePage } from '../recipe/recipe';
import { UserPage } from '../user/user';
import { HomePage } from '../home/home';

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage implements OnInit, OnDestroy {
  @ViewChild('navTabs') navTabs: Tabs;
  @ViewChild(Slides) slides: Slides;
  currentIndex: number = 0;
  _popHeaderNav: any;
  tabs = [
    { component: HomePage,   title: 'Home',    header: 'BrewIO',  icon: 'home'    },
    { component: RecipePage, title: 'Recipes', header: 'Recipes', icon: 'beer'    },
    { component: UserPage,   title: 'User',    header: 'User',    icon: 'contact' }
  ];

  constructor(public events: Events) {
    this._popHeaderNav = this.popHeaderNavEventHandler.bind(this);
  }

  /***** Lifecycle hooks *****/

  ngOnDestroy() {
    this.events.unsubscribe('pop-header-nav', this._popHeaderNav);
  }

  ngOnInit() {
    this.slides.lockSwipes(true);
    this.events.subscribe('pop-header-nav', this._popHeaderNav);
  }

  /***** End lifecycle hooks *****/

  /**
   * Get tab title for header
   *
   * @return: tab title at current tab index
  **/
  getCurrentTitle(): string {
    return this.tabs[this.currentIndex].header;
  }

  /**
   * Set tab navigation
   *
   * @params: event - ionChange event
   *
   * @return: none
  **/
  onTabNavigation(event: any): void {
    this.setIndex(event.index);
    this.updateHeader();
  }

  /**
   * 'pop-header-nav' event handler
   *
   * @params: data - if origin was a tab, update header with new tab
   *
   * @return: none
  **/
  popHeaderNavEventHandler(data: any): void {
    if (this.tabs.some(tab => tab.component.name === data.origin)) {
      this.updateHeader();
    }
  }

  /**
   * Set tab index to slide to
   *
   * @params: index - tab index destination
   *
   * @return: none
  **/
  setIndex(index: number): void {
    this.slides.lockSwipes(false);
    this.currentIndex = index;
    this.navTabs.select(index);
    this.slides.slideTo(index);
    this.slides.lockSwipes(true);
  }

  /**
   * Publish nav event to header
   *
   * @params: none
   * @return: none
  **/
  updateHeader(): void {
    this.events.publish('update-nav-header', {
      caller: 'tabs component',
      dest: this.tabs[this.currentIndex].title.toLowerCase(),
      destType: 'tab',
      destTitle: this.tabs[this.currentIndex].header
    });
  }

}
