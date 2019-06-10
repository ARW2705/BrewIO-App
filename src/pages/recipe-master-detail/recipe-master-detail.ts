import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { NavController, NavParams, Events } from 'ionic-angular';

import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { Recipe } from '../../shared/interfaces/recipe';
import { getIndexById } from '../../shared/utility-functions/utilities';

import { RecipeFormPage } from '../forms/recipe-form/recipe-form';
import { ProcessPage } from '../process/process';

import { RecipeProvider } from '../../providers/recipe/recipe';
import { ToastProvider } from '../../providers/toast/toast';

@Component({
  selector: 'page-recipe-master-detail',
  templateUrl: 'recipe-master-detail.html',
})
export class RecipeMasterDetailPage implements OnInit, OnDestroy {
  title: string = '';
  private recipeMaster: RecipeMaster = null;
  private hasActiveBatch: boolean = false;
  private recipeIndex: number = -1;
  private noteIndex: number = -1;
  private showNotes: boolean = false;
  private showNotesIcon: string = 'arrow-down';
  private deletionInProgress: boolean = false;
  private _updateMaster: any;
  private _addRecipe: any;
  private _updateRecipe: any;
  private _deleteRecipe: any;

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    public events: Events,
    private cdRef: ChangeDetectorRef,
    private recipeService: RecipeProvider,
    private toastService: ToastProvider) {
      this.recipeMaster = this.navParams.get('master');
      this.title = this.recipeMaster.name;
      this._updateMaster = this.updateMasterEventHandler.bind(this);
      this._addRecipe = this.addRecipeEventHandler.bind(this);
      this._updateRecipe = this.updateRecipeEventHandler.bind(this);
      this._deleteRecipe = this.deleteRecipeEventHandler.bind(this);
  }

  /**
   * Event handler for 'add-recipe' event
   *
   * params: Recipe
   * data - new recipe to be added to master
   *
   * return: none
  **/
  private addRecipeEventHandler(data: Recipe): void {
    this.updateSetMaster(data);
    this.recipeMaster.recipes.push(data);
  }

  /**
   * Check if a recipe can be deleted from the recipe master
   * - must have at least one recipe at any time
   *
   * params: none
   *
   * return: boolean
   * - true if there are at least 2 recipes present and requested recipe is not in progress
  **/
  private canDelete(): boolean {
    return  this.recipeMaster.recipes.length > 1
            && !this.deletionInProgress;
  }

  /**
   * Delete a recipe master note
   *
   * params: number
   * index - recipe master note array index to remove
   *
   * return: none
  **/
  private deleteNote(index: number): void {
    this.recipeMaster.notes.splice(index, 1);
    this.recipeService.patchRecipeMasterById(this.recipeMaster._id, {notes: this.recipeMaster.notes})
      .subscribe(response => {
        console.log(response);
      });
  }

  /**
   * Delete a recipe
   *
   * params: Recipe
   * recipe - recipe instance to be deleted
   *
   * return: none
  **/
  private deleteRecipe(recipe: Recipe): void {
    this.deletionInProgress = true;
    this.recipeService.deleteRecipeById(this.recipeMaster._id, recipe._id)
      .subscribe(response => {
        this.toastService.presentToast('Recipe deleted!', 1500);
        this.deletionInProgress = false;
        const index = getIndexById(recipe._id, this.recipeMaster.recipes);
      });
  }

  /**
   * Event handler for 'delete-recipe' event
   *
   * params: object
   * data - contains new recipe id to be set as master
   *
   * return: none
  **/
  private deleteRecipeEventHandler(data: any): void {
    const toUpdate = this.recipeMaster.recipes.find(recipe => recipe._id == data.newMaster._id);
    if (toUpdate) {
      toUpdate.isMaster = true;
    }
  }

  /**
   * Expand note at given index
   *
   * params: number
   * index - note array index to expand
   *
   * return: none
  **/
  private expandNote(index: number): void {
    this.noteIndex = this.noteIndex == index ? -1: index;
  }

  /**
   * Toggle note display and button icon
   *
   * params: none
   *
   * return: none
  **/
  private expandNoteMain(): void {
    this.showNotes = !this.showNotes;
    this.showNotesIcon = this.showNotes ? 'arrow-up': 'arrow-down';
  }

  /**
   * Select recipe variant to expand
   *
   * params: number
   * index - index for variant to expand
   *
   * return: none
  **/
  private expandRecipe(index: number): void {
    this.recipeIndex = this.recipeIndex == index ? -1: index;
  }

  /**
   * Check if recipe as given index is the set master
   *
   * params: number
   * index - recipe array index of given recipe
   *
   * return: boolean
   * - true if recipe at given index is set as the master
  **/
  private isMaster(index: number): boolean {
    return this.recipeMaster.recipes[index]._id == this.recipeMaster.master;
  }

  /**
   * Pass recipe instance to brew process page
   *
   * params: Recipe
   * recipe - recipe to be used for brew process
   *
   * return: none
  **/
  private navToBrewProcess(recipe: Recipe): void {
    if (this.recipeService.isRecipeProcessPresent(recipe)) {
      this.navCtrl.push(ProcessPage, {
        master: this.recipeMaster,
        requestedUserId: this.recipeMaster.owner,
        selectedRecipeId: recipe._id
      });
    } else {
      this.toastService.presentToast('Recipe missing a process guide!', 2000);
    }
  }

  /**
   * Navigate to recipe form with options
   *
   * params: string, [Recipe], [object]
   * formType - either 'master' for RecipeMaster or 'recipe' for Recipe
   * recipe - recipe to update
   * other - additional form configuration data
   *
   * return: none
  **/
  private navToRecipeForm(formType: string, recipe?: Recipe, other?: any): void {
    const options = {
      formType: formType,
      other: other
    };
    if (formType == 'master') {
      options['masterData'] = this.recipeMaster;
      options['mode'] = 'update';
    } else if (formType == 'recipe') {
      options['masterData'] = this.recipeMaster;
      if (recipe) {
        options['recipeData'] = recipe;
        options['mode'] = 'update';
      } else {
        options['mode'] = 'create';
      }
    }
    this.navCtrl.push(RecipeFormPage, options);
  }

  ngOnDestroy() {
    this.events.unsubscribe('update-master', this._updateMaster);
    this.events.unsubscribe('new-recipe', this._addRecipe);
    this.events.unsubscribe('update-recipe', this._updateRecipe);
    this.events.unsubscribe('delete-recipe', this._deleteRecipe);
  }

  ngOnInit() {
    this.events.subscribe('update-master', this._updateMaster);
    this.events.subscribe('new-recipe', this._addRecipe);
    this.events.subscribe('update-recipe', this._updateRecipe);
    this.events.subscribe('delete-recipe', this._deleteRecipe);
  }

  /**
   * Toggle recipe master public property
   *
   * params: none
   *
   * return: none
  **/
  private setPublic(): void {
    this.recipeService.patchRecipeMasterById(this.recipeMaster._id,
      {isPublic: !this.recipeMaster.isPublic})
      .subscribe(response => {
        this.recipeMaster.isPublic = response.isPublic;
      });
  }

  /**
   * Check if note at array index should be shown
   *
   * params: number
   * index - note array index to check
   *
   * return: boolean
   * - true if given index is the selected index to show
  **/
  private showExpandedNote(index: number): boolean {
    return index == this.noteIndex;
  }

  /**
   * Check if recipe variant at given index should be shown
   *
   * params: number
   * index - given index to check
   *
   * return: boolean
   * - true if given index should be shown
  **/
  private showExpandedRecipe(index: number): boolean {
    return index == this.recipeIndex;
  }

  /**
   * Toggle isFavorite property of recipe
   *
   * params: Recipe
   * recipe - Recipe instance to modify
   *
   * return: none
  **/
  private toggleFavorite(recipe: Recipe): void {
    this.recipeService.patchRecipeById(
      this.recipeMaster._id,
      recipe._id,
      {isFavorite: !recipe.isFavorite}
    )
    .subscribe(response => {
      if (response) {
        console.log('set fav', response);
      }
    })
  }

  /**
   * Event handler for 'update-master' event
   *
   * params: RecipeMaster
   * data - updated recipe master
   *
   * return: none
  **/
  private updateMasterEventHandler(data: RecipeMaster): void {
    this.recipeMaster = data;
  }

  /**
   * Navigate to recipe form to update note from array
   *
   * params: number
   * index - array index to update
   *
   * return: none
  **/
  private updateNote(index: number): void {
    this.navToRecipeForm('master', null, {noteIndex: index});
  }

  /**
   * Event handler for 'update-recipe' event
   *
   * params: Recipe
   * data - updated recipe
   *
   * return: none
  **/
  private updateRecipeEventHandler(data: Recipe): void {
    this.updateSetMaster(data);
  }

  /**
   * Update recipe master list item
   *
   * params: Recipe
   * data - updated recipe
   *
   * return: none
  **/
  private updateSetMaster(data: Recipe): void {
    for (let i=0; i < this.recipeMaster.recipes.length; i++) {
      if (data._id == this.recipeMaster.recipes[i]._id) {
        this.recipeMaster.recipes[i] = data;
      } else if (data.isMaster) {
        this.recipeMaster.recipes[i].isMaster = false;
      }
    }
  }

}
