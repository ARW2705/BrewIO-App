/* Module imports */
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Modal, ModalController, NavController, NavParams } from 'ionic-angular';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { Subject } from 'rxjs/Subject';
import { take } from 'rxjs/operators/take';

/* Constant imports */
import { SRM_HEX_CHART } from '../../shared/constants/srm-hex-chart';
import { STOCK_TYPES } from '../../shared/constants/stock-types';

/* Utility imports */
import { clone } from '../../shared/utility-functions/clone';
import { getId } from '../../shared/utility-functions/id-helpers';
import { normalizeErrorObservableMessage } from '../../shared/utility-functions/observable-helpers';

/* Interface imports */
import { Batch } from '../../shared/interfaces/batch';
import { InventoryItem } from '../../shared/interfaces/inventory-item';
import { PrimaryValues } from '../../shared/interfaces/primary-values';
import { StockType } from '../../shared/interfaces/stocktype';

/* Page imports */
import { InventoryFormPage } from '../../pages/forms/inventory-form/inventory-form';
import { ProcessMeasurementsFormPage } from '../../pages/forms/process-measurements-form/process-measurements-form';

/* Provider imports */
import { InventoryProvider } from '../../providers/inventory/inventory';
import { ProcessProvider } from '../../providers/process/process';
import { ToastProvider } from '../../providers/toast/toast';


@Component({
  selector: 'inventory',
  templateUrl: 'inventory.html',
})
export class InventoryComponent implements OnInit, OnDestroy {
  destroy$: Subject<boolean> = new Subject<boolean>();
  displayList: InventoryItem[] = [];
  filterBy: string[] = [];
  inventoryList: InventoryItem[] = null;
  isAscending: boolean = false;
  itemIndex: number = -1;
  sortBy: string = 'alphabetical';

  constructor(
    public modalCtrl: ModalController,
    public navCtrl: NavController,
    public navParams: NavParams,
    public inventoryService: InventoryProvider,
    public processService: ProcessProvider,
    public toastService: ToastProvider
  ) { }

  /***** Lifecycle hooks *****/

