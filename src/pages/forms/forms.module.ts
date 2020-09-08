/* Module imports */
import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';

/* Page imports */
import { GeneralFormPage } from './general-form/general-form';
import { IngredientFormPage } from './ingredient-form/ingredient-form';
import { InventoryFormPage } from './inventory-form/inventory-form';
import { NoteFormPage } from './note-form/note-form';
import { LoginPage } from './login/login';
import { ProcessFormPage } from './process-form/process-form';
import { ProcessMeasurementsFormPage } from './process-measurements-form/process-measurements-form';
import { RecipeFormPage } from './recipe-form/recipe-form';
import { SignupPage } from './signup/signup';


@NgModule({
  declarations: [
    GeneralFormPage,
    IngredientFormPage,
    InventoryFormPage,
    NoteFormPage,
    LoginPage,
    ProcessFormPage,
    ProcessMeasurementsFormPage,
    RecipeFormPage,
    SignupPage
  ],
  imports: [
    IonicPageModule
  ],
  entryComponents: [
    GeneralFormPage,
    IngredientFormPage,
    InventoryFormPage,
    NoteFormPage,
    LoginPage,
    ProcessFormPage,
    ProcessMeasurementsFormPage,
    RecipeFormPage,
    SignupPage
  ]
})
export class MyFormsModule {}
