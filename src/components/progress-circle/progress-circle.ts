/* Module Imports */
import { Component, Input, ViewEncapsulation } from '@angular/core';


@Component({
  selector: 'progress-circle',
  templateUrl: 'progress-circle.html',
  encapsulation: ViewEncapsulation.None
})
export class ProgressCircleComponent {
  @Input('settings') settings;

  constructor() { }

}
