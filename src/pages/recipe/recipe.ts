import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
export class RecipePage implements OnInit {
  title: string = 'Recipes';
  private masterList: Array<RecipeMaster> = null;
  private masterRecipeList: Array<Recipe> = null;
  private isLoggedIn: boolean = false;
  private hasActiveBatch: boolean = false;
  private masterIndex: number = -1;
  private creationMode: boolean = false;

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    private nativeStorage: NativeStorage,
    private events: Events,
    private cdRef: ChangeDetectorRef,
    private userService: UserProvider,
    private recipeService: RecipeProvider) {
      events.subscribe('on-login', () => {
        this.getMasterList();
      });
      events.subscribe('tab-change', data => {
        if (data.dest == 'recipes') {
          console.log('recipe dest');
        }
      })
      events.subscribe('new-master', master => {
        this.getMasterList();
      });
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
    this.navCtrl.push(ProcessPage, {master: master, selected: master.master});
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
  }

  showExpandedMaster(index: number): boolean {
    return index == this.masterIndex;
  }

  toggleCreationMode() {
    this.creationMode = !this.creationMode;
  }

}
