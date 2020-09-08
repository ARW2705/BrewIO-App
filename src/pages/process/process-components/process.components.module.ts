/* Module imports */
import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';
import { ComponentsModule } from '../../../components/components.module';

/* Component imports */
import { ManualProcessComponent } from './manual-process/manual-process';
import { TimerProcessComponent } from './timer-process/timer-process';
import { CalendarProcessComponent } from './calendar-process/calendar-process';

/* Pipe imports */
import { PipesModule } from '../../../pipes/pipes.module';

@NgModule({
  declarations: [
    ManualProcessComponent,
    TimerProcessComponent,
    CalendarProcessComponent
  ],
  imports: [
    IonicModule,
    ComponentsModule,
    PipesModule
  ],
  exports: [
    ManualProcessComponent,
    TimerProcessComponent,
    CalendarProcessComponent
  ]
})
export class ProcessComponentsModule {}
