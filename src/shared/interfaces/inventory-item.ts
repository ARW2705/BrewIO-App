import { Syncable } from './sync';

export interface InventoryItem extends Syncable {
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
  cid: string;
  supplierName: string;
  stockType: string;
  initialQuantity: number;
  currentQuantity: number;
  description: string;
  itemName: string;
  itemStyleId: string;
  itemStyleName: string;
  itemABV: number;
  sourceType: string;
  optionalItemData: OptionalItemData;
};

export interface OptionalItemData {
  batchId?: string;
  supplierURL?: string;
  supplierLabelImageURL?: string;
  itemIBU?: number;
  itemSRM?: number;
  itemLabelImageURL?: string;
  itemSubname?: string;
  packagingDate?: string;
  originalRecipeId?: string;
};
