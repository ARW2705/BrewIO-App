/* Module imports */
import { Pipe, PipeTransform } from '@angular/core';


@Pipe({
  name: 'ratio',
})
export class RatioPipe implements PipeTransform {

  /**
   * Get an item's percentage of the group
   *
   * @params: item - the item to measure
   * @params: key - the object key whose amount will be used
   * @params: group - the group of items to get a total from
   * @params: [refresh] - not used internally - changing this parameter allows
   *          manually refreshing the pipe when needed
   *
   * @return: formatted percentage of whole for the item
  **/
  transform(item: object, key: string, group: object[], refresh?: boolean): string {
    if (!item.hasOwnProperty(key)) {
      return '';
    } else if (!this.contributesFermentable(item)) {
      return '0%';
    }
    return `${(item[key] / this.getTotal(key, group) * 100).toFixed(1)}%`;
  }

  /**
   * Check if an item is fermentable; true if item has a grain type and non-zero
   * gravity rating
   *
   * @params: item - the item to check
   *
   * @return: true if item can be counted towards fermentation
  **/
  contributesFermentable(item: object): boolean {
    return item.hasOwnProperty('grainType') && item['grainType']['gravity'] > 0;
  }

  /**
   * Get the total amount of a given object quantity by a given key
   *
   * @params: key - the object key to reduce
   * @params: group - the items to sum
   *
   * @return: total amount at object key
  **/
  getTotal(key: string, group: object[]): number {
    try {
      return group.reduce(
        (acc: number, curr: object): number => {
          if (!this.contributesFermentable(curr)) {
            return acc;
          }
          return acc + (curr[key] !== undefined ? curr[key]: 0);
        },
        0
      );
    } catch(error) {
      console.log('Ratio pipe error', error);
      return 0;
    }
  }
}
