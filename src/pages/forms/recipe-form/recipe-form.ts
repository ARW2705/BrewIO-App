/* Module imports */
import { Component, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { Events, Modal, ModalController, NavController, NavParams } from 'ionic-angular';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { Subject } from 'rxjs/Subject';
import { take } from 'rxjs/operators/take';
import { takeUntil } from 'rxjs/operators/takeUntil';

/* Interface imports */
import { Grains, Hops, Yeast, Style } from '../../../shared/interfaces/library';
import { GrainBill } from '../../../shared/interfaces/grain-bill';
import { HopsSchedule } from '../../../shared/interfaces/hops-schedule';
import { OtherIngredients } from '../../../shared/interfaces/other-ingredients';
import { Process } from '../../../shared/interfaces/process';
import { RecipeMaster } from '../../../shared/interfaces/recipe-master';
import { RecipeVariant } from '../../../shared/interfaces/recipe-variant';
import { SelectedUnits } from '../../../shared/interfaces/units';
import { YeastBatch } from '../../../shared/interfaces/yeast-batch';

/* Default imports */
import { defaultRecipeMaster } from '../../../shared/defaults/default-recipe-master';
import { defaultStyle } from '../../../shared/defaults/default-style';

/* Utility function imports */
import { clone } from '../../../shared/utility-functions/clone';
import { getId } from '../../../shared/utility-functions/id-helpers';
import { normalizeErrorObservableMessage } from '../../../shared/utility-functions/observable-helpers';
import { stripSharedProperties } from '../../../shared/utility-functions/strip-shared-properties';
import { roundToDecimalPlace, toTitleCase } from '../../../shared/utility-functions/utilities';

/* Page imports */
import { GeneralFormPage } from '../general-form/general-form';
import { IngredientFormPage } from '../ingredient-form/ingredient-form';
import { NoteFormPage } from '../note-form/note-form';
import { ProcessFormPage } from '../process-form/process-form';

/* Provider imports */
import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';
import { CalculationsProvider } from '../../../providers/calculations/calculations';
import { ClientIdProvider } from '../../../providers/client-id/client-id';
import { LibraryProvider } from '../../../providers/library/library';
import { PreferencesProvider } from '../../../providers/preferences/preferences';
import { RecipeProvider } from '../../../providers/recipe/recipe';
import { ToastProvider } from '../../../providers/toast/toast';


@Component({
  selector: 'page-recipe-form',
  templateUrl: 'recipe-form.html',
})
export class RecipeFormPage implements AfterViewInit {
  defaultStyle: Style = defaultStyle();
  destroy$: Subject<boolean> = new Subject<boolean>();
  docMethod: string = '';
  formOptions: any = null;
  formType: string = null;
  grainsLibrary: Grains[] = null;
  hopsLibrary: Hops[] = null;
  isLoaded: boolean = false;
  master: RecipeMaster = null;
  mode: string = null;
  processIcons: object = {
    manual: 'hand',
    timer: 'timer',
    calendar: 'calendar'
  };
  refreshRatio: boolean = false;
  styleLibrary: Style[] = null;
  textarea: string = '';
  title: string = '';
  units: SelectedUnits = null;
  variant: RecipeVariant = null;
  yeastLibrary: Yeast[] = null;
  _headerNavPop: any;

  constructor(
    public cdRef: ChangeDetectorRef,
    public events: Events,
    public modalCtrl: ModalController,
    public navCtrl: NavController,
    public navParams: NavParams,
    public actionService: ActionSheetProvider,
    public calculator: CalculationsProvider,
    public clientIdService: ClientIdProvider,
    public libraryService: LibraryProvider,
    public preferenceService: PreferencesProvider,
    public recipeService: RecipeProvider,
    public toastService: ToastProvider
  ) {
    this._headerNavPop = this.headerNavPopEventHandler.bind(this);
  }

  /***** Lifecycle Hooks *****/

  ngOnInit() {
    this.units = this.preferenceService.getSelectedUnits();
    this.setFormTypeConfiguration(
      this.navParams.get('formType'),
      this.navParams.get('mode'),
      this.navParams.get('masterData'),
      this.navParams.get('variantData'),
      this.navParams.get('additionalData')
    );
    this.libraryService.getAllLibraries()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        ([grainsLibrary, hopsLibrary, yeastLibrary, styleLibrary]): void => {
          this.grainsLibrary = <Grains[]>grainsLibrary;
          this.hopsLibrary = <Hops[]>hopsLibrary;
          this.yeastLibrary = <Yeast[]>yeastLibrary;
          this.styleLibrary = <Style[]>styleLibrary;
          this.isLoaded = true;
        },
        (error: ErrorObservable): void => {
          console.log(
            `Library import error: ${normalizeErrorObservableMessage(error)}`
          );
        }
      );
    this.events.subscribe('pop-header-nav', this._headerNavPop);
  }

  ngAfterViewInit() {
    this.handleFormOptions(this.formOptions);
  }

  ngOnDestroy() {
    this.events.unsubscribe('pop-header-nav', this._headerNavPop);
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  /***** End lifecycle hooks *****/


  /***** Modals *****/

  /**
   * Open general recipe form modal - pass current data for update, if present
   *
   * @params: none
   * @return: none
  **/
  openGeneralModal(): void {
    const data: { formType: string, docMethod: string, data: object } = {
      formType: this.formType,
      docMethod: this.docMethod,
      data: {
        style: this.master.style,
        brewingType: this.variant.brewingType,
        mashDuration: this.variant.mashDuration,
        boilDuration: this.variant.boilDuration,
        batchVolume: this.variant.batchVolume,
        boilVolume: this.variant.boilVolume,
        mashVolume: this.variant.mashVolume,
        isFavorite: this.variant.isFavorite,
        isMaster: this.variant.isMaster
      }
    };

    if (this.mode === 'create' && this.formType === 'master') {
      data['styles'] = this.styleLibrary;
      data.data = null;
    } else if (this.mode === 'update') {
      if (this.formType === 'master') {
        data.data['name'] = this.master.name;
        data['styles'] = this.styleLibrary;
      }
      if (this.formType === 'variant') {
        data.data['variantName'] = this.variant.variantName;
      }
    }

    const modal: Modal = this.modalCtrl.create(GeneralFormPage, data);
    modal.onDidDismiss((_data: object) => {
      if (_data) {
        this.mode = 'update';
        this.updateDisplay(_data);
        this.updateRecipeValues();
        this.autoSetBoilMashDuration(_data);
      }
    });
    modal.present({keyboardClose: false});
  }

  /**
   * Open modal to create, edit, or delete specified ingredient type
   *
   * @params: type - the ingredient type
   * @params: [toUpdate] - current ingredient data to edit or delete
   *
   * @return: none
  **/
  openIngredientFormModal(type: string, toUpdate?: object): void {
    const data: { ingredientType: string, update: object } = {
      ingredientType: type,
      update: toUpdate
    };

    switch(type) {
      case 'grains':
        data['library'] = this.grainsLibrary;
        break;
      case 'hops':
        data['library'] = this.hopsLibrary;
        break;
      case 'yeast':
        data['library'] = this.yeastLibrary;
        break;
      default:
        // No additional data needed for an 'other ingredient'
        break;
    };

    const modal: Modal = this.modalCtrl.create(IngredientFormPage, { data: data });
    modal.onDidDismiss((data: object) => {
      if (data) {
        this.updateIngredientList(data, type, toUpdate, data['delete']);
        this.updateRecipeValues();
        if (data['hopsType'] !== undefined) {
          this.autoSetHopsAddition();
        }
      }
    });
    modal.present({keyboardClose: false});
  }

  /**
   * Open modal to create, edit, or delete a note
   *
   * @params: noteType - 'variant' for a common note, 'batch' for a variant specific note
   * @params: [index] - the index to edit or delete
   *
   * @return: none
  **/
  openNoteModal(noteType: string, index?: number): void {
    let toUpdate: string;

    if (index !== undefined) {
      toUpdate = noteType === 'master'
        ? this.master.notes[index]
        : this.variant.notes[index];
    } else {
      toUpdate = '';
    }

    const options: { noteType: string, formMethod: string, toUpdate: string } = {
      noteType: noteType,
      formMethod: index !== undefined ? 'update': 'create',
      toUpdate: toUpdate
    };

    const modal: Modal = this.modalCtrl.create(NoteFormPage, options);
    modal.onDidDismiss((data: object) => {
      if (data) {
        if (data['method'] === 'create') {
          if (noteType === 'master') {
            this.master.notes.push(data['note']);
          } else if (noteType === 'variant') {
            this.variant.notes.push(data['note']);
          }
        } else if (data['method'] === 'update') {
          if (noteType === 'master') {
            this.master.notes[index] = data['note'];
          } else if (noteType === 'variant') {
            this.variant.notes[index] = data['note'];
          }
        } else if (data['method'] === 'delete') {
          if (noteType === 'master') {
            this.master.notes.splice(index, 1);
          } else if (noteType === 'variant') {
            this.variant.notes.splice(index, 1);
          }
        }
      }
    });
    modal.present({keyboardClose: false});
  }

  /**
   * Open modal to create, edit, or delete specified process step type
   *
   * @params: processType - the step type, either 'manual', 'timer', or 'calendar'
   * @params: [toUpdate] - current step data to be edited or deleted
   * @params: [index] - index of step
   *
   * @return: none
  **/
  openProcessModal(processType: string, toUpdate?: object, index?: number): void {
    const options: { processType: string, update: object, formMode: string } = {
      processType: toUpdate ? toUpdate['type']: processType,
      update: toUpdate,
      formMode: toUpdate ? 'update': 'create'
    };

    const modal: Modal = this.modalCtrl.create(ProcessFormPage, options);
    modal.onDidDismiss((data: object) => {
      if (data) {
        if (data['delete']) {
          this.variant.processSchedule.splice(index, 1);
        } else if (data['update']) {
          this.variant.processSchedule[index] = data['update'];
        } else {
          this.variant.processSchedule.push(<Process>data);
        }
      }
    });
    modal.present({keyboardClose: false});
  }

  /***** End Modals *****/


  /***** Action Sheets *****/

  /**
   * Open ingredient form action sheet to select ingredient type to modify
   *
   * @params: none
   * @return: none
  **/
  openIngredientActionSheet(): void {
    this.actionService.openActionSheet(
      'Select an Ingredient',
      [
        {
          text: 'Grains',
          handler: () => {
            this.openIngredientFormModal('grains');
          }
        },
        {
          text: 'Hops',
          handler: () => {
            this.openIngredientFormModal('hops');
          }
        },
        {
          text: 'Yeast',
          handler: () => {
            this.openIngredientFormModal('yeast');
          }
        },
        {
          text: 'Other',
          handler: () => {
            this.openIngredientFormModal('otherIngredients');
          }
        }
      ]
    );
  }

  /**
   * Open action sheet to select the type of process step to add
   *
   * @params: none
   * @return: none
  **/
  openProcessActionSheet(): void {
    this.actionService.openActionSheet(
      'Add a process step',
      [
        {
          text: 'Manual',
          handler: () => {
            this.openProcessModal('manual');
          }
        },
        {
          text: 'Timer',
          handler: () => {
            this.openProcessModal('timer');
          }
        },
        {
          text: 'Calendar',
          handler: () => {
            this.openProcessModal('calendar');
          }
        }
      ]
    );
  }

  /***** End Action Sheets *****/


  /***** Form value auto-generation *****/

  /**
   * Generate timer process steps for mash and boil step if they haven't been added yet
   *
   * @params: data - form data containing mash and boil duration
   *
   * @return: none
  **/
  autoSetBoilMashDuration(data: object): void {
    const mashIndex: number = this.variant.processSchedule
      .findIndex((process: Process) => {
        return process.name === 'Mash';
      });

    if (mashIndex === -1) {
      // add mash timer if one does not already exist
      this.variant.processSchedule.push({
        cid: this.clientIdService.getNewId(),
        type: 'timer',
        name: 'Mash',
        description: 'Mash grains',
        duration: data['mashDuration'],
        concurrent: false,
        splitInterval: 1
      });
    }

    const boilIndex: number = this.variant.processSchedule
      .findIndex((process: Process) => {
        return process.name === 'Boil';
      });
    if (boilIndex === -1) {
      // add boil timer if one does not already exist
      this.variant.processSchedule.push({
        cid: this.clientIdService.getNewId(),
        type: 'timer',
        name: 'Boil',
        description: 'Boil wort',
        duration: data['boilDuration'],
        concurrent: false,
        splitInterval: 1
      });
    }
  }

  /**
   * Generate timer process step for hops addition
   *
   * @params: none
   *
   * @return: none
  **/
  autoSetHopsAddition(): void {
    // if the boil step has not been set, do not auto add the timer
    const boilStep: Process = this.variant.processSchedule
      .find((process: Process) => {
        return process.name === 'Boil';
      });

    if (boilStep !== undefined) {
      // remove existing hops timers
      this.variant.processSchedule = this.variant.processSchedule
        .filter((process: Process) => {
          return !process.name.match(/^(Add).*(hops)$/);
        });

      // add hops timers for each hops instance
      // ignore dry hop additions
      // combine hops additions that occur at the same time
      const hopsForTimers = this.variant.hops
        .filter((hops: HopsSchedule) => {
          return !hops.dryHop;
        });

      // sort timers in descending order
      hopsForTimers.sort(
        (h1: HopsSchedule, h2: HopsSchedule) => {
          if (h1.addAt < h2.addAt) {
            return 1;
          } else if (h1.addAt > h2.addAt) {
            return -1;
          }
          return 0;
        }
      );

      hopsForTimers.forEach(
        (hopsAddition: HopsSchedule) => {
          this.variant.processSchedule.push({
            cid: this.clientIdService.getNewId(),
            type: 'timer',
            name: `Add ${hopsAddition.hopsType.name} hops`,
            concurrent: true,
            description: `Hops addition: ${roundToDecimalPlace(hopsAddition.quantity, 2)}${this.units.weightSmall.shortName}`,
            duration: this.getHopsTimeRemaining(hopsAddition.addAt)
          })
        }
      );

      // set boil timer to concurrent
      boilStep.concurrent = true;
    }
  }

  /***** End form value auto-generation *****/


  /***** Recipe Calculations *****/

  /**
   * Get time remaining after subtracting addAt time from boil time
   *
   * @params: addAt - time to add hops at in minutes
   *
   * @return: difference between boil time and addAt time point
  **/
  getHopsTimeRemaining(addAt: number): number {
    const boilStep: Process = this.variant.processSchedule
      .find((process: Process) => process.name === 'Boil');
    // TODO handle missing boil step
    const boilTime: number = boilStep ? boilStep.duration: 60;
    return boilTime - addAt;
  }

  /**
   * Update recipe calculated values
   *
   * @params: none
   * @return: none
  **/
  updateRecipeValues(): void {
    this.calculator.calculateRecipeValues(this.variant);
  }

  /***** End recipe calculations *****/


  /***** Form data handling *****/

  /**
   * Format form data for recipe creation or update
   *
   * @params: none
   *
   * @return: structured form data for service
  **/
  constructPayload(): object {
    let payload: object;

    if (this.formType === 'master') {
      if (this.docMethod === 'create') {
        payload = {
          master: {
            name: this.master.name,
            style: this.master.style,
            notes: this.master.notes,
            isPublic: this.master.isPublic,
          },
          variant: this.variant
        }
      } else {
        payload = {
          name: this.master.name,
          style: this.master.style,
          notes: this.master.notes,
          isPublic: this.master.isPublic
        };
      }
    } else if (this.formType === 'variant') {
      payload = this.variant;
    }

    return payload;
  }

  /**
   * Handle additional options passed to form page
   *
   * @params: options - object with additional formatting data
   *
   * @return: none
  **/
  handleFormOptions(options: object): void {
    if (!options) return;

    if (options.hasOwnProperty('noteIndex')) {
      this.openNoteModal('variant', options['noteIndex']);
    }
  }

  /**
   * Call appropriate submission type with recipe form data
   *
   * @params: none
   *
   * @return: none
  **/
  onSubmit(): void {
    const payload: object = this.constructPayload();

    const message: string = toTitleCase(
      `${this.formType} ${this.docMethod} Successful!`
    );

    if (this.docMethod === 'create') {
      this.submitCreationPost(payload, message);
    } else if (this.docMethod === 'update') {
      this.submitPatchUpdate(payload, message);
    }
  }

  /**
   * Set form configuration from nav params
   *
   * @params: formType - either 'master' for RecipeMaster or 'variant' for
   *          RecipeVariant
   * @params: mode - CRUD mode
   * @params: master - RecipeMaster instance
   * @params: variant - RecipeVariant instance
   * @params: additionalData - additional configuration object
   *
   * @return: none
  **/
  setFormTypeConfiguration(
    formType: string,
    mode: string,
    master: RecipeMaster,
    variant: RecipeVariant,
    additionalData: object
  ): void {
    this.formType = formType;
    this.formOptions = additionalData;
    this.mode = mode;
    this.docMethod = mode;

    if (formType === 'master') {
      if (mode === 'create') {
        // Start master and variant with default values
        this.title = 'Create Recipe';
        const _defaultRecipeMaster: RecipeMaster = defaultRecipeMaster();
        this.master = _defaultRecipeMaster;
        this.variant = _defaultRecipeMaster.variants[0];
      } else {
        // Start master and variant with existing values
        this.title = `Update ${master.name}`;
        this.master = clone(master);
        this.variant = clone(master.variants.find(elem => elem.isMaster));
      }
    } else {
      if (mode === 'create') {
        // Start master with given master and variant with the master variant
        this.title = `Add Variant to ${master.name}`;
        this.master = master;
        this.variant = clone(master.variants.find(elem => elem.isMaster));
        stripSharedProperties(this.variant);
        this.variant.variantName = '';
      } else {
        // Start master and variant with existing values
        this.title = `Update ${variant.variantName}`;
        this.master = clone(master);
        this.variant = clone(variant);
      }
    }
  }

  /**
   * Submit a new RecipeMaster or RecipeVariant
   *
   * @params: payload - formatted data object for creation
   * @params: message - feedback toast message
   *
   * @return: none
  **/
  submitCreationPost(payload: object, message: string): void {
    if (this.formType === 'master') {
      this.recipeService.postRecipeMaster(payload)
        .pipe(take(1))
        .subscribe(
          (): void => {
            console.log('master create success');
            this.toastService.presentToast(message);
            this.events.publish(
              'update-nav-header',
              {
                caller: 'recipe form page',
                other: 'form-submit-complete'
              }
            );
          },
          (error: string): void => {
            this.toastService.presentToast(error);
            if (!RegExp('Client Validation Error', 'g').test(error)) {
              this.events.publish(
                'update-nav-header',
                {
                  caller: 'recipe form page',
                  other: 'form-submit-complete'
                }
              );
            }
          }
        );
    } else if (this.formType === 'variant') {
      this.recipeService.postRecipeToMasterById(
        getId(this.master),
        <RecipeVariant>payload
      )
      .pipe(take(1))
      .subscribe(
        (): void => {
          console.log('variant create success');
          this.toastService.presentToast(message);
          this.events.publish(
            'update-nav-header',
            {
              caller: 'recipe form page',
              other: 'form-submit-complete'
            }
          );
        },
        (error: string): void => {
          this.toastService.presentToast(error);
        }
      );
    }
  }

  /**
   * Update a RecipeMaster or RecipeVariant
   *
   * @params: payload - formatted data object for HTTP post
   * @params: message - feedback toast message
   *
   * @return: none
  **/
  submitPatchUpdate(payload: object, message: string): void {
    if (this.formType === 'master') {
      this.recipeService.patchRecipeMasterById(getId(this.master), payload)
        .pipe(take(1))
        .subscribe(
          (): void => {
            this.toastService.presentToast(message);
            this.events.publish(
              'update-nav-header',
              {
                caller: 'recipe form page',
                other: 'form-submit-complete'
              }
            );
          },
          (error: string): void => {
            this.toastService.presentToast(error);
          }
        );
    } else if (this.formType === 'variant') {
      this.recipeService.patchRecipeVariantById(
        getId(this.master),
        getId(this.variant),
        payload
      )
      .pipe(take(1))
      .subscribe(
        (): void => {
          this.toastService.presentToast(message);
          this.events.publish(
            'update-nav-header',
            {
              caller: 'recipe form page',
              other: 'form-submit-complete'
            }
          );
        },
        (error: string): void => {
          this.toastService.presentToast(error);
        }
      );
    }
  }

  /***** End form data handling *****/


  /***** Ingredient List *****/

  /**
   * Sort ingredient array in the following orders:
   * - grains: descending quantity
   * - hops: chronological
   * - yeast: descending quantity
   *
   * @params: ingredientType - the ingredient array to sort
   *
   * @return: none
  **/
  sortIngredients(ingredientType: string): void {
    switch(ingredientType) {
      case 'grains':
        this.variant.grains.sort(
          (g1: GrainBill, g2: GrainBill): number => {
            if (g1.quantity < g2.quantity) {
              return 1;
            }
            if (g1.quantity > g2.quantity) {
              return -1;
            }
            return 0;
          });
        break;
      case 'hops':
        this.variant.hops.sort(
          (h1: HopsSchedule, h2: HopsSchedule): number => {
            if (!h1.addAt || h1.addAt < h2.addAt) {
              return 1;
            }
            if (!h2.addAt || h1.addAt > h2.addAt) {
              return -1;
            }
            return 0;
          });
        break;
      case 'yeast':
        this.variant.yeast.sort(
          (y1: YeastBatch, y2: YeastBatch): number => {
            if (y1.quantity < y2.quantity) {
              return 1;
            }
            if (y1.quantity > y2.quantity) {
              return -1;
            }
            return 0;
          });
        break;
      default:
        // do not sort on 'otherIngredients' or unknown ingredient type
        break;
    };
  }

  /**
   * Update in memory ingredient arrays
   *
   * @params: ingredient - ingredient data returned from ingredient form
   * @params: type - the ingredient type
   * @params: [toUpdate] - current ingredient data to edit
   * @params: [deletion] - true if ingredient is to be deleted
   *
   * @return: none
  **/
  updateIngredientList(
    ingredient: object,
    type: string,
    toUpdate?: object,
    deletion?: boolean
  ): void {
    switch(type) {
      case 'grains':
        if (toUpdate) {
          const index = this.variant.grains.findIndex(elem => {
            return elem.grainType._id === toUpdate['grainType']._id;
          });
          if (deletion) {
            this.variant.grains.splice(index, 1);
          } else {
            this.variant.grains[index] = <GrainBill>ingredient;
          }
        } else {
          this.variant.grains.push(<GrainBill>ingredient);
        }
        this.sortIngredients('grains');
        break;
      case 'hops':
        if (toUpdate) {
          const index = this.variant.hops.findIndex(elem => {
            return elem.hopsType._id === toUpdate['hopsType']._id;
          });
          if (deletion) {
            this.variant.hops.splice(index, 1);
          } else {
            this.variant.hops[index] = <HopsSchedule>ingredient;
          }
        } else {
          this.variant.hops.push(<HopsSchedule>ingredient);
        }
        this.sortIngredients('hops');
        break;
      case 'yeast':
        if (toUpdate) {
          const index = this.variant.yeast.findIndex(elem => {
            return elem.yeastType._id === toUpdate['yeastType']._id;
          });
          if (deletion) {
            this.variant.yeast.splice(index, 1);
          } else {
            this.variant.yeast[index] = <YeastBatch>ingredient;
          }
        } else {
          this.variant.yeast.push(<YeastBatch>ingredient);
        }
        this.sortIngredients('yeast');
        break;
      case 'otherIngredients':
        if (toUpdate) {
          const index = this.variant.otherIngredients.findIndex(elem => {
            return elem.name === toUpdate['name'];
          });
          if (deletion) {
            this.variant.otherIngredients.splice(index, 1);
          } else {
            this.variant.otherIngredients[index] = <OtherIngredients>ingredient;
          }
        } else {
          this.variant.otherIngredients.push(<OtherIngredients>ingredient);
        }
        break;
      default:
        this.toastService.presentToast(
          `Unknown ingredient type '${type}'`,
          2000,
          'middle'
        );
        break;
    }
    this.refreshRatio = !this.refreshRatio;
    this.cdRef.detectChanges();
  }

  /***** End ingredient list *****/


  /***** Other *****/

  /**
   * Handle header nav pop event
   *
   * @params: data - nav data
   * @return: none
  **/
  headerNavPopEventHandler(data: object): void {
    if (data['origin'] === 'RecipeDetailPage') {
      this.navCtrl.pop();
    }
  }

  /**
   * Map data to RecipeMaster and/or RecipeVariant
   *
   * @params: data - data that may be contained in the RecipeMaster and/or Recipe
   *
   * @return: none
  **/
  updateDisplay(data: object): void {
    for (const key in data) {
      if (this.master.hasOwnProperty(key)) {
        this.master[key] = data[key];
      }
      if (this.variant.hasOwnProperty(key)) {
        this.variant[key] = data[key];
      }
    }
  }

}
