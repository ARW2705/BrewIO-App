import { async, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { IonicModule, Platform } from 'ionic-angular';
import { IonicStorageModule } from '@ionic/storage';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { StorageMock } from '../../test-config/mocks-ionic';

import { LibraryProvider } from '../providers/library/library';
import { UserProvider } from '../providers/user/user';
import { RecipeProvider } from '../providers/recipe/recipe';
import { AuthenticationProvider } from '../providers/authentication/authentication';
import { ProcessHttpErrorProvider } from '../providers/process-http-error/process-http-error';

import { MyApp } from './app.component';

import {
  PlatformMock,
  StatusBarMock,
  SplashScreenMock
} from '../../test-config/mocks-ionic';

describe('MyApp Component', () => {
  let fixture;
  let component;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MyApp ],
      imports: [
        IonicModule.forRoot(MyApp),
        IonicStorageModule.forRoot(),
        HttpClientTestingModule
      ],
      providers: [
        LibraryProvider,
        UserProvider,
        RecipeProvider,
        AuthenticationProvider,
        ProcessHttpErrorProvider,
        { provide: StatusBar, useClass: StatusBarMock },
        { provide: SplashScreen, useClass: SplashScreenMock },
        { provide: Platform, useClass: PlatformMock },
        { provide: Storage, useClass: StorageMock }
      ]
    })
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MyApp);
    component = fixture.componentInstance;
  });

  test('should create MyApp component', () => {
    expect(component instanceof MyApp).toBe(true);
  });

});
