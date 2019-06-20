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
  _userUpdate: any;
  _headerNavPop: any;
  tabs = [
    { component: HomePage,   title: 'Home',    header: 'BrewIO',  icon: 'home'    },
    { component: RecipePage, title: 'Recipes', header: 'Recipes', icon: 'beer'    },
    { component: UserPage,   title: 'User',    header: 'User',    icon: 'contact' }
  ];

  constructor(public events: Events) {
    this._userUpdate = this.userUpdateEventHandler.bind(this);
    this._headerNavPop = this.headerNavPopEventHandler.bind(this);
  }

  getCurrentTitle(): string {
    return this.tabs[this.currentIndex].header;
  }

  ngOnInit() {
    this.slides.lockSwipes(true);
    this.events.subscribe('user-update', this._userUpdate);
    this.events.subscribe('header-nav-pop', this._headerNavPop);
  }

  ngOnDestroy() {
    this.events.unsubscribe('user-update', this._userUpdate);
    this.events.unsubscribe('header-nav-pop', this._headerNavPop);
  }

  headerNavPopEventHandler(data: any): void {
    if (this.tabs.some(tab => tab.component.name === data.origin)) {
      this.updateHeader();
    }
  }

  updateHeader(): void {
    this.events.publish('header-nav-update', {
      dest: this.tabs[this.currentIndex].title.toLowerCase(),
      destType: 'tab',
      destTitle: this.tabs[this.currentIndex].header
    });
  }

  setIndex(index: number): void {
    this.slides.lockSwipes(false);
    this.currentIndex = index;
    this.navTabs.select(index);
    this.slides.slideTo(index);
    this.slides.lockSwipes(true);
  }

  tabNavigation(event): void {
    this.setIndex(event.index);
    this.updateHeader();
  }

  userUpdateEventHandler(data: any): void {
    if (!data) {
      this.setIndex(0);
    }
  }

}
