import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { NavController, NavParams, Events } from 'ionic-angular';
import { NativeStorage } from '@ionic-native/native-storage/ngx';

import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { Recipe } from '../../shared/interfaces/recipe';
import { User } from '../../shared/interfaces/user';
import { getIndexById } from '../../shared/utility-functions/utilities';

import { RecipeMasterDetailPage } from '../recipe-master-detail/recipe-master-detail';
import { RecipeFormPage } from '../forms/recipe-form/recipe-form';
import { ProcessPage } from '../process/process';

import { UserProvider } from '../../providers/user/user';
import { RecipeProvider } from '../../providers/recipe/recipe';

@Component({
  selector: 'page-recipe',
  templateUrl: 'recipe.html',
})
export class RecipePage implements OnInit, OnDestroy {
  title: string = 'Recipes';
  private masterList: Array<RecipeMaster> = null;
  private masterRecipeList: Array<Recipe> = null;
  private isLoggedIn: boolean = false;
  private hasActiveBatch: boolean = false;
  private masterIndex: number = -1;
  private creationMode: boolean = false;
  private _onLogin: any;
  private _tabChange: any;
  private _newMaster: any;
  private _updateRecipe: any;

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    private nativeStorage: NativeStorage,
    private events: Events,
    private cdRef: ChangeDetectorRef,
    private userService: UserProvider,
    private recipeService: RecipeProvider) {
      this._onLogin = this.onLoginEventHandler.bind(this);
      this._tabChange = this.tabChangeEventHandler.bind(this);
      this._newMaster = this.newMasterEventHandler.bind(this);
      this._updateRecipe = this.updateRecipeEventHandler.bind(this);
  }

  deleteMaster(master: RecipeMaster) {
    this.recipeService.deleteRecipeMasterById(master._id)
      .subscribe(response => {
        console.log('deleted master', response);
        const index = getIndexById(master._id, this.masterList);
        if (index != -1) {
          this.masterList.splice(index, 1);
        }
      });
  }

  expandMaster(index: number) {
    this.masterIndex = this.masterIndex == index ? -1: index;
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
        return recipe._id == master.master;
      });
      return selected == undefined ? master.recipes[0]: selected;
    });
  }

  navToBrewProcess(master: RecipeMaster) {
    this.navCtrl.push(ProcessPage, {
      master: master,
      requestedUserId: master.owner,
      selectedRecipeId: master.master
    });
  }

  navToDetails(index: number) {
    this.navCtrl.push(RecipeMasterDetailPage, {master: this.masterList[index]});
  }

  navToRecipeForm() {
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
    this.events.subscribe('on-login', this._onLogin);
    this.events.subscribe('tab-change', this._tabChange);
    this.events.subscribe('new-master', this._newMaster);
    this.events.subscribe('update-recipe', this._updateRecipe);
  }

  ngOnDestroy() {
    this.events.unsubscribe('on-login', this._onLogin);
    this.events.unsubscribe('tab-change', this._tabChange);
    this.events.unsubscribe('new-master', this._newMaster);
    this.events.unsubscribe('update-recipe', this._updateRecipe);
  }

  showExpandedMaster(index: number): boolean {
    return index == this.masterIndex;
  }

  toggleCreationMode() {
    this.creationMode = !this.creationMode;
  }

  onLoginEventHandler() {
    this.getMasterList();
  }

  tabChangeEventHandler(data) {
    if (data.dest == 'recipes') {
      console.log('recipe dest');
    }
  }

  newMasterEventHandler() {
    this.getMasterList();
  }

  updateRecipeEventHandler(recipe: Recipe) {
    const recipeMaster = this.masterList.find(master => {
      return master.recipes.some(_recipe => {
        return _recipe._id == recipe._id;
      });
    });
    const indexToUpdate = recipeMaster.recipes.findIndex(item => item._id == recipe._id);
    recipeMaster.recipes[indexToUpdate] = recipe;
    recipeMaster.master = recipe._id;
    this.mapMasterRecipes();
  }

}
