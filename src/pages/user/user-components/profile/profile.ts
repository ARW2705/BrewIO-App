/* Module imports */
import { Component, ChangeDetectorRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TextInput } from 'ionic-angular';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { Subject } from 'rxjs/Subject';
import { takeUntil } from 'rxjs/operators/takeUntil';
import { take } from 'rxjs/operators/take';

/* Utility imports */
import { normalizeErrorObservableMessage } from '../../../../shared/utility-functions/observable-helpers';

/* Page imports */
import { User } from '../../../../shared/interfaces/user';

/* Provider imports */
import { UserProvider } from '../../../../providers/user/user';
import { ToastProvider } from '../../../../providers/toast/toast';


@Component({
  selector: 'profile',
  templateUrl: 'profile.html'
})
export class ProfileComponent {
  @ViewChild('email') emailField: TextInput;
  @ViewChild('firstname') firstnameField: TextInput;
  @ViewChild('lastname') lastnameField: TextInput;
  destroy$: Subject<boolean> = new Subject<boolean>();
  editing: string = '';
  isLoggedIn: boolean = false;
  user: User = null;
  userForm: FormGroup = null;

  constructor(
    public cdRef: ChangeDetectorRef,
    public formBuilder: FormBuilder,
    public toastService: ToastProvider,
    public userService: UserProvider
  ) { }

  /***** Lifecycle Hooks *****/

  ngOnInit() {
    this.userService.getUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (user: User) => {
          this.user = user;
          this.isLoggedIn = this.userService.isLoggedIn();
          this.initForm(user);
        },
        (error: ErrorObservable) => {
          console.log(`Error getting user: ${normalizeErrorObservableMessage(error)}`);
        }
      );
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  /***** End Lifecycle Hooks *****/


  /***** Form Methods *****/

  /**
   * Select field to be edited
   *
   * @params: field - the form control field to edit
   * @params: update - new text to be applied
   *
   * @return: none
  **/
  changeEdit(field: string, update: TextInput): void {
    this.editing = update === undefined ? field: '';
    if (update === undefined) {
      this.cdRef.detectChanges();
      if (field === 'email') {
        this.emailField.setFocus();
      } else if (field === 'firstname') {
        this.firstnameField.setFocus();
      } else if (field === 'lastname') {
        this.lastnameField.setFocus();
      }
    }
  }

  /**
   * Create form with profile values in form fields
   *
   * @params: user - user profile object
   *
   * @return: none
  **/
  initForm(user: any): void {
    this.userForm = this.formBuilder.group({
      email: [(user && user.email ? user.email: ''), [Validators.email, Validators.required]],
      firstname: [(user && user.firstname ? user.firstname: ''), [Validators.maxLength(25)]],
      lastname: [(user && user.lastname ? user.lastname: ''), [Validators.maxLength(25)]]
    });
  }

  /**
   * Check if given field is being edited
   *
   * @params: field - form field to check
   *
   * @return: true if given field matches the currently editing field
  **/
  isEditing(field: string): boolean {
    return field === this.editing;
  }

  /**
   * Submit updated user profile, update view on successful response or
   * display error message on error
   *
   * @params: none
   * @return: none
  **/
  onUpdate(): void {
    this.userService.updateUserProfile(this.userForm.value)
      .pipe(take(1))
      .subscribe(
        (): void => {
          this.toastService.presentToast('Profile Updated');
        },
        error => {
          this.toastService.presentToast(error);
        }
      );
  }

  /***** End Form Methods *****/

}
