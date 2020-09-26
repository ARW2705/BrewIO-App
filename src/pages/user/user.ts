/* Module imports */
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { takeUntil } from 'rxjs/operators/takeUntil';

/* Provider imports */
import { UserProvider } from '../../providers/user/user';
import { ModalProvider } from '../../providers/modal/modal';


@Component({
  selector: 'page-user',
  templateUrl: 'user.html'
})
export class UserPage implements OnInit, OnDestroy {
  destroy$: Subject<boolean> = new Subject<boolean>();
  expandedContent: string = '';
  isLoggedIn: boolean = false;

  constructor(
    public userService: UserProvider,
    public modalService: ModalProvider
  ) { }

  ngOnInit() {
    this.userService.getUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe((): void => {
        this.isLoggedIn = this.userService.isLoggedIn();
      });
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
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
   * Toggle whether section should be expanded or collapsed
   *
   * @params: section - name of section to toggle
   *
   * @return: none
  **/
  toggleExpandContent(section: string): void {
    this.expandedContent = this.expandedContent === section ? '': section;
  }

}
