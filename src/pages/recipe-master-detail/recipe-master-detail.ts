/* Module imports */
import { Component, OnInit, OnDestroy, ViewChildren, QueryList } from '@angular/core';
import { NavController, NavParams, Events, ItemSliding } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

/* Interface imports */
import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { Recipe } from '../../shared/interfaces/recipe';

/* Utility function imports */
import { getArrayFromObservables } from '../../shared/utility-functions/utilities';

/* Page imports */
import { RecipeFormPage } from '../forms/recipe-form/recipe-form';
import { ProcessPage } from '../process/process';

/* Provider imports */
import { RecipeProvider } from '../../providers/recipe/recipe';
import { ToastProvider } from '../../providers/toast/toast';

@Component({
  selector: 'page-recipe-master-detail',
  templateUrl: 'recipe-master-detail.html',
})
export class RecipeMasterDetailPage implements OnInit, OnDestroy {
  @ViewChildren('slidingItems') slidingItems: QueryList<ItemSliding>;
  recipeMasterId: string = null;
  recipeMaster: RecipeMaster = null;
  destroy$: Subject<boolean> = new Subject<boolean>();
  masterList$: Observable<Array<Observable<RecipeMaster>>> = null;
  hasActiveBatch: boolean = false;
  recipeIndex: number = -1;
  noteIndex: number = -1;
  showNotes: boolean = false;
  showNotesIcon: string = 'arrow-down';
  deletionInProgress: boolean = false;
  _headerNavPop: any;

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    public events: Events,
    public recipeService: RecipeProvider,
    public toastService: ToastProvider) {
      this.recipeMasterId = this.navParams.get('masterId');
      this.masterList$ = this.recipeService.getMasterList();
      this._headerNavPop = this.headerNavPopEventHandler.bind(this);
  }

  /***** Lifecycle Hooks *****/

  // Close all sliding items on view exit
  ionViewDidLeave() {
    this.slidingItems.forEach(slidingItem => slidingItem.close());
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
    this.events.unsubscribe('pop-header-nav', this._headerNavPop);
  }

  ngOnInit() {
    this.masterList$
      .takeUntil(this.destroy$)
      .subscribe(_masterList => {
        this.recipeMaster = getArrayFromObservables(_masterList).find(_master => {
          return _master._id == this.recipeMasterId;
        });
      });
    this.events.subscribe('pop-header-nav', this._headerNavPop);
  }

  /***** End lifecycle hooks *****/


  /***** Navigation *****/

  /**
   * 'pop-header-nav' event handler
   *
   * @params: data - origin that should be loaded after nav pop
   *
   * @return: none
  **/
  headerNavPopEventHandler(data: any): void {
    if (data.origin === 'RecipePage') {
      this.navCtrl.pop();
    } else if (data.origin === 'RecipeMasterDetailPage') {
      this.events.publish('update-nav-header', {destTitle: this.recipeMaster.name});
    }
  }

  /**
   * Pass recipe instance to brew process page
   *
   * @params: recipe - recipe to be used for brew process
   *
   * @return: none
  **/
  navToBrewProcess(recipe: Recipe): void {
    if (this.recipeService.isRecipeProcessPresent(recipe)) {
      this.events.publish('update-nav-header', {
        dest: 'process',
        destType: 'page',
        destTitle: recipe.variantName,
        origin: this.navCtrl.getActive().name
      });
      this.navCtrl.push(ProcessPage, {
        master: this.recipeMaster,
        requestedUserId: this.recipeMaster.owner,
        selectedRecipeId: recipe._id
      });
    } else {
      this.toastService.presentToast('Recipe missing a process guide!', 2000);
    }
  }

  /**
   * Navigate to recipe form with options
   *
   * @params: formType - either 'master' for RecipeMaster or 'recipe' for Recipe
   * @params: recipe - recipe to update
   * @params: other - additional form configuration data
   *
   * @return: none
  **/
  navToRecipeForm(formType: string, recipe?: Recipe, other?: any): void {
    const options = {
      formType: formType,
      other: other
    };
    let title;
    if (formType === 'master') {
      options['masterData'] = this.recipeMaster;
      options['mode'] = 'update';
      title = 'Update Recipe';
    } else if (formType === 'recipe') {
      options['masterData'] = this.recipeMaster;
      if (recipe) {
        options['recipeData'] = recipe;
        options['mode'] = 'update';
        title = 'Update Variant'
      } else {
        options['mode'] = 'create';
        title = 'Add a Variant';
      }
    }
    this.events.publish('update-nav-header', {
      dest: 'recipe-form',
      destType: 'page',
      destTitle: title,
      origin: this.navCtrl.getActive().name
    });
    this.navCtrl.push(RecipeFormPage, options);
  }

  /***** End navigation *****/


  /***** Deletion handling *****/

  /**
   * Check if a recipe can be deleted from the recipe master
   * - must have at least one recipe at any time
   *
   * @params: none
   *
   * @return: true if there are at least 2 recipes present and requested recipe is not in progress
  **/
  canDelete(): boolean {
    return  this.recipeMaster.recipes.length > 1
            && !this.deletionInProgress;
  }

  /**
   * Delete a recipe master note from server
   *
   * @params: index - recipe master note array index to remove
   *
   * @return: none
  **/
  deleteNote(index: number): void {
    this.recipeMaster.notes.splice(index, 1);
    this.recipeService.patchRecipeMasterById(this.recipeMaster._id, {notes: this.recipeMaster.notes})
      .subscribe(() => {
        this.toastService.presentToast('Note deleted', 1000);
      });
  }

  /**
   * Delete a recipe from server
   *
   * @params: recipe - recipe instance to be deleted
   *
   * @return: none
  **/
  deleteRecipe(recipe: Recipe): void {
    this.deletionInProgress = true;
    this.recipeService.deleteRecipeById(this.recipeMaster._id, recipe._id)
      .subscribe(() => {
        this.toastService.presentToast('Recipe deleted!', 1500);
        this.deletionInProgress = false;
      });
  }

  /***** End deletion handling *****/


  /***** Notes *****/

  /**
   * Expand note at given index
   *
   * @params: index - note array index to expand
   *
   * @return: none
  **/
  expandNote(index: number): void {
    this.noteIndex = this.noteIndex === index ? -1: index;
  }

  /**
   * Toggle note display and button icon
   *
   * @params: none
   * @return: none
  **/
  expandNoteMain(): void {
    this.showNotes = !this.showNotes;
    this.showNotesIcon = this.showNotes ? 'arrow-up': 'arrow-down';
  }

  /**
   * Check if note at array index should be shown
   *
   * @params: index - note array index to check
   *
   * @return: true if given index is the selected index to show
  **/
  showExpandedNote(index: number): boolean {
    return index === this.noteIndex;
  }

  /**
   * Navigate to recipe form to update note from array
   *
   * @params: index - array index to update
   *
   * @return: none
  **/
  updateNote(index: number): void {
    this.navToRecipeForm('master', null, {noteIndex: index});
  }

  /***** End notes *****/


  /***** Recipe *****/

  /**
   * Select recipe variant to expand
   *
   * @params: index - index for variant to expand
   *
   * @return: none
  **/
  expandRecipe(index: number): void {
    this.recipeIndex = this.recipeIndex === index ? -1: index;
  }

  /**
   * Check if recipe as given index is the set master
   *
   * @params: index - recipe array index of given recipe
   *
   * @return: true if recipe at given index is set as the master
  **/
  isMaster(index: number): boolean {
    return this.recipeMaster.recipes[index]._id === this.recipeMaster.master;
  }

  /**
   * Toggle recipe master public property
   *
   * @params: none
   * @return: none
  **/
  setPublic(): void {
    this.recipeService.patchRecipeMasterById(
      this.recipeMaster._id,
      { isPublic: !this.recipeMaster.isPublic }
    )
    .subscribe(response => {
      this.recipeMaster.isPublic = response.isPublic;
    });
  }

  /**
   * Check if recipe variant at given index should be shown
   *
   * @params: index - given index to check
   *
   * @return: true if given index should be shown
  **/
  showExpandedRecipe(index: number): boolean {
    return index === this.recipeIndex;
  }

  /**
   * Toggle isFavorite property of recipe
   *
   * @params: recipe - Recipe instance to modify
   *
   * @return: none
  **/
  toggleFavorite(recipe: Recipe): void {
    this.recipeService.patchRecipeById(
      this.recipeMaster._id,
      recipe._id,
      {isFavorite: !recipe.isFavorite}
    )
    .subscribe(updatedRecipe => {
      if (updatedRecipe) {
        this.toastService.presentToast(`${updatedRecipe.isFavorite ? 'Added to': 'Removed from'} favorites`, 1000);
      }
    });
  }

  /***** End recipe *****/

}
