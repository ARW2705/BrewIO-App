import { Component, Input, OnInit, OnDestroy, AfterViewInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { ModalController, NavController, Events, Navbar, Tabs } from 'ionic-angular';

import { LoginPage } from '../../pages/forms/login/login';
import { SignupPage } from '../../pages/forms/signup/signup';

import { UserProvider } from '../../providers/user/user';
import { ModalProvider } from '../../providers/modal/modal';

@Component({
  selector: 'app-header',
  templateUrl: 'header.html'
})
export class HeaderComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() title: string;
  @ViewChild(Navbar) navBar: Navbar;
  private username: string = '';
  private userTab: boolean = false;
  private _titleChange: any;
  private _tabChange: any;
  private _userUpdate: any;

  constructor(private modalCtrl: ModalController,
    private navCtrl: NavController,
    private cdRef: ChangeDetectorRef,
    public events: Events,
    private tabs: Tabs,
    private userService: UserProvider,
    private modalService: ModalProvider) {
      this._titleChange = this.titleChangeEventHandler.bind(this);
      this._tabChange = this.tabChangeEventHandler.bind(this);
      this._userUpdate = this.userUpdateEventHandler.bind(this);
  }

  ngAfterViewInit() {
    this.navBar.backButtonClick = (e: UIEvent) => {
      this.events.publish('header-nav-pop', this.navCtrl.getActive().name);
      this.navCtrl.pop();
    }
  }

  ngOnDestroy() {
    this.events.unsubscribe('title-change', this._titleChange);
    this.events.unsubscribe('tab-change', this._tabChange);
    this.events.subscribe('user-update', this._userUpdate);
  }

  ngOnInit() {
    this.events.subscribe('title-change', this._titleChange);
    this.events.subscribe('tab-change', this._tabChange);
    this.events.subscribe('user-update', this._userUpdate);
  }

  openLogin() {
    this.modalService.openLogin();
  }

  logout(): void {
    this.userService.logOut();
  }

  tabChangeEventHandler(data: any) {
    this.userTab = data.dest == 'user';
    this.username = this.userService.getUsername();
  }

  titleChangeEventHandler(title: string) {
    this.title = title;
  }

  userUpdateEventHandler(data: any) {
    if (data) {
      this.username = data.username;
    } else {
      this.username = '';
      this.tabs.select(0);
    }
  }

}
