import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { By }           from '@angular/platform-browser';
import { IonicModule, NavController} from 'ionic-angular';
import { IonicStorageModule } from '@ionic/storage';

import { StorageMock } from '../../../test-config/mocks-ionic';

import { HomePage } from './home';
import { MockActiveBatchesComponent } from '../../../test-config/mockcomponents/mockActiveBatches.component';

import { UserProvider } from '../../providers/user/user';
import { AuthenticationProvider } from '../../providers/authentication/authentication';
import { ProcessHttpErrorProvider } from '../../providers/process-http-error/process-http-error';
import { RecipeProvider } from '../../providers/recipe/recipe';
import { ModalProvider } from '../../providers/modal/modal';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        HomePage,
        MockActiveBatchesComponent
      ],
      imports: [
        IonicModule.forRoot(HomePage),
        IonicStorageModule.forRoot(),
        HttpClientTestingModule
      ],
      providers: [
        NavController,
        { provide: Storage, useValue: StorageMock },
        UserProvider,
        AuthenticationProvider,
        ProcessHttpErrorProvider,
        RecipeProvider,
        ModalProvider
      ]
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
  });

  test('should create Home Page', () => {
    expect(component).toBeDefined();
  });

  test('should have expected <h2> text', async(() => {
    fixture.detectChanges();
    const h2 = fixture.debugElement.query(By.css('h2')).nativeElement.innerHTML;
    expect(h2).toMatch('Welcome to BrewIO!');
  }));

  test('should have login button', async(() => {
    fixture.detectChanges();
    const button = fixture.debugElement.query(By.css('button')).nativeElement.innerHTML;
    expect(button).toMatch('Log In');
  }));

});
