/* Module imports */
import { Component, Input } from '@angular/core';

/* Interface imports */
import { Process } from '../../../../shared/interfaces/process';


@Component({
  selector: 'manual-process',
  templateUrl: 'manual-process.html'
})
export class ManualProcessComponent {
  @Input() stepData: Process;

  constructor() { }

}
