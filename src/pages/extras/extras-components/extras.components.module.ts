/* Module imports */
import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';
import { ComponentsModule } from '../../../components/components.module';

/* Page imports */
import { AboutComponent } from './about/about';
import { ActiveBatchesWrapperPage } from './active-batches-wrapper/active-batches-wrapper';
import { InventoryWrapperPage } from './inventory-wrapper/inventory-wrapper';
import { PreferencesComponent } from './preferences/preferences';


@NgModule({
  declarations: [
    ActiveBatchesWrapperPage,
    InventoryWrapperPage,
    AboutComponent,
    PreferencesComponent
  ],
  imports: [
    IonicModule,
    ComponentsModule
  ],
  exports: [
    ActiveBatchesWrapperPage,
    InventoryWrapperPage,
    AboutComponent,
    PreferencesComponent
  ],
  entryComponents: [
    ActiveBatchesWrapperPage,
    InventoryWrapperPage,
    AboutComponent,
    PreferencesComponent
  ]
})
export class ExtrasWrappersModule {}
