import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { IonicStorageModule } from '@ionic/storage';
import { CommonModule } from '@angular/common';
import { Network } from '@ionic-native/network/ngx';
import { ComponentsModule } from '../components/components.module';
import { PipesModule } from '../pipes/pipes.module';

import { HomePage } from '../pages/home/home';
import { TabsPage } from '../pages/tabs/tabs';
import { RecipePage } from '../pages/recipe/recipe';
import { RecipeMasterDetailPage } from '../pages/recipe-master-detail/recipe-master-detail';
import { RecipeFormPage } from '../pages/forms/recipe-form/recipe-form';
import { GeneralFormPage } from '../pages/forms/general-form/general-form';
import { ProcessFormPage } from '../pages/forms/process-form/process-form';
import { IngredientFormPage } from '../pages/forms/ingredient-form/ingredient-form';
import { LoginPage } from '../pages/forms/login/login';
import { ProcessPage } from '../pages/process/process';
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
import { SyncProvider } from '../providers/sync/sync';
import { ConnectionProvider } from '../providers/connection/connection';

import { UserPageModule } from '../pages/user/user.module';
import { PreferencesProvider } from '../providers/preferences/preferences';

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    TabsPage,
    RecipePage,
    RecipeMasterDetailPage,
    RecipeFormPage,
    GeneralFormPage,
    IngredientFormPage,
    LoginPage,
    ProcessFormPage,
    ProcessPage,
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
    UserPageModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    TabsPage,
    RecipePage,
    RecipeMasterDetailPage,
    RecipeFormPage,
    GeneralFormPage,
    IngredientFormPage,
    LoginPage,
    ProcessFormPage,
    ProcessPage,
    SignupPage,
    NoteFormPage,
    InventoryPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    Network,
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
    SyncProvider,
    ConnectionProvider,
    PreferencesProvider
  ]
})
export class AppModule {}
