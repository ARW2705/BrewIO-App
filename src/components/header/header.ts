import { Component, Input, OnInit, OnDestroy, AfterViewInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { ModalController, NavController, Events, Navbar } from 'ionic-angular';

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
  private _titleChange: any;
  private _tabChange: any;
  private _login: any;

  constructor(private modalCtrl: ModalController,
    private navCtrl: NavController,
    private cdRef: ChangeDetectorRef,
    public events: Events,
    private userService: UserProvider,
    private modalService: ModalProvider) {
      this.getUsername();
      this._titleChange = this.titleChangeEventHandler.bind(this);
      this._tabChange = this.tabChangeEventHandler.bind(this);
      this._login = this.loginEventHandler.bind(this);
  }

  ngAfterViewInit() {
    this.navBar.backButtonClick = (e: UIEvent) => {
      this.events.publish('header-nav-pop', this.navCtrl.getActive().name);
      this.navCtrl.pop();
    }
  }

  getUsername() {
    const user = this.userService.getUser();
    this.username = user != null ? user.username: '';
  }

  ngOnDestroy() {
    this.events.unsubscribe('title-change', this._titleChange);
    this.events.unsubscribe('tab-change', this._tabChange);
    this.events.unsubscribe('on-login', this._login);
  }

  ngOnInit() {
    this.events.subscribe('title-change', this._titleChange);
    this.events.subscribe('tab-change', this._tabChange);
    this.events.subscribe('on-login', this._login);
  }

  openLogin() {
    this.modalService.openLogin();
  }

  loginEventHandler(): void {
    this.getUsername();
  }

  tabChangeEventHandler() {
    this.getUsername();
  }

  titleChangeEventHandler(title: string) {
    this.title = title;
  }

}
