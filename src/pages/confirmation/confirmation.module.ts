import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ConfirmationPage } from './confirmation';

@NgModule({
  declarations: [
    ConfirmationPage,
  ],
  imports: [
    IonicPageModule.forChild(ConfirmationPage),
  ],
  entryComponents: [
    ConfirmationPage
  ]
})
export class ConfirmationPageModule {}
