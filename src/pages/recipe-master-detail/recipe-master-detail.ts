import { Component, OnInit, OnDestroy, ViewChildren, QueryList } from '@angular/core';
import { NavController, NavParams, Events, ItemSliding } from 'ionic-angular';

import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { Recipe } from '../../shared/interfaces/recipe';

import { RecipeFormPage } from '../forms/recipe-form/recipe-form';
import { ProcessPage } from '../process/process';

import { RecipeProvider } from '../../providers/recipe/recipe';
import { ToastProvider } from '../../providers/toast/toast';

@Component({
  selector: 'page-recipe-master-detail',
  templateUrl: 'recipe-master-detail.html',
})
export class RecipeMasterDetailPage implements OnInit, OnDestroy {
  @ViewChildren('slidingItems') slidingItems: QueryList<ItemSliding>;
  recipeMaster: RecipeMaster = null;
  hasActiveBatch: boolean = false;
  recipeIndex: number = -1;
  noteIndex: number = -1;
  showNotes: boolean = false;
  showNotesIcon: string = 'arrow-down';
  deletionInProgress: boolean = false;
  _updateMaster: any;
  _addRecipe: any;
  _updateRecipe: any;
  _deleteRecipe: any;
  _headerNavPop: any;

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    public events: Events,
    public recipeService: RecipeProvider,
    public toastService: ToastProvider) {
      this.recipeMaster = this.navParams.get('master');
      this.events.publish('nav-update', {dest: 'recipe-master', destType: 'page', destTitle: this.recipeMaster.name});
      this._updateMaster = this.updateMasterEventHandler.bind(this);
      this._addRecipe = this.addRecipeEventHandler.bind(this);
      this._updateRecipe = this.updateRecipeEventHandler.bind(this);
      this._deleteRecipe = this.deleteRecipeEventHandler.bind(this);
      this._headerNavPop = this.headerNavPopEventHandler.bind(this);
  }

  /**
   * Event handler for 'add-recipe' event
   *
   * params: Recipe
   * data - new recipe to be added to master
   *
   * return: none
  **/
  addRecipeEventHandler(data: Recipe): void {
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
  canDelete(): boolean {
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
  deleteNote(index: number): void {
    this.recipeMaster.notes.splice(index, 1);
    this.recipeService.patchRecipeMasterById(this.recipeMaster._id, {notes: this.recipeMaster.notes})
      .subscribe(() => {
        this.toastService.presentToast('Note deleted', 1000);
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
  deleteRecipe(recipe: Recipe): void {
    this.deletionInProgress = true;
    this.recipeService.deleteRecipeById(this.recipeMaster._id, recipe._id)
      .subscribe(() => {
        this.toastService.presentToast('Recipe deleted!', 1500);
        this.deletionInProgress = false;
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
  deleteRecipeEventHandler(data: any): void {
    const toUpdate = this.recipeMaster.recipes.find(recipe => recipe._id === data.newMaster._id);
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
  expandNote(index: number): void {
    this.noteIndex = this.noteIndex === index ? -1: index;
  }

  /**
   * Toggle note display and button icon
   *
   * params: none
   *
   * return: none
  **/
  expandNoteMain(): void {
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
  expandRecipe(index: number): void {
    this.recipeIndex = this.recipeIndex === index ? -1: index;
  }

  headerNavPopEventHandler(data: any): void {
    if (data.origin === 'RecipePage') {
      this.navCtrl.pop();
    } else if (data.origin === 'RecipeMasterDetailPage') {
      this.events.publish('header-nav-update', {destTitle: this.recipeMaster.name});
    }
  }

  ionViewDidLeave() {
    this.slidingItems.forEach(slidingItem => slidingItem.close());
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
  isMaster(index: number): boolean {
    return this.recipeMaster.recipes[index]._id === this.recipeMaster.master;
  }

  /**
   * Pass recipe instance to brew process page
   *
   * params: Recipe
   * recipe - recipe to be used for brew process
   *
   * return: none
  **/
  navToBrewProcess(recipe: Recipe): void {
    if (this.recipeService.isRecipeProcessPresent(recipe)) {
      this.events.publish('header-nav-update', {
        dest: 'process',
        destType: 'page',
        destTitle: recipe.variantName,
        origin: this.navCtrl.getActive().name
      });
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
  navToRecipeForm(formType: string, recipe?: Recipe, other?: any): void {
    const options = {
      formType: formType,
      other: other
    };
    let title;
    if (formType === 'master') {
      options['masterData'] = this.recipeMaster;
      options['mode'] = 'update';
      title = 'Update Recipe';
    } else if (formType === 'recipe') {
      options['masterData'] = this.recipeMaster;
      if (recipe) {
        options['recipeData'] = recipe;
        options['mode'] = 'update';
        title = 'Update Variant'
      } else {
        options['mode'] = 'create';
        title = 'Add a Variant';
      }
    }
    this.events.publish('header-nav-update', {
      dest: 'recipe-form',
      destType: 'page',
      destTitle: title,
      origin: this.navCtrl.getActive().name
    });
    this.navCtrl.push(RecipeFormPage, options);
  }

  ngOnDestroy() {
    this.events.unsubscribe('update-master', this._updateMaster);
    this.events.unsubscribe('new-recipe', this._addRecipe);
    this.events.unsubscribe('update-recipe', this._updateRecipe);
    this.events.unsubscribe('delete-recipe', this._deleteRecipe);
    this.events.unsubscribe('header-nav-pop', this._headerNavPop);
  }

  ngOnInit() {
    this.events.subscribe('update-master', this._updateMaster);
    this.events.subscribe('new-recipe', this._addRecipe);
    this.events.subscribe('update-recipe', this._updateRecipe);
    this.events.subscribe('delete-recipe', this._deleteRecipe);
    this.events.subscribe('header-nav-pop', this._headerNavPop);
  }

  /**
   * Toggle recipe master public property
   *
   * params: none
   *
   * return: none
  **/
  setPublic(): void {
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
  showExpandedNote(index: number): boolean {
    return index === this.noteIndex;
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
  showExpandedRecipe(index: number): boolean {
    return index === this.recipeIndex;
  }

  /**
   * Toggle isFavorite property of recipe
   *
   * params: Recipe
   * recipe - Recipe instance to modify
   *
   * return: none
  **/
  toggleFavorite(recipe: Recipe): void {
    this.recipeService.patchRecipeById(
      this.recipeMaster._id,
      recipe._id,
      {isFavorite: !recipe.isFavorite}
    )
    .subscribe(response => {
      if (response) {
        // TODO show feedback toast
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
  updateMasterEventHandler(data: RecipeMaster): void {
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
  updateNote(index: number): void {
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
  updateRecipeEventHandler(data: Recipe): void {
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
  updateSetMaster(data: Recipe): void {
    for (let i=0; i < this.recipeMaster.recipes.length; i++) {
      if (data._id === this.recipeMaster.recipes[i]._id) {
        this.recipeMaster.recipes[i] = data;
      } else if (data.isMaster) {
        this.recipeMaster.recipes[i].isMaster = false;
      }
    }
  }

}
