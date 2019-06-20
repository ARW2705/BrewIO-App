import { Component, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { NavController, NavParams, ModalController, Events } from 'ionic-angular';

import { Recipe } from '../../../shared/interfaces/recipe';
import { RecipeMaster } from '../../../shared/interfaces/recipe-master';
import { Grains, Hops, Yeast, Style } from '../../../shared/interfaces/library';
import { HopsSchedule } from '../../../shared/interfaces/hops-schedule';
import { defaultRecipeMaster } from '../../../shared/defaults/default-recipe-master';
import { defaultStyle } from '../../../shared/defaults/default-style';
import { clone, toTitleCase } from '../../../shared/utility-functions/utilities';

import { GeneralFormPage } from '../general-form/general-form';
import { ProcessFormPage } from '../process-form/process-form';
import { IngredientFormPage } from '../ingredient-form/ingredient-form';
import { NoteFormPage } from '../note-form/note-form';

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

  /**
   * Generate timer process step for mash or boil
   *
   * params: object
   * data - form data containing mash or boil duration
   *
   * return: none
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
   * params: object
   * data - form data containing hops addition time
   *
   * return: none
  **/
  autoSetHopsAddition(data: any): void {
    // remove hops timers
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
   * params: string, object
   * type - either 'duration' for boil/mash or 'hops-addition' for hops timers
   * data - form data containing durations to use for timer
   *
   * return: none
  **/
  autoSetProcess(type: string, data: any): void {
    if (type === 'hops-addition') {
      this.autoSetHopsAddition(data);
    } else if (type === 'duration') {
      this.autoSetBoilMashDuration(data);
    }
  }

  /**
   * Format form data for server request
   *
   * params: none
   *
   * return: object
   * - structured form data for http request
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
   * Get grains quantity percentage of total
   *
   * params: number
   * quantity - grain weight
   *
   * return: number
   * - percentage of total quantity for given quantity
  **/
  getGristRatio(quantity: number): number {
    return quantity / this.getTotalGristWeight() * 100;
  }

  /**
   * Get time remaining after subtracting addAt time from boil time
   *
   * params: number
   * addAt - time to add hops at in minutes
   *
   * return: number
   * - difference between boil time and addAt time point
  **/
  getHopsTimeRemaining(addAt: number): number {
    const boilStep = this.recipe.processSchedule.find(item => item.name === 'Boil');
    const boilTime = boilStep ? boilStep.duration: 60;
    return boilTime - addAt;
  }

  /**
   * Calculate the individual IBU contribution of a hops instances
   *
   * params: HopsSchedule
   * hops - an individual hops addition
   *
   * return: number
   * - IBU contribution of given hops addition
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
   * Sum total grain weight
   *
   * params: none
   *
   * return: number
   * - sum of all recipe grain bill quantities
  **/
  getTotalGristWeight(): number {
    let total = 0;
    for (let i=0; i < this.recipe.grains.length; i++) {
      total += this.recipe.grains[i].quantity;
    }
    return total;
  }

  /**
   * Open note modal for editing
   *
   * params: object
   * options - form options to edit existing note
   *
   * return: none
  **/
  handleFormOptions(options: any): void {
    if (!options) return;
    if (options.hasOwnProperty('noteIndex')) {
      this.openNoteModal('recipe', options.noteIndex);
    }
  }

  headerNavPopEventHandler(): void {
    this.navCtrl.pop();
  }

  /**
   * Check if a recipe has been created - style must have been changed
   *
   * params: none
   *
   * return: boolean
   * - true if master style id has been changed from default
  **/
  isRecipeValid(): boolean {
    return this.master.style._id !== defaultStyle._id;
  }

  ngAfterViewInit() {
    this.handleFormOptions(this.formOptions);
  }

  ngOnDestroy() {
    this.events.unsubscribe('header-nav-pop', this._headerNavPop);
  }

  ngOnInit() {
    this.events.subscribe('header-nav-pop', this._headerNavPop);
  }

  /**
   * Call appropriate HTTP request with recipe form data
   *
   * params: none
   *
   * return: none
  **/
  onSubmit(): void {
    const payload = this.constructPayload();
    const message = toTitleCase(`${this.formType} ${this.docMethod} Successful!`);
    if (this.docMethod === 'create') {
      if (this.formType === 'master') {
        this.recipeService.postRecipeMaster(payload)
          .subscribe(
            response => {
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
            response => {
              this.toastService.presentToast(message);
              this.navCtrl.pop();
            },
            error => {
              this.toastService.presentToast(error.error.error.message);
            }
          );
      }
    } else if (this.docMethod === 'update') {
      if (this.formType === 'master') {
        this.recipeService.patchRecipeMasterById(this.master._id, payload)
          .subscribe(
            response => {
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
            response => {
              this.toastService.presentToast(message);
              this.navCtrl.pop();
            },
            error => {
              this.toastService.presentToast(error.error.error.message);
            }
          );
      }
    }
  }

  /**
   * Open general recipe form modal - pass current data for update, if present
   *
   * params: none
   *
   * return: none
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
   * Open ingredient form action sheet to select ingredient type to modify
   *
   * params: none
   *
   * return: none
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
   * Open modal to create, edit, or delete specified ingredient type
   *
   * params: string, [object]
   * type - the ingredient type
   * toUpdate - current ingredient data to edit or delete
   *
   * return: none
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
   * params: string, [number]
   * noteType - 'recipe' for a common note, 'batch' for a variant specific note
   * index - the index to edit or delete
   *
   * return: none
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
   * Open action sheet to select the type of process step to add
   *
   * params: none
   *
   * return: none
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

  /**
   * Open modal to create, edit, or delete specified process step type
   *
   * params: string, [object], [number]
   * processType - the step type, either 'manual', 'timer', or 'calendar'
   * toUpdate - current step data to be edited or deleted
   * index - index of step
   *
   * return: none
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

  /**
   * Set form configuration from nav params
   *
   * params: string, string, RecipeMaster, Recipe, object
   * formType - either 'master' for RecipeMaster or 'recipe' for Recipe
   * mode - CRUD mode
   * master - RecipeMaster instance
   * recipe - Recipe instance
   * options - additional configuration object
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
   * Sort ingredient array in the following orders:
   * - grains: descending quantity
   * - hops: chronological
   * - yeast: descending quantity
   *
   * params: string
   * ingredientType - the ingredient array to sort
   *
   * return: none
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
   * Map data to RecipeMaster and/or Recipe
   *
   * params: object
   * data - contains data that may be contained in the RecipeMaster and/or Recipe
   *
   * return: none
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

  /**
   * Update in memory ingredient arrays
   *
   * params: object, string, [object], [boolean]
   * ingredient - ingredient data returned from ingredient form
   * type - the ingredient type
   * toUpdate - current ingredient data to edit
   * deletion - true if ingredient is to be deleted
   *
   * return: none
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

  /**
   * Calculate recipe values
   *
   * params: none
   *
   * return: none
  **/
  updateRecipeValues(): void {
    this.calculator.calculateRecipeValues(this.recipe);
  }

}
