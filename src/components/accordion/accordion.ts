import { Component, Input, ViewChild, OnChanges, SimpleChanges, ElementRef } from '@angular/core';

import { slideUpDown } from '../../animations/slide';

@Component({
  selector: 'accordion',
  templateUrl: 'accordion.html',
  animations: [
    slideUpDown()
  ]
})
export class AccordionComponent implements OnChanges {
  @Input('expanded') expanded;
  @ViewChild('accordionContainer', {read: ElementRef}) container;
  expand = {
    value: 'collapsed',
    params: {
      height: 0
    }
  };

  constructor() { }

  ngOnChanges(changes: SimpleChanges) {
    const expansion = changes.expanded.currentValue;
    this.expand = {
      value: expansion ? 'expanded': 'collapsed',
      params: {
        height: this.container.nativeElement.clientHeight
      }
    };
  }

}
