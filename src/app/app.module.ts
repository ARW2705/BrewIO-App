import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { IonicStorageModule } from '@ionic/storage';
import { CommonModule } from '@angular/common';
import { ComponentsModule } from '../components/components.module';

import { AboutPage } from '../pages/about/about';
import { ContactPage } from '../pages/contact/contact';
import { HomePage } from '../pages/home/home';
import { TabsPage } from '../pages/tabs/tabs';
import { RecipePage } from '../pages/recipe/recipe';
import { RecipeDetailPage } from '../pages/recipe-detail/recipe-detail';
import { RecipeMasterDetailPage } from '../pages/recipe-master-detail/recipe-master-detail';
import { UserPage } from '../pages/user/user';
import { RecipeFormPage } from '../pages/forms/recipe-form/recipe-form';
import { GeneralFormPage } from '../pages/forms/general-form/general-form';
import { ProcessFormPage } from '../pages/forms/process-form/process-form';
import { IngredientFormPage } from '../pages/forms/ingredient-form/ingredient-form';
import { LoginPage } from '../pages/forms/login/login';
import { ProcessPage } from '../pages/process/process';
import { SignupPage } from '../pages/forms/signup/signup';
import { NoteFormPage } from '../pages/forms/note-form/note-form';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { UserProvider } from '../providers/user/user';
import { RecipeProvider } from '../providers/recipe/recipe';
import { AuthenticationProvider } from '../providers/authentication/authentication';
import { AuthorizedInterceptor, UnauthorizedInterceptor } from '../providers/interceptor/interceptor';
import { ProcessHttpErrorProvider } from '../providers/process-http-error/process-http-error';
import { LibraryProvider } from '../providers/library/library';
import { CalculationsProvider } from '../providers/calculations/calculations';
import { ProcessProvider } from '../providers/process/process';
import { ModalProvider } from '../providers/modal/modal';
import { FormValidatorProvider } from '../providers/form-validator/form-validator';

@NgModule({
  declarations: [
    MyApp,
    AboutPage,
    ContactPage,
    HomePage,
    TabsPage,
    RecipePage,
    UserPage,
    RecipeDetailPage,
    RecipeMasterDetailPage,
    RecipeFormPage,
    GeneralFormPage,
    IngredientFormPage,
    LoginPage,
    ProcessFormPage,
    ProcessPage,
    SignupPage,
    NoteFormPage
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
    CommonModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    AboutPage,
    ContactPage,
    HomePage,
    TabsPage,
    RecipePage,
    RecipeMasterDetailPage,
    UserPage,
    RecipeFormPage,
    GeneralFormPage,
    IngredientFormPage,
    LoginPage,
    ProcessFormPage,
    ProcessPage,
    SignupPage,
    NoteFormPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    UserProvider,
    RecipeProvider,
    AuthenticationProvider,
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
    FormValidatorProvider
  ]
})
export class AppModule {}
