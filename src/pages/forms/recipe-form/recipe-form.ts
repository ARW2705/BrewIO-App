import { Component, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { NavController, NavParams, ModalController, ActionSheetController } from 'ionic-angular';

import { Recipe } from '../../../shared/interfaces/recipe';
import { RecipeMaster } from '../../../shared/interfaces/recipe-master';
import { Grains, Hops, Yeast, Style } from '../../../shared/interfaces/library';
import { HopsSchedule } from '../../../shared/interfaces/hops-schedule';
import { defaultRecipeMaster } from '../../../shared/defaults/default-recipe-master';
import { defaultStyle } from '../../../shared/defaults/default-style';
import { clone } from '../../../shared/utility-functions/utilities';

import { GeneralFormPage } from '../general-form/general-form';
import { ProcessFormPage } from '../process-form/process-form';
import { IngredientFormPage } from '../ingredient-form/ingredient-form';
import { NoteFormPage } from '../note-form/note-form';

import { LibraryProvider } from '../../../providers/library/library';
import { RecipeProvider } from '../../../providers/recipe/recipe';
import { CalculationsProvider } from '../../../providers/calculations/calculations';

@Component({
  selector: 'page-recipe-form',
  templateUrl: 'recipe-form.html',
})
export class RecipeFormPage implements AfterViewInit {
  title: string = '';
  processIcons = {'manual': 'hand', 'timer': 'timer', 'calendar': 'calendar'};
  private isLoaded: boolean = false;
  private formType: string = null;
  private formOptions: any = null;
  private mode: string = null;
  private docMethod: string = '';
  private grainsLibrary: Array<Grains> = null;
  private hopsLibrary: Array<Hops> = null;
  private yeastLibrary: Array<Yeast> = null;
  private styleLibrary: Array<Style> = null;
  private master: RecipeMaster = null;
  private recipe: Recipe = null;
  private textarea = '';
  private updateIndex = -1;

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    private modalCtrl: ModalController,
    private actionCtrl: ActionSheetController,
    private cdRef: ChangeDetectorRef,
    private libraryService: LibraryProvider,
    private recipeService: RecipeProvider,
    private calculator: CalculationsProvider) {
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

  constructPayload(): any {
    let payload;
    if (this.formType == 'master') {
      if (this.docMethod == 'create') {
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
    } else if (this.formType == 'recipe') {
      if (this.docMethod == 'create') {
        console.log(this.recipe);
        payload = this.recipe;
      } else if (this.docMethod == 'update') {
        payload = this.recipe;
      }
    }
    console.log(payload);
    return payload;
  }

  getGristRatio(quantity: number): number {
    return quantity / this.getTotalGristWeight() * 100;
  }

  getIndividualIBU(hops: HopsSchedule): number {
    return this.calculator.getIBU(
      hops.hopsType,
      hops,
      this.recipe.originalGravity,
      this.recipe.batchVolume,
      this.recipe.boilVolume
    );
  }

  getTotalGristWeight(): number {
    let total = 0;
    for (let i=0; i < this.recipe.grains.length; i++) {
      total += this.recipe.grains[i].quantity;
    }
    return total;
  }

  private handleFormOptions(options: any): void {
    if (!options) return;
    console.log('got options', options);
    if (options.hasOwnProperty('noteIndex')) {
      console.log('push to index', options.noteIndex);
      this.openNoteModal('recipe', options.noteIndex);
    }
  }

  isRecipeValid(): boolean {
    return this.master.style._id != defaultStyle._id;
  }

  ngAfterViewInit() {
    this.handleFormOptions(this.formOptions);
  }

  onSubmit() {
    const payload = this.constructPayload();
    if (this.docMethod == 'create') {
      if (this.formType == 'master') {
        this.recipeService.postRecipeMaster(payload)
          .subscribe(response => {
            this.navCtrl.pop();
          });
      } else if (this.formType == 'recipe') {
        this.recipeService.postRecipeToMasterById(this.master._id, payload)
          .subscribe(response => {
            this.navCtrl.pop();
          });
      }
    } else if (this.docMethod == 'update') {
      if (this.formType == 'master') {
        this.recipeService.patchRecipeMasterById(this.master._id, payload)
          .subscribe(response => {
            // TODO map response to master
            // TODO show confirmation
            this.navCtrl.pop();
          });
      } else if (this.formType == 'recipe') {
        this.recipeService.patchRecipeById(this.master._id, this.recipe._id, payload)
          .subscribe(response => {
            this.navCtrl.pop();
          });
      }
    }
  }

  openGeneralModal() {
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
    if (this.mode == 'create' && this.formType == 'master') {
      data['styles'] = this.styleLibrary;
      data.data = null;
    } else if (this.mode == 'update') {
      if (this.formType == 'master') {
        data.data['name'] = this.master.name;
        data['styles'] = this.styleLibrary;
      }
      if (this.formType == 'recipe') {
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

  openIngredientActionSheet() {
    const actionSheet = this.actionCtrl.create({
      title: 'Select an Ingredient',
      buttons: [
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
        },
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            console.log('Action sheet cancelled');
          }
        }
      ]
    });
    actionSheet.present({keyboardClose: false});
  }

  openIngredientFormModal(type: string, toUpdate?: any) {
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
        if (data.hopsType != undefined) {
          this.autoSetProcess('hops-addition', data);
        }
      }
    });
    modal.present({keyboardClose: false});
  }

  private openNoteModal(noteType: string, index?: number): void {
    let toUpdate;
    if (index == undefined) {
      toUpdate = '';
    } else {
      toUpdate = noteType == 'recipe' ? this.master.notes[index]: this.recipe.notes[index];
    }
    const options = {
      noteType: noteType,
      formMethod: index == undefined ? 'create': 'update',
      toUpdate: toUpdate
    };
    const modal = this.modalCtrl.create(NoteFormPage, options);
    modal.onDidDismiss(data => {
      if (data) {
        if (data.method == 'create') {
          if (noteType == 'recipe') {
            this.master.notes.push(data.note);
          } else if (noteType == 'batch') {
            this.recipe.notes.push(data.note);
          }
        } else if (data.method == 'update') {
          if (noteType == 'recipe') {
            this.master.notes[index] = data.note;
          } else if (noteType == 'batch') {
            this.recipe.notes[index] = data.note;
          }
        } else if (data.method == 'delete') {
          if (noteType == 'recipe') {
            this.master.notes.splice(index, 1);
          } else if (noteType == 'batch') {
            this.recipe.notes.splice(index, 1);
          }
        }
      }
    });
    modal.present({keyboardClose: false});
  }

  openProcessActionSheet() {
    const actionSheet = this.actionCtrl.create({
      title: 'Add a process step',
      buttons: [
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
        },
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            console.log('Action sheet cancelled');
          }
        }
      ]
    });
    actionSheet.present({keyboardClose: false});
  }

  openProcessModal(processType: string, toUpdate?: any, index?: number) {
    const options = {
      processType: toUpdate == undefined ? processType: toUpdate.type,
      update: toUpdate,
      formMode: toUpdate == undefined ? 'create': 'update'
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

  setFormTypeConfiguration(formType: string, mode: string, master: RecipeMaster, recipe: Recipe, options: any) {
    console.log(formType, mode, master, recipe);
    this.formType = formType;
    this.formOptions = options;
    this.mode = mode;
    this.docMethod = mode;
    if (formType == 'master') {
      if (mode == 'create') {
        this.title = 'Create a Recipe';
        this.master = clone(defaultRecipeMaster);
        this.recipe = clone(defaultRecipeMaster.recipes[0]);
      } else {
        this.title = `Update ${master.name}`;
        this.master = master;
        this.recipe = master.recipes.find(elem => elem.isMaster);
      }
    } else {
      if (mode == 'create') {
        this.title = `Add Batch to ${master.name}`;
        this.master = master;
        this.recipe = clone(master.recipes.find(elem => elem.isMaster));
        this.recipe.variantName = '< Add Batch Name >';
      } else {
        this.title = `Update ${recipe.variantName}`;
        this.master = master;
        this.recipe = recipe;
      }
    }
  }

  sortIngredients(ingredientType: string) {
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

  updateDisplay(data) {
    for (const key in data) {
      if (this.master.hasOwnProperty(key)) {
        this.master[key] = data[key];
      }
      if (this.recipe.hasOwnProperty(key)) {
        this.recipe[key] = data[key];
      }
    }
  }

  updateIngredientList(ingredient: any, type: string, toUpdate: any, deletion?: any) {
    switch(type) {
      case 'grains':
        if (toUpdate) {
          const index = this.recipe.grains.findIndex(elem => {
            return elem.grainType._id == toUpdate.grainType._id;
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
            return elem.hopsType._id == toUpdate.hopsType._id;
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
            return elem.yeastType._id == toUpdate.yeastType._id;
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
            return elem.name == toUpdate.name;
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

  updateRecipeValues() {
    this.calculator.calculateRecipeValues(this.recipe);
  }

  private autoSetProcess(type: string, data: any): void {
    if (type == 'hops-addition') {
      // remove hops timers
      this.recipe.processSchedule = this.recipe.processSchedule.filter(process => {
        return !process.name.match(/^(Add).*(hops)$/);
      });
      console.log('clear hops timers', this.recipe.processSchedule);

      // add hops timers for each hops instance
      // combine hops additions that occur at the same time
      const hopsForTimers = this.recipe.hops.filter(hops => {
        return !hops.dryHop;
      });
      console.log('gather hops instances', hopsForTimers);

      hopsForTimers.sort((h1, h2) => {
        if (h1.addAt < h2.addAt) {
          return 1;
        } else if (h1.addAt > h2.addAt) {
          return -1;
        }
        return 0;
      });

      console.log('sort hops in order of duration', hopsForTimers);

      hopsForTimers.forEach(hopsAddition => {
        this.recipe.processSchedule.push({
          type: 'timer',
          name: `Add ${hopsAddition.hopsType.name} hops`,
          concurrent: true,
          description: 'Hops addition',
          duration: this.getHopsTimeRemaining(hopsAddition.addAt)
        })
      });

      console.log('add hops timers', this.recipe.processSchedule);
    } else if (type == 'duration') {
      const mashIndex = this.recipe.processSchedule.findIndex(process => {
        return process.name == 'Mash';
      });
      if (mashIndex == -1) {
        // add mash timer
        console.log('duration', data);
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
            this.recipe.processSchedule[mashIndex][key] == data[key];
          }
        }
      }

      const boilIndex = this.recipe.processSchedule.findIndex(process => {
        return process.name == 'Boil';
      });
      if (boilIndex == -1) {
        // add boil timer
        this.recipe.processSchedule.push({
          type: 'timer',
          name: 'Boil',
          description: 'Boil wort',
          duration: data.boilDuration
        });
      } else {
        // update boil timer
        for (const key in this.recipe.processSchedule[boilIndex]) {
          if (data.hasOwnProperty(key)) {
            this.recipe.processSchedule[boilIndex][key] == data[key];
          }
        }
      }
    }
  }

  getHopsTimeRemaining(addAt: number): number {
    const boilTime = this.recipe.processSchedule.find(item => item.name == 'Boil').duration;
    return boilTime - addAt;
  }

}
