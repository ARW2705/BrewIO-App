import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { NativeStorage } from '@ionic-native/native-storage/ngx';

import { TabsPage } from '../pages/tabs/tabs';

import { storageName } from '../shared/constants/storage-name';

import { NativeStorageProvider } from '../providers/native-storage/native-storage';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage:any = TabsPage;

  constructor(platform: Platform,
    statusBar: StatusBar,
    splashScreen: SplashScreen,
    private nativeStorage: NativeStorage,
    private storageUtil: NativeStorageProvider) {
    platform.ready().then(() => {
      statusBar.styleDefault();
      this.storageUtil.checkStorage()
        .subscribe(hasStorage => {
          if (!hasStorage) {
            this.nativeStorage.setItem(storageName, JSON.stringify([]))
              .then(
                () => console.log('Storage initialized'),
                error => this.storageUtil.onNativeStorageError('Initialize storage', error)
              )
              .then(() => splashScreen.hide());
          } else {
            splashScreen.hide();
          }
        })
    });
  }
}
