import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

import { RecipeMaster } from '../../shared/interfaces/recipe-master';

import { RecipeDetailPage } from '../recipe-detail/recipe-detail';

import { RecipeProvider } from '../../providers/recipe/recipe';

@Component({
  selector: 'page-recipe-master-detail',
  templateUrl: 'recipe-master-detail.html',
})
export class RecipeMasterDetailPage {
  private recipeMaster: RecipeMaster = null;
  private hasActiveBatch: boolean = false;

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    private recipeService: RecipeProvider) {
    this.recipeMaster = this.navParams.get('master');
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad RecipeMasterDetailPage');
  }

  navigateToRecipeDetail(index: number) {
    this.navCtrl.push(RecipeDetailPage, {recipe: this.recipeMaster.recipes[index]});
  }

  isMaster(index: number) {
    return this.recipeMaster.recipes[index]._id == this.recipeMaster.master;
  }

  setPublic() {
    this.recipeService.patchRecipeMasterById(this.recipeMaster._id,
      {isPublic: !this.recipeMaster.isPublic})
      .subscribe(response => {
        this.recipeMaster.isPublic = response.isPublic;
      });
  }

}
