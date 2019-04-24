import { Component, ChangeDetectorRef } from '@angular/core';
import { NavController, NavParams, ModalController, ActionSheetController } from 'ionic-angular';
import { FormGroup, FormBuilder, FormControl, FormArray } from '@angular/forms';

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

import { LibraryProvider } from '../../../providers/library/library';
import { RecipeProvider } from '../../../providers/recipe/recipe';
import { CalculationsProvider } from '../../../providers/calculations/calculations';

@Component({
  selector: 'page-recipe-form',
  templateUrl: 'recipe-form.html',
})
export class RecipeFormPage {
  title: string = '';
  processIcons = {'manual': 'hand', 'timer': 'timer', 'calendar': 'calendar'};
  private formType: string = null;
  private mode: string = null;
  private docMethod: string = '';
  private noteForm: FormGroup;
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
    private formBuilder: FormBuilder,
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
      navParams.get('recipeData')
    );
    this.libraryService.getAllLibraries()
      .subscribe(([grainsLibrary, hopsLibrary, yeastLibrary, styleLibrary]) => {
        this.grainsLibrary = grainsLibrary;
        this.hopsLibrary = hopsLibrary;
        this.yeastLibrary = yeastLibrary;
        this.styleLibrary = styleLibrary;
        this.initForm();
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
            notes: this.noteForm.value.recipeNotes,
            isPublic: this.master.isPublic,
          },
          recipe: this.recipe
        }
      } else {
        payload = {
          name: this.master.name,
          style: this.master.style._id,
          notes: this.noteForm.value.recipeNotes,
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
    return payload;
  }

  deleteNote(area: string) {
    const control = <FormArray>this.noteForm.controls[`${area}Notes`];
    control.removeAt(this.updateIndex);
    this.noteForm.get(`${area}NoteTextArea`).reset();
    this.textarea = '';
    if (area == 'recipe') {
      this.master.notes = this.noteForm.value.recipeNotes;
    } else {
      this.recipe.notes = this.noteForm.value.batchNotes;
    }
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

  initForm() {
    this.noteForm = this.formBuilder.group({
      recipeNotes: this.formBuilder.array([]),
      recipeNoteTextArea: [''],
      batchNotes: this.formBuilder.array([]),
      batchNoteTextArea: [''],
    });
  }

  isRecipeValid(): boolean {
    return this.master.style._id != defaultStyle._id;
  }

  onSubmit() {
    const payload = this.constructPayload();
    if (this.docMethod == 'create') {
      if (this.formType == 'master') {
        this.recipeService.postRecipeMaster(payload)
          .subscribe(response => {
            this.resetFields();
            this.navCtrl.pop();
          });
      } else if (this.formType == 'recipe') {
        this.recipeService.postRecipeToMasterById(this.master._id, payload)
          .subscribe(response => {
            this.resetFields();
            this.navCtrl.pop();
          });
      }
    } else if (this.docMethod == 'update') {
      if (this.formType == 'master') {
        this.recipeService.patchRecipeMasterById(this.master._id, payload)
          .subscribe(response => {
            this.resetFields();
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
      data: null
    };
    if (this.mode == 'create') {
      if (this.formType == 'master') {
        data['styles'] = this.styleLibrary;
      } else if (this.formType == 'recipe') {
        data.data = {
          style: this.master.style,
          brewingType: this.recipe.brewingType,
          batchVolume: this.recipe.batchVolume,
          boilVolume: this.recipe.boilVolume,
          mashVolume: this.recipe.mashVolume,
          isFavorite: this.recipe.isFavorite,
          isMaster: this.recipe.isMaster
        }
      }
    } else if (this.mode == 'update') {
      data.data = {
        style: this.master.style,
        brewingType: this.recipe.brewingType,
        batchVolume: this.recipe.batchVolume,
        boilVolume: this.recipe.boilVolume,
        mashVolume: this.recipe.mashVolume,
        isFavorite: this.recipe.isFavorite,
        isMaster: this.recipe.isMaster
      }
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
        this.updateFormAndDisplay(data);
        this.calculator.calculateRecipeValues(this.recipe);
      }
    });
    modal.present();
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
    actionSheet.present();
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
      }
    });
    modal.present();
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
    actionSheet.present();
  }

  openProcessModal(processType: string, toUpdate?: any, index?: number) {
    const options = {
      processType: toUpdate == undefined ? processType: toUpdate.type,
      update: toUpdate,
      formMode: toUpdate == undefined ? 'create': 'update'
    };
    console.log('process', options);
    const modal = this.modalCtrl.create(ProcessFormPage, options);
    modal.onDidDismiss(data => {
      if (data) {
        console.log(data);
        if (data.delete) {
          this.recipe.processSchedule.splice(index, 1);
        } else if (data.update) {
          this.recipe.processSchedule[index] = data.update;
        } else {
          this.recipe.processSchedule.push(data);
        }
      }
    });
    modal.present();
  }

  resetFields() {
    this.noteForm.reset();
    this.master = clone(defaultRecipeMaster);
    this.recipe = clone(defaultRecipeMaster.recipes[0]);
  }

  setFormTypeConfiguration(formType: string, mode: string, master: RecipeMaster, recipe: Recipe) {
    console.log(formType, mode, master, recipe);
    this.formType = formType;
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

  submitNote(area: string) {
    const control = <FormArray>this.noteForm.controls[`${area}Notes`];
    if (this.updateIndex != -1) {
      control.at(this.updateIndex).setValue(this.noteForm.get(`${area}NoteTextArea`).value);
      this.textarea = '';
      if (area == 'recipe') {
        this.master.notes[this.updateIndex] = this.noteForm.value.recipeNotes[this.updateIndex];
      } else {
        this.recipe.notes[this.updateIndex] = this.noteForm.value.batchNotes[this.updateIndex];
      }
      this.updateIndex = -1;
    } else {
      control.push(new FormControl(this.noteForm.get(`${area}NoteTextArea`).value))
      if (area == 'recipe') {
        this.master.notes.push(this.noteForm.get('recipeNoteTextArea').value);
      } else {
        this.recipe.notes.push(this.noteForm.get('batchNoteTextArea').value);
      }
    }
    this.noteForm.get(`${area}NoteTextArea`).reset();
  }

  toggleNoteTextarea(area: string, index?: number) {
    if (index != undefined) {
      this.updateIndex = index;
      const control = <FormArray>this.noteForm.controls[`${area}Notes`];
      const text = control.at(index).value;
      this.noteForm.controls[`${area}NoteTextArea`].setValue(text);
      this.textarea = area;
    } else {
      this.updateIndex = -1;
      this.textarea = this.textarea != area ? area: '';
    }
  }

  updateFormAndDisplay(data: FormGroup) {
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

}
