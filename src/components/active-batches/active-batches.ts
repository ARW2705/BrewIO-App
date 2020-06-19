/* Module imports */
import { Component, OnInit, OnDestroy, ViewChildren, QueryList } from '@angular/core';
import { NavController, Events, ItemSliding } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { takeUntil } from 'rxjs/operators/takeUntil';

/* Interface imports */
import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { Batch } from '../../shared/interfaces/batch';
import { User } from '../../shared/interfaces/user';

/* Utility function imports */
import {
  getArrayFromObservables,
  getId,
  hasId
} from '../../shared/utility-functions/utilities';

/* Page imports */
import { ProcessPage } from '../../pages/process/process';

/* Provider imports */
import { ProcessProvider } from '../../providers/process/process';
import { RecipeProvider } from '../../providers/recipe/recipe';
import { ToastProvider } from '../../providers/toast/toast';
import { UserProvider } from '../../providers/user/user';


@Component({
  selector: 'active-batches',
  templateUrl: 'active-batches.html'
})
export class ActiveBatchesComponent implements OnInit, OnDestroy {
  @ViewChildren('slidingItems') slidingItems: QueryList<ItemSliding>;
  destroy$: Subject<boolean> = new Subject<boolean>();
  user: User = null;
  activeBatchesList: Array<Observable<Batch>> = [];
  masterList: Array<Observable<RecipeMaster>> = [];
  getArrayFromObservables = getArrayFromObservables;
  _updateHeaderNav: any;

  constructor(
    public navCtrl: NavController,
    public events: Events,
    public processService: ProcessProvider,
    public recipeService: RecipeProvider,
    public toastService: ToastProvider,
    public userService: UserProvider)
  {
    this._updateHeaderNav = this.updateHeaderNavEventHandler.bind(this);
  }

  /***** Lifecycle Hooks *****/

  ngOnInit() {
    this.userService.getUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.user = user;
      });

    this.processService.getActiveBatchesList()
      .pipe(takeUntil(this.destroy$))
      .subscribe(activeBatchesList => {
        this.activeBatchesList = activeBatchesList;
      });

    this.recipeService.getMasterList()
      .pipe(takeUntil(this.destroy$))
      .subscribe(masterList => {
        this.masterList = masterList;
      });

    this.events.subscribe('update-nav-header', this._updateHeaderNav);
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
    this.events.unsubscribe('update-nav-header', this._updateHeaderNav);
  }

  /***** End lifecycle hooks *****/


  /**
   * Get the name of the next process step for given batch
   *
   * @params: batch - requested batch to get name
   *
   * @return: none
  **/
  getBatchCurrentStep(batch: Batch): string {
    return batch.schedule[batch.currentStep].name;
  }

  /**
   * Get the start datetime of the given batch
   *
   * @params: batch - requested batch to get start datetime
   *
   * @return: ISO date string
  **/
  getBatchStartDate(batch: Batch): string {
    return batch.createdAt;
  }

  /**
   * Find the recipe master associated with given batch
   *
   * @params: batch - requested batch to use to find master
   *
   * @return: the recipe master or undefined if not present
  **/
  getMasterByBatch(batch: Batch): RecipeMaster {
    const list = getArrayFromObservables(this.masterList);
    const master = list.find(_master => {
      return _master.variants.some(_recipe => {
        return hasId(_recipe, batch.recipe);
      })
    });
    return master;
  }

  /**
   * Get the recipe master name associated with given batch
   *
   * @params: batch - requested batch to use to find recipe master
   *
   * @return: recipe master name as string, an empty string if
   *  recipe master is not found
  **/
  getRecipeMasterName(batch: Batch): string {
    const master = this.getMasterByBatch(batch);
    return (master !== undefined) ? master.name: '';
  }

  /**
   * Get the recipe variant name associated with given batch
   *
   * @params: batch - requested batch to use to find recipe
   *
   * @return: recipe variant name as string, an empty string if
   *  recipe or master not found
  **/
  getRecipeName(batch: Batch): string {
    let recipe = undefined;
    const master = this.getMasterByBatch(batch);
    if (master !== undefined) {
      recipe = master.variants.find(recipe => hasId(recipe, batch.recipe));
    }
    return (recipe !== undefined) ? recipe.variantName: '';
  }

  /**
   * Get user login status from user service
   *
   * @params: none
   *
   * @return: true if logged in
  **/
  isLoggedIn(): boolean {
    return this.userService.isLoggedIn();
  }

  /**
   * Navigate to Process Page
   * Ensure there is a recipe master for the given batch
   * Update header of navigation event
   * Pass the recipe master, the owner's id, selected recipe's id, and the selected batch id
   *
   * @params: batch - the batch instance to use in brew process
   *
   * @return: none
  **/
  navToBrewProcess(batch: Batch): void {
    const master = this.getMasterByBatch(batch)
    if (master) {
      this.events.publish('update-nav-header', {
        caller: 'active batches component',
        dest: 'process',
        destType: 'page',
        destTitle: master.variants.find(recipe => hasId(recipe, batch.recipe)).variantName,
        origin: this.navCtrl.getActive().name
      });
      this.navCtrl.push(ProcessPage, {
        master: master,
        requestedUserId: master.owner,
        selectedRecipeId: master.master,
        selectedBatchId: getId(batch)
      });
    } else {
      this.toastService.presentToast('Error finding associated Recipe');
    }
  }

  /**
   * Close sliding items when navigating from current view
   *
   * @params: none
   * @return: none
  **/
  updateHeaderNavEventHandler(): void {
    this.slidingItems.forEach(slidingItem => slidingItem.close());
  }

}
