/* Module imports */
import { Component, OnInit, OnDestroy, ViewChildren, QueryList } from '@angular/core';
import { NavController, NavParams, Events, ItemSliding } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { takeUntil } from 'rxjs/operators/takeUntil';
import { take } from 'rxjs/operators/take';

/* Interface imports */
import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { RecipeVariant } from '../../shared/interfaces/recipe-variant';

/* Utility imports */
import { getId } from '../../shared/utility-functions/utilities';

/* Page imports */
import { RecipeFormPage } from '../forms/recipe-form/recipe-form';
import { ProcessPage } from '../process/process';

/* Provider imports */
import { RecipeProvider } from '../../providers/recipe/recipe';
import { ToastProvider } from '../../providers/toast/toast';


@Component({
  selector: 'page-recipe-detail',
  templateUrl: 'recipe-detail.html',
})
export class RecipeDetailPage implements OnInit, OnDestroy {
  @ViewChildren('slidingItems') slidingItems: QueryList<ItemSliding>;
  recipeMasterId: string = null;
  recipeMaster: RecipeMaster = null;
  recipeMaster$: Observable<RecipeMaster> = null;
  destroy$: Subject<boolean> = new Subject<boolean>();
  hasActiveBatch: boolean = false;
  recipeIndex: number = -1;
  noteIndex: number = -1;
  showNotes: boolean = false;
  showNotesIcon: string = 'arrow-down';
  deletionInProgress: boolean = false;
  _headerNavPop: any;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public events: Events,
    public recipeService: RecipeProvider,
    public toastService: ToastProvider
  ) {
    this.recipeMasterId = this.navParams.get('masterId');
    this.recipeMaster$ = this.recipeService.getMasterById(this.recipeMasterId);
    this._headerNavPop = this.headerNavPopEventHandler.bind(this);
  }

  /***** Lifecycle Hooks *****/

  ngOnInit() {
    this.recipeMaster$
      .pipe(takeUntil(this.destroy$))
      .subscribe(recipeMaster => {
        this.recipeMaster = recipeMaster;
      });
    this.events.subscribe('pop-header-nav', this._headerNavPop);
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
    this.events.unsubscribe('pop-header-nav', this._headerNavPop);
  }

  // Close all sliding items on view exit
  ionViewDidLeave() {
    this.slidingItems.forEach(slidingItem => slidingItem.close());
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
    } else if (data.origin === 'RecipeDetailPage') {
      // update header title with current recipeMaster name
      this.events.publish('update-nav-header', {caller: 'recipe details page', destTitle: this.recipeMaster.name});
    }
  }

  /**
   * Pass recipe instance to brew process page
   *
   * @params: variant - recipe variant to be used for brew process
   *
   * @return: none
  **/
  navToBrewProcess(variant: RecipeVariant): void {
    if (this.recipeService.isRecipeProcessPresent(variant)) {
      this.events.publish('update-nav-header', {
        caller: 'recipe details page',
        dest: 'process',
        destType: 'page',
        destTitle: variant.variantName,
        origin: this.navCtrl.getActive().name
      });
      this.navCtrl.push(ProcessPage, {
        master: this.recipeMaster,
        requestedUserId: this.recipeMaster.owner,
        selectedRecipeId: variant.cid
      });
    } else {
      this.toastService.presentToast('Recipe missing a process guide!', 2000, 'error-toast');
    }
  }

  /**
   * Navigate to recipe form with options
   *
   * @params: formType - either 'master' for RecipeMaster or 'recipe' for Recipe
   * @params: [variant] - recipe variant to update
   * @params: [additionalData] - additional form configuration data
   *
   * @return: none
  **/
  navToRecipeForm(formType: string, variant?: RecipeVariant, additionalData?: any): void {
    const options: object = {
      formType: formType,
      additionalData: additionalData
    };

    let title;

    if (formType === 'master') {
      options['masterData'] = this.recipeMaster;
      options['mode'] = 'update';
      title = 'Update Recipe';
    } else if (formType === 'variant') {
      options['masterData'] = this.recipeMaster;
      if (variant) {
        options['variantData'] = variant;
        options['mode'] = 'update';
        title = 'Update Variant'
      } else {
        options['mode'] = 'create';
        title = 'Add a Variant';
      }
    } else {
      this.toastService.presentToast('Invalid form type detected', 3000, 'error-toast');
      return;
    }

    this.events.publish('update-nav-header', {
      caller: 'recipe details page',
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
    return  this.recipeMaster.variants.length > 1
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
    const forDeletion = this.recipeMaster.notes.splice(index, 1);
    this.recipeService.patchRecipeMasterById(getId(this.recipeMaster), {notes: this.recipeMaster.notes})
      .subscribe(
        () => {
          this.toastService.presentToast('Note deleted', 1000);
        },
        error => {
          console.log(error);
          this.recipeMaster.notes.splice(index, 0, forDeletion[0]);
          this.toastService.presentToast('Error while deleting note', 1500, 'error-toast');
        }
      );
  }

  /**
   * Delete a recipe from server
   *
   * @params: variant - recipe variant instance to be deleted
   *
   * @return: none
  **/
  deleteRecipe(variant: RecipeVariant): void {
    this.deletionInProgress = true;
    this.recipeService.deleteRecipeVariantById(getId(this.recipeMaster), getId(variant))
      .pipe(take(1))
      .subscribe(
        () => {
          this.toastService.presentToast('Recipe deleted!', 1500);
          this.deletionInProgress = false;
        },
        error => {
          // TODO add error feedback
          console.log(error);
        }
      );
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
   * @params: index - index for variant to expand, if index matches recipeIndex,
   *  set recipeIndex to -1 instead
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
    return getId(this.recipeMaster.variants[index]) === this.recipeMaster.master;
  }

  /**
   * Toggle recipe master public property
   *
   * @params: none
   * @return: none
  **/
  setPublic(): void {
    this.recipeService.patchRecipeMasterById(
      getId(this.recipeMaster),
      { isPublic: !this.recipeMaster.isPublic }
    )
    .subscribe(
      response => {
        this.recipeMaster.isPublic = response.isPublic;
      },
      error => {
        // TODO add error feedback
        console.log(error);
      }
    );
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
   * @params: variant - Recipe variant instance to modify
   *
   * @return: none
  **/
  toggleFavorite(variant: RecipeVariant): void {
    this.recipeService.patchRecipeVariantById(
      getId(this.recipeMaster),
      getId(variant),
      { isFavorite: !variant.isFavorite }
    )
    .pipe(take(1))
    .subscribe(
      updatedRecipe => {
        if (updatedRecipe) {
          this.toastService.presentToast(`${updatedRecipe.isFavorite ? 'Added to': 'Removed from'} favorites`, 1500);
        }
      },
      error => {
        console.log(error);
        this.toastService.presentToast(`Unable to ${ !variant.isFavorite ? 'add to': 'remove from'} favorites`, 1500, 'error-toast');
      }
    );
  }

  /***** End recipe *****/

}
