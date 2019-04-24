import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { GeneralFormPage } from './general-form';

@NgModule({
  declarations: [
    GeneralFormPage,
  ],
  imports: [
    IonicPageModule.forChild(GeneralFormPage),
  ],
})
export class GeneralFormPageModule {}
