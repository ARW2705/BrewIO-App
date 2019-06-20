import { Component, OnInit, OnDestroy, ViewChildren, QueryList } from '@angular/core';
import { NavController, NavParams, Events, ItemSliding } from 'ionic-angular';

import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { Recipe } from '../../shared/interfaces/recipe';
import { User } from '../../shared/interfaces/user';
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

  deleteMaster(master: RecipeMaster) {
    console.log('delete master', master);
    if (master.hasActiveBatch) {
      console.log('cannot delete');
      // TODO toast cannot delete a master with active batch
    } else {
      this.recipeService.deleteRecipeMasterById(master._id)
        .subscribe(response => {
          const index = getIndexById(master._id, this.masterList);
          if (index !== -1) {
            this.masterList.splice(index, 1);
            this.toastService.presentToast('Recipe master deleted!', 1500);
          }
        });
    }
  }

  expandMaster(index: number) {
    this.masterIndex = this.masterIndex === index ? -1: index;
  }

  ionViewDidLeave() {
    this.slidingItems.forEach(slidingItem => slidingItem.close());
  }

  getMasterList() {
    this.recipeService.getMasterList()
      .subscribe(list => {
        this.masterList = list;
        this.mapMasterRecipes();
      });
  }

  mapMasterRecipes() {
    this.masterRecipeList = this.masterList.map(master => {
      const selected =  master.recipes.find(recipe => {
        return recipe._id === master.master;
      });
      return selected === undefined ? master.recipes[0]: selected;
    });
  }

  navToBrewProcess(master: RecipeMaster) {
    if (this.recipeService.isRecipeProcessPresent(
      master.recipes.find(recipe => recipe._id === master.master)
    )) {
      this.events.publish('header-nav-update', {
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

  navToDetails(index: number) {
    this.events.publish('header-nav-update', {
      dest: 'process',
      destType: 'page',
      destTitle: this.masterList[index].name,
      origin: this.navCtrl.getActive().name
    });
    this.navCtrl.push(RecipeMasterDetailPage, {master: this.masterList[index]});
  }

  navToRecipeForm() {
    this.events.publish('header-nav-update', {
      dest: 'recipe-form',
      destType: 'page',
      destTitle: 'Create Recipe',
      origin: this.navCtrl.getActive().name
    });
    this.navCtrl.push(RecipeFormPage, {formType: 'master', mode: 'create'});
  }

  ngOnInit() {
    this.isLoggedIn = this.userService.getLoginStatus();
    if (this.isLoggedIn) {
      // TODO check for storage - sync storage and api call
      this.getMasterList();
    } else {
      // TODO check and pull from storage
    }
    this.events.subscribe('user-update', this._userUpdate);
    this.events.subscribe('new-master', this._newMaster);
    this.events.subscribe('update-recipe', this._updateRecipe);
  }

  ngOnDestroy() {
    this.events.unsubscribe('user-update', this._userUpdate);
    this.events.unsubscribe('new-master', this._newMaster);
    this.events.unsubscribe('update-recipe', this._updateRecipe);
  }

  showExpandedMaster(index: number): boolean {
    return index === this.masterIndex && this.masterList[index].recipes.some(
      recipe => recipe.processSchedule.length > 0
    );
  }

  toggleCreationMode() {
    this.creationMode = !this.creationMode;
  }

  userUpdateEventHandler(data: any) {
    if (data) {
      this.getMasterList();
    }
  }

  newMasterEventHandler() {
    this.getMasterList();
  }

  updateRecipeEventHandler(recipe: Recipe) {
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

}
