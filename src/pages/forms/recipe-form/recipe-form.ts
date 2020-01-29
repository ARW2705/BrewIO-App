/* Module imports */
import { Component, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { NavController, NavParams, ModalController, Events } from 'ionic-angular';

/* Interface imports */
import { Recipe } from '../../../shared/interfaces/recipe';
import { RecipeMaster } from '../../../shared/interfaces/recipe-master';
import { Grains, Hops, Yeast, Style } from '../../../shared/interfaces/library';
import { HopsSchedule } from '../../../shared/interfaces/hops-schedule';

/* Default imports */
import { defaultRecipeMaster } from '../../../shared/defaults/default-recipe-master';
import { defaultStyle } from '../../../shared/defaults/default-style';

/* Utility function imports */
import { clone, toTitleCase } from '../../../shared/utility-functions/utilities';

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
  recipe: Recipe = null;
  textarea = '';
  _headerNavPop: any;

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    public modalCtrl: ModalController,
    public cdRef: ChangeDetectorRef,
    public events: Events,
    public libraryService: LibraryProvider,
    public recipeService: RecipeProvider,
    public calculator: CalculationsProvider,
    public toastService: ToastProvider,
    public actionService: ActionSheetProvider) {
      this._headerNavPop = this.headerNavPopEventHandler.bind(this);
      this.setFormTypeConfiguration(
        navParams.get('formType'),
        navParams.get('mode'),
        navParams.get('masterData'),
        navParams.get('recipeData'),
        navParams.get('other')
      );
      this.libraryService.getAllLibraries()
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
      mode: this.mode,
      docMethod: this.docMethod,
      data: {
        style: this.master.style,
        brewingType: this.recipe.brewingType,
        mashDuration: this.recipe.mashDuration,
        boilDuration: this.recipe.boilDuration,
        batchVolume: this.recipe.batchVolume,
        boilVolume: this.recipe.boilVolume,
        mashVolume: this.recipe.mashVolume,
        isFavorite: this.recipe.isFavorite,
        isMaster: this.recipe.isMaster
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
      if (this.formType === 'recipe') {
        data.data['variantName'] = this.recipe.variantName;
      }
    }
    const modal = this.modalCtrl.create(GeneralFormPage, data);
    modal.onDidDismiss(data => {
      if (data) {
        this.mode = 'update';
        this.updateDisplay(data);
        this.calculator.calculateRecipeValues(this.recipe);
        this.autoSetProcess('duration', data);
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
        this.calculator.calculateRecipeValues(this.recipe);
        if (data.hopsType !== undefined) {
          this.autoSetProcess('hops-addition', data);
        }
      }
    });
    modal.present({keyboardClose: false});
  }

  /**
   * Open modal to create, edit, or delete a note
   *
   * @params: noteType - 'recipe' for a common note, 'batch' for a variant specific note
   * @params: [index] - the index to edit or delete
   *
   * @return: none
  **/
  openNoteModal(noteType: string, index?: number): void {
    let toUpdate;
    if (index === undefined) {
      toUpdate = '';
    } else {
      toUpdate = noteType === 'recipe' ? this.master.notes[index]: this.recipe.notes[index];
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
          if (noteType === 'recipe') {
            this.master.notes.push(data.note);
          } else if (noteType === 'batch') {
            this.recipe.notes.push(data.note);
          }
        } else if (data.method === 'update') {
          if (noteType === 'recipe') {
            this.master.notes[index] = data.note;
          } else if (noteType === 'batch') {
            this.recipe.notes[index] = data.note;
          }
        } else if (data.method === 'delete') {
          if (noteType === 'recipe') {
            this.master.notes.splice(index, 1);
          } else if (noteType === 'batch') {
            this.recipe.notes.splice(index, 1);
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
          this.recipe.processSchedule.splice(index, 1);
        } else if (data.update) {
          this.recipe.processSchedule[index] = data.update;
        } else {
          this.recipe.processSchedule.push(data);
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
   * Generate timer process step for mash or boil step
   *
   * @params: data - form data containing mash or boil duration
   *
   * @return: none
  **/
  autoSetBoilMashDuration(data: any): void {
    const mashIndex = this.recipe.processSchedule.findIndex(process => {
      return process.name === 'Mash';
    });
    if (mashIndex === -1) {
      // add mash timer
      this.recipe.processSchedule.push({
        type: 'timer',
        name: 'Mash',
        description: 'Mash grains',
        duration: data.mashDuration
      });
    } else {
      // update mash timer
      for (const key in this.recipe.processSchedule[mashIndex]) {
        if (data.hasOwnProperty(key)) {
          this.recipe.processSchedule[mashIndex][key] === data[key];
        }
      }
    }

    const boilIndex = this.recipe.processSchedule.findIndex(process => {
      return process.name === 'Boil';
    });
    if (boilIndex === -1) {
      // add boil timer
      this.recipe.processSchedule.push({
        type: 'timer',
        name: 'Boil',
        description: 'Boil wort',
        duration: data.boilDuration,
        concurrent: true
      });
    } else {
      // update boil timer
      for (const key in this.recipe.processSchedule[boilIndex]) {
        if (data.hasOwnProperty(key)) {
          this.recipe.processSchedule[boilIndex][key] === data[key];
        }
      }
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
    this.recipe.processSchedule = this.recipe.processSchedule.filter(process => {
      return !process.name.match(/^(Add).*(hops)$/);
    });

    // add hops timers for each hops instance
    // ignore dry hop additions
    // combine hops additions that occur at the same time
    const hopsForTimers = this.recipe.hops.filter(hops => {
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
      this.recipe.processSchedule.push({
        type: 'timer',
        name: `Add ${hopsAddition.hopsType.name} hops`,
        concurrent: true,
        description: `Hops addition: ${hopsAddition.quantity} oz`,
        duration: this.getHopsTimeRemaining(hopsAddition.addAt)
      })
    });
  }

  /**
   * Automatically create timer processes for boil/mash and hops addition
   *
   * @params: type - either 'duration' for boil/mash or 'hops-addition' for hops timers
   * @params: data - form data containing durations to use for timer
   *
   * @return: none
  **/
  autoSetProcess(type: string, data: any): void {
    if (type === 'hops-addition') {
      this.autoSetHopsAddition();
    } else if (type === 'duration') {
      this.autoSetBoilMashDuration(data);
    }
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
    const boilStep = this.recipe.processSchedule.find(item => item.name === 'Boil');
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
      this.recipe.originalGravity,
      this.recipe.batchVolume,
      this.recipe.boilVolume
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
    for (let i=0; i < this.recipe.grains.length; i++) {
      total += this.recipe.grains[i].quantity;
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
    this.calculator.calculateRecipeValues(this.recipe);
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
            style: this.master.style._id,
            notes: this.master.notes,
            isPublic: this.master.isPublic,
          },
          recipe: this.recipe
        }
      } else {
        payload = {
          name: this.master.name,
          style: this.master.style._id,
          notes: this.master.notes,
          isPublic: this.master.isPublic
        };
      }
    } else if (this.formType === 'recipe') {
      if (this.docMethod === 'create') {
        payload = this.recipe;
      } else if (this.docMethod === 'update') {
        payload = this.recipe;
      }
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
      this.openNoteModal('recipe', options.noteIndex);
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
   * @params: formType - either 'master' for RecipeMaster or 'recipe' for Recipe
   * @params: mode - CRUD mode
   * @params: master - RecipeMaster instance
   * @params: recipe - Recipe instance
   * @params: options - additional configuration object
   *
   * @return: none
  **/
  setFormTypeConfiguration(
    formType: string,
    mode: string,
    master: RecipeMaster,
    recipe: Recipe,
    options: any
  ): void {
      this.formType = formType;
      this.formOptions = options;
      this.mode = mode;
      this.docMethod = mode;
      if (formType === 'master') {
        if (mode === 'create') {
          this.title = 'Create Recipe';
          this.master = clone(defaultRecipeMaster);
          this.recipe = clone(defaultRecipeMaster.recipes[0]);
        } else {
          this.title = `Update ${master.name}`;
          this.master = master;
          this.recipe = master.recipes.find(elem => elem.isMaster);
        }
      } else {
        if (mode === 'create') {
          this.title = `Add Variant to ${master.name}`;
          this.master = master;
          this.recipe = clone(master.recipes.find(elem => elem.isMaster));
          this.recipe.variantName = '< Add Variant Name >';
        } else {
          this.title = `Update ${recipe.variantName}`;
          this.master = master;
          this.recipe = recipe;
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
        .subscribe(
          () => {
            this.toastService.presentToast(message);
            this.navCtrl.pop();
          },
          error => {
            this.toastService.presentToast(error.error.error.message);
          }
        );
    } else if (this.formType === 'recipe') {
      this.recipeService.postRecipeToMasterById(this.master._id, payload)
        .subscribe(
          () => {
            this.toastService.presentToast(message);
            this.navCtrl.pop();
          },
          error => {
            this.toastService.presentToast(error.error.error.message);
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
      this.recipeService.patchRecipeMasterById(this.master._id, payload)
        .subscribe(
          () => {
            this.toastService.presentToast(message);
            this.navCtrl.pop();
          },
          error => {
            this.toastService.presentToast(error.error.error.message);
          }
        );
    } else if (this.formType === 'recipe') {
      this.recipeService.patchRecipeById(this.master._id, this.recipe._id, payload)
        .subscribe(
          () => {
            this.toastService.presentToast(message);
            this.navCtrl.pop();
          },
          error => {
            this.toastService.presentToast(error.error.error.message);
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
        this.recipe.grains.sort((g1, g2) => {
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
        this.recipe.hops.sort((g1, g2) => {
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
        this.recipe.yeast.sort((g1, g2) => {
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
          const index = this.recipe.grains.findIndex(elem => {
            return elem.grainType._id === toUpdate.grainType._id;
          });
          if (deletion) {
            this.recipe.grains.splice(index, 1);
          } else {
            this.recipe.grains[index] = ingredient;
          }
        } else {
          this.recipe.grains.push(ingredient);
        }
        this.sortIngredients('grains');
        break;
      case 'hops':
        if (toUpdate) {
          const index = this.recipe.hops.findIndex(elem => {
            return elem.hopsType._id === toUpdate.hopsType._id;
          });
          if (deletion) {
            this.recipe.hops.splice(index, 1);
          } else {
            this.recipe.hops[index] = ingredient;
          }
        } else {
          this.recipe.hops.push(ingredient);
        }
        this.sortIngredients('hops');
        break;
      case 'yeast':
        if (toUpdate) {
          const index = this.recipe.yeast.findIndex(elem => {
            return elem.yeastType._id === toUpdate.yeastType._id;
          });
          if (deletion) {
            this.recipe.yeast.splice(index, 1);
          } else {
            this.recipe.yeast[index] = ingredient;
          }
        } else {
          this.recipe.yeast.push(ingredient);
        }
        this.sortIngredients('yeast');
        break;
      case 'otherIngredients':
        if (toUpdate) {
          const index = this.recipe.otherIngredients.findIndex(elem => {
            return elem.name === toUpdate.name;
          });
          if (deletion) {
            this.recipe.otherIngredients.splice(index, 1);
          } else {
            this.recipe.otherIngredients[index] = ingredient;
          }
        } else {
          this.recipe.otherIngredients.push(ingredient);
        }
        break;
      default:
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
    return this.master.style._id !== defaultStyle._id;
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
      if (this.recipe.hasOwnProperty(key)) {
        this.recipe[key] = data[key];
      }
    }
  }

}
