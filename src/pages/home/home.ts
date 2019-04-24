import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { NavController, Events } from 'ionic-angular';

import { UserProvider } from '../../providers/user/user';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage implements OnInit, OnDestroy {
  title = "Brew IO";
  private user = null;
  activeBatches = [];
  notifications = [];
  private _login: any;

  constructor(public navCtrl: NavController,
    private cdRef: ChangeDetectorRef,
    private events: Events,
    private userService: UserProvider) {
      this._login = this.loginEventHandler.bind(this);
  }

  loginEventHandler() {
    this.user = this.userService.getUser();
    this.cdRef.detectChanges();
  }

  ngOnDestroy() {
    this.events.unsubscribe('on-login', this._login);
  }

  ngOnInit() {
    this.events.subscribe('on-login', this._login);
  }

}
