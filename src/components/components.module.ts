import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';
import { AccordionComponent } from './accordion/accordion';
import { ActiveBatchesComponent } from './active-batches/active-batches';
import { CalendarComponent } from './calendar/calendar';
import { HeaderComponent } from './header/header';
import { ProgressCircleComponent } from './progress-circle/progress-circle';
import { InventoryComponent } from './inventory/inventory';


@NgModule({
	declarations: [
		AccordionComponent,
		ActiveBatchesComponent,
		CalendarComponent,
    HeaderComponent,
    ProgressCircleComponent,
    InventoryComponent
	],
	imports: [ IonicModule ],
	exports: [
		AccordionComponent,
		ActiveBatchesComponent,
		CalendarComponent,
    HeaderComponent,
    ProgressCircleComponent,
    InventoryComponent
	],
	entryComponents: [
		ActiveBatchesComponent,
		InventoryComponent
	]
})
export class ComponentsModule {}
