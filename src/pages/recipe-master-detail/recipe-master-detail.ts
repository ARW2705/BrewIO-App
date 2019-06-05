import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { NavController, NavParams, Events } from 'ionic-angular';

import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { Recipe } from '../../shared/interfaces/recipe';
import { getIndexById } from '../../shared/utility-functions/utilities';

import { RecipeFormPage } from '../forms/recipe-form/recipe-form';
import { ProcessPage } from '../process/process';

import { RecipeProvider } from '../../providers/recipe/recipe';

@Component({
  selector: 'page-recipe-master-detail',
  templateUrl: 'recipe-master-detail.html',
})
export class RecipeMasterDetailPage implements OnInit, OnDestroy {
  title:string = '';
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
    private recipeService: RecipeProvider) {
      this.recipeMaster = this.navParams.get('master');
      this.title = this.recipeMaster.name;
      this._updateMaster = this.updateMasterEventHandler.bind(this);
      this._addRecipe = this.addRecipeEventHandler.bind(this);
      this._updateRecipe = this.updateRecipeEventHandler.bind(this);
      this._deleteRecipe = this.deleteRecipeEventHandler.bind(this);
  }

  updateMasterEventHandler(data: any) {
    this.recipeMaster = data;
  }

  addRecipeEventHandler(data: any) {
    this.updateSetMaster(data);
    this.recipeMaster.recipes.push(data);
  }

  updateRecipeEventHandler(data: any) {
    this.updateSetMaster(data);
  }

  deleteRecipeEventHandler(data: any) {
    const toUpdate = this.recipeMaster.recipes.find(recipe => recipe._id == data.newMaster._id);
    if (toUpdate) {
      toUpdate.isMaster = true;
    }
  }

  deleteRecipe(recipe: Recipe) {
    this.deletionInProgress = true;
    this.recipeService.deleteRecipeById(this.recipeMaster._id, recipe._id)
      .subscribe(response => {
        console.log('deleted recipe');
        this.deletionInProgress = false;
        const index = getIndexById(recipe._id, this.recipeMaster.recipes);
      });
  }

  canDelete(): boolean {
    return  this.recipeMaster.recipes.length > 1
            && !this.deletionInProgress;
  }

  expandRecipe(index: number) {
    this.recipeIndex = this.recipeIndex == index ? -1: index;
  }

  toggleFavorite(recipe: Recipe): void {
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

  isMaster(index: number) {
    return this.recipeMaster.recipes[index]._id == this.recipeMaster.master;
  }

  navToBrewProcess(recipe: Recipe) {
    this.navCtrl.push(ProcessPage, {
      master: this.recipeMaster,
      requestedUserId: this.recipeMaster.owner,
      selectedRecipeId: recipe._id
    });
  }

  expandNote(index: number): void {
    this.noteIndex = this.noteIndex == index ? -1: index;
  }

  showExpandedNote(index: number): boolean {
    return index == this.noteIndex;
  }

  navToRecipeForm(formType: string, recipe?: Recipe, other?: any) {
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

  setPublic() {
    this.recipeService.patchRecipeMasterById(this.recipeMaster._id,
      {isPublic: !this.recipeMaster.isPublic})
      .subscribe(response => {
        this.recipeMaster.isPublic = response.isPublic;
      });
  }

  showExpandedRecipe(index: number): boolean {
    return index == this.recipeIndex;
  }

  deleteNote(index: number): void {
    this.recipeMaster.notes.splice(index, 1);
    this.recipeService.patchRecipeMasterById(this.recipeMaster._id, {notes: this.recipeMaster.notes})
      .subscribe(response => {
        console.log(response);
      });
  }

  expandNoteMain() {
    this.showNotes = !this.showNotes;
    this.showNotesIcon = this.showNotes ? 'arrow-up': 'arrow-down';
  }

  updateNote(index: number): void {
    this.navToRecipeForm('master', null, {noteIndex: index});
  }

  updateSetMaster(data: Recipe) {
    for (let i=0; i < this.recipeMaster.recipes.length; i++) {
      if (data._id == this.recipeMaster.recipes[i]._id) {
        this.recipeMaster.recipes[i] = data;
      } else if (data.isMaster) {
        this.recipeMaster.recipes[i].isMaster = false;
      }
    }
  }

}
