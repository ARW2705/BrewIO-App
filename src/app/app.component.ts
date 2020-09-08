/* Module imports */
import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

/* Page imports */
import { TabsPage } from '../pages/tabs/tabs';

/* Provider imports */
import { LibraryProvider } from '../providers/library/library';
import { UserProvider } from '../providers/user/user';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage: any = TabsPage;

  constructor(
    public platform: Platform,
    public statusBar: StatusBar,
    public splashScreen: SplashScreen,
    public libraryService: LibraryProvider,
    public userService: UserProvider
  ) {
    this.initializeApp();
    this.libraryService.fetchAllLibraries();
    this.userService.loadUserFromStorage();
  }

  /**
   * Listen for platform ready event
   *
   * @params: none
   * @return: none
  **/
  initializeApp(): void {
    this.platform.ready()
      .then(() => {
        this.statusBar.styleDefault();
        this.splashScreen.hide();
      });
  }
}
