import { Component, OnInit, OnDestroy, ViewChildren, QueryList } from '@angular/core';
import { NavController, Events, ItemSliding } from 'ionic-angular';

import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { Batch } from '../../shared/interfaces/batch';
import { User } from '../../shared/interfaces/user';

import { ProcessPage } from '../../pages/process/process';

import { UserProvider } from '../../providers/user/user';
import { ToastProvider } from '../../providers/toast/toast';

@Component({
  selector: 'active-batches',
  templateUrl: 'active-batches.html'
})
export class ActiveBatchesComponent implements OnInit, OnDestroy {
  @ViewChildren('slidingItems') slidingItems: QueryList<ItemSliding>;
  activeBatches: Array<Batch> = [];
  user: User = null;
  _updateUser: any;
  _updateHeaderNav: any;
  _updateBatch: any;

  constructor(public navCtrl: NavController,
    public events: Events,
    public userService: UserProvider,
    public toastService: ToastProvider) {
      this._updateUser = this.updateUserEventHandler.bind(this);
      this._updateHeaderNav = this.updateHeaderNavEventHandler.bind(this);
      this._updateBatch = this.updateBatchEventHandler.bind(this);
      this.user = this.userService.getUser();
      this.getActiveBatches();
  }

  ngOnInit() {
    this.events.subscribe('user-update', this._updateUser);
    this.events.subscribe('update-nav-header', this._updateHeaderNav);
    this.events.subscribe('update-batch', this._updateBatch);
  }

  ngOnDestroy() {
    this.events.unsubscribe('user-update', this._updateUser);
    this.events.unsubscribe('update-nav-header', this._updateHeaderNav);
    this.events.unsubscribe('update-batch', this._updateBatch);
  }

  // Assign user's in progress list to active batches
  getActiveBatches(): void {
    this.activeBatches = this.user ? this.user.inProgressList: [];
  }

  // Get the variant name of the recipe associated with given batch
  getBatchName(batch: Batch): string {
    const master = this.getMasterByBatch(batch);
    const recipe = master.recipes.find(recipe => recipe._id === batch.recipe);
    return recipe.variantName;
  }

  // Get the next to be completed step's name
  getBatchNextStep(batch: Batch): string {
    return batch.schedule[batch.currentStep].name;
  }

  getBatchStartDate(batch: Batch): string {
    return batch.createdAt;
  }

  // Get the recipe master of the recipe associated with given batch
  getMasterByBatch(batch: Batch): RecipeMaster {
    return this.user.masterList.find(master => {
      return master.recipes.some(recipe => {
        return recipe._id === batch.recipe;
      });
    });
  }

  // Get the recipe master's name associated with given batch
  getRecipeName(batch: Batch): string {
    const master = this.getMasterByBatch(batch);
    return master ? master.name: 'Missing master';
  }

  /**
   * Navigate to Process Page
   * Ensure there is a recipe master for the given batch
   * Update header of navigation event
   * Pass the recipe master, the owner's id, selected recipe's id, and the selected batch id
   *
   * @params: batch - the batch instance to use in brew process
  **/
  navToBrewProcess(batch: Batch): void {
    const master = this.getMasterByBatch(batch);
    if (master) {
      this.events.publish('update-nav-header', {
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
      this.toastService.presentToast('Error finding associated Recipe');
    }
  }

  // 'user-update' event handler
  updateUserEventHandler(user: User): void {
    this.user = user;
    this.getActiveBatches();
  }

  // 'update-nav-header' event handler
  updateHeaderNavEventHandler(data: any): void {
    this.slidingItems.forEach(slidingItem => slidingItem.close());
    if (data.destType === 'tab') {
      this.getActiveBatches();
    }
  }

  // 'update-batch' event handler
  updateBatchEventHandler(data: any): void {
    if (data.type === 'end') {
      this.userService.updateUserInProgressList(data.data);
    }
  }

}
