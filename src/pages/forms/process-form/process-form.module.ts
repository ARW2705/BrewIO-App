import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ProcessFormPage } from './process-form';

@NgModule({
  declarations: [
    ProcessFormPage,
  ],
  imports: [
    IonicPageModule.forChild(ProcessFormPage),
  ],
})
export class ProcessFormPageModule {}
