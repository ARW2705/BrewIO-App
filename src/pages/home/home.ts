/* Module imports */
import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavController, Events } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/takeUntil';

/* Interface imports */
import { Recipe } from '../../shared/interfaces/recipe';
import { User } from '../../shared/interfaces/user';

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
    public events: Events,
    public userService: UserProvider,
    public recipeService: RecipeProvider,
    public modalService: ModalProvider
  ) {
    this.user$ = this.userService.getUser();
  }

  /***** Lifecycle Hooks *****/

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  ngOnInit() {
    this.user$
      .takeUntil(this.destroy$)
      .subscribe(user => {
        this.user = user
      });
  }

  /***** End lifecycle hooks *****/

  /**
   * Navigate to Process Page with required data
   *
   * @params: batch - Recipe to use as template for brew process
   *
   * @return: none
  **/
  navToBrewProcess(recipe: Recipe): void {
    const master$ = this.recipeService.getMasterList().value
      .find(_master$ => {
        return _master$.value.recipes.some(_recipe => {
          return _recipe._id === recipe._id;
        })
      });
    const master = master$.value;
    this.navCtrl.push(
      ProcessPage,
      {
        master: master,
        requestedUserId: master.owner,
        selectedRecipeId: recipe._id
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
