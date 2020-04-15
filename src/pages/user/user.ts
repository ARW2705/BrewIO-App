/* Module imports */
import { Component, ViewChild, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { NavController, TextInput } from 'ionic-angular';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/takeUntil';

/* Interface imports */
import { User } from '../../shared/interfaces/user';

/* Provider imports */
import { UserProvider } from '../../providers/user/user';
import { ModalProvider } from '../../providers/modal/modal';
import { ToastProvider } from '../../providers/toast/toast';

@Component({
  selector: 'page-user',
  templateUrl: 'user.html'
})
export class UserPage implements OnInit, OnDestroy {
  @ViewChild('email') emailField: TextInput;
  @ViewChild('firstname') firstnameField: TextInput;
  @ViewChild('lastname') lastnameField: TextInput;
  user$: Observable<User> = null;
  destroy$: Subject<boolean> = new Subject<boolean>();
  user: User = null;
  userForm: FormGroup = null;
  editing = '';
  originalValues = {
    email: '',
    firstname: '',
    lastname: ''
  };

  constructor(
    public navCtrl: NavController,
    public formBuilder: FormBuilder,
    public cdRef: ChangeDetectorRef,
    public userService: UserProvider,
    public modalService: ModalProvider,
    public toastService: ToastProvider
  ) {
    this.user$ = this.userService.getUser();
  }

  /***** Lifecycle hooks *****/

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  ngOnInit() {
    this.user$
      .takeUntil(this.destroy$)
      .subscribe(user => {
        this.user = user;
        this.initForm(user);
      });
  }

  /***** End lifecycle hooks *****/

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
   * Check if profile form has a value other than original
   *
   * @params: none
   *
   * @return: true if at least on form field has a new input value
  **/
  hasValuesToUpdate(): boolean {
    for (const key in this.originalValues) {
      if (this.userForm.value[key] != this.originalValues[key]) {
        return true;
      }
    }
    return false;
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
   * Check if user is logged in via user provider
   *
   * @params: none
   *
   * @return: true if user is logged in
  **/
  isLoggedIn(): boolean {
    return this.userService.isLoggedIn();
  }

  /**
   * Update original values object with new values
   *
   * @params: values - key value pairs of updates to apply
   *
   * @return: none
  **/
  mapOriginalValues(values: any): void {
    for (const key in this.originalValues) {
      if (values.hasOwnProperty(key)) {
        this.originalValues[key] = values[key];
      }
    }
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
      .subscribe(
        response => {
          this.updateForm(response);
          this.toastService.presentToast('Profile Updated');
        },
        error => {
          this.toastService.presentToast(error);
        }
      );
  }

  /**
   * Open login form modal
   *
   * @params: none
   * @return: none
  **/
  openLogin(): void {
    this.modalService.openLogin();
  }

  /**
   * Open sign up form modal
   *
   * @params: none
   * @return: none
  **/
  openSignup(): void {
    this.modalService.openSignup();
  }

  /**
   * Update original values and form fields with updated values
   *
   * @params: update - key value pairs of user profile data
   *
   * @return: none
  **/
  updateForm(update: any): void {
    this.mapOriginalValues(update);
    this.userForm.reset(this.originalValues);
  }

}
