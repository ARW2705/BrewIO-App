/* Module imports */
import { ComponentFixture, TestBed, getTestBed, async } from '@angular/core/testing';
import { IonicModule, Events, NavController } from 'ionic-angular';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { of } from 'rxjs/observable/of';

/* Test configuration imports */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Mock imports */
import { mockUser } from '../../../test-config/mockmodels/mockUser';
import { mockRecipeMasterActive } from '../../../test-config/mockmodels/mockRecipeMasterActive';
import { mockRecipeVariantComplete } from '../../../test-config/mockmodels/mockRecipeVariantComplete';
import { EventsMock, NavMock } from '../../../test-config/mocks-ionic';

/* Interface imports */
import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { RecipeVariant } from '../../shared/interfaces/recipe-variant';
import { User } from '../../shared/interfaces/user';

/* Page imports */
import { HomePage } from './home';
import { ProcessPage } from '../process/process';

/* Provider imports */
import { UserProvider } from '../../providers/user/user';
import { RecipeProvider } from '../../providers/recipe/recipe';
import { ModalProvider } from '../../providers/modal/modal';


describe('Home Page', () => {
  let fixture: ComponentFixture<HomePage>;
  let injector: TestBed;
  let homePage: HomePage;
  let userService: UserProvider;
  let modalService: ModalProvider;
  let recipeService: RecipeProvider;
  let navCtrl: NavController;
  configureTestBed();

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      declarations: [
        HomePage
      ],
      imports: [
        IonicModule.forRoot(HomePage),
      ],
      providers: [
        { provide: UserProvider, useValue: {} },
        { provide: RecipeProvider, useValue: {} },
        { provide: ModalProvider, useValue: {} },
        { provide: Events, useClass: EventsMock },
        { provide: NavController, useClass: NavMock }
      ],
      schemas: [
        NO_ERRORS_SCHEMA
      ]
    });
    await TestBed.compileComponents()
  })()
  .then(done)
  .catch(done.fail));

  beforeAll(async(() => {
    injector = getTestBed();
    userService = injector.get(UserProvider);
    modalService = injector.get(ModalProvider);
    recipeService = injector.get(RecipeProvider);
  }));

  beforeEach(async(() => {
    navCtrl = injector.get(NavController);
  }));

  describe('User not logged in', () => {

    beforeEach(async(() => {
      const _mockUser: User = mockUser();
      _mockUser.token = '';
      userService.getUser = jest
        .fn()
        .mockReturnValue(of(null));
      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(false);

      modalService.openLogin = jest
        .fn();
      modalService.openSignup = jest
        .fn();
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(HomePage);
      homePage = fixture.componentInstance;
      homePage.isLoggedIn = false;
    });

    test('should create the component', () => {
      fixture.detectChanges();

      expect(homePage).toBeDefined();
    }); // end 'should create the component' test

    test('should open signup modal', () => {
      fixture.detectChanges();

      const modalSpy: jest.SpyInstance = jest.spyOn(modalService, 'openSignup');

      homePage.openSignup();

      expect(modalSpy).toHaveBeenCalled();
    }); // end 'should open signup modal' test

    test('should open login modal', () => {
      fixture.detectChanges();

      const modalSpy: jest.SpyInstance = jest.spyOn(modalService, 'openLogin');

      homePage.openLogin();

      expect(modalSpy).toHaveBeenCalled();
    }); // end 'should open login modal' test

  }); // end 'User not logged in' section


  describe('User logged in', () => {

    beforeEach(async(() => {
      userService.getUser = jest
        .fn()
        .mockReturnValue(new BehaviorSubject<User>(mockUser()));
      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(true);
      recipeService.getMasterList = jest
        .fn()
        .mockReturnValue(
          new BehaviorSubject<BehaviorSubject<RecipeMaster>[]>(
            [
              new BehaviorSubject<RecipeMaster>(mockRecipeMasterActive())
            ]
          )
        );
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(HomePage);
      homePage = fixture.componentInstance;
    });

    test('should have a user', () => {
      fixture.detectChanges();

      expect(homePage.user).not.toBeNull();
    }); // end 'should have a user' test

    test('should set the welcome message to user name', () => {
      homePage.user = mockUser();

      fixture.detectChanges();

      expect(homePage.welcomeMessage)
        .toMatch(`Welcome ${homePage.user.firstname} to BrewIO`);

      delete homePage.user.firstname;

      homePage.setWelcomeMessage();

      expect(homePage.welcomeMessage)
        .toMatch(`Welcome ${homePage.user.username} to BrewIO`);
    }); // end 'should set the welcome message to user name' test

    test('should handle a nav stack reset event', () => {
      navCtrl.popToRoot = jest
        .fn();

      const navSpy: jest.SpyInstance = jest.spyOn(navCtrl, 'popToRoot');

      fixture.detectChanges();

      homePage.handleStackReset();

      expect(navSpy).toHaveBeenCalled();
    }); // end 'should handle a nav stack reset event' test

    test('should navigate to active brew process', () => {
      fixture.detectChanges();

      const navSpy: jest.SpyInstance = jest.spyOn(navCtrl, 'push');

      const _mockRecipeVariant: RecipeVariant = mockRecipeVariantComplete();
      const _mockRecipeMaster: RecipeMaster = mockRecipeMasterActive();

      homePage.navToBrewProcess(_mockRecipeVariant);

      expect(navSpy).toHaveBeenCalledWith(
        ProcessPage,
        {
          master: _mockRecipeMaster,
          requestedUserId: _mockRecipeMaster.owner,
          selectedRecipeId: _mockRecipeVariant._id
        }
      )
    }); // end 'should navigate to active brew process' test

    test('should toggle show active batches flag', () => {
      fixture.detectChanges();

      expect(homePage.showActiveBatches).toBe(false);

      homePage.toggleActiveBatches();

      expect(homePage.showActiveBatches).toBe(true);

      homePage.toggleActiveBatches();

      expect(homePage.showActiveBatches).toBe(false);
    }); // end 'should toggle show active batches flag' test

    test('should toggle show inventory flag', () => {
      fixture.detectChanges();

      expect(homePage.showInventory).toBe(false);

      homePage.toggleInventory();

      expect(homePage.showInventory).toBe(true);

      homePage.toggleInventory();

      expect(homePage.showInventory).toBe(false);
    }); // end 'should toggle show inventory flag' test

  }); // end 'User logged in' section

});
