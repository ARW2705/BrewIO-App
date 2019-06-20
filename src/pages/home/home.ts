import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { NavController, Events } from 'ionic-angular';

import { Recipe } from '../../shared/interfaces/recipe';

import { ProcessPage } from '../../pages/process/process';

import { UserProvider } from '../../providers/user/user';
import { ModalProvider } from '../../providers/modal/modal';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage implements OnInit, OnDestroy {
  user = null;
  activeBatches = [];
  notifications = [];
  _userUpdate: any;
  _updateMaster: any;
  _navUpdate: any;

  constructor(public navCtrl: NavController,
    public cdRef: ChangeDetectorRef,
    public events: Events,
    public userService: UserProvider,
    public modalService: ModalProvider) {
      this._userUpdate = this.userUpdateEventHandler.bind(this);
      this._navUpdate = this.navUpdateEventHandler.bind(this);
      this._updateMaster = this.updateMasterEventHandler.bind(this);
  }

  dismissBatch(batch: Recipe): void {
    const toRemove = this.activeBatches.findIndex(_batch => _batch._id === batch._id);
    this.activeBatches.splice(toRemove, 1);
    this.cdRef.detectChanges();
  }

  getBatchCurrentStep(batch: Recipe): string {
    return `${batch.processSchedule[batch.currentStep].name}`;
  }

  getBatchName(batch: Recipe): string {
    return `${batch.variantName}`;
  }

  getBatchNextStep(batch: Recipe): string {
    return batch.currentStep < batch.processSchedule.length - 1
           ? `${batch.processSchedule[batch.currentStep + 1].name}`
           : 'Finished';
  }

  userUpdateEventHandler(data: any): void {
    console.log('incoming user update', data);
    this.user = data ? data: null;
  }

  navToBrewProcess(batch: Recipe): void {
    const master = this.user.masterList.find(master => {
      return master.recipes.find(recipe => {
        return recipe._id === batch._id;
      });
    });
    this.navCtrl.push(ProcessPage, {
      master: master,
      requestedUserId: master.owner,
      selectedRecipeId: batch._id
    });
  }

  openLogin(): void {
    this.modalService.openLogin();
  }

  openSignup(): void {
    this.modalService.openSignup();
  }

  ngOnDestroy() {
    this.events.unsubscribe('user-update', this._userUpdate);
    this.events.unsubscribe('nav-update', this._navUpdate);
    this.events.unsubscribe('update-master', this._updateMaster);
  }

  ngOnInit() {
    this.events.subscribe('user-update', this._userUpdate);
    this.events.subscribe('nav-update', this._navUpdate);
    this.events.subscribe('update-master', this._updateMaster);
  }

  navUpdateEventHandler(data: any): void {
    if (this.user && data.dest === 'home') {
      this.userService.getUserProfile()
        .subscribe(user => {
          if (user) {
            this.user = user;
          }
        });
    }
  }

  updateMasterEventHandler(update: any): void {
    const indexToUpdate = this.user.masterList.findIndex(master => master._id == update._id);
    this.user.masterList[indexToUpdate] = update;
  }

}
