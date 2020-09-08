import {
  animate,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';

/**
 * Expand or collapse vertically while also transitioning opacity
**/
export function expandUpDown() {
  return trigger('expandUpDown', [
    state('collapsed', style({
      height: 0,
      margin: 0,
      opacity: 0
    })),
    state('expanded', style({
      margin: '15px 0',
    })),
    transition('void => *', []),
    transition('collapsed <=> expanded', [
      style({
        height: '{{ height }}px'
      }),
      animate('{{ speed }}ms cubic-bezier(0.645, 0.045, 0.355, 1)')
    ], {params: {
      height: 0,
      speed: 500
    }})
  ]);
}
