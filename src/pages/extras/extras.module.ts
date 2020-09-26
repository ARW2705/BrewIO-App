import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ExtrasPage } from './extras';
import { ExtrasWrappersModule } from './extras-components/extras.components.module';

@NgModule({
  declarations: [
    ExtrasPage,
  ],
  imports: [
    IonicPageModule.forChild(ExtrasPage),
    ExtrasWrappersModule
  ],
})
export class ExtrasPageModule {}
