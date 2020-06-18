import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ProcessPage } from './process';
import { ProcessComponentsModule } from './process-components/process.components.module';
import { ComponentsModule } from '../../components/components.module';

@NgModule({
  declarations: [
    ProcessPage,
  ],
  imports: [
    ProcessComponentsModule,
    ComponentsModule,
    IonicPageModule.forChild(ProcessPage),
  ],
})
export class ProcessPageModule {}
