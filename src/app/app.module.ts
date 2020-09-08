/* Package Modules */
import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { IonicStorageModule } from '@ionic/storage';
import { CommonModule } from '@angular/common';
import { Network } from '@ionic-native/network';
import { BackgroundMode } from '@ionic-native/background-mode';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

/* My Modules */
import { ExtrasPageModule } from '../pages/extras/extras.module';
import { HomePageModule } from '../pages/home/home.module';
import { MyApp } from './app.component';
import { MyFormsModule } from '../pages/forms/forms.module';
import { PipesModule } from '../pipes/pipes.module';
import { ProcessPageModule } from '../pages/process/process.module';
import { RecipeDetailPageModule } from '../pages/recipe-detail/recipe-detail.module';
import { RecipePageModule } from '../pages/recipe/recipe.module';
import { TabsPageModule } from '../pages/tabs/tabs.module';
import { UserPageModule } from '../pages/user/user.module';

/* Providers */
import { ActionSheetProvider } from '../providers/action-sheet/action-sheet';
import { AuthorizedInterceptor, UnauthorizedInterceptor } from '../providers/interceptor/interceptor';
import { CalculationsProvider } from '../providers/calculations/calculations';
import { ClientIdProvider } from '../providers/client-id/client-id';
import { ConnectionProvider } from '../providers/connection/connection';
import { FormValidatorProvider } from '../providers/form-validator/form-validator';
import { InventoryProvider } from '../providers/inventory/inventory';
import { LibraryProvider } from '../providers/library/library';
import { ModalProvider } from '../providers/modal/modal';
import { PreferencesProvider } from '../providers/preferences/preferences';
import { ProcessHttpErrorProvider } from '../providers/process-http-error/process-http-error';
import { ProcessProvider } from '../providers/process/process';
import { RecipeProvider } from '../providers/recipe/recipe';
import { StorageProvider } from '../providers/storage/storage';
import { SyncProvider } from '../providers/sync/sync';
import { TimerProvider } from '../providers/timer/timer';
import { ToastProvider } from '../providers/toast/toast';
import { UserProvider } from '../providers/user/user';


@NgModule({
  declarations: [ MyApp ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    ExtrasPageModule,
    HomePageModule,
    HttpClientModule,
    IonicModule.forRoot(MyApp, {
      scrollAssist: false,
      scrollPadding: false
    }),
    IonicStorageModule.forRoot(),
    MyFormsModule,
    PipesModule,
    ProcessPageModule,
    RecipeDetailPageModule,
    RecipePageModule,
    TabsPageModule,
    UserPageModule
  ],
  bootstrap: [ IonicApp ],
  providers: [
    ActionSheetProvider,
    BackgroundMode,
    CalculationsProvider,
    ClientIdProvider,
    ConnectionProvider,
    FormValidatorProvider,
    InventoryProvider,
    LibraryProvider,
    Network,
    ModalProvider,
    PreferencesProvider,
    ProcessHttpErrorProvider,
    ProcessProvider,
    RecipeProvider,
    SplashScreen,
    StatusBar,
    StorageProvider,
    SyncProvider,
    TimerProvider,
    ToastProvider,
    UserProvider,
    {
      provide: ErrorHandler,
      useClass: IonicErrorHandler
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthorizedInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: UnauthorizedInterceptor,
      multi: true
    }
  ]
})
export class AppModule {}
