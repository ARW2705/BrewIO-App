import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';
import { PipesModule } from '../pipes/pipes.module';
import { AccordionComponent } from './accordion/accordion';
import { ActiveBatchesComponent } from './active-batches/active-batches';
import { CalendarComponent } from './calendar/calendar';
import { HeaderComponent } from './header/header';
import { ProgressCircleComponent } from './progress-circle/progress-circle';
import { InventoryComponent } from './inventory/inventory';
import { FormErrorComponent } from './form-error/form-error';


@NgModule({
	declarations: [
		AccordionComponent,
		ActiveBatchesComponent,
		CalendarComponent,
    HeaderComponent,
    ProgressCircleComponent,
    InventoryComponent,
    FormErrorComponent
	],
	imports: [
		IonicModule,
	 	PipesModule
	],
	exports: [
		AccordionComponent,
		ActiveBatchesComponent,
		CalendarComponent,
    HeaderComponent,
    ProgressCircleComponent,
    InventoryComponent,
    FormErrorComponent
	],
	entryComponents: [
		ActiveBatchesComponent,
		InventoryComponent
	]
})
export class ComponentsModule {}
