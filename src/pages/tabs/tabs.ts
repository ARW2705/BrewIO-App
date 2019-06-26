import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Events, Tabs, Slides } from 'ionic-angular';

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
  _updateUser: any;
  _popHeaderNav: any;
  tabs = [
    { component: HomePage,   title: 'Home',    header: 'BrewIO',  icon: 'home'    },
    { component: RecipePage, title: 'Recipes', header: 'Recipes', icon: 'beer'    },
    { component: UserPage,   title: 'User',    header: 'User',    icon: 'contact' }
  ];

  constructor(public events: Events) {
    this._updateUser = this.updateUserEventHandler.bind(this);
    this._popHeaderNav = this.popHeaderNavEventHandler.bind(this);
  }

  /**
   * Get tab title for header
   *
   * @return: tab title at current tab index
  **/
  getCurrentTitle(): string {
    return this.tabs[this.currentIndex].header;
  }

  /**
   * 'pop-header-nav' event handler
   *
   * @params: data - if origin was a tab, update header with new tab
  **/
  popHeaderNavEventHandler(data: any): void {
    if (this.tabs.some(tab => tab.component.name === data.origin)) {
      this.updateHeader();
    }
  }

  ngOnDestroy() {
    this.events.unsubscribe('update-user', this._updateUser);
    this.events.unsubscribe('pop-header-nav', this._popHeaderNav);
  }

  ngOnInit() {
    this.slides.lockSwipes(true);
    this.events.subscribe('update-user', this._updateUser);
    this.events.subscribe('pop-header-nav', this._popHeaderNav);
  }

  /**
   * Set tab index to slide to
   *
   * @params: index - tab index destination
  **/
  setIndex(index: number): void {
    this.slides.lockSwipes(false);
    this.currentIndex = index;
    this.navTabs.select(index);
    this.slides.slideTo(index);
    this.slides.lockSwipes(true);
  }

  /**
   * Set tab navigation
   *
   * @params: event - ionChange event
  **/
  tabNavigation(event: any): void {
    this.setIndex(event.index);
    this.updateHeader();
  }

  // Publish nav event to header
  updateHeader(): void {
    this.events.publish('update-nav-header', {
      dest: this.tabs[this.currentIndex].title.toLowerCase(),
      destType: 'tab',
      destTitle: this.tabs[this.currentIndex].header
    });
  }

  /**
   * 'update-user' event handler
   *
   * @params: data - set tab to home
  **/
  updateUserEventHandler(data: any): void {
    if (!data) {
      this.setIndex(0);
    }
  }

}
