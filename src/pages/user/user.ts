/* Module imports */
import { Component } from '@angular/core';
import 'rxjs/add/operator/takeUntil';

/* Provider imports */
import { ModalProvider } from '../../providers/modal/modal';


@Component({
  selector: 'page-user',
  templateUrl: 'user.html'
})
export class UserPage {
  expandedContent = '';

  constructor(public modalService: ModalProvider) { }

  showExpandedContent(section: string): boolean {
    return section === this.expandedContent;
  }

  toggleExpandContent(section: string): void {
    this.expandedContent = this.expandedContent === section ? '': section;
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

}
