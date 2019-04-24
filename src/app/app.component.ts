import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { TabsPage } from '../pages/tabs/tabs';

import { LibraryProvider } from '../providers/library/library';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage:any = TabsPage;

  constructor(platform: Platform,
    statusBar: StatusBar,
    splashScreen: SplashScreen,
    private libraryService: LibraryProvider) {
    platform.ready().then(() => {
      this.libraryService.fetchAllLibraries();
      statusBar.styleDefault();
      splashScreen.hide();
      // TODO init storage once storage system has been implemented
    });
  }
}
