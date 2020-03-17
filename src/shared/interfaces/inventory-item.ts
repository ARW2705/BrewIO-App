export interface InventoryItem {
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
  stockCount: number;
  stockQuantity: number;
  stockType: string;
  labelImageUrl: string;
  packageDate: string;
  itemDetails: {
    master: string;
    recipe: string;
  }
};
