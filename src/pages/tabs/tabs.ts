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
  private currentIndex: number = 0;
  private _userUpdate: any;
  private tabs = [
    { component: HomePage,   title: 'Home',    header: 'BrewIO',  icon: 'home'    },
    { component: RecipePage, title: 'Recipes', header: 'Recipes', icon: 'beer'    },
    { component: UserPage,   title: 'User',    header: 'User',    icon: 'contact' }
  ];

  constructor(public events: Events) {
      this._userUpdate = this.userUpdateEventHandler.bind(this);
  }

  private getCurrentTitle(): string {
    return this.tabs[this.currentIndex].header;
  }

  ngOnInit() {
    this.events.subscribe('user-update', this._userUpdate);
  }

  ngOnDestroy() {
    this.events.unsubscribe('user-update', this._userUpdate);
  }

  private setIndex(index: number): void {
    this.currentIndex = index;
    this.navTabs.select(index);
    this.slides.slideTo(index);
  }

  private tabNavigation(event): void {
    this.setIndex(event.index);
    this.events.publish('tab-change', {dest: event.tabTitle.toLowerCase()});
  }

  private userUpdateEventHandler(data: any): void {
    if (!data) {
      this.setIndex(0);
    }
  }

}
