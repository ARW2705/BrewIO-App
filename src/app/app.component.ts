import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { TabsPage } from '../pages/tabs/tabs';

import { LibraryProvider } from '../providers/library/library';
import { UserProvider } from '../providers/user/user';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage:any = TabsPage;

  constructor(public platform: Platform,
    public statusBar: StatusBar,
    public splashScreen: SplashScreen,
    public libraryService: LibraryProvider,
    public userService: UserProvider) {
      this.libraryService.fetchAllLibraries();
      this.initializeApp();
      this.userService.loadUserFromStorage();
  }

  initializeApp(): void {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });
  }
}
