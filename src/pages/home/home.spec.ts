/* Module imports */
import { ComponentFixture, TestBed, getTestBed, async } from '@angular/core/testing';
import { IonicModule, NavController, ModalController } from 'ionic-angular';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Storage } from '@ionic/storage';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

/* Mock imports */
import { mockUser } from '../../../test-config/mockmodels/mockUser';
import { mockRecipeMasterActive } from '../../../test-config/mockmodels/mockRecipeMasterActive';
import { mockRecipeComplete } from '../../../test-config/mockmodels/mockRecipeComplete';
import { NavMock, StorageMock, ModalControllerMock } from '../../../test-config/mocks-ionic';

/* Interface imports */
import { RecipeMaster } from '../../shared/interfaces/recipe-master';

/* Page imports */
import { HomePage } from './home';
import { ProcessPage } from '../process/process';

/* Provider imports */
import { UserProvider } from '../../providers/user/user';
import { RecipeProvider } from '../../providers/recipe/recipe';
import { ModalProvider } from '../../providers/modal/modal';
import { ProcessProvider } from '../../providers/process/process';
import { ProcessHttpErrorProvider } from '../../providers/process-http-error/process-http-error';


describe('Home Page', () => {

  describe('User not logged in', () => {
    let fixture: ComponentFixture<HomePage>;
    let homePage: HomePage;

    beforeEach(async(() => {
      TestBed.configureTestingModule({
        declarations: [
          HomePage
        ],
        imports: [
          IonicModule.forRoot(HomePage),
          HttpClientTestingModule
        ],
        providers: [
          UserProvider,
          RecipeProvider,
          ModalProvider,
          { provide: ProcessProvider, useValue: {} },
          { provide: ProcessHttpErrorProvider, useValue: {} },
          { provide: NavController, useClass: NavMock },
          { provide: ModalController, useClass: ModalControllerMock },
          { provide: Storage, useClass: StorageMock }
        ],
        schemas: [
          NO_ERRORS_SCHEMA
        ]
      })
      .compileComponents()
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(HomePage);
      homePage = fixture.componentInstance;
    });

    test('should create the component', () => {
      fixture.detectChanges();
      expect(homePage).toBeDefined();
    }); // end 'should create the component' test

    test('should open signup modal', () => {
      fixture.detectChanges();
      const modalSpy = jest.spyOn(homePage.modalService, 'openSignup');
      homePage.openSignup();
      expect(modalSpy).toHaveBeenCalled();
    }); // end 'should open signup modal' test

    test('should open login modal', () => {
      fixture.detectChanges();
      const modalSpy = jest.spyOn(homePage.modalService, 'openLogin');
      homePage.openLogin();
      expect(modalSpy).toHaveBeenCalled();
    }); // end 'should open login modal' test

  }); // end 'User not logged in' section


  describe('User logged in', () => {
    let fixture: ComponentFixture<HomePage>;
    let homePage: HomePage;
    let userService: UserProvider;
    let recipeService: RecipeProvider;
    let injector: TestBed;

    beforeEach(async(() => {
      TestBed.configureTestingModule({
        declarations: [
          HomePage
        ],
        imports: [
          IonicModule.forRoot(HomePage),
          HttpClientTestingModule
        ],
        providers: [
          UserProvider,
          RecipeProvider,
          ModalProvider,
          { provide: ProcessProvider, useValue: {} },
          { provide: ProcessHttpErrorProvider, useValue: {} },
          { provide: NavController, useClass: NavMock },
          { provide: Storage, useClass: StorageMock }
        ],
        schemas: [
          NO_ERRORS_SCHEMA
        ]
      })
      .compileComponents()
    }));

    beforeEach(async(() => {
      injector = getTestBed();
      userService = injector.get(UserProvider);
      userService.user$.next(mockUser());
      recipeService = injector.get(RecipeProvider);
      recipeService.recipeMasterList$.next([new BehaviorSubject<RecipeMaster>(mockRecipeMasterActive())]);
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(HomePage);
      homePage = fixture.componentInstance;
    });

    test('should have a user', () => {
      fixture.detectChanges();
      expect(homePage.user$).not.toBeNull();
    }); // end 'should have a user' test

    test('should navigate to active brew process', () => {
      fixture.detectChanges();
      const navSpy = jest.spyOn(homePage.navCtrl, 'push');
      const _mockRecipe = mockRecipeComplete();
      const _mockRecipeMaster = mockRecipeMasterActive();
      homePage.navToBrewProcess(_mockRecipe);
      expect(navSpy).toHaveBeenCalledWith(
        ProcessPage,
        {
          master: _mockRecipeMaster,
          requestedUserId: _mockRecipeMaster.owner,
          selectedRecipeId: _mockRecipe._id
        }
      )
    }); // end 'should navigate to active brew process' test

  }); // end 'User logged in' section

});
