/* Module imports */
import { Component, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { Events, ItemSliding, NavController } from 'ionic-angular';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subject } from 'rxjs/Subject';
import { takeUntil } from 'rxjs/operators/takeUntil';

/* Interface imports */
import { Batch } from '../../shared/interfaces/batch';
import { RecipeMaster } from '../../shared/interfaces/recipe-master';

/* Utility function imports */
import { getId, hasId } from '../../shared/utility-functions/id-helpers';
import { getArrayFromObservables } from '../../shared/utility-functions/observable-helpers';

/* Page imports */
import { ProcessPage } from '../../pages/process/process';

/* Provider imports */
import { ProcessProvider } from '../../providers/process/process';
import { RecipeProvider } from '../../providers/recipe/recipe';
import { ToastProvider } from '../../providers/toast/toast';


@Component({
  selector: 'active-batches',
  templateUrl: 'active-batches.html'
})
export class ActiveBatchesComponent implements OnInit, OnDestroy {
  @ViewChildren('slidingItems') slidingItems: QueryList<ItemSliding>;
  activeBatchesList: Batch[] = [];
  destroy$: Subject<boolean> = new Subject<boolean>();
  _updateHeaderNav: any;

  constructor(
    public events: Events,
    public navCtrl: NavController,
    public processService: ProcessProvider,
    public recipeService: RecipeProvider,
    public toastService: ToastProvider
  ) {
    this._updateHeaderNav = this.updateHeaderNavEventHandler.bind(this);
  }

  /***** Lifecycle Hooks *****/

  ngOnInit() {
    // retrieve active batches only
    this.processService.getBatchList(true)
      .pipe(takeUntil(this.destroy$))
      .subscribe(activeBatchesList$ => {
        this.activeBatchesList = getArrayFromObservables(activeBatchesList$);
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
   * Navigate to Process Page
   * Ensure there is a recipe master for the given batch
   * Update header of navigation event
   * Pass the recipe master, the owner's id, selected recipe's id, and the
   *  selected batch id
   *
   * @params: batch - the batch instance to use in brew process
   *
   * @return: none
  **/
  navToBrewProcess(batch: Batch): void {
    const master$: BehaviorSubject<RecipeMaster> = this.recipeService
      .getRecipeMasterById(batch.recipeMasterId);

    if (master$ !== undefined) {
      const master: RecipeMaster = master$.value;

      this.events.publish('update-nav-header', {
        caller: 'active batches component',
        dest: 'process',
        destType: 'page',
        destTitle: master.variants.find(recipe => {
            return hasId(recipe, batch.recipeVariantId)
          }).variantName,
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
   * Close all sliding items when navigating away from current view
   *
   * @params: none
   * @return: none
  **/
  updateHeaderNavEventHandler(): void {
    this.slidingItems.forEach((slidingItem: ItemSliding) => slidingItem.close());
  }

}
