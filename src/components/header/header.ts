import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ModalController, Events } from 'ionic-angular';

import { LoginPage } from '../../pages/forms/login/login';
import { SignupPage } from '../../pages/forms/signup/signup';

import { UserProvider } from '../../providers/user/user';

@Component({
  selector: 'app-header',
  templateUrl: 'header.html'
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Input() title: string;
  private username: string = '';
  private _titleChange: any;
  private _tabChange: any;

  constructor(private modalCtrl: ModalController,
    private cdRef: ChangeDetectorRef,
    public events: Events,
    private userService: UserProvider) {
      this.getUsername();
      this._titleChange = this.titleChangeEventHandler.bind(this);
      this._tabChange = this.tabChangeEventHandler.bind(this);
  }

  getUsername() {
    const user = this.userService.getUser();
    this.username = user != null ? user.username: '';
  }

  ngOnDestroy() {
    this.events.unsubscribe('title-change', this._titleChange);
    this.events.unsubscribe('tab-change', this._tabChange);
  }

  ngOnInit() {
    this.events.subscribe('title-change', this._titleChange);
    this.events.subscribe('tab-change', this._tabChange);
  }

  openLogin() {
    const modal = this.modalCtrl.create(LoginPage);
    modal.onDidDismiss(data => {
      if (data) {
        this.username = data;
        this.cdRef.detectChanges();
      }
    });
    modal.present();
  }

  tabChangeEventHandler() {
    this.getUsername();
  }

  titleChangeEventHandler(title: string) {
    console.log(title);
    this.title = title;
  }

}
