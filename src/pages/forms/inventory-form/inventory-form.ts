/* Module imports */
import { Component, OnInit } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { take } from 'rxjs/operators/take';

/* Contants imports */
import { OPTIONAL_INVENTORY_DATA_KEYS } from '../../../shared/constants/optional-inventory-data-keys';
import { STOCK_TYPES } from '../../../shared/constants/stock-types';

/* Utility functions imports */
import { hasId } from '../../../shared/utility-functions/id-helpers';
import { normalizeErrorObservableMessage } from '../../../shared/utility-functions/observable-helpers';

/* Interface imports */
import { Batch } from '../../../shared/interfaces/batch';
import { InventoryItem } from '../../../shared/interfaces/inventory-item';
import { StockType } from '../../../shared/interfaces/stocktype';
import { Style } from '../../../shared/interfaces/library';

/* Provider imports */
import { LibraryProvider } from '../../../providers/library/library';
import { RecipeProvider } from '../../../providers/recipe/recipe';
import { ToastProvider } from '../../../providers/toast/toast';
import { UserProvider } from '../../../providers/user/user';


@Component({
  selector: 'page-inventory-form',
  templateUrl: 'inventory-form.html',
})
export class InventoryFormPage implements OnInit {
  batch: Batch = null;
  inventoryForm: FormGroup = null;
  isRequired: boolean = false;
  item: InventoryItem = null;
  numericFieldKeys: string[] = [
    'initialQuantity',
    'currentQuantity',
    'itemABV',
    'itemIBU',
    'itemSRM'
  ];
  stockTypes: StockType[] = STOCK_TYPES;
  styles: Style[] = null;
    styleSelection: Style;

  constructor(
    public formBuilder: FormBuilder,
    public navParams: NavParams,
    public viewCtrl: ViewController,
    public libraryService: LibraryProvider,
    public recipeService: RecipeProvider,
    public toastService: ToastProvider,
    public userService: UserProvider
  ) { }

  ngOnInit() {
    this.libraryService.getStyleLibrary()
      .pipe(take(1))
      .subscribe(
        (styles: Style[]) => {
          this.styles = styles;
          this.isRequired = this.navParams.get('isRequired');

          const options: object = this.navParams.get('options');
          const item: InventoryItem = options['item'];
          const batch: Batch = options['batch'];

          if (item !== undefined) {
            // Populate form with given item values as an update
            this.item = item;
            this.initFormWithItem();
          } else if (batch !== undefined) {
            // Populate form fields for initial new item with a batch as a base
            this.batch = batch;
            this.initFormWithBatch();
          } else {
            // Populate form fields for new item with no previous references
            this.initFormGeneric();
          }
        },
        (error: ErrorObservable) => {
          // TODO handle get styles error
          console
            .log(
              `Inventory form error: ${normalizeErrorObservableMessage(error)}`
            );
        }
      );
  }

  /**
   * ion-select comparison function - allows objects as values
   *
   * @params: o1 - comparison object
   * @params: o2 - comparison object
   *
   * @return: true if object ids match
  **/
  compareWithFn(o1: any, o2: any): boolean {
    try {
      return o1['_id'] === o2['_id'];
    } catch(error) {
      return o1 === o2;
    }
  }

  /**
   * Ion-input stores numbers as strings - convert these fields back to numbers
   *
   * @params: none
   *
   * @return: converted form values
  **/
  convertFormValuesToNumbers(): object {
    const formValues: object = this.inventoryForm.value;
    this.numericFieldKeys.forEach(key => {
      if (formValues.hasOwnProperty(key)) {
        formValues[key] = parseFloat(formValues[key]);
      }
    });
    return formValues;
  }

  /**
   * Call ViewController dismiss method
   *
   * @params: none
   * @return: none
  **/
  dismiss(): void {
    this.viewCtrl.dismiss();
  }

  /**
   * Initialize the form using given batch values as form values
   *
   * @params: none
   * @return: none
  **/
  initFormWithBatch(): void {
    this.inventoryForm = this.formBuilder.group({
      description: ['', [Validators.maxLength(120)]],
      initialQuantity: ['', [Validators.required]],
      stockType: ['', [Validators.required]],
      // itemLabelImageURL: ''
    });
  }

  /**
   * Initialize the form with default values
   *
   * @params: none
   * @return: none
  **/
  initFormGeneric(): void {
    this.inventoryForm = this.formBuilder.group({
      description: ['', [Validators.maxLength(120)]],
      initialQuantity: [null, [Validators.required, Validators.min(1)]],
      itemABV: [null, [Validators.required, Validators.min(0)]],
      itemIBU: null,
      itemName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(25)
        ]
      ],
      itemSRM: null,
      itemStyleId: [null, [Validators.required]],
      itemSubname: ['', [Validators.minLength(2), Validators.maxLength(25)]],
      sourceType: ['', [Validators.required]],
      stockType: ['', [Validators.required]],
      supplierName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(25)
        ]
      ],
      supplierURL: '',
      // supplierLabelImageURL: '',
      // itemLabelImageURL: '',
    });
  }

  /**
   * Initialize the form using given item values as form values
   *
   * @params: none
   * @return: none
  **/
  initFormWithItem(): void {
    this.inventoryForm = this.formBuilder.group({
      currentQuantity: [this.item.currentQuantity, [Validators.required]],
      description: [this.item.description, [Validators.maxLength(120)]],
      initialQuantity: [
        this.item.initialQuantity,
        [
          Validators.required, Validators.min(1)
        ]
      ],
      itemABV: [this.item.itemABV, [Validators.required, Validators.min(0)]],
      itemName: [
        this.item.itemName,
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(20)
        ]
      ],
      itemStyleId: [null, [Validators.required]],
      sourceType: [this.item.sourceType, [Validators.required]],
      stockType: [this.item.stockType, [Validators.required]],
      supplierName: [
        this.item.supplierName,
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50)
        ]
      ]
    });

    // populate ion-selects with currently chosen option
    this.styleSelection = this.styles.find((style: Style) => {
      return hasId(style, this.item.itemStyleId)
    });

    this.inventoryForm.controls.itemStyleId.setValue(this.styleSelection);

    // create controls for any optional fields present
    OPTIONAL_INVENTORY_DATA_KEYS.forEach((optionalKey: string) => {
      if (optionalKey === 'batchId'
          || !this.item.optionalItemData.hasOwnProperty(optionalKey)) {
        return;
      }

      const addValue: any = this.item.optionalItemData[optionalKey];
      this.inventoryForm.addControl(
        optionalKey,
        new FormControl(addValue !== undefined ? addValue: '')
      );
    });
  }

  /**
   * Update style model on style selection
   *
   * @params: style - the style selection
   *
   * @return: none
  **/
  onStyleSelection(style: Style): void {
    this.styleSelection = style;
  }

  /**
   * Format the form values and call ViewController dismiss with those values
   *
   * @params: none
   * @return: none
  **/
  onSubmit(): void {
    const formValues: object = this.convertFormValuesToNumbers();
    const style: Style = this.styleSelection !== undefined
      ? this.styleSelection
      : this.styles.find(
          (style: Style) => hasId(style, this.batch.annotations.styleId)
        );
    formValues['itemStyleId'] = style._id;
    formValues['itemStyleName'] = style.name;
    this.viewCtrl.dismiss(formValues);
  }

}
