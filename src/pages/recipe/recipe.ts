/* Module imports */
import { Component, OnInit, OnDestroy, ViewChildren, QueryList } from '@angular/core';
import { NavController, NavParams, Events, ItemSliding } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/takeUntil';

/* Interface imports */
import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { Recipe } from '../../shared/interfaces/recipe';
import { User } from '../../shared/interfaces/user';

/* Utility function imports */
import { getArrayFromObservables } from '../../shared/utility-functions/utilities';

/* Page imports */
import { RecipeMasterDetailPage } from '../recipe-master-detail/recipe-master-detail';
import { RecipeFormPage } from '../forms/recipe-form/recipe-form';
import { ProcessPage } from '../process/process';

/* Provider imports */
import { UserProvider } from '../../providers/user/user';
import { RecipeProvider } from '../../providers/recipe/recipe';
import { ToastProvider } from '../../providers/toast/toast';

@Component({
  selector: 'page-recipe',
  templateUrl: 'recipe.html'
})
export class RecipePage implements OnInit, OnDestroy {
  @ViewChildren('slidingItems') slidingItems: QueryList<ItemSliding>;
  user$: Observable<User> = null;
  user: User = null;
  destroy$: Subject<boolean> = new Subject<boolean>();
  masterList$: Observable<Array<Observable<RecipeMaster>>> = null;
  masterList: Array<Observable<RecipeMaster>> = null;
  masterRecipeList: Array<Recipe> = null;
  getArrayFromObservables = getArrayFromObservables;
  hasActiveBatch: boolean = false;
  masterIndex: number = -1;
  creationMode: boolean = false;

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    public events: Events,
    public userService: UserProvider,
    public recipeService: RecipeProvider,
    public toastService: ToastProvider) {
      this.user$ = this.userService.getUser();
      this.masterList$ = this.recipeService.getMasterList();
  }

  /***** Lifecycle Hooks *****/

  // Close all sliding items on view exit
  ionViewDidLeave() {
    this.slidingItems.forEach(slidingItem => slidingItem.close());
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  ngOnInit() {
    this.user$
      .takeUntil(this.destroy$)
        .subscribe(_user => {
          this.user = _user;
        });

    this.masterList$
      .takeUntil(this.destroy$)
      .subscribe(_masterList => {
        console.log('got master list for recipe page');
        this.masterList = _masterList;
        this.mapMasterRecipes();
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
    if (this.recipeService.isRecipeProcessPresent(
      master.recipes.find(recipe => recipe._id === master.master)
    )) {
      this.events.publish('update-nav-header', {
        dest: 'process',
        destType: 'page',
        destTitle: master.recipes.find(recipe => recipe._id === master.master).variantName,
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
    const recipeMaster = getArrayFromObservables(this.masterList)[index];
    this.events.publish('update-nav-header', {
      destType: 'page',
      destTitle: recipeMaster.name,
      origin: this.navCtrl.getActive().name
    });
    this.navCtrl.push(RecipeMasterDetailPage, { masterId: recipeMaster._id });
  }

  /**
   * Navigate to recipe form and publish nav update for header
   *
   * @params: none
   * @return: none
  **/
  navToRecipeForm(): void {
    this.events.publish('update-nav-header', {
      dest: 'recipe-form',
      destType: 'page',
      destTitle: 'Create Recipe',
      origin: this.navCtrl.getActive().name
    });
    this.navCtrl.push(RecipeFormPage, {formType: 'master', mode: 'create'});
  }

  /***** End navigation *****/


  /***** Other *****/

  /**
   * Delete a Recipe Master from server
   *
   * @params: master - recipe master to delete
   *
   * @return: none
  **/
  deleteMaster(master: RecipeMaster): void {
    if (master.hasActiveBatch) {
      this.toastService.presentToast('Cannot delete a recipe master with a batch in progress', 3000);
    } else {
      this.recipeService.deleteRecipeMasterById(master._id);
    }
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
   * Check if user subject is logged in
   *
   * @params: none
   *
   * @return: true if user values are authed
  **/
  isLoggedIn(): boolean {
    return this.userService.isLoggedIn();
  }

  /**
   * Populate recipe master list with each master's designated selected recipe
   *
   * @params: none
   *
   * @return: none
  **/
  mapMasterRecipes(): void {
    this.masterRecipeList = this.getArrayFromObservables(this.masterList).map(master => {
      const selected = master.recipes.find(recipe => {
        return recipe._id === master.master;
      });
      return selected === undefined ? master.recipes[0]: selected;
    });
  }

  /**
   * Expand ingredient table accordion of recipe master at given index
   *
   * @params: index - masterList index to expand
   *
   * @return: none
  **/
  showExpandedMaster(index: number): boolean {
    return index === this.masterIndex && getArrayFromObservables(this.masterList)[index].recipes.some(
      recipe => recipe.processSchedule.length > 0
    );
  }

  /**
   * Toggle create mode flag
   *
   * @params: none
   * @return: none
  **/
  toggleCreationMode() {
    this.creationMode = !this.creationMode;
  }

  /***** End other *****/

}
