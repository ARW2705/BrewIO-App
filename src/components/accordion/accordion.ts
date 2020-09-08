/* Module imports */
import { Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';

/* Animation imports */
import { expandUpDown } from '../../animations/expand';


@Component({
  selector: 'accordion',
  templateUrl: 'accordion.html',
  animations: [
    expandUpDown()
  ]
})
export class AccordionComponent implements OnChanges {
  @Input('expanded') expanded;
  @ViewChild('accordionContainer', {read: ElementRef}) container;
  expand: object = {
    value: 'collapsed',
    params: {
      height: 0
    }
  };

  constructor() {}

  /***** Lifecycle Hooks *****/

  ngOnChanges(changes: SimpleChanges) {
    const expansion = changes.expanded.currentValue;
    this.expand = {
      value: expansion ? 'expanded': 'collapsed',
      params: {
        height: this.container.nativeElement.clientHeight
      }
    };
  }

  /***** End Lifecycle Hooks *****/

}
