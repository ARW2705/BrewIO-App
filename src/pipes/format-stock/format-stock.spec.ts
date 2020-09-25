/* Mock imports */
import { mockInventoryItem } from '../../../test-config/mockmodels/mockInventoryItem';

/* Constant imports */
import { STOCK_TYPES } from '../../shared/constants/stock-types';

/* Interface imports */
import { InventoryItem } from '../../shared/interfaces/inventory-item';
import { StockType } from '../../shared/interfaces/stocktype';

/* Pipe imports */
import { FormatStockPipe } from './format-stock';


describe('Pipe: FormatStock', () => {
  let formatPipe: FormatStockPipe;
  let _mockItem: InventoryItem;

  beforeEach(() => {
    formatPipe = new FormatStockPipe();
    _mockItem = mockInventoryItem();
  });

  test('should transform item by its type', () => {
    formatPipe.formatItemQuantityText = jest
      .fn();
    const quantitySpy: jest.SpyInstance = jest
      .spyOn(formatPipe, 'formatItemQuantityText');

    formatPipe.formatItemTypeText = jest
      .fn();
    const typeSpy: jest.SpyInstance = jest
      .spyOn(formatPipe, 'formatItemTypeText');

    formatPipe.transform(_mockItem, 'quantity');
    expect(quantitySpy).toHaveBeenCalledWith(_mockItem);

    formatPipe.transform(_mockItem, 'type');
    expect(typeSpy).toHaveBeenCalledWith(_mockItem);

    expect(formatPipe.transform(_mockItem, 'other').length).toEqual(0);
  }); // end 'should transform item by its type' test

  test('should format item quantity text', () => {
    expect(formatPipe.formatItemQuantityText(_mockItem))
      .toMatch(_mockItem.currentQuantity.toString());

    _mockItem.stockType = STOCK_TYPES[STOCK_TYPES.length - 1].name;

    expect(formatPipe.formatItemQuantityText(_mockItem)).toMatch('20%');
  }); // end 'should format item quantity text' test

  test('should format item type text', () => {
    expect(formatPipe.formatItemTypeText(_mockItem))
      .toMatch('Bottle');

    _mockItem.currentQuantity = 2;

    expect(formatPipe.formatItemTypeText(_mockItem))
      .toMatch('Bottles');

    _mockItem.stockType = STOCK_TYPES[STOCK_TYPES.length - 1].name;

    expect(formatPipe.formatItemTypeText(_mockItem))
      .toMatch('Keg');
  }); // end 'should format item type text' test

});
