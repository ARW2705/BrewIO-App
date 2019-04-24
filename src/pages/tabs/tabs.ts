import { Component } from '@angular/core';
import { Events } from 'ionic-angular';

import { RecipePage } from '../recipe/recipe';
import { UserPage } from '../user/user';
import { HomePage } from '../home/home';

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {

  homeRoot = HomePage;
  recipeRoot = RecipePage;
  userRoot = UserPage;

  constructor(public events: Events) { }

  tabNavigation(event) {
    this.events.publish('tab-change', {dest: event.tabTitle.toLowerCase()});
  }

}
