import { Component, OnInit } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { NativeStorage } from '@ionic-native/native-storage/ngx';

import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { User } from '../../shared/interfaces/user';

import { RecipeMasterDetailPage } from '../recipe-master-detail/recipe-master-detail';

import { UserProvider } from '../../providers/user/user';
import { RecipeProvider } from '../../providers/recipe/recipe';

@Component({
  selector: 'page-recipe',
  templateUrl: 'recipe.html',
})
export class RecipePage implements OnInit {
  private masterList: Array<RecipeMaster> = null;
  private isLoggedIn: boolean = false;
  private hasActiveBatch: boolean = false;
  private masterIndex: number = -1;

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    private nativeStorage: NativeStorage,
    private userService: UserProvider,
    private recipeService: RecipeProvider) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad RecipePage');
  }

  ngOnInit() {
    this.isLoggedIn = this.userService.getLoginStatus();
    if (this.isLoggedIn) {
      // TODO check for storage - sync storage and api call
      this.recipeService.getMasterList()
        .subscribe(list => {
          this.masterList = list;
        });
    } else {
      // TODO check and pull from storage
    }
  }

  navigateToMasterDetail(index: number) {
    this.navCtrl.push(RecipeMasterDetailPage, {master: this.masterList[index]});
  }

  expandMaster(index: number) {
    this.masterIndex = index;
  }

  showExpandedMaster(index: number): boolean {
    return index == this.masterIndex;
  }

}
