import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';
import { ComponentsModule } from '../../../components/components.module';
import { ManualProcessComponent } from './manual-process/manual-process';
import { TimerProcessComponent } from './timer-process/timer-process';
import { CalendarProcessComponent } from './calendar-process/calendar-process';
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
