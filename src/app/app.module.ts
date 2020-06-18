import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { IonicStorageModule } from '@ionic/storage';
import { CommonModule } from '@angular/common';
import { Network } from '@ionic-native/network/ngx';
import { BackgroundMode } from '@ionic-native/background-mode';
import { ComponentsModule } from '../components/components.module';
import { PipesModule } from '../pipes/pipes.module';
import { UserPageModule } from '../pages/user/user.module';
import { ProcessPageModule } from '../pages/process/process.module';

import { HomePage } from '../pages/home/home';
import { TabsPage } from '../pages/tabs/tabs';
import { RecipePage } from '../pages/recipe/recipe';
import { RecipeDetailPage } from '../pages/recipe-detail/recipe-detail';
import { RecipeFormPage } from '../pages/forms/recipe-form/recipe-form';
import { GeneralFormPage } from '../pages/forms/general-form/general-form';
import { ProcessFormPage } from '../pages/forms/process-form/process-form';
import { IngredientFormPage } from '../pages/forms/ingredient-form/ingredient-form';
import { LoginPage } from '../pages/forms/login/login';
import { SignupPage } from '../pages/forms/signup/signup';
import { NoteFormPage } from '../pages/forms/note-form/note-form';
import { InventoryPage } from '../pages/inventory/inventory';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { UserProvider } from '../providers/user/user';
import { RecipeProvider } from '../providers/recipe/recipe';
import { AuthorizedInterceptor, UnauthorizedInterceptor } from '../providers/interceptor/interceptor';
import { ProcessHttpErrorProvider } from '../providers/process-http-error/process-http-error';
import { LibraryProvider } from '../providers/library/library';
import { CalculationsProvider } from '../providers/calculations/calculations';
import { ProcessProvider } from '../providers/process/process';
import { ModalProvider } from '../providers/modal/modal';
import { FormValidatorProvider } from '../providers/form-validator/form-validator';
import { ToastProvider } from '../providers/toast/toast';
import { ActionSheetProvider } from '../providers/action-sheet/action-sheet';
import { InventoryProvider } from '../providers/inventory/inventory';
import { StorageProvider } from '../providers/storage/storage';
import { ConnectionProvider } from '../providers/connection/connection';
import { PreferencesProvider } from '../providers/preferences/preferences';
import { SyncProvider } from '../providers/sync/sync';
import { ClientIdProvider } from '../providers/client-id/client-id';
import { TimerProvider } from '../providers/timer/timer';

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    TabsPage,
    RecipePage,
    RecipeDetailPage,
    RecipeFormPage,
    GeneralFormPage,
    IngredientFormPage,
    LoginPage,
    ProcessFormPage,
    SignupPage,
    NoteFormPage,
    InventoryPage
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    IonicModule.forRoot(MyApp, {
      scrollAssist: false,
      scrollPadding: false
    }),
    HttpClientModule,
    IonicStorageModule.forRoot(),
    ComponentsModule,
    CommonModule,
    PipesModule,
    UserPageModule,
    ProcessPageModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    TabsPage,
    RecipePage,
    RecipeDetailPage,
    RecipeFormPage,
    GeneralFormPage,
    IngredientFormPage,
    LoginPage,
    ProcessFormPage,
    SignupPage,
    NoteFormPage,
    InventoryPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    Network,
    BackgroundMode,
    {
      provide: ErrorHandler,
      useClass: IonicErrorHandler
    },
    UserProvider,
    RecipeProvider,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthorizedInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: UnauthorizedInterceptor,
      multi: true
    },
    ProcessHttpErrorProvider,
    LibraryProvider,
    CalculationsProvider,
    ProcessProvider,
    ModalProvider,
    FormValidatorProvider,
    ToastProvider,
    ActionSheetProvider,
    InventoryProvider,
    StorageProvider,
    ConnectionProvider,
    PreferencesProvider,
    SyncProvider,
    ClientIdProvider,
    TimerProvider
  ]
})
export class AppModule {}
