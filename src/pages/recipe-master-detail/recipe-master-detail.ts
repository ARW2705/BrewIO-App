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
   * @params: data - new recipe to be added to master
  **/
  addRecipeEventHandler(data: Recipe): void {
    this.updateSetMaster(data);
    this.recipeMaster.recipes.push(data);
  }

  /**
   * Check if a recipe can be deleted from the recipe master
   * - must have at least one recipe at any time
   *
   * @return: true if there are at least 2 recipes present and requested recipe is not in progress
  **/
  canDelete(): boolean {
    return  this.recipeMaster.recipes.length > 1
            && !this.deletionInProgress;
  }

  /**
   * Delete a recipe master note from server
   *
   * @params: index - recipe master note array index to remove
  **/
  deleteNote(index: number): void {
    this.recipeMaster.notes.splice(index, 1);
    this.recipeService.patchRecipeMasterById(this.recipeMaster._id, {notes: this.recipeMaster.notes})
      .subscribe(() => {
        this.toastService.presentToast('Note deleted', 1000);
      });
  }

  /**
   * Delete a recipe from server
   *
   * @params: recipe - recipe instance to be deleted
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
   * 'delete-recipe' event handler
   *
   * @params: data - contains new recipe id to be set as master
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
   * @params: index - note array index to expand
  **/
  expandNote(index: number): void {
    this.noteIndex = this.noteIndex === index ? -1: index;
  }

  // Toggle note display and button icon
  expandNoteMain(): void {
    this.showNotes = !this.showNotes;
    this.showNotesIcon = this.showNotes ? 'arrow-up': 'arrow-down';
  }

  /**
   * Select recipe variant to expand
   *
   * @params: index - index for variant to expand
  **/
  expandRecipe(index: number): void {
    this.recipeIndex = this.recipeIndex === index ? -1: index;
  }

  /**
   * 'pop-header-nav' event handler
   *
   * @params: data - origin that should be loaded after nav pop
  **/
  headerNavPopEventHandler(data: any): void {
    if (data.origin === 'RecipePage') {
      this.navCtrl.pop();
    } else if (data.origin === 'RecipeMasterDetailPage') {
      this.events.publish('update-nav-header', {destTitle: this.recipeMaster.name});
    }
  }

  // Close all sliding items on view exit
  ionViewDidLeave() {
    this.slidingItems.forEach(slidingItem => slidingItem.close());
  }

  /**
   * Check if recipe as given index is the set master
   *
   * @params: index - recipe array index of given recipe
   *
   * @return: true if recipe at given index is set as the master
  **/
  isMaster(index: number): boolean {
    return this.recipeMaster.recipes[index]._id === this.recipeMaster.master;
  }

  /**
   * Pass recipe instance to brew process page
   *
   * @params: recipe - recipe to be used for brew process
  **/
  navToBrewProcess(recipe: Recipe): void {
    if (this.recipeService.isRecipeProcessPresent(recipe)) {
      this.events.publish('update-nav-header', {
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
   * @params: formType - either 'master' for RecipeMaster or 'recipe' for Recipe
   * @params: recipe - recipe to update
   * @params: other - additional form configuration data
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
    this.events.publish('update-nav-header', {
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
    this.events.unsubscribe('pop-header-nav', this._headerNavPop);
  }

  ngOnInit() {
    this.events.subscribe('update-master', this._updateMaster);
    this.events.subscribe('new-recipe', this._addRecipe);
    this.events.subscribe('update-recipe', this._updateRecipe);
    this.events.subscribe('delete-recipe', this._deleteRecipe);
    this.events.subscribe('pop-header-nav', this._headerNavPop);
  }

  // Toggle recipe master public property
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
   * @params: index - note array index to check
   *
   * @return: true if given index is the selected index to show
  **/
  showExpandedNote(index: number): boolean {
    return index === this.noteIndex;
  }

  /**
   * Check if recipe variant at given index should be shown
   *
   * @params: index - given index to check
   *
   * @return: true if given index should be shown
  **/
  showExpandedRecipe(index: number): boolean {
    return index === this.recipeIndex;
  }

  /**
   * Toggle isFavorite property of recipe
   *
   * @params: recipe - Recipe instance to modify
  **/
  toggleFavorite(recipe: Recipe): void {
    this.recipeService.patchRecipeById(
      this.recipeMaster._id,
      recipe._id,
      {isFavorite: !recipe.isFavorite}
    )
    .subscribe(updatedRecipe => {
      if (updatedRecipe) {
        this.toastService.presentToast(`${updatedRecipe.isFavorite ? 'Added to': 'Removed from'} favorites`, 1000);
      }
    });
  }

  /**
   * Event handler for 'update-master' event
   *
   * @params: data - updated recipe master
  **/
  updateMasterEventHandler(data: RecipeMaster): void {
    this.recipeMaster = data;
  }

  /**
   * Navigate to recipe form to update note from array
   *
   * @params: index - array index to update
  **/
  updateNote(index: number): void {
    this.navToRecipeForm('master', null, {noteIndex: index});
  }

  /**
   * Event handler for 'update-recipe' event
   *
   * @params: data - updated recipe
  **/
  updateRecipeEventHandler(data: Recipe): void {
    this.updateSetMaster(data);
  }

  /**
   * Update recipe master list item
   *
   * @params: data - updated recipe
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
