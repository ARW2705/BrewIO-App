/* Module imports */
import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup } from '@angular/forms';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { Subject } from 'rxjs/Subject';

/* Constant imports */
import { BRIX, PLATO, SPECIFIC_GRAVITY } from '../../../../shared/constants/units';

/* Interface imports */
import { User } from '../../../../shared/interfaces/user';
import { SelectedUnits } from '../../../../shared/interfaces/units';

/* Default imports */
import { defaultEnglish, defaultMetric } from '../../../../shared/defaults/default-units';

/* Utility imports */
import { normalizeErrorObservableMessage } from '../../../../shared/utility-functions/observable-helpers';

/* Provider imports */
import { PreferencesProvider } from '../../../../providers/preferences/preferences';
import { ToastProvider } from '../../../../providers/toast/toast';
import { UserProvider } from '../../../../providers/user/user';


@Component({
  selector: 'preferences',
  templateUrl: 'preferences.html'
})
export class PreferencesComponent implements OnInit, OnDestroy {
  destroy$: Subject<boolean> = new Subject<boolean>();
  defaultEnglish: SelectedUnits = defaultEnglish();
  defaultMetric: SelectedUnits = defaultMetric();
  preferencesForm: FormGroup = null;
  preferredUnits: string = '';
  setUnits: SelectedUnits = null;
  user: User = null;

  constructor(
    public formBuilder: FormBuilder,
    public preferenceService: PreferencesProvider,
    public toastService: ToastProvider,
    public userService: UserProvider
  ) { }

  /***** Lifecycle Hooks *****/

  ngOnInit() {
    this.userService.getUser()
      .takeUntil(this.destroy$)
      .subscribe(
        (user: User): void => {
          this.user = user;
          this.preferredUnits = this.preferenceService.getPreferredUnitSystem();
          this.setUnits = this.preferenceService.getSelectedUnits();
          if (this.preferredUnits.length > 0 && this.setUnits !== null) {
            this.initForm();
            this.listenForChanges();
          } else {
            // TODO handle error for insufficient preferences data
            console.log(
              'Preferences data error',
              this.preferredUnits,
              this.setUnits
            );
          }
        },
        (error: ErrorObservable): void => {
          // TODO add error feedback
          console.log(
            `Error loading user: ${normalizeErrorObservableMessage(error)}`
          );
        }
      )
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  /***** End Lifecycle Hooks *****/


  /***** Form Methods *****/

  /**
   * Initialize preferences form
   *
   * @params: none
   * @return: none
  **/
  initForm(): void {
    const _defaultEnglish: SelectedUnits = defaultEnglish();
    this.preferencesForm = this.formBuilder.group({
      preferredUnitSystem: [],
      weightSmall: [
        this.setUnits.weightSmall.system === _defaultEnglish.weightSmall.system
      ],
      weightLarge: [
        this.setUnits.weightLarge.system === _defaultEnglish.weightLarge.system
      ],
      volumeSmall: [
        this.setUnits.volumeSmall.system === _defaultEnglish.volumeSmall.system
      ],
      volumeLarge: [
        this.setUnits.volumeLarge.system === _defaultEnglish.volumeLarge.system
      ],
      temperature: [
        this.setUnits.temperature.system === _defaultEnglish.temperature.system
      ],
      density: []
    });
    const controls: { [key: string]: AbstractControl }
      = this.preferencesForm.controls;

    controls.preferredUnitSystem.setValue(this.setUnits.system);
    controls.density.setValue(this.setUnits.density.longName);
  }

  /**
   * Submit preferences update
   *
   * @params: none
   * @return: none
  **/
  onSubmit(): void {
    const formValues: object = this.preferencesForm.value;
    const system: string = formValues['preferredUnitSystem'];
    const density: string = formValues['density'];
    const updatedUnits: SelectedUnits = {
      system: formValues['preferredUnitSystem'],
      weightSmall:  formValues['weightSmall']
        ? this.defaultEnglish['weightSmall']
        : this.defaultMetric['weightSmall'],
      weightLarge:  formValues['weightLarge']
        ? this.defaultEnglish['weightLarge']
        : this.defaultMetric['weightLarge'],
      volumeSmall:  formValues['volumeSmall']
        ? this.defaultEnglish['volumeSmall']
        : this.defaultMetric['volumeSmall'],
      volumeLarge:  formValues['volumeLarge']
        ? this.defaultEnglish['volumeLarge']
        : this.defaultMetric['volumeLarge'],
      temperature:  formValues['temperature']
        ? this.defaultEnglish['temperature']
        : this.defaultMetric['temperature'],
      density: null
    };

    if (density === 'plato') {
      updatedUnits.density = PLATO;
    } else if (density === 'specificGravity') {
      updatedUnits.density = SPECIFIC_GRAVITY;
    } else {
      updatedUnits.density = BRIX;
    }

    this.preferenceService.setUnits(system, updatedUnits);

    this.userService.updateUserProfile({
      preferredUnitSystem: system,
      units: updatedUnits
    })
    .subscribe(
      (): void => {
        this.toastService
          .presentToast('Preferences Updated!', 1000, 'middle', 'toast-bright');
      },
      (error: ErrorObservable): void => {
        console.log(
          `Preferences submit error: ${normalizeErrorObservableMessage(error)}`
        );
      }
    );
  }

  listenForChanges(): void {
    this.preferencesForm.valueChanges
      .takeUntil(this.destroy$)
      .subscribe((formValues: object): void => {
        for (const key in formValues) {
          if (this.setUnits.hasOwnProperty(key)) {
            this.setUnits[key] = formValues[key]
              ? this.defaultEnglish[key]
              : this.defaultMetric[key];
          }
        }
      });
  }

  /***** End Form Methods *****/

}
