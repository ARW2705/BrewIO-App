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
  isTabPage: boolean = true;
  username: string = '';
  currentTab: string = '';
  navStack: Array<string> = [];
  _updateUser: any;
  _headerNavUpdate: any;

  constructor(public modalCtrl: ModalController,
    public navCtrl: NavController,
    public events: Events,
    public userService: UserProvider,
    public modalService: ModalProvider) {
      this._headerNavUpdate = this.headerNavUpdateEventHandler.bind(this);
      this._updateUser = this.updateUserEventHandler.bind(this);
  }

  // Header back button, publish event with nav destination
  goBack(): void {
    this.events.publish('pop-header-nav', {
      origin: this.isTabPage ? '': this.navStack.pop()
    });
    this.isTabPage =  !this.navStack.length
                    || this.navStack[this.navStack.length - 1] === 'tab';
  }

  // Handle nav events - format header according to nav data
  headerNavUpdateEventHandler(data: any): void {
    if (data.origin) {
      // add previous page/tab to nav stack
      this.navStack.push(data.origin);
    }
    if (data.dest) {
      this.currentTab = data.dest;
    }
    if (data.destType) {
      // tab destinations should clear stack
      if (data.destType === 'tab') {
        this.isTabPage = true;
        this.navStack = [];
      } else {
        this.isTabPage = false;
      }
    }
    if (data.destTitle) {
      this.title = data.destTitle;
    }
    if (data.other === 'batch-end') {
      // if on process page and batch has been completed, automatically go back
      this.goBack();
    }
    this.username = this.userService.getUsername();
  }

  isUserTab(): boolean {
    return this.currentTab === 'user';
  }

  logout(): void {
    this.userService.logOut();
  }

  ngOnDestroy() {
    this.events.unsubscribe('update-nav-header', this._headerNavUpdate);
    this.events.unsubscribe('update-user', this._updateUser);
  }

  ngOnInit() {
    this.events.subscribe('update-nav-header', this._headerNavUpdate);
    this.events.subscribe('update-user', this._updateUser);
  }

  openLogin(): void {
    this.modalService.openLogin();
  }

  updateUserEventHandler(data: any) {
    this.username = data ? data.username: '';
  }

}
