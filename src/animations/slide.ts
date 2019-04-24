import { animate, state, style, transition, trigger } from '@angular/animations';

export function slideInOut() {
  return trigger('slideInOut', [
    transition(':enter', [
      style({
        transform: 'translateX(100%)',
        opacity: 0
      }),
      animate('150ms', style({
        transform: 'translateX(0)',
        opacity: 1
      }))
    ]),
    transition(':leave', [
      animate('150ms', style({
        transform: 'translateX(100%)',
        opacity: 0
      }))
    ])
  ]);
}
