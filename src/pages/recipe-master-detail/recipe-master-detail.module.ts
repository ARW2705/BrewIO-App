import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { RecipeMasterDetailPage } from './recipe-master-detail';

@NgModule({
  declarations: [
    RecipeMasterDetailPage,
  ],
  imports: [
    IonicPageModule.forChild(RecipeMasterDetailPage),
  ],
})
export class RecipeMasterDetailPageModule {}
