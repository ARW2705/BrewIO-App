import { Component } from '@angular/core';

import { RecipePage } from '../recipe/recipe';
import { UserPage } from '../user/user';
import { HomePage } from '../home/home';

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {

  tab1Root = HomePage;
  tab2Root = RecipePage;
  tab3Root = UserPage;

  constructor() {

  }
}
