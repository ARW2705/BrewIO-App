import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { NoteFormPage } from './note-form';

@NgModule({
  declarations: [
    NoteFormPage,
  ],
  imports: [
    IonicPageModule.forChild(NoteFormPage),
  ],
})
export class NoteFormPageModule {}
