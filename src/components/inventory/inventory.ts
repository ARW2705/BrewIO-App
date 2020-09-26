/* Module imports */
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Modal, ModalController, NavController, NavParams } from 'ionic-angular';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { Subject } from 'rxjs/Subject';
import { take } from 'rxjs/operators/take';

/* Constant imports */
import { BASE_URL } from '../../shared/constants/base-url';
import { API_VERSION } from '../../shared/constants/api-version';

/* Utility imports */
import { normalizeErrorObservableMessage } from '../../shared/utility-functions/observable-helpers';
import { toTitleCase } from '../../shared/utility-functions/utilities';

/* Interface imports */
import { Batch } from '../../shared/interfaces/batch';
import { InventoryItem } from '../../shared/interfaces/inventory-item';
import { PrimaryValues } from '../../shared/interfaces/primary-values';

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
  baseImageURL: string = `${BASE_URL}/${API_VERSION}/assets/`; // TODO implement image asset handling
  destroy$: Subject<boolean> = new Subject<boolean>();
  displayList: InventoryItem[] = null;
  filterBy: string[] = [];
  inventoryList: InventoryItem[] = null;
  isAscending: boolean = true;
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
      console.log('start inventory from batch');
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
      (updatedItem: InventoryItem): void => {
        let message: string = '';
        let customClass: string = '';
        if (updatedItem === null) {
          message = `${toTitleCase(item.itemName)} Out of Stock!`;
          customClass = 'toast-warn'
        } else {
          const count: number = updatedItem.currentQuantity;
          message = `${count} ${updatedItem.stockType}${count > 1 ? 's': ''} remaining`;
        }
        this.toastService
          .presentToast(
            message,
            1500,
            'bottom',
            customClass
          );
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
          this.displayList = inventoryList;
          this.displayList.forEach((item: InventoryItem): void => {
            item['supplierLabelImageURLLoaded'] = false;
            item['itemLabelImageURLLoaded'] = false;
          });
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
   * Get the associated batch with which to generate the measurement form
   *
   * @params: sourceBatchId - batch id to search
   *
   * @return: an options object to pass to the measurement form modal
  **/
  getMeasurementFormOptions(sourceBatchId: string): object {
    try {
      const batch$: BehaviorSubject<Batch> = this.processService
        .getBatchById(sourceBatchId);

      const batch: Batch = batch$.value;

      return {
        areAllRequired: true,
        batch: batch
      };
    } catch(error) {
      console.log('Batch not found', error);
      return undefined;
    }
  }

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
              (): void => {
                this.toastService.presentToast('Added new item to inventory!');
              },
              (error: ErrorObservable): void => {
                // TODO handle error
                console.log(
                  `Inventory error: ${normalizeErrorObservableMessage(error)}`
                );
              }
            );
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
    try {
      const options: object = this.getMeasurementFormOptions(sourceBatchId);

      if (options['batch'] === undefined) {
        throw new Error('Batch not found');
      }

      const modal: Modal = this.modalCtrl.create(
        ProcessMeasurementsFormPage,
        options
      );

      modal.onDidDismiss((update: PrimaryValues) => {
        if (update) {
          console.log('inventory init update', update);
          this.processService.patchMeasuredValues(
            false,
            sourceBatchId,
            update
          )
          .pipe(take(1))
          .subscribe(
            (updated: Batch) => {
              console.log('updated batch', updated);
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
    } catch(error) {
      console.log('Measurement confirmation form error', error);
      this.toastService.presentToast(
        'Measurement form error: please add as custom item instead',
        2000,
        'bottom',
        'toast-error'
      );
    }
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

}