  ngOnInit() {
    this.loadInventoryList();
    if (this.navParams.get('onInit')) {
      this.navCtrl.remove(this.navCtrl.length() - 2, 1);
      this.openMeasurementFormModal(this.navParams.get('sourceBatchId'));
    }
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  /***** End Lifecycle Hooks *****/


  /***** Display *****/

  /**
   * Set expanded item index or -1 if selecting expanded items
   *
   * @params: index - list index to expand or collapse
   *
   * @return: none
  **/
  expandItem(index: number): void {
    this.itemIndex = this.itemIndex === index ? -1: index;
  }

  // TODO - handle image source string
  getImageSource(imageURL: string): string {
    return '';
  }

  /**
   * Format the stock type display text
   *
   * @params: item - item instance to base text
   *
   * @return: formatted display text
  **/
  getStockTypeDisplayText(item: InventoryItem): string {
    let text: string;

    const stockType: StockType = STOCK_TYPES
      .find(type => type.name === item.stockType);

    let stockName: string = stockType.name.split(' ').slice(-1)[0];

    if (stockType.isDiscreteUnit) {
      if (item.currentQuantity > 1) {
        stockName += 's';
      }
      text = `${item.currentQuantity} ${stockName}`;
    } else {
      const remaining: number = Math.floor(
        item.currentQuantity / item.initialQuantity * 100
      );
      text = `${remaining}% ${stockName}`;
    }

    return text;
  }

  /**
   * Reset the display inventory list based on chosen sorting
   *
   * @params: none
   * @return: none
  **/
  resetDisplayList(): void {
    if (this.sortBy === 'Source') {
      this.sortBySource();
    } else if (this.sortBy === 'Remaining') {
      this.sortByRemaining();
    } else {
      this.sortByAlphabetical();
    }
  }

  /***** End Display *****/


  /***** Inventory Actions *****/

  /**
   * Decrement the item count by 1
   *
   * @params: item - the item instance to lower its count
   *
   * @return: none
  **/
  decrementCount(item: InventoryItem): void {
    // TODO open dec type form if not a bottle/can type
    this.inventoryService.patchItem(
      item.cid,
      { currentQuantity: item.currentQuantity - 1 }
    )
    .subscribe(
      () => {
        this.toastService.presentToast('Decreased Item Count', 1500);
      },
      (error: ErrorObservable) => {
        // TODO handle error
        console.log(`Count error: ${normalizeErrorObservableMessage(error)}`);
      }
    );
  }

  /**
   * Load the inventory list
   *
   * @params: none
   * @return: none
  **/
  loadInventoryList(): void {
    this.inventoryService.getInventoryList()
      .takeUntil(this.destroy$)
      .subscribe(
        (inventoryList: InventoryItem[]) => {
          this.inventoryList = inventoryList;
          this.displayList = clone(inventoryList);
          this.resetDisplayList();
        },
        (error: ErrorObservable) => {
          // TODO handle list error
          console.log(
            `Error loading inventory: ${normalizeErrorObservableMessage(error)}`
          );
        }
      );
  }

  /**
   * Call inventory service remove item method
   *
   * @params: itemId - item instance id
   *
   * @return: none
  **/
  removeItem(itemId: string): void {
    this.inventoryService.removeItem(itemId)
      .subscribe(
        () => {},
        (error: ErrorObservable) => {
          // TODO handle error
          console.log(
            `Error removing item: ${normalizeErrorObservableMessage(error)}`
          );
        }
      )
  }

  /***** End Inventory Actions *****/


  /***** Modals *****/

  /**
   * Open the inventory form modal
   *
   * @params: options - may contain an item to update, a batch to base a new
   *          item on, or an empty object to set form to default values instead
   *
   * @return: none
  **/
  openInventoryFormModal(options: {item?: InventoryItem, batch?: Batch}): void {
    const modal: Modal = this.modalCtrl.create(
      InventoryFormPage,
      { options: options, isRequired: options.batch !== undefined }
    );

    modal.onDidDismiss((itemFormValues: object) => {
      if (itemFormValues) {
        if (options.batch !== undefined) {
          // Generate a new item from the given batch
          this.inventoryService.generateItemFromBatch(options.batch, itemFormValues)
            .subscribe(
              () => {
                this.toastService.presentToast('Added new item to inventory!');
              },
              (error: ErrorObservable) => {
                // TODO handle error
                console.log(
                  `Inventory error: ${normalizeErrorObservableMessage(error)}`
                );
              }
            )
        } else if (options.item !== undefined) {
          // Update an item
          this.inventoryService.patchItem(options.item.cid, itemFormValues)
            .subscribe(
              () => {
                this.toastService.presentToast('Updated item');
              },
              (error: ErrorObservable) => {
                // TODO handl error
                console.log(
                  `Inventory error: ${normalizeErrorObservableMessage(error)}`
                );
              }
            )
        } else {
          // Directly add the new item
          this.inventoryService.addItem(itemFormValues)
            .subscribe(
              () => {
                this.toastService.presentToast('Added new item to inventory!');
              },
              (error: ErrorObservable) => {
                // TODO handle error
                console.log(
                  `Inventory error: ${normalizeErrorObservableMessage(error)}`
                );
              }
            )
        }
      }
    });

    modal.present();
  }

  /**
   * Open the measurements form modal
   *
   * @params: sourceBatchId - the batch instance id for batch measurements
   *
   * @return: none
  **/
  openMeasurementFormModal(sourceBatchId: string): void {
    const batch$: BehaviorSubject<Batch> = this.processService
      .getBatchById(sourceBatchId);

    const batch: Batch = batch$.value;

    const options: object = {
      areAllRequired: true,
      batch: batch
    };

    const modal: Modal = this.modalCtrl.create(
      ProcessMeasurementsFormPage,
      options
    );

    modal.onDidDismiss((update: PrimaryValues) => {
      if (update !== undefined) {
        this.processService.patchMeasuredValues(
          false,
          getId(batch),
          update
        )
        .pipe(take(1))
        .subscribe(
          (updated: Batch) => {
            this.openInventoryFormModal({batch: updated});
          },
          (error: ErrorObservable) => {
            // TODO handle batch update error
            console.log(
              `Batch update error: ${normalizeErrorObservableMessage(error)}`
            );
          })
      }
    });

    modal.present();
  }

  /***** End Modals *****/


  /***** Sorting *****/

  /**
   * Handle sorting direction change
   *
   * @params: isAscending - true if should be in ascending order
   *
   * @return: none
  **/
  onDirectionChange(isAscending: boolean): void {
    this.isAscending = isAscending;
    this.resetDisplayList();
  }

  /**
   * Handle sorting category
   *
   * @params: sortBy - string of sorting category
   *
   * @return: none
  **/
  onSortChange(sortBy: string): void {
    this.sortBy = sortBy;
    this.resetDisplayList();
  }

  /**
   * Sort display inventory list alphabetically
   *
   * @params: none
   * @return: none
  **/
  sortByAlphabetical(): void {
    this.displayList.sort((item1: InventoryItem, item2: InventoryItem) => {
      if (item1.itemName < item2.itemName) {
        return this.isAscending ? -1: 1;
      }
      return this.isAscending ? 1: -1;
    });
  }

  /**
   * Sort display inventory list by count remaining
   *
   * @params: none
   * @return: none
  **/
  sortByRemaining(): void {
    const secondOperand: number = this.isAscending ? -1: 1;
    const thirdOperand: number = this.isAscending ? 1: -1;
    this.displayList.sort((item1: InventoryItem, item2: InventoryItem) => {
      return  item1.currentQuantity < item2.currentQuantity
              ? secondOperand
              : thirdOperand;
    });
  }

  /**
   * Sort display inventory list by source type
   *
   * @params: none
   * @return: none
  **/
  sortBySource(): void {
    const self: InventoryItem[] = [];
    const other: InventoryItem[] = [];
    const third: InventoryItem[] = [];

    this.displayList.forEach((item: InventoryItem) => {
      if (item.sourceType === 'self') {
        self.push(item);
      } else if (item.sourceType === 'other') {
        other.push(item);
      } else {
        third.push(item);
      }
    });

    if (this.isAscending) {
      this.displayList = self.concat(other).concat(third);
    } else {
      this.displayList = third.concat(other).concat(self);
    }
  }

  /***** End Sorting *****/


  /***** Style Selections *****/

  /**
   * Get the appropriate ABV color by item
   *
   * @params: item - item instance to get count from item quantity counts
   *
   * @return: style color object
  **/
  getABVStyle(item: InventoryItem): { color: string } {
    const low: string = '#f4f4f4';
    const mid: string = '#40e0cf';
    const high: string = '#ff9649';
    const ultra: string = '#fd4855';
    const style: { color: string } = {
      color: low
    };

    if (item.itemABV > 10) {
      style.color = ultra;
    } else if (item.itemABV > 7) {
      style.color = high;
    } else if (item.itemABV > 5) {
      style.color = mid;
    }

    return style;
  }

  /**
   * Get the appropriate IBU color by item
   *
   * @params: item - item instance to get count from item quantity counts
   *
   * @return: style color object
  **/
  getIBUStyle(item: InventoryItem): { color: string } {
    const low: string = '#f4f4f4';
    const mid: string = '#9bc484';
    const high: string = '#309400';
    const ultra: string = '#161312';
    const style: { color: string } = {
      color: low
    };

    if (item.optionalItemData.itemIBU > 100) {
      style.color = ultra;
    } else if (item.optionalItemData.itemIBU > 60) {
      style.color = high;
    } else if (item.optionalItemData.itemIBU > 20) {
      style.color = mid;
    }

    return style;
  }

  /**
   * Get the appropriate quantity color by item
   *
   * @params: item - item instance to get count from item quantity counts
   *
   * @return: style color object
  **/
  getQuantityStyle(item: InventoryItem): { color: string} {
    const normal: string = '#f4f4f4';
    const warning: string = '#ff9649';
    const danger: string = '#fd4855';
    const remaining: number = item.currentQuantity / item.initialQuantity;
    const style: { color: string } = {
      color: danger
    };

    if (remaining > 0.5) {
      style.color = normal;
    } else   if (remaining > 0.25) {
      style.color = warning;
    }

    return style;
  }

  /**
   * Get the appropriate SRM color by item
   *
   * @params: item - item instance to get count from item quantity counts
   *
   * @return: style color object
  **/
  getSRMStyle(item: InventoryItem): { color: string } {
    const style: { color: string } = {
      color: '#f4f4f4'
    };

    if (item.optionalItemData.itemSRM !== undefined) {
      if (item.optionalItemData.itemSRM < SRM_HEX_CHART.length) {
        style.color = SRM_HEX_CHART[Math.floor(item.optionalItemData.itemSRM)];
      } else {
        style.color = '#140303';
      }
    }

    return style;
  }

  /***** End Style Selections *****/

}
