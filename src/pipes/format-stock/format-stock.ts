/* Module imports */
import { Pipe, PipeTransform } from '@angular/core';

/* Constant imports */
import { STOCK_TYPES } from '../../shared/constants/stock-types';

/* Interface imports */
import { InventoryItem } from '../../shared/interfaces/inventory-item';
import { StockType } from '../../shared/interfaces/stocktype';


@Pipe({
  name: 'formatStock',
})
export class FormatStockPipe implements PipeTransform {

  /**
   *
  **/
  transform(item: InventoryItem, type: string): string {
    switch(type) {
      case 'quantity':
        return this.formatItemQuantityText(item);
      case 'type':
        return this.formatItemTypeText(item);
      default:
        return '';
    }
  }

  formatItemQuantityText(item: InventoryItem): string {
    const stockType: StockType = STOCK_TYPES
      .find(type => type.name === item.stockType);

    if (stockType.isDiscreteUnit) {
      return item.currentQuantity.toString();
    } else {
      const remaining: number = Math.floor(
        item.currentQuantity / item.initialQuantity * 100
      );
      return`${remaining}%`;
    }
  }

  formatItemTypeText(item: InventoryItem): string {
    const stockType: StockType = STOCK_TYPES
      .find(type => type.name === item.stockType);

    let stockName: string = stockType.name.split(' ').slice(-1)[0];

    if (stockType.isDiscreteUnit) {
      if (item.currentQuantity > 1) {
        stockName += 's';
      }
    }

    return stockName;
  }

}
