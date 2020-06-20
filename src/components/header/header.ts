/* Module Imports */
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { NavController, Events } from 'ionic-angular';
import { Subject } from 'rxjs/Subject';
import { takeUntil } from 'rxjs/operators/takeUntil';

/* Interface Imports */
import { User } from '../../shared/interfaces/user';

/* Provider Imports */
import { UserProvider } from '../../providers/user/user';
import { ModalProvider } from '../../providers/modal/modal';

@Component({
  selector: 'app-header',
  templateUrl: 'header.html'
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Input() title: string;
  destroy$: Subject<boolean> = new Subject<boolean>();
  user: User = null;
  isTabPage: boolean = true;
  currentTab: string = '';
  navStack: Array<string> = [];
  _headerNavUpdate: any;

  constructor(
    public events: Events,
    public userService: UserProvider,
    public modalService: ModalProvider)
  {
    this._headerNavUpdate = this.headerNavUpdateEventHandler.bind(this);
  }

  /***** Lifecycle Hooks *****/

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
    this.events.unsubscribe('update-nav-header', this._headerNavUpdate);
  }

  ngOnInit() {
    this.userService.getUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe(_user => {
        this.user = _user;
      });
    this.events.subscribe('update-nav-header', this._headerNavUpdate);
  }

  /***** End lifecycle hooks *****/

  /**
   * Header back button, publish event with nav destination
   *
   * @params: none
   * @return: none
  **/
  goBack(): void {
    console.log('calling header go back');
    this.events.publish('pop-header-nav', {
      origin: this.isTabPage ? '': this.navStack.pop()
    });
    this.isTabPage =  !this.navStack.length
                      || this.navStack[this.navStack.length - 1] === 'tab';
  }

  /**
   * Handle nav events - format header according to nav data
   *
   * @params: data - additional context for header on nav events
   *
   * @return: none
  **/
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
    if (data.other === 'batch-end' || data.other === 'form-submit-complete') {
      // if on process page and batch has been completed,
      // or a form submission has completed,
      // automatically go back
      // console.log(data.caller);
      this.goBack();
    }
  }

  /**
   * Check if user is logged in
   *
   * @params: none
   *
   * @return: true if a user is logged in
  **/
  isLoggedIn(): boolean {
    return this.userService.isLoggedIn();
  }

  /**
   * Check if on user tab
   *
   * @params: none
   *
   * @return: true if currently on user tab
  **/
  isUserTab(): boolean {
    return this.currentTab === 'user';
  }

  /**
   * Call user log out
   *
   * @params: none
   * @return: none
  **/
  logout(): void {
    this.userService.logOut();
  }

  /**
   * Open login modal
   *
   * @params: none
   * @return: none
  **/
  openLogin(): void {
    this.modalService.openLogin();
  }

}
