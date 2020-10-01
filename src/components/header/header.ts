/* Module Imports */
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Events } from 'ionic-angular';
import { Subject } from 'rxjs/Subject';
import { takeUntil } from 'rxjs/operators/takeUntil';

/* Interface Imports */
import { User } from '../../shared/interfaces/user';

/* Provider Imports */
import { ModalProvider } from '../../providers/modal/modal';
import { UserProvider } from '../../providers/user/user';


@Component({
  selector: 'app-header',
  templateUrl: 'header.html'
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Input() title: string;
  currentView: string = '';
  destroy$: Subject<boolean> = new Subject<boolean>();
  isLoggedIn: boolean = false;
  isTabPage: boolean = true;
  navStack: string[] = [];
  user: User = null;
  _headerNavUpdate: any;

  constructor(
    public events: Events,
    public modalService: ModalProvider,
    public userService: UserProvider
  ) {
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
        this.isLoggedIn = this.userService.isLoggedIn();
      });
    this.events.subscribe('update-nav-header', this._headerNavUpdate);
  }

  /***** End lifecycle hooks *****/


  /**
   * Header back button, publish event with nav destination. If current page is
   * a tab page, leave the origin blank to start a new nav stack, otherwise
   * get the origin from the top of the nav stack. Set isTabPage to true if
   * stack is empty or last item is a tab
   *
   * @params: none
   * @return: none
  **/
  goBack(): void {
    console.log('go back click');
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
      this.currentView = data.dest;
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
      // automatically navigate back
      this.goBack();
    }
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
