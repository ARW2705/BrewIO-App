import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { RecipeDetailPage } from './recipe-detail';
import { ComponentsModule } from '../../components/components.module';
import { PipesModule } from '../../pipes/pipes.module';

@NgModule({
  declarations: [
    RecipeDetailPage,
  ],
  imports: [
    IonicPageModule.forChild(RecipeDetailPage),
    ComponentsModule,
    PipesModule
  ],
})
export class RecipeDetailPageModule {}
