/* Module imports */
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Subject } from 'rxjs/Subject';

/* Interface imports */
import { User } from '../../../../shared/interfaces/user';

/* Provider imports */
import { PreferencesProvider } from '../../../../providers/preferences/preferences';
import { UserProvider } from '../../../../providers/user/user';


@Component({
  selector: 'preferences',
  templateUrl: 'preferences.html'
})
export class PreferencesComponent implements OnInit, OnDestroy {
  preferencesForm: FormGroup = null;
  user: User = null;
  destroy$: Subject<boolean> = new Subject<boolean>();
  preferredUnits: string = '';

  constructor(
    public preferenceService: PreferencesProvider,
    public userService: UserProvider,
    public formBuilder: FormBuilder
  ) { }

  /***** Lifecycle Hooks *****/

  ngOnInit() {
    this.userService.getUser()
      .takeUntil(this.destroy$)
      .subscribe(
        user => {
          this.user = user;
          this.preferredUnits = this.preferenceService.units === 'e' ? 'English' : 'Metric';
          this.initForm();
          this.listenForChanges();
        },
        error => {
          // TODO add error feedback
          console.log('Error loading user');
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
    this.preferencesForm = this.formBuilder.group({
      preferredUnits: this.user.preferredUnits === 'e'
    });
  }

  /**
   * Listen for changes to form and update service
   *
   * @params: none
   * @return: none
  **/
  listenForChanges(): void {
    this.preferencesForm.valueChanges
      .subscribe(formValues => {
        this.preferredUnits = formValues.preferredUnits ? 'English': 'Metric';
        this.preferenceService.setUnits(formValues.preferredUnits);
      });
  }

  /***** End Form Methods *****/

}
