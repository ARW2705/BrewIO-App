import { Component, ViewChild, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { NavController, TextInput, NavParams, Events } from 'ionic-angular';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import { User } from '../../shared/interfaces/user';

import { UserProvider } from '../../providers/user/user';
import { ModalProvider } from '../../providers/modal/modal';

@Component({
  selector: 'page-user',
  templateUrl: 'user.html'
})
export class UserPage implements OnInit, OnDestroy {
  private user: User = null;
  private userForm: FormGroup = null;
  private _userUpdate: any;
  private editing = '';
  @ViewChild('email') emailField: TextInput;
  @ViewChild('firstname') firstnameField: TextInput;
  @ViewChild('lastname') lastnameField: TextInput;
  private originalValues = {
    email: '',
    firstname: '',
    lastname: ''
  };

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    private formBuilder: FormBuilder,
    private events: Events,
    private cdRef: ChangeDetectorRef,
    private userService: UserProvider,
    private modalService: ModalProvider) {
      this._userUpdate = this.userUpdateEventHandler.bind(this);
      this.initUser();
  }

  private clearForm(): void {
    this.originalValues.email = '';
    this.originalValues.firstname = '';
    this.originalValues.lastname = '';
  }

  ngOnInit() {
    this.events.subscribe('user-update', this._userUpdate);
  }

  ngOnDestroy() {
    this.events.unsubscribe('user-update', this._userUpdate);
  }

  initUser() {
    this.user = this.userService.getUser();
    if (this.user != null) {
      this.originalValues.email = this.user.email;
      this.originalValues.firstname = this.user.firstname;
      this.originalValues.lastname = this.user.lastname;
      this.initForm();
    }
  }

  private userUpdateEventHandler(data: any): void {
    if (data) {
      this.initUser();
      this.cdRef.detectChanges();
    } else {
      this.clearForm();
      this.user = null;
    }
  }

  private initForm(): void {
    this.userForm = this.formBuilder.group({
      email: [this.user.email, [Validators.email, Validators.required]],
      firstname: [this.user.firstname, [Validators.maxLength(25)]],
      lastname: [this.user.lastname, [Validators.maxLength(25)]]
    });
  }

  private onUpdate(): void {
    console.log('update', this.userForm.value);
    this.userService.updateUserProfile(this.userForm.value)
      .subscribe(response => {
        console.log('profile updated', response);
        this.userForm.reset();
        this.originalValues.email = response.email;
        this.originalValues.firstname = response.firstname;
        this.originalValues.lastname = response.lastname;
      });
  }

  private openLogin(): void {
    this.modalService.openLogin();
  }

  private openSignup(): void {
    this.modalService.openSignup();
  }

  private isEditing(field: string): boolean {
    return field == this.editing;
  }

  private changeEdit(field: string, update: TextInput): void {
    this.editing = update == undefined ? field: '';
    if (update == undefined) {
      this.cdRef.detectChanges();
      if (field == 'email') {
        this.emailField.setFocus();
      } else if (field == 'firstname') {
        this.firstnameField.setFocus();
      } else if (field == 'lastname') {
        this.lastnameField.setFocus();
      }
    }
  }

  private hasValuesToUpdate(): boolean {
    for (const key in this.originalValues) {
      if (this.userForm.value[key] != this.originalValues[key]) {
        return true;
      }
    }
    return false;
  }

}
