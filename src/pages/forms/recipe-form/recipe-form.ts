/* Module imports */
import { Component, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { NavController, NavParams, ModalController, Events } from 'ionic-angular';
import { Subject } from 'rxjs/Subject';
import { takeUntil } from 'rxjs/operators/takeUntil';

/* Interface imports */
import { RecipeVariant } from '../../../shared/interfaces/recipe-variant';
import { RecipeMaster } from '../../../shared/interfaces/recipe-master';
import { Grains, Hops, Yeast, Style } from '../../../shared/interfaces/library';
import { HopsSchedule } from '../../../shared/interfaces/hops-schedule';

/* Default imports */
import { defaultRecipeMaster } from '../../../shared/defaults/default-recipe-master';
import { defaultStyle } from '../../../shared/defaults/default-style';

/* Utility function imports */
import { clone, toTitleCase, stripSharedProperties, getId } from '../../../shared/utility-functions/utilities';

/* Page imports */
import { GeneralFormPage } from '../general-form/general-form';
import { ProcessFormPage } from '../process-form/process-form';
import { IngredientFormPage } from '../ingredient-form/ingredient-form';
import { NoteFormPage } from '../note-form/note-form';

/* Provider imports */
import { LibraryProvider } from '../../../providers/library/library';
import { RecipeProvider } from '../../../providers/recipe/recipe';
import { CalculationsProvider } from '../../../providers/calculations/calculations';
import { ToastProvider } from '../../../providers/toast/toast';
import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';
import { ClientIdProvider } from '../../../providers/client-id/client-id';

@Component({
  selector: 'page-recipe-form',
  templateUrl: 'recipe-form.html',
})
export class RecipeFormPage implements AfterViewInit {
  title: string = '';
  processIcons = {'manual': 'hand', 'timer': 'timer', 'calendar': 'calendar'};
  isLoaded: boolean = false;
  formType: string = null;
  formOptions: any = null;
  mode: string = null;
  docMethod: string = '';
  grainsLibrary: Array<Grains> = null;
  hopsLibrary: Array<Hops> = null;
  yeastLibrary: Array<Yeast> = null;
  styleLibrary: Array<Style> = null;
  master: RecipeMaster = null;
  variant: RecipeVariant = null;
  textarea = '';
  _headerNavPop: any;
  destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public modalCtrl: ModalController,
    public cdRef: ChangeDetectorRef,
    public events: Events,
    public libraryService: LibraryProvider,
    public recipeService: RecipeProvider,
    public calculator: CalculationsProvider,
    public toastService: ToastProvider,
    public actionService: ActionSheetProvider,
    public clientIdService: ClientIdProvider
  ) {
    this._headerNavPop = this.headerNavPopEventHandler.bind(this);
    this.setFormTypeConfiguration(
      navParams.get('formType'),
      navParams.get('mode'),
      navParams.get('masterData'),
      navParams.get('variantData'),
      navParams.get('additionalData')
    );
    this.libraryService.getAllLibraries()
      .pipe(takeUntil(this.destroy$))
      .subscribe(([grainsLibrary, hopsLibrary, yeastLibrary, styleLibrary]) => {
        this.grainsLibrary = grainsLibrary;
        this.hopsLibrary = hopsLibrary;
        this.yeastLibrary = yeastLibrary;
        this.styleLibrary = styleLibrary;
        this.isLoaded = true;
      });
  }

  /***** Lifecycle Hooks *****/

  ngAfterViewInit() {
    this.handleFormOptions(this.formOptions);
  }

  ngOnDestroy() {
    this.events.unsubscribe('pop-header-nav', this._headerNavPop);
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  ngOnInit() {
    this.events.subscribe('pop-header-nav', this._headerNavPop);
  }

  /***** End lifecycle hooks *****/


  /***** Modals *****/

  /**
   * Open general recipe form modal - pass current data for update, if present
   *
   * @params: none
   * @return: none
  **/
  openGeneralModal(): void {
    const data = {
      formType: this.formType,
      docMethod: this.docMethod,
      data: {
        style: this.master.style,
        brewingType: this.variant.brewingType,
        mashDuration: this.variant.mashDuration,
        boilDuration: this.variant.boilDuration,
        batchVolume: this.variant.batchVolume,
        boilVolume: this.variant.boilVolume,
        mashVolume: this.variant.mashVolume,
        isFavorite: this.variant.isFavorite,
        isMaster: this.variant.isMaster
      }
    };
    if (this.mode === 'create' && this.formType === 'master') {
      data['styles'] = this.styleLibrary;
      data.data = null;
    } else if (this.mode === 'update') {
      if (this.formType === 'master') {
        data.data['name'] = this.master.name;
        data['styles'] = this.styleLibrary;
      }
      if (this.formType === 'variant') {
        data.data['variantName'] = this.variant.variantName;
      }
    }
    const modal = this.modalCtrl.create(GeneralFormPage, data);
    modal.onDidDismiss(_data => {
      if (_data) {
        this.mode = 'update';
        this.updateDisplay(_data);
        this.calculator.calculateRecipeValues(this.variant);
        this.autoSetBoilMashDuration(_data);
      }
    });
    modal.present({keyboardClose: false});
  }

  /**
   * Open modal to create, edit, or delete specified ingredient type
   *
   * @params: type - the ingredient type
   * @params: [toUpdate] - current ingredient data to edit or delete
   *
   * @return: none
  **/
  openIngredientFormModal(type: string, toUpdate?: any): void {
    const data = {
      ingredientType: type,
      update: toUpdate
    };
    switch(type) {
      case 'grains':
        data['library'] = this.grainsLibrary;
        break;
      case 'hops':
        data['library'] = this.hopsLibrary;
        break;
      case 'yeast':
        data['library'] = this.yeastLibrary;
        break;
      default:
        break;
    }
    const modal = this.modalCtrl.create(IngredientFormPage, {data: data});
    modal.onDidDismiss(data => {
      if (data) {
        this.updateIngredientList(data, type, toUpdate, data.delete);
        this.calculator.calculateRecipeValues(this.variant);
        if (data.hopsType !== undefined) {
          this.autoSetHopsAddition();
        }
      }
    });
    modal.present({keyboardClose: false});
  }

  /**
   * Open modal to create, edit, or delete a note
   *
   * @params: noteType - 'variant' for a common note, 'batch' for a variant specific note
   * @params: [index] - the index to edit or delete
   *
   * @return: none
  **/
  openNoteModal(noteType: string, index?: number): void {
    let toUpdate;
    if (index === undefined) {
      toUpdate = '';
    } else {
      toUpdate = noteType === 'variant' ? this.master.notes[index]: this.variant.notes[index];
    }
    const options = {
      noteType: noteType,
      formMethod: index === undefined ? 'create': 'update',
      toUpdate: toUpdate
    };
    const modal = this.modalCtrl.create(NoteFormPage, options);
    modal.onDidDismiss(data => {
      if (data) {
        if (data.method === 'create') {
          if (noteType === 'variant') {
            this.master.notes.push(data.note);
          } else if (noteType === 'batch') {
            this.variant.notes.push(data.note);
          }
        } else if (data.method === 'update') {
          if (noteType === 'variant') {
            this.master.notes[index] = data.note;
          } else if (noteType === 'batch') {
            this.variant.notes[index] = data.note;
          }
        } else if (data.method === 'delete') {
          if (noteType === 'variant') {
            this.master.notes.splice(index, 1);
          } else if (noteType === 'batch') {
            this.variant.notes.splice(index, 1);
          }
        }
      }
    });
    modal.present({keyboardClose: false});
  }

  /**
   * Open modal to create, edit, or delete specified process step type
   *
   * @params: processType - the step type, either 'manual', 'timer', or 'calendar'
   * @params: [toUpdate] - current step data to be edited or deleted
   * @params: [index] - index of step
   *
   * @return: none
  **/
  openProcessModal(processType: string, toUpdate?: any, index?: number): void {
    const options = {
      processType: toUpdate === undefined ? processType: toUpdate.type,
      update: toUpdate,
      formMode: toUpdate === undefined ? 'create': 'update'
    };
    const modal = this.modalCtrl.create(ProcessFormPage, options);
    modal.onDidDismiss(data => {
      if (data) {
        if (data.delete) {
          this.variant.processSchedule.splice(index, 1);
        } else if (data.update) {
          this.variant.processSchedule[index] = data.update;
        } else {
          this.variant.processSchedule.push(data);
        }
      }
    });
    modal.present({keyboardClose: false});
  }

  /***** End Modals *****/


  /***** Action Sheets *****/

  /**
   * Open ingredient form action sheet to select ingredient type to modify
   *
   * @params: none
   *
   * @return: none
  **/
  openIngredientActionSheet(): void {
    this.actionService.openActionSheet(
      'Select an Ingredient',
      [
        {
          text: 'Grains',
          handler: () => {
            this.openIngredientFormModal('grains');
          }
        },
        {
          text: 'Hops',
          handler: () => {
            this.openIngredientFormModal('hops');
          }
        },
        {
          text: 'Yeast',
          handler: () => {
            this.openIngredientFormModal('yeast');
          }
        },
        {
          text: 'Other',
          handler: () => {
            this.openIngredientFormModal('otherIngredients');
          }
        }
      ]
    );
  }

  /**
   * Open action sheet to select the type of process step to add
   *
   * @params: none
   *
   * @return: none
  **/
  openProcessActionSheet(): void {
    this.actionService.openActionSheet(
      'Add a process step',
      [
        {
          text: 'Manual',
          handler: () => {
            this.openProcessModal('manual');
          }
        },
        {
          text: 'Timer',
          handler: () => {
            this.openProcessModal('timer');
          }
        },
        {
          text: 'Calendar',
          handler: () => {
            this.openProcessModal('calendar');
          }
        }
      ]
    );
  }

  /***** End Action Sheets *****/


  /***** Form value auto-generation *****/

  /**
   * Generate timer process step for mash and boil step if they haven't been added yet
   *
   * @params: data - form data containing mash and boil duration
   *
   * @return: none
  **/
  autoSetBoilMashDuration(data: any): void {
    const mashIndex = this.variant.processSchedule.findIndex(process => {
      return process.name === 'Mash';
    });
    if (mashIndex === -1) {
      // add mash timer if one does not already exist
      this.variant.processSchedule.push({
        cid: this.clientIdService.getNewId(),
        type: 'timer',
        name: 'Mash',
        description: 'Mash grains',
        duration: data.mashDuration,
        concurrent: false,
        splitInterval: 1
      });
    }

    const boilIndex = this.variant.processSchedule.findIndex(process => {
      return process.name === 'Boil';
    });
    if (boilIndex === -1) {
      // add boil timer if one does not already exist
      this.variant.processSchedule.push({
        cid: this.clientIdService.getNewId(),
        type: 'timer',
        name: 'Boil',
        description: 'Boil wort',
        duration: data.boilDuration,
        concurrent: false,
        splitInterval: 1
      });
    }
  }

  /**
   * Generate timer process step for hops addition
   *
   * @params: none
   *
   * @return: none
  **/
  autoSetHopsAddition(): void {
    // remove existing hops timers
    this.variant.processSchedule = this.variant.processSchedule.filter(process => {
      return !process.name.match(/^(Add).*(hops)$/);
    });

    // add hops timers for each hops instance
    // ignore dry hop additions
    // combine hops additions that occur at the same time
    const hopsForTimers = this.variant.hops.filter(hops => {
      return !hops.dryHop;
    });

    hopsForTimers.sort((h1, h2) => {
      if (h1.addAt < h2.addAt) {
        return 1;
      } else if (h1.addAt > h2.addAt) {
        return -1;
      }
      return 0;
    });

    hopsForTimers.forEach(hopsAddition => {
      this.variant.processSchedule.push({
        cid: this.clientIdService.getNewId(),
        type: 'timer',
        name: `Add ${hopsAddition.hopsType.name} hops`,
        concurrent: true,
        description: `Hops addition: ${hopsAddition.quantity} oz`,
        duration: this.getHopsTimeRemaining(hopsAddition.addAt)
      })
    });

    const boilStep = this.variant.processSchedule.find(process => {
      return process.name === 'Boil';
    });
    boilStep.concurrent = true;
  }

  /***** End form value auto-generation *****/


  /***** Recipe Calculations *****/

  /**
   * Get grains quantity as percentage of total
   *
   * @params: quantity - grain weight
   *
   * @return: percentage of total quantity for given quantity
  **/
  getGristRatio(quantity: number): number {
    return quantity / this.getTotalGristWeight() * 100;
  }

  /**
   * Get time remaining after subtracting addAt time from boil time
   *
   * @params: addAt - time to add hops at in minutes
   *
   * @return: difference between boil time and addAt time point
  **/
  getHopsTimeRemaining(addAt: number): number {
    const boilStep = this.variant.processSchedule.find(process => process.name === 'Boil');
    const boilTime = boilStep ? boilStep.duration: 60;
    return boilTime - addAt;
  }

  /**
   * Calculate the individual IBU contribution of a hops instances
   *
   * @params: hops - an individual hops addition
   *
   * @return: IBU contribution of given hops addition
  **/
  getIndividualIBU(hops: HopsSchedule): number {
    return this.calculator.getIBU(
      hops.hopsType,
      hops,
      this.variant.originalGravity,
      this.variant.batchVolume,
      this.variant.boilVolume
    );
  }

  /**
   * Get total weight of all grains
   *
   * @params: none
   *
   * @return: total weight of grain bill in pounds
  **/
  getTotalGristWeight(): number {
    let total = 0;
    for (let i=0; i < this.variant.grains.length; i++) {
      total += this.variant.grains[i].quantity;
    }
    return total;
  }

  /**
   * Update recipe calculated values
   *
   * @params: none
   * @return: none
  **/
  updateRecipeValues(): void {
    this.calculator.calculateRecipeValues(this.variant);
  }

  /***** End recipe calculations *****/


  /***** Form data handling *****/

  /**
   * Format form data for server request
   *
   * @params: none
   *
   * @return: structured form data for http request
  **/
  constructPayload(): any {
    let payload;
    if (this.formType === 'master') {
      if (this.docMethod === 'create') {
        payload = {
          master: {
            name: this.master.name,
            style: this.master.style,
            notes: this.master.notes,
            isPublic: this.master.isPublic,
          },
          variant: this.variant
        }
      } else {
        payload = {
          name: this.master.name,
          style: this.master.style,
          notes: this.master.notes,
          isPublic: this.master.isPublic
        };
      }
    } else if (this.formType === 'variant') {
      payload = this.variant;
    }
    return payload;
  }

  /**
   * Handle additional options passed to form page
   *
   * @params: options - object with additional formatting data
   *
   * @return: none
  **/
  handleFormOptions(options: any): void {
    if (!options) return;
    if (options.hasOwnProperty('noteIndex')) {
      this.openNoteModal('variant', options.noteIndex);
    }
  }

  /**
   * Call appropriate HTTP request with recipe form data
   *
   * @params: none
   *
   * @return: none
  **/
  onSubmit(): void {
    const payload = this.constructPayload();

    const message = toTitleCase(`${this.formType} ${this.docMethod} Successful!`);
    if (this.docMethod === 'create') {
      this.submitCreationPost(payload, message);
    } else if (this.docMethod === 'update') {
      this.submitPatchUpdate(payload, message);
    }
  }

  /**
   * Set form configuration from nav params
   *
   * @params: formType - either 'master' for RecipeMaster or 'variant' for RecipeVariant
   * @params: mode - CRUD mode
   * @params: master - RecipeMaster instance
   * @params: variant - Recipe variant instance
   * @params: additionalData - additional configuration object
   *
   * @return: none
  **/
  setFormTypeConfiguration(
    formType: string,
    mode: string,
    master: RecipeMaster,
    variant: RecipeVariant,
    additionalData: any
  ): void {
    this.formType = formType;
    this.formOptions = additionalData;
    this.mode = mode;
    this.docMethod = mode;
    if (formType === 'master') {
      if (mode === 'create') {
        this.title = 'Create Recipe';
        this.master = defaultRecipeMaster();
        this.variant = defaultRecipeMaster().variants[0];
      } else {
        this.title = `Update ${master.name}`;
        this.master = clone(master);
        this.variant = clone(master.variants.find(elem => elem.isMaster));
      }
    } else {
      if (mode === 'create') {
        this.title = `Add Variant to ${master.name}`;
        this.master = master;
        this.variant = clone(master.variants.find(elem => elem.isMaster));
        stripSharedProperties(this.variant);
        this.variant.variantName = '< Add Variant Name >';
      } else {
        this.title = `Update ${variant.variantName}`;
        this.master = clone(master);
        this.variant = clone(variant);
      }
    }
  }

  /**
   * HTTP post new Recipe Master or Recipe
   *
   * @params: payload - formatted data object for HTTP post
   * @params: message - feedback toast message
   *
   * @return: none
  **/
  submitCreationPost(payload: any, message: string): void {
    if (this.formType === 'master') {
      this.recipeService.postRecipeMaster(payload)
        .pipe(takeUntil(this.destroy$))
        .subscribe(
          () => {
            console.log('master create success');
            this.toastService.presentToast(message);
            this.events.publish('update-nav-header', {caller: 'recipe form page', other: 'form-submit-complete'});
          },
          error => {
            this.toastService.presentToast(error);
            if (!RegExp('Client Validation Error', 'g').test(error)) {
              this.events.publish('update-nav-header', {caller: 'recipe form page', other: 'form-submit-complete'});
            }
          }
        );
    } else if (this.formType === 'variant') {
      this.recipeService.postRecipeToMasterById(getId(this.master), payload)
        .pipe(takeUntil(this.destroy$))
        .subscribe(
          () => {
            console.log('variant create success');
            this.toastService.presentToast(message);
            this.events.publish('update-nav-header', {caller: 'recipe form page', other: 'form-submit-complete'});
          },
          error => {
            this.toastService.presentToast(error);
          }
        );
    }
  }

  /**
   * HTTP patch new Recipe Master or Recipe
   *
   * @params: payload - formatted data object for HTTP post
   * @params: message - feedback toast message
   *
   * @return: none
  **/
  submitPatchUpdate(payload: any, message: string): void {
    if (this.formType === 'master') {
      console.log('recipe form calls patch recipe master');
      this.recipeService.patchRecipeMasterById(getId(this.master), payload)
        .pipe(takeUntil(this.destroy$))
        .subscribe(
          () => {
            console.log('master patch success');
            this.toastService.presentToast(message);
            this.events.publish('update-nav-header', {caller: 'recipe form page', other: 'form-submit-complete'});
          },
          error => {
            this.toastService.presentToast(error);
          }
        );
    } else if (this.formType === 'variant') {
      this.recipeService.patchRecipeVariantById(getId(this.master), getId(this.variant), payload)
        .pipe(takeUntil(this.destroy$))
        .subscribe(
          () => {
            console.log('variant patch success');
            this.toastService.presentToast(message);
            this.events.publish('update-nav-header', {caller: 'recipe form page', other: 'form-submit-complete'});
          },
          error => {
            this.toastService.presentToast(error);
          }
        );
    }
  }

  /***** End form data handling *****/


  /***** Ingredient List *****/

  /**
   * Sort ingredient array in the following orders:
   * - grains: descending quantity
   * - hops: chronological
   * - yeast: descending quantity
   *
   * @params: ingredientType - the ingredient array to sort
   *
   * @return: none
  **/
  sortIngredients(ingredientType: string): void {
    switch(ingredientType) {
      case 'grains':
        this.variant.grains.sort((g1, g2) => {
          if (g1.quantity < g2.quantity) {
            return 1;
          }
          if (g1.quantity > g2.quantity) {
            return -1;
          }
          return 0;
        });
        break;
      case 'hops':
        this.variant.hops.sort((g1, g2) => {
          if (g1.addAt < g2.addAt) {
            return 1;
          }
          if (g1.addAt > g2.addAt) {
            return -1;
          }
          return 0;
        });
        break;
      case 'yeast':
        this.variant.yeast.sort((g1, g2) => {
          if (g1.quantity < g2.quantity) {
            return 1;
          }
          if (g1.quantity > g2.quantity) {
            return -1;
          }
          return 0;
        });
        break;
      default:
        // do not sort on unknown ingredient type
        break;
    }
  }

  /**
   * Update in memory ingredient arrays
   *
   * @params: ingredient - ingredient data returned from ingredient form
   * @params: type - the ingredient type
   * @params: toUpdate - current ingredient data to edit
   * @params: deletion - true if ingredient is to be deleted
   *
   * @return: none
  **/
  updateIngredientList(ingredient: any, type: string, toUpdate?: any, deletion?: boolean): void {
    switch(type) {
      case 'grains':
        if (toUpdate) {
          const index = this.variant.grains.findIndex(elem => {
            return elem.grainType._id === toUpdate.grainType._id;
          });
          if (deletion) {
            this.variant.grains.splice(index, 1);
          } else {
            this.variant.grains[index] = ingredient;
          }
        } else {
          this.variant.grains.push(ingredient);
        }
        this.sortIngredients('grains');
        break;
      case 'hops':
        if (toUpdate) {
          const index = this.variant.hops.findIndex(elem => {
            return elem.hopsType._id === toUpdate.hopsType._id;
          });
          if (deletion) {
            this.variant.hops.splice(index, 1);
          } else {
            this.variant.hops[index] = ingredient;
          }
        } else {
          this.variant.hops.push(ingredient);
        }
        this.sortIngredients('hops');
        break;
      case 'yeast':
        if (toUpdate) {
          const index = this.variant.yeast.findIndex(elem => {
            return elem.yeastType._id === toUpdate.yeastType._id;
          });
          if (deletion) {
            this.variant.yeast.splice(index, 1);
          } else {
            this.variant.yeast[index] = ingredient;
          }
        } else {
          this.variant.yeast.push(ingredient);
        }
        this.sortIngredients('yeast');
        break;
      case 'otherIngredients':
        if (toUpdate) {
          const index = this.variant.otherIngredients.findIndex(elem => {
            return elem.name === toUpdate.name;
          });
          if (deletion) {
            this.variant.otherIngredients.splice(index, 1);
          } else {
            this.variant.otherIngredients[index] = ingredient;
          }
        } else {
          this.variant.otherIngredients.push(ingredient);
        }
        break;
      default:
        this.toastService.presentToast(`Unknown ingredient type '${type}'`, 2000, 'middle');
        break;
    }
    this.cdRef.detectChanges();
  }

  /***** End ingredient list *****/


  /***** Other *****/

  /**
   * Handle header nav pop event
   *
   * @params: none
   * @return: none
  **/
  headerNavPopEventHandler(): void {
    this.navCtrl.pop();
  }

  /**
   * Check if a recipe has been created - style must have been changed
   *
   * @params: none
   *
   * @return: true if master style id has been changed from default
  **/
  isRecipeValid(): boolean {
    return this.master.style._id !== defaultStyle()._id;
  }

  /**
   * Map data to RecipeMaster and/or Recipe
   *
   * @params: data - data that may be contained in the RecipeMaster and/or Recipe
   *
   * @return: none
  **/
  updateDisplay(data: any): void {
    for (const key in data) {
      if (this.master.hasOwnProperty(key)) {
        this.master[key] = data[key];
      }
      if (this.variant.hasOwnProperty(key)) {
        this.variant[key] = data[key];
      }
    }
  }

}
