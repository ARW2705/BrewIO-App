import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { NavController, Events } from 'ionic-angular';

import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { Recipe } from '../../shared/interfaces/recipe';

import { ProcessPage } from '../../pages/process/process';

import { UserProvider } from '../../providers/user/user';
import { RecipeProvider } from '../../providers/recipe/recipe';
import { ModalProvider } from '../../providers/modal/modal';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage implements OnInit, OnDestroy {
  title = "Brew IO";
  private user = null;
  activeBatches = [];
  notifications = [];
  private _login: any;
  private _tabChange: any;
  private _updateMaster: any;

  constructor(public navCtrl: NavController,
    private cdRef: ChangeDetectorRef,
    private events: Events,
    private userService: UserProvider,
    private recipeService: RecipeProvider,
    private modalService: ModalProvider) {
      this._login = this.loginEventHandler.bind(this);
      this._tabChange = this.tabChangeEventHandler.bind(this);
      this._updateMaster = this.updateMasterEventHandler.bind(this);
  }

  private dismissBatch(batch: Recipe): void {
    const toRemove = this.activeBatches.findIndex(_batch => _batch._id == batch._id);
    this.activeBatches.splice(toRemove, 1);
    this.cdRef.detectChanges();
  }

  private getActiveBatches(): void {
    if (this.user) {
      this.activeBatches = [];
      this.user.masterList.forEach(recipeMaster => {
        // if (recipeMaster.hasActiveBatch) {
        //   this.activeBatches.push(recipeMaster);
        // }
      });
    }
  }

  private getBatchCurrentStep(batch: Recipe): string {
    return `${batch.processSchedule[batch.currentStep].name}`;
  }

  private getBatchName(batch: Recipe): string {
    return `${batch.variantName}`;
  }

  private getBatchNextStep(batch: Recipe): string {
    return batch.currentStep < batch.processSchedule.length - 1
           ? `${batch.processSchedule[batch.currentStep + 1].name}`
           : 'Finished';
  }

  private loginEventHandler() {
    this.user = this.userService.getUser();
    this.getActiveBatches();
    this.cdRef.detectChanges();
  }

  private navToBrewProcess(batch: Recipe) {
    const master = this.user.masterList.find(master => {
      return master.recipes.find(recipe => {
        return recipe._id == batch._id;
      });
    });
    this.navCtrl.push(ProcessPage, {
      master: master,
      requestedUserId: master.owner,
      selectedRecipeId: batch._id
    });
  }

  private openLogin() {
    this.modalService.openLogin();
  }

  private openSignup() {
    this.modalService.openSignup();
  }

  ngOnDestroy() {
    this.events.unsubscribe('on-login', this._login);
    this.events.unsubscribe('tab-change', this._tabChange);
    this.events.unsubscribe('update-master', this._updateMaster);
  }

  ngOnInit() {
    this.events.subscribe('on-login', this._login);
    this.events.subscribe('tab-change', this._tabChange);
    this.events.subscribe('update-master', this._updateMaster);
    this.getActiveBatches();
  }

  private tabChangeEventHandler(tab: any): void {
    if (this.user && tab.dest == 'home') {
      this.userService.getUserProfile()
        .subscribe(user => {
          if (user) {
            this.user = user;
            this.getActiveBatches();
          }
        });
    }
  }

  private updateMasterEventHandler(update: any) {
    const indexToUpdate = this.user.masterList.findIndex(master => master._id == update._id);
    this.user.masterList[indexToUpdate] = update;
    this.getActiveBatches();
  }

}
