/* Module imports */
import { Component, OnInit, OnDestroy, QueryList, ViewChildren } from '@angular/core';
import { Events, ItemSliding, Modal, ModalController, NavController } from 'ionic-angular';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { Subject } from 'rxjs/Subject';
import { takeUntil } from 'rxjs/operators/takeUntil';

/* Interface imports */
import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { RecipeVariant } from '../../shared/interfaces/recipe-variant';

/* Utility function imports */
import { clone } from '../../shared/utility-functions/clone';
import { getArrayFromObservables } from '../../shared/utility-functions/observable-helpers';
import { getId, hasId } from '../../shared/utility-functions/id-helpers';

/* Page imports */
import { ConfirmationPage } from '../confirmation/confirmation';
import { RecipeDetailPage } from '../recipe-detail/recipe-detail';
import { RecipeFormPage } from '../forms/recipe-form/recipe-form';
import { ProcessPage } from '../process/process';

/* Provider imports */
import { RecipeProvider } from '../../providers/recipe/recipe';
import { ToastProvider } from '../../providers/toast/toast';
import { UserProvider } from '../../providers/user/user';


@Component({
  selector: 'page-recipe',
  templateUrl: 'recipe.html'
})
export class RecipePage implements OnInit, OnDestroy {
  @ViewChildren('slidingItems') slidingItems: QueryList<ItemSliding>;
  creationMode: boolean = false;
  destroy$: Subject<boolean> = new Subject<boolean>();
  isLoggedIn: boolean = false;
  masterIndex: number = -1;
  masterList: RecipeMaster[] = null;
  refreshPipes: boolean = false;
  variantList: RecipeVariant[] = null;

  constructor(
    public events: Events,
    public modalCtrl: ModalController,
    public navCtrl: NavController,
    public recipeService: RecipeProvider,
    public toastService: ToastProvider,
    public userService: UserProvider
  ) { }

  /***** Lifecycle Hooks *****/

  // Close all sliding items on view exit
  ionViewDidLeave() {
    this.slidingItems.forEach(slidingItem => slidingItem.close());
  }

  ionViewWillEnter() {
    this.refreshPipes = !this.refreshPipes;
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  ngOnInit() {
    this.recipeService.getMasterList()
      .pipe(takeUntil(this.destroy$))
      .subscribe((_masterList: BehaviorSubject<RecipeMaster>[]) => {
        this.masterList = getArrayFromObservables(_masterList);
        this.mapMasterRecipes();
      });
    this.userService.getUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe((): void => {
        this.isLoggedIn = this.userService.isLoggedIn();
      });
  }

  /***** End lifecycle hooks *****/


  /***** Navigation *****/

  /**
   * Navigate to Process Page
   * Update header of navigation event
   * Pass the recipe master, the owner's id, selected recipe's id
   *
   * @params: master - recipe master to use in brew process
   *
   * @return: none
  **/
  navToBrewProcess(master: RecipeMaster): void {
    const variant: RecipeVariant = master.variants
      .find(variant => {
        return hasId(variant, master.master);
      });

    if (this.recipeService.isRecipeProcessPresent(variant)) {
      this.events.publish('update-nav-header', {
        caller: 'recipe page',
        dest: 'process',
        destType: 'page',
        destTitle: variant.variantName,
        origin: this.navCtrl.getActive().name
      });

      this.navCtrl.push(ProcessPage, {
        master: master,
        requestedUserId: master.owner,
        selectedRecipeId: master.master
      });
    } else {
      this.toastService.presentToast('Recipe missing a process guide!', 2000);
    }
  }

  /**
   * Navigate to Recipe Master details page
   *
   * @params: index - masterList index to send to page
   *
   * @return: none
  **/
  navToDetails(index: number): void {
    if (-1 < index && index < this.masterList.length) {
      const recipeMaster: RecipeMaster = this.masterList[index];

      this.events.publish('update-nav-header', {
        caller: 'recipe page',
        dest: 'recipe-details',
        destType: 'page',
        destTitle: recipeMaster.name,
        origin: this.navCtrl.getActive().name
      });

      this.navCtrl.push(RecipeDetailPage, { masterId: getId(recipeMaster) });
    } else {
      this.toastService.presentToast(
        'Error: invalid Recipe Master list index',
        2000
      );
    }
  }

  /**
   * Navigate to recipe form and publish nav update for header
   *
   * @params: none
   * @return: none
  **/
  navToRecipeForm(): void {
    this.events.publish('update-nav-header', {
      caller: 'recipe page',
      dest: 'recipe-form',
      destType: 'page',
      destTitle: 'Create Recipe',
      origin: this.navCtrl.getActive().name
    });

    this.navCtrl.push(RecipeFormPage, {formType: 'master', mode: 'create'});
  }

  /***** End navigation *****/


  /***** Modals *****/

  /**
   * Present confirmation modal prior to deletion
   *
   * @params: index - index of recipe master to delete
   *
   * @return: none
  **/
  confirmDelete(index: number): void {
    const modal: Modal = this.modalCtrl.create(
      ConfirmationPage,
      {
        title: 'Recipe',
        message: `Confirm deletion of "${this.masterList[index].name}" and its variants`,
        subMessage: 'This action cannot be reversed'
      }
    );
    modal.onDidDismiss((confirmed: boolean): void => {
      if (confirmed) {
        this.deleteMaster(index);
      }
    });
    modal.present();
  }

  /***** End Modals *****/


  /***** Other *****/

  /**
   * Delete a Recipe Master
   *
   * @params: index - index of recipe master to delete
   *
   * @return: none
  **/
  deleteMaster(index: number): void {
    this.recipeService.deleteRecipeMasterById(getId(this.masterList[index]))
      .subscribe(
        (): void => {
          this.toastService.presentToast('Deleted Recipe', 1000);
        },
        (error: ErrorObservable): void => {
          console.log('Error deleting recipe master', error);
          this.toastService.presentToast(
            'An error occured during recipe deletion',
            2000
          );
        }
      );
  }

  /**
   * Expand the accordion for recipe master ingredient table
   *
   * @params: index - index in masterIndex array to expand
   *
   * @return: none
  **/
  expandMaster(index: number): void {
    this.masterIndex = this.masterIndex === index ? -1: index;
  }

  /**
   * Populate recipe master list with each master's designated selected recipe
   *
   * @params: none
   *
   * @return: none
  **/
  mapMasterRecipes(): void {
    this.variantList = this.masterList
      .map((master: RecipeMaster) => {
        const selected: RecipeVariant = clone(master.variants.find(variant => {
          return hasId(variant, master.master);
        }));
        selected.hops = this.recipeService.getCombinedHopsSchedule(selected.hops);
        return selected;
      })
      .filter((variant: RecipeVariant) => {
        return variant !== undefined;
      });
  }

  /***** End other *****/

}
