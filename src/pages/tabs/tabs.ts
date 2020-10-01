/* Module imports */
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Events, Slides, Tabs } from 'ionic-angular';

/* Interface imports */
import { PageChoice } from '../../shared/interfaces/page-choice';

/* Page imports */
import { ExtrasPage } from '../extras/extras';
import { HomePage } from '../home/home';
import { RecipePage } from '../recipe/recipe';


@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage implements OnInit, OnDestroy {
  @ViewChild('navTabs') navTabs: Tabs;
  @ViewChild(Slides) slides: Slides;
  currentIndex: number = 0;
  tabs: PageChoice[] = [
    {
      component: HomePage,
      title: 'Home',
      header: 'BrewIO',
      icon: 'home'
    },
    {
      component: RecipePage,
      title: 'Recipes',
      header: 'Recipes',
      icon: 'beer'
    },
    {
      component: ExtrasPage,
      title: 'Extras',
      header: 'Extras',
      icon: 'more'
    }
  ];
  title: string = '';
  _popHeaderNav: any;


  constructor(public events: Events) {
    this._popHeaderNav = this.popHeaderNavEventHandler.bind(this);
  }

  /***** Lifecycle hooks *****/

  ngOnInit() {
    this.slides.lockSwipes(true);
    this.events.subscribe('pop-header-nav', this._popHeaderNav);
    this.title = this.tabs[this.currentIndex].header;
  }

  ngOnDestroy() {
    this.events.unsubscribe('pop-header-nav', this._popHeaderNav);
  }

  /***** End lifecycle hooks *****/

  /**
   * Set tab navigation
   *
   * @params: event - ionChange event
   *
   * @return: none
  **/
  onTabNavigation(event: object): void {
    this.setIndex(event['index']);
    this.updateHeader();
    this.events.publish('reset-stack');
  }

  /**
   * 'pop-header-nav' event handler
   *
   * @params: data - if origin was a tab, update header with new tab
   *
   * @return: none
  **/
  popHeaderNavEventHandler(data: any): void {
    if (this.tabs.some((tab: PageChoice) => tab.component.name === data.origin)) {
      this.navTabs.select(this.currentIndex);
      this.title = this.tabs[this.currentIndex].header;
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
    this.title = this.tabs[this.currentIndex].header;
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
