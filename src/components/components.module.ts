import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';
import { AccordionComponent } from './accordion/accordion';
import { HeaderComponent } from './header/header';
import { ProgressCircleComponent } from './progress-circle/progress-circle';
import { CalendarComponent } from './calendar/calendar';
@NgModule({
	declarations: [AccordionComponent,
    HeaderComponent,
    ProgressCircleComponent,
    CalendarComponent],
	imports: [IonicModule],
	exports: [AccordionComponent,
    HeaderComponent,
    ProgressCircleComponent,
    CalendarComponent]
})
export class ComponentsModule {}
