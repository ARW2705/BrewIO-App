import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { RecipePage } from './recipe';
import { ComponentsModule } from '../../components/components.module';

@NgModule({
  declarations: [
    RecipePage,
  ],
  imports: [
    IonicPageModule.forChild(RecipePage),
    ComponentsModule
  ],
})
export class RecipePageModule {}
