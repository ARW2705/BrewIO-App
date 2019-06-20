import { Component, OnInit, OnDestroy, ViewChildren, QueryList } from '@angular/core';
import { NavController, Events, ItemSliding } from 'ionic-angular';

import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { Batch } from '../../shared/interfaces/batch';
import { User } from '../../shared/interfaces/user';

import { ProcessPage } from '../../pages/process/process';

import { UserProvider } from '../../providers/user/user';

@Component({
  selector: 'active-batches',
  templateUrl: 'active-batches.html'
})
export class ActiveBatchesComponent implements OnInit, OnDestroy {
  @ViewChildren('slidingItems') slidingItems: QueryList<ItemSliding>;
  activeBatches: Array<Batch> = [];
  user: User = null;
  _userUpdate: any;
  _headerNavUpdate: any;
  _updateBatch: any;

  constructor(public navCtrl: NavController,
    public events: Events,
    public userService: UserProvider) {
      this._userUpdate = this.userUpdateEventHandler.bind(this);
      this._headerNavUpdate = this.headerNavUpdateEventHandler.bind(this);
      this._updateBatch = this.updateBatchEventHandler.bind(this);
      this.user = this.userService.getUser();
      this.getActiveBatches();
  }

  ngOnInit() {
    this.events.subscribe('user-update', this._userUpdate);
    this.events.subscribe('header-nav-update', this._headerNavUpdate);
    this.events.subscribe('batch-update', this._updateBatch);
  }

  ngOnDestroy() {
    this.events.unsubscribe('user-update', this._userUpdate);
    this.events.unsubscribe('header-nav-update', this._headerNavUpdate);
    this.events.unsubscribe('batch-update', this._updateBatch);
  }

  getActiveBatches(): void {
    if (this.user) {
      this.activeBatches = this.user.inProgressList;
    } else {
      this.activeBatches = [];
    }
  }

  getBatchName(batch: Batch): string {
    const master = this.getMasterByBatch(batch);
    const recipe = master.recipes.find(recipe => recipe._id === batch.recipe);
    return recipe.variantName;
  }

  getBatchNextStep(batch: Batch): string {
    return batch.schedule[batch.currentStep].name;
  }

  getBatchStartDate(batch: Batch): string {
    return batch.createdAt;
  }

  getMasterByBatch(batch: Batch): RecipeMaster {
    const master = this.user.masterList.find(master => {
      return master.recipes.some(recipe => {
        return recipe._id === batch.recipe;
      });
    });
    return master;
  }

  getRecipeName(batch: Batch): string {
    const master = this.getMasterByBatch(batch);
    return master ? master.name: 'Missing master';
  }

  ionViewDidLeave() {
    this.slidingItems.forEach(slidingItem => slidingItem.close());
  }

  navToBrewProcess(batch: Batch): void {
    const master = this.getMasterByBatch(batch);
    if (master) {
      this.events.publish('header-nav-update', {
        dest: 'process',
        destType: 'page',
        destTitle: master.recipes.find(recipe => recipe._id === batch.recipe).variantName,
        origin: this.navCtrl.getActive().name
      });
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

  userUpdateEventHandler(user: User): void {
    console.log('user update', user);
    this.user = user;
    this.getActiveBatches();
  }

  headerNavUpdateEventHandler(data: any): void {
    if (data.destType === 'tab') {
      this.getActiveBatches();
    }
  }

  updateBatchEventHandler(data: any): void {
    if (data.type === 'end') {
      this.userService.updateUserInProgressList(data.data);
    }
  }

}
