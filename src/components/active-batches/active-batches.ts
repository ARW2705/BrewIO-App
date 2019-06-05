import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavController, Events } from 'ionic-angular';

import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { Recipe } from '../../shared/interfaces/recipe';
import { Batch } from '../../shared/interfaces/batch';
import { User } from '../../shared/interfaces/user';

import { ProcessPage } from '../../pages/process/process';

import { UserProvider } from '../../providers/user/user';
import { RecipeProvider } from '../../providers/recipe/recipe';

@Component({
  selector: 'active-batches',
  templateUrl: 'active-batches.html'
})
export class ActiveBatchesComponent implements OnInit, OnDestroy {
  private activeBatches: Array<Batch> = [];
  private user: User = null;
  private _userUpdate: any;
  private _tabChange: any;
  private _headerNav: any;
  private _updateBatch: any;

  constructor(private navCtrl: NavController,
    private events: Events,
    private userService: UserProvider) {
      this._userUpdate = this.userUpdateEventHandler.bind(this);
      this._tabChange = this.tabChangeEventHandler.bind(this);
      this._headerNav = this.headerNavEventHandler.bind(this);
      this._updateBatch = this.updateBatchEventHandler.bind(this);
      this.user = this.userService.getUser();
      this.getActiveBatches();
  }

  ngOnInit() {
    this.events.subscribe('user-update', this._userUpdate);
    this.events.subscribe('tab-change', this._tabChange);
    this.events.subscribe('header-nav-pop', this._headerNav);
    this.events.subscribe('batch-update', this._updateBatch);
  }

  ngOnDestroy() {
    this.events.unsubscribe('user-update', this._userUpdate);
    this.events.unsubscribe('tab-change', this._tabChange);
    this.events.unsubscribe('header-nav-pop', this._headerNav);
    this.events.unsubscribe('batch-update', this._updateBatch);
  }

  private getActiveBatches(): void {
    if (this.user) {
      this.activeBatches = this.user.inProgressList;
    } else {
      this.activeBatches = [];
    }
  }

  private getBatchName(batch: Batch): string {
    const master = this.getMasterByBatch(batch);
    const recipe = master.recipes.find(recipe => recipe._id == batch.recipe);
    return recipe.variantName;
  }

  private getBatchNextStep(batch: Batch): string {
    // console.log(batch);
    return batch.schedule[batch.currentStep].name;
  }

  private getBatchStartDate(batch: Batch): string {
    // console.log(batch);
    return batch.createdAt;
  }

  private getMasterByBatch(batch: Batch): RecipeMaster {
    const master = this.user.masterList.find(master => {
      return master.recipes.some(recipe => {
        return recipe._id == batch.recipe;
      });
    });
    return master;
  }

  private getRecipeName(batch: Batch): string {
    const master = this.getMasterByBatch(batch);
    return master ? master.name: 'Missing master';
  }

  navToBrewProcess(batch: Batch) {
    const master = this.getMasterByBatch(batch);
    if (master) {
      this.navCtrl.push(ProcessPage, {
        master: master,
        requestedUserId: master.owner,
        selectedRecipeId: master.master,
        selectedBatchId: batch._id
      });
    } else {
      // TODO error finding master
    }
  }

  private userUpdateEventHandler(user: User): void {
    this.user = user;
    this.getActiveBatches();
  }

  private tabChangeEventHandler(tab: any): void {
    this.getActiveBatches();
  }

  private headerNavEventHandler(pageName: string): void {

  }

  private updateBatchEventHandler(data: any): void {
    if (data.type == 'end') {
      this.userService.updateUserInProgressList(data.data);
    }
  }

}
