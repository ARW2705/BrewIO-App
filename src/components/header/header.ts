import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { ModalController, NavController, Events } from 'ionic-angular';

import { UserProvider } from '../../providers/user/user';
import { ModalProvider } from '../../providers/modal/modal';

@Component({
  selector: 'app-header',
  templateUrl: 'header.html'
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Input() title: string;
  tabPage: boolean = true;
  username: string = '';
  userTab: boolean = false;
  navStack: Array<string> = [];
  _userUpdate: any;
  _headerNavUpdate: any;

  constructor(public modalCtrl: ModalController,
    public navCtrl: NavController,
    public events: Events,
    public userService: UserProvider,
    public modalService: ModalProvider) {
      this._headerNavUpdate = this.headerNavUpdateEventHandler.bind(this);
      this._userUpdate = this.userUpdateEventHandler.bind(this);
  }

  goBack(): void {
    this.events.publish('header-nav-pop', {
      origin: this.tabPage ? '': this.navStack.pop()
    });
    this.tabPage =  !this.navStack.length
                    || this.navStack[this.navStack.length - 1] === 'tab';
  }

  headerNavUpdateEventHandler(data: any): void {
    if (data.origin) {
      this.navStack.push(data.origin);
    }
    if (data.dest) {
      this.userTab = data.dest === 'user';
    }
    if (data.destType) {
      if (data.destType === 'tab') {
        this.tabPage = true;
        this.navStack = [];
      } else {
        this.tabPage = false;
      }
    }
    if (data.destTitle) {
      this.title = data.destTitle;
    }
    if (data.other === 'batch-end') {
      this.goBack();
    }
    this.username = this.userService.getUsername();
  }

  isTab(): boolean {
    return this.navStack[this.navStack.length - 1] === 'tab';
  }

  logout(): void {
    this.userService.logOut();
  }

  ngOnDestroy() {
    this.events.unsubscribe('header-nav-update', this._headerNavUpdate);
    this.events.unsubscribe('user-update', this._userUpdate);
  }

  ngOnInit() {
    this.events.subscribe('header-nav-update', this._headerNavUpdate);
    this.events.subscribe('user-update', this._userUpdate);
  }

  openLogin(): void {
    this.modalService.openLogin();
  }

  userUpdateEventHandler(data: any) {
    this.username = data ? data.username: '';
  }

}
