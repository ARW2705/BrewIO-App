import { Component, Input, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'accordion',
  templateUrl: 'accordion.html'
})
export class AccordionComponent {
  @ViewChild('expandAccordion', {read: ElementRef}) expandAccordion;
  @Input('expanded') expanded;
  @Input('expandHeight') expandHeight;

  constructor() { }

}
