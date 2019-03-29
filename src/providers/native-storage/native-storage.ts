import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { NativeStorage } from '@ionic-native/native-storage/ngx';

import { storageName } from '../../shared/constants/storage-name';

@Injectable()
export class NativeStorageProvider {

  constructor(private nativeStorage: NativeStorage) {
    console.log('Hello NativeStorageProvider Provider');
  }

  public onNativeStorageSuccess(origin: string) {
    console.log(`${origin} operation successful`);
  }

  public onNativeStorageError(origin: string, error: any) {
    console.log(`${origin} operation failed: ${error}`);
  }

  public checkStorage(): Observable<any> {
    return Observable.fromPromise(
      this.nativeStorage.getItem(storageName)
        .then(
          items => true,
          error => false
        )
    );
  }

}
