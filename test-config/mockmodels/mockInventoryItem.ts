import { STOCK_TYPES } from '../../src/shared/constants/stock-types';

import { InventoryItem, OptionalItemData } from '../../src/shared/interfaces/inventory-item';
import { Style } from '../../src/shared/interfaces/library';

import { mockStyles } from './mockStyles';

export const mockInventoryItem = () => {
  const style: Style = mockStyles()[0];
  const mock: InventoryItem = {
    cid: '0123456789012',
    supplierName: 'Mock Supplier',
    stockType: STOCK_TYPES[0].name,
    initialQuantity: 5,
    currentQuantity: 1,
    description: 'Mock description',
    itemName: 'Mock Item',
    itemStyleId: style._id,
    itemStyleName: style.name,
    itemABV: 5.5,
    sourceType: 'self',
    optionalItemData: mockOptionalItemData()
  };
  return mock;
};

export const mockOptionalItemData = () => {
  const mock: OptionalItemData = {
    batchId: '0123456789012',
    supplierURL: 'mocksupplier.url',
    supplierLabelImageURL: 'mocksupplierlabelurl',
    itemIBU: 30,
    itemSRM: 20,
    itemLabelImageURL: 'mockitemlabelurl',
    itemSubname: 'mock subname',
    packagingDate: 'mockdate',
    originalRecipeId: 'originalid',
    remainingColor: '#fd4855',
    srmColor: '#963500'
  };
  return mock;
};
