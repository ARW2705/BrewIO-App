/* Module imports */
import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { takeUntil } from 'rxjs/operators/takeUntil';

/* Interface imports */
import { RecipeVariant } from '../../shared/interfaces/recipe-variant';
import { User } from '../../shared/interfaces/user';

/* Utility imports */
import { getId } from '../../shared/utility-functions/utilities';

/* Page imports */
import { ProcessPage } from '../../pages/process/process';

/* Provider imports */
import { UserProvider } from '../../providers/user/user';
import { RecipeProvider } from '../../providers/recipe/recipe';
import { ModalProvider } from '../../providers/modal/modal';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage implements OnInit, OnDestroy {
  user$: Observable<User> = null;
  destroy$: Subject<boolean> = new Subject<boolean>();
  user = null;
  notifications = [];

  constructor(
    public navCtrl: NavController,
    public userService: UserProvider,
    public recipeService: RecipeProvider,
    public modalService: ModalProvider
  ) {
    this.user$ = this.userService.getUser();
  }

  /***** Lifecycle Hooks *****/

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  ngOnInit() {
    this.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.user = user
      });
  }

  /***** End lifecycle hooks *****/

  /**
   * Format welcome message
   *
   * @params: none
   *
   * @return: welcome message string
  **/
  getWelcomeMessage(): string {
    let userName = ' ';
    if (this.user !== null) {
      if (this.user.firstname !== undefined && this.user.firstname.length > 0) {
        userName = ` ${this.user.firstname} `;
      } else if (this.user.username !== undefined && this.user.username.length > 0) {
        userName = ` ${this.user.username} `;
      }
    }
    return `Welcome${userName}to BrewIO`;
  }

  /**
   * Check if a user is logged in
   *
   * @params: none
   *
   * @return: true if user is logged in
  **/
  isLoggedIn(): boolean {
    return this.userService.isLoggedIn();
  }

  /**
   * Navigate to Process Page with required data
   *
   * @params: variant - Recipe variant to use as template for brew process
   *
   * @return: none
  **/
  navToBrewProcess(variant: RecipeVariant): void {
    const master$ = this.recipeService.getMasterList().value
      .find(_master$ => {
        return _master$.value.variants.some(_variant => {
          return getId(_variant) === getId(variant);
        })
      });
    const master = master$.value;
    this.navCtrl.push(
      ProcessPage,
      {
        master: master,
        requestedUserId: master.owner,
        selectedRecipeId: getId(variant)
      }
    );
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
   * Open signup form modal
   *
   * @params: none
   * @return: none
  **/
  openSignup(): void {
    this.modalService.openSignup();
  }

}
