/* Module imports */
import { Component, OnInit, OnDestroy, QueryList, ViewChildren } from '@angular/core';
import { Events, ItemSliding, NavController, NavParams } from 'ionic-angular';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { Subject } from 'rxjs/Subject';
import { take } from 'rxjs/operators/take';
import { takeUntil } from 'rxjs/operators/takeUntil';

/* Interface imports */
import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { RecipeVariant } from '../../shared/interfaces/recipe-variant';

/* Utility imports */
import { clone } from '../../shared/utility-functions/clone';
import { getId, hasId } from '../../shared/utility-functions/id-helpers';
import { normalizeErrorObservableMessage } from '../../shared/utility-functions/observable-helpers';

/* Page imports */
import { ProcessPage } from '../process/process';
import { RecipeFormPage } from '../forms/recipe-form/recipe-form';

/* Provider imports */
import { RecipeProvider } from '../../providers/recipe/recipe';
import { ToastProvider } from '../../providers/toast/toast';


@Component({
  selector: 'page-recipe-detail',
  templateUrl: 'recipe-detail.html',
})
export class RecipeDetailPage implements OnInit, OnDestroy {
  @ViewChildren('slidingItems') slidingItems: QueryList<ItemSliding>;
  deletionInProgress: boolean = false;
  destroy$: Subject<boolean> = new Subject<boolean>();
  displayVariantList: RecipeVariant[] = null;
  noteIndex: number = -1;
  recipeIndex: number = -1;
  recipeMaster: RecipeMaster = null;
  recipeMasterId: string = null;
  showNotes: boolean = false;
  showNotesIcon: string = 'arrow-down';
  _headerNavPop: any;

  constructor(
    public events: Events,
    public navCtrl: NavController,
    public navParams: NavParams,
    public recipeService: RecipeProvider,
    public toastService: ToastProvider
  ) {
    this.recipeMasterId = this.navParams.get('masterId');
    this._headerNavPop = this.headerNavPopEventHandler.bind(this);
  }

  /***** Lifecycle Hooks *****/

  ngOnInit() {
    this.recipeService.getRecipeMasterById(this.recipeMasterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (recipeMaster: RecipeMaster) => {
          this.recipeMaster = recipeMaster;
          this.mapVariantList();
        },
        (error: ErrorObservable) => {
          // TODO provide user feedback
          console.log(`Recipe detail page error: ${normalizeErrorObservableMessage(error)}`);
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
  headerNavPopEventHandler(data: object): void {
    if (data['origin'] === 'RecipeDetailPage') {
      // update header title with current recipeMaster name
      this.events.publish(
        'update-nav-header',
        {
          caller: 'recipe details page',
          destTitle: this.recipeMaster.name
        }
      );
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
        destTitle: variant.variantName
      });

      this.navCtrl.push(ProcessPage, {
        master: this.recipeMaster,
        requestedUserId: this.recipeMaster.owner,
        selectedRecipeId: variant.cid,
        origin: this.navCtrl.getActive().name
      });
    } else {
      this.toastService.presentToast(
        'Recipe missing a process guide!',
        2000,
        'toast-error'
      );
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
  navToRecipeForm(
    formType: string,
    variant?: RecipeVariant,
    additionalData?: object
  ): void {
    const options: object = {
      formType: formType,
      additionalData: additionalData
    };

    let title: string;

    if (formType === 'master') {
      options['masterData'] = this.recipeMaster;
      options['mode'] = 'update';
      title = 'Update Recipe';
    } else if (formType === 'variant') {
      options['masterData'] = this.recipeMaster;
      if (variant) {
        options['variantData'] = this.recipeMaster.variants.find(
          (recipeVariant: RecipeVariant): boolean => {
            return hasId(recipeVariant, getId(variant));
          });
        options['mode'] = 'update';
        title = 'Update Variant'
      } else {
        options['mode'] = 'create';
        title = 'Add a Variant';
      }
    } else {
      this.toastService.presentToast(
        'Invalid form type detected',
        3000,
        'toast-error'
      );
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
   * Delete a recipe master note from server
   *
   * @params: index - recipe master note array index to remove
   *
   * @return: none
  **/
  deleteNote(index: number): void {
    const forDeletion: string[] = this.recipeMaster.notes.splice(index, 1);
    this.recipeService.patchRecipeMasterById(
      getId(this.recipeMaster),
      { notes: this.recipeMaster.notes }
    )
    .subscribe(
      () => {
        this.toastService.presentToast(
          'Note deleted',
          1000
        );
      },
      (error: ErrorObservable) => {
        console.log(error);
        this.recipeMaster.notes.splice(index, 0, forDeletion[0]);
        this.toastService.presentToast(
          'Error while deleting note',
          1500,
          'toast-error'
        );
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

    this.recipeService.deleteRecipeVariantById(
      getId(this.recipeMaster),
      getId(variant)
    )
    .pipe(take(1))
    .subscribe(
      () => {
        this.toastService.presentToast(
          'Recipe deleted!',
          1500
        );
        this.deletionInProgress = false;
      },
      (error: ErrorObservable) => {
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
   * Navigate to recipe form to update note from array
   *
   * @params: index - array index to update
   *
   * @return: none
  **/
  updateNote(index: number): void {
    this.navToRecipeForm('master', null, { noteIndex: index });
  }

  /***** End notes *****/


  /***** Recipe *****/

  /**
   * Select recipe variant to expand
   *
   * @params: index - index for variant to expand, if index matches recipeIndex,
   *          set recipeIndex to -1 instead
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
   * Map recipe variants to their own list;
   * Combine hops instances of the same type
   *
   * @params: none
   *
   * @return: none
  **/
  mapVariantList(): void {
    this.displayVariantList = this.recipeMaster.variants
      .map((variant: RecipeVariant) => {
        const selected: RecipeVariant = clone(variant);
        selected.hops = this.recipeService.getCombinedHopsSchedule(selected.hops);
        return selected;
      })
      .filter((variant: RecipeVariant) => {
        return variant !== undefined;
      });
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
      (response: RecipeMaster) => {
        this.recipeMaster.isPublic = response.isPublic;
      },
      (error: ErrorObservable) => {
        // TODO add error feedback
        console.log(error);
      }
    );
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
      (updatedRecipeVariant: RecipeVariant) => {
        if (updatedRecipeVariant) {
          this.toastService.presentToast(
            `${updatedRecipeVariant.isFavorite ? 'Added to': 'Removed from'} favorites`,
            1500,
            'bottom',
            'toast-fav'
          );
        }
      },
      (error: ErrorObservable) => {
        console.log(error);
        this.toastService.presentToast(
          `Unable to ${ !variant.isFavorite ? 'add to': 'remove from'} favorites`,
          1500,
          'toast-error'
        );
      }
    );
  }

  /***** End recipe *****/

}
