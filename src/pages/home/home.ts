/* Module imports */
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Events, NavController } from 'ionic-angular';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subject } from 'rxjs/Subject';
import { takeUntil } from 'rxjs/operators/takeUntil';

/* Interface imports */
import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { RecipeVariant } from '../../shared/interfaces/recipe-variant';
import { User } from '../../shared/interfaces/user';

/* Utility imports */
import { getId } from '../../shared/utility-functions/id-helpers';

/* Page imports */
import { ProcessPage } from '../../pages/process/process';

/* Provider imports */
import { ModalProvider } from '../../providers/modal/modal';
import { RecipeProvider } from '../../providers/recipe/recipe';
import { UserProvider } from '../../providers/user/user';


@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage implements OnInit, OnDestroy {
  destroy$: Subject<boolean> = new Subject<boolean>();
  isLoggedIn: boolean = false;
  notifications: string[] = [];
  showActiveBatches: boolean = false;
  showInventory: boolean = false;
  user: User = null;
  welcomeMessage: string = '';
  _stackReset: () => void;

  constructor(
    public events: Events,
    public navCtrl: NavController,
    public modalService: ModalProvider,
    public recipeService: RecipeProvider,
    public userService: UserProvider
  ) {
    this._stackReset = this.handleStackReset.bind(this);
  }

  /***** Lifecycle Hooks *****/

  ngOnDestroy() {
    this.events.unsubscribe('reset-stack');
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  ngOnInit() {
    this.events.subscribe('reset-stack', this._stackReset);

    this.userService.getUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.user = user
        this.isLoggedIn = this.userService.isLoggedIn();
        this.setWelcomeMessage();
      });
  }

  /***** End lifecycle hooks *****/

  /**
   * Handle resetting the tab nav stack after a tab change event
   *
   * @params: none
   * @return: none
  **/
  handleStackReset(): void {
    console.log('handle home tab stack reset');
    this.navCtrl.popToRoot();
  }

  /**
   * Navigate to Process Page with required data
   *
   * @params: variant - Recipe variant to use as template for brew process
   *
   * @return: none
  **/
  navToBrewProcess(variant: RecipeVariant): void {
    const master$: BehaviorSubject<RecipeMaster> =
      this.recipeService.getMasterList().value
        .find((_master$: BehaviorSubject<RecipeMaster>) => {
          return _master$.value.variants.some((_variant: RecipeVariant) => {
            return getId(_variant) === getId(variant);
          });
        });

    // TODO handle missing master
    const master: RecipeMaster = master$.value;

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

  /**
   * Format welcome message
   *
   * @params: none
   *
   * @return: welcome message string
  **/
  setWelcomeMessage(): void {
    let userName: string = ' ';
    if (this.user !== null) {
      if (
        this.user.firstname !== undefined && this.user.firstname.length > 0
      ) {
        userName = ` ${this.user.firstname} `;
      } else if (
        this.user.username !== undefined && this.user.username.length > 0
      ) {
        userName = ` ${this.user.username} `;
      }
    }
    this.welcomeMessage = `Welcome${userName}to BrewIO`;
  }

  /**
   * Toggle active batch list expansion
   *
   * @params: none
   * @return: none
  **/
  toggleActiveBatches(): void {
    this.showActiveBatches = !this.showActiveBatches;
  }

  /**
   * Toggle inventory list expansion
   *
   * @params: none
   * @return: none
  **/
  toggleInventory(): void {
    this.showInventory = !this.showInventory;
  }

}
