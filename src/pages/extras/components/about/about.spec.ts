/* Module imports */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from 'ionic-angular';
import { NO_ERRORS_SCHEMA } from '@angular/core';

/* Test Configuration imports */
import { configureTestBed } from '../../../../../test-config/configureTestBed';

/* Page imports */
import { AboutComponent } from './about';


describe('Inventory Wrapper Page', () => {
  let fixture: ComponentFixture<AboutComponent>;
  let aboutCmp: AboutComponent;
  configureTestBed();

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      declarations: [
        AboutComponent
      ],
      imports: [
        IonicModule.forRoot(AboutComponent)
      ],
      providers: [],
      schemas: [
        NO_ERRORS_SCHEMA
      ]
    });
    await TestBed.compileComponents();
  })()
  .then(done)
  .catch(done.fail));

  beforeEach(() => {
    fixture = TestBed.createComponent(AboutComponent);
    aboutCmp = fixture.componentInstance;
  });

  test('should create the component', () => {
    fixture.detectChanges();

    expect(aboutCmp).toBeDefined();
  }); // end 'should create the component' test

});
