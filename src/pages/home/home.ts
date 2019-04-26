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

  constructor(public navCtrl: NavController,
    private cdRef: ChangeDetectorRef,
    private events: Events,
    private userService: UserProvider,
    private recipeService: RecipeProvider,
    private modalService: ModalProvider) {
      this._login = this.loginEventHandler.bind(this);
      this._tabChange = this.tabChangeEventHandler.bind(this);
  }

  private dismissBatch(batch: Recipe): void {
    const toRemove = this.activeBatches.findIndex(_batch => _batch._id == batch._id);
    this.activeBatches.splice(toRemove, 1);
    this.cdRef.detectChanges();
  }

  private getActiveBatches(): void {
    console.log('get actives');
    if (this.user) {
      this.activeBatches = [];
      this.user.masterList.forEach(recipeMaster => {
        if (recipeMaster.hasActiveBatch) {
          // this.activeBatches.push(recipeMaster);
          recipeMaster.recipes.forEach(recipe => {
            if (recipe.isActive) {
              this.activeBatches.push(recipe);
            }
          });
        }
      });
    }
    console.log(this.activeBatches);
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
    this.navCtrl.push(ProcessPage, {master: master, selected: batch._id});
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
  }

  ngOnInit() {
    this.events.subscribe('on-login', this._login);
    this.events.subscribe('tab-change', this._tabChange);
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

}
