/* Module imports */
import { Component } from '@angular/core';

/* Provider imports */
import { UserProvider } from '../../providers/user/user';
import { ModalProvider } from '../../providers/modal/modal';


@Component({
  selector: 'page-user',
  templateUrl: 'user.html'
})
export class UserPage {
  expandedContent: string = '';

  constructor(
    public userService: UserProvider,
    public modalService: ModalProvider
  ) { }

  /**
   * Check if a user is logged in
   *
   * @params: none
   *
   * @return: true if a user is logged in
  **/
  isLoggedIn(): boolean {
    return this.userService.isLoggedIn();
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
   * Determine if content should be expanded or collapsed
   *
   * @params: section - name of section check
   *
   * @return: true if section name matches expandedContent name
  **/
  showExpandedContent(section: string): boolean {
    return section === this.expandedContent;
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
