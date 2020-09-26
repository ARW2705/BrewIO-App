/* Module imports */
import { Component } from '@angular/core';
import { Events, NavController, NavParams } from 'ionic-angular';

/* Interface imports */
import { PageChoice } from '../../shared/interfaces/page-choice';

/* Page imports */
import { AboutComponent } from './extras-components/about/about';
import { ActiveBatchesWrapperPage } from './extras-components/active-batches-wrapper/active-batches-wrapper';
import { InventoryWrapperPage } from './extras-components/inventory-wrapper/inventory-wrapper';
import { PreferencesComponent } from './extras-components/preferences/preferences';
import { UserPage } from '../user/user';

// For testing purposes only
// import { ConnectionProvider } from '../../providers/connection/connection';

@Component({
  selector: 'page-extras',
  templateUrl: 'extras.html',
})
export class ExtrasPage {
  extras: PageChoice[] = [
    { component: ActiveBatchesWrapperPage,
      title: 'Active Batches',
      header: 'Active Batches',
      icon: 'flask'
    },
    { component: InventoryWrapperPage,
      title: 'Inventory',
      header: 'Inventory',
      icon: 'clipboard'
    },
    { component: PreferencesComponent,
      title: 'Preferences',
      header: 'Preferences',
      icon: 'construct'
    },
    { component: UserPage,
      title: 'User',
      header: 'User',
      icon: 'settings'
    },
    { component: AboutComponent,
      title: 'About',
      header: 'About',
      icon: 'bulb'
    }
  ];

  constructor(
    public events: Events,
    public navCtrl: NavController,
    public navParams: NavParams,
    // public connection: ConnectionProvider
  ) { }

  // For testing purposes only
  // toggleConnection(): void {
  //   this.connection.toggleConnection();
  //   console.log(this.connection.isConnected());
  // }

  /**
   * Navigate to page at given index
   *
   * @params: index - index of extras to navigate to
   *
   * @return: none
  **/
  navTo(index: number): void {
    this.navCtrl.push(this.extras[index].component);
    this.updateHeader(index);
  }

  /**
   * Publish nav event to header
   *
   * @params: none
   * @return: none
  **/
  updateHeader(index: number): void {
    this.events.publish('update-nav-header', {
      caller: 'extras tab',
      dest: this.extras[index].title.toLowerCase(),
      destType: 'page',
      destTitle: this.extras[index].header,
      origin: this.navCtrl.getActive().name
    });
  }

}
