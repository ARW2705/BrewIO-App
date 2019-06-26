import { Component, OnInit, OnDestroy, ViewChildren, QueryList } from '@angular/core';
import { NavController, NavParams, Events, ItemSliding } from 'ionic-angular';

import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { Recipe } from '../../shared/interfaces/recipe';
import { getIndexById } from '../../shared/utility-functions/utilities';

import { RecipeMasterDetailPage } from '../recipe-master-detail/recipe-master-detail';
import { RecipeFormPage } from '../forms/recipe-form/recipe-form';
import { ProcessPage } from '../process/process';

import { UserProvider } from '../../providers/user/user';
import { RecipeProvider } from '../../providers/recipe/recipe';
import { ToastProvider } from '../../providers/toast/toast';

@Component({
  selector: 'page-recipe',
  templateUrl: 'recipe.html'
})
export class RecipePage implements OnInit, OnDestroy {
  @ViewChildren('slidingItems') slidingItems: QueryList<ItemSliding>;
  masterList: Array<RecipeMaster> = null;
  masterRecipeList: Array<Recipe> = null;
  isLoggedIn: boolean = false;
  hasActiveBatch: boolean = false;
  masterIndex: number = -1;
  creationMode: boolean = false;
  _userUpdate: any;
  _newMaster: any;
  _updateRecipe: any;

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    public events: Events,
    public userService: UserProvider,
    public recipeService: RecipeProvider,
    public toastService: ToastProvider) {
      this._userUpdate = this.userUpdateEventHandler.bind(this);
      this._newMaster = this.newMasterEventHandler.bind(this);
      this._updateRecipe = this.updateRecipeEventHandler.bind(this);
  }

  /**
   * Delete a Recipe Master from server
   *
   * @params: master - recipe master to delete
  **/
  deleteMaster(master: RecipeMaster): void {
    if (master.hasActiveBatch) {
      this.toastService.presentToast('Cannot delete a recipe master with a batch in progress', 3000);
    } else {
      this.recipeService.deleteRecipeMasterById(master._id)
        .subscribe(() => {
          const index = getIndexById(master._id, this.masterList);
          if (index !== -1) {
            this.masterList.splice(index, 1);
            this.toastService.presentToast('Recipe master deleted!', 1500);
          }
        });
    }
  }

  /**
   * Expand the accordion for recipe master ingredient table
   *
   * @params: index - index in masterIndex array to expand
  **/
  expandMaster(index: number): void {
    this.masterIndex = this.masterIndex === index ? -1: index;
  }

  // Get list of recipe masters
  getMasterList(): void {
    this.recipeService.getMasterList()
      .subscribe(list => {
        this.masterList = list;
        this.mapMasterRecipes();
      });
  }

  // Close all sliding items on view exit
  ionViewDidLeave() {
    this.slidingItems.forEach(slidingItem => slidingItem.close());
  }

  // Populate recipe master list with each master's designated selected recipe
  mapMasterRecipes(): void {
    this.masterRecipeList = this.masterList.map(master => {
      const selected = master.recipes.find(recipe => {
        return recipe._id === master.master;
      });
      return selected === undefined ? master.recipes[0]: selected;
    });
  }

  /**
   * Navigate to Process Page
   * Update header of navigation event
   * Pass the recipe master, the owner's id, selected recipe's id
   *
   * @params: master - recipe master to use in brew process
  **/
  navToBrewProcess(master: RecipeMaster): void {
    if (this.recipeService.isRecipeProcessPresent(
      master.recipes.find(recipe => recipe._id === master.master)
    )) {
      this.events.publish('update-nav-header', {
        dest: 'process',
        destType: 'page',
        destTitle: master.recipes.find(recipe => recipe._id === master.master).variantName,
        origin: this.navCtrl.getActive().name
      });
      this.navCtrl.push(ProcessPage, {
        master: master,
        requestedUserId: master.owner,
        selectedRecipeId: master.master
      });
    } else {
      this.toastService.presentToast('Recipe missing a process guide!', 2000);
    }
  }

  /**
   * Navigate to Recipe Master details page
   *
   * @params: index - masterList index to send to page
  **/
  navToDetails(index: number): void {
    this.events.publish('update-nav-header', {
      dest: 'process',
      destType: 'page',
      destTitle: this.masterList[index].name,
      origin: this.navCtrl.getActive().name
    });
    this.navCtrl.push(RecipeMasterDetailPage, {master: this.masterList[index]});
  }

  // Navigate to recipe form and publish nav update for header
  navToRecipeForm() {
    this.events.publish('update-nav-header', {
      dest: 'recipe-form',
      destType: 'page',
      destTitle: 'Create Recipe',
      origin: this.navCtrl.getActive().name
    });
    this.navCtrl.push(RecipeFormPage, {formType: 'master', mode: 'create'});
  }

  // 'new-master' event handler
  newMasterEventHandler() {
    this.getMasterList();
  }

  ngOnDestroy() {
    this.events.unsubscribe('update-user', this._userUpdate);
    this.events.unsubscribe('new-master', this._newMaster);
    this.events.unsubscribe('update-recipe', this._updateRecipe);
  }

  ngOnInit() {
    this.isLoggedIn = this.userService.getLoginStatus();
    if (this.isLoggedIn) {
      // TODO check for storage - sync storage and api call
      this.getMasterList();
    } else {
      // TODO check and pull from storage
    }
    this.events.subscribe('update-user', this._userUpdate);
    this.events.subscribe('new-master', this._newMaster);
    this.events.subscribe('update-recipe', this._updateRecipe);
  }

  /**
   * Expand ingredient table accordion of recipe master at given index
   *
   * @params: index - masterList index to expand
  **/
  showExpandedMaster(index: number): boolean {
    return index === this.masterIndex && this.masterList[index].recipes.some(
      recipe => recipe.processSchedule.length > 0
    );
  }

  toggleCreationMode() {
    this.creationMode = !this.creationMode;
  }

  /**
   * 'update-recipe' event handler
   *
   * @params: recipe - updated recipe
  **/
  updateRecipeEventHandler(recipe: Recipe): void {
    const recipeMaster = this.masterList.find(master => {
      return master.recipes.some(_recipe => {
        return _recipe._id === recipe._id;
      });
    });
    const indexToUpdate = recipeMaster.recipes.findIndex(item => item._id === recipe._id);
    recipeMaster.recipes[indexToUpdate] = recipe;
    recipeMaster.master = recipe._id;
    this.mapMasterRecipes();
  }

  // 'update-user' event hanlder
  userUpdateEventHandler(data: any) {
    if (data) {
      this.getMasterList();
    } else {
      this.isLoggedIn = false;
      this.masterList = [];
    }
  }

}
