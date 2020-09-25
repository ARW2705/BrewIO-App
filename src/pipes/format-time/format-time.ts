import { Pipe, PipeTransform } from '@angular/core';

/**
 * Generated class for the FormatTimePipe pipe.
 *
 * See https://angular.io/api/core/Pipe for more info on Angular Pipes.
 */
@Pipe({
  name: 'formatTime',
})
export class FormatTimePipe implements PipeTransform {
  /**
   * Takes a value and makes it lowercase.
   */
  transform(value: string, formatType: string): string {
    switch(formatType) {
      case 'duration':
        return this.formatDuration(parseFloat(value));
      default:
        return value;
    }
  }

  /**
   * Convert a duration in minutes to text
   *
   * @params: duration - in minutes
   *
   * @return: formatted string of minutes in n hours m minutes
  **/
  formatDuration(duration: number): string {
    let result: string = 'Duration: ';
    if (duration > 59) {
      const hours = Math.floor(duration / 60);
      result += `${hours} hour${hours > 1 ? 's': ''}`;
      duration = duration % 60;
      result += (duration) ? ' ': '';
    }
    if (duration) {
      result += `${duration} minute${duration > 1 ? 's': ''}`;
    }
    return result;
  }
}
