import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { IngredientFormPage } from './ingredient-form';

@NgModule({
  declarations: [
    IngredientFormPage,
  ],
  imports: [
    IonicPageModule.forChild(IngredientFormPage),
  ],
})
export class IngredientFormPageModule {}
