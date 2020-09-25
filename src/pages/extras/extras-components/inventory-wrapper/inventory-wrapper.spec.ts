/* Module imports */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from 'ionic-angular';
import { NO_ERRORS_SCHEMA } from '@angular/core';

/* Test Configuration imports */
import { configureTestBed } from '../../../../../test-config/configureTestBed';

/* Page imports */
import { InventoryWrapperPage } from './inventory-wrapper';


describe('Inventory Wrapper Page', () => {
  let fixture: ComponentFixture<InventoryWrapperPage>;
  let inventoryWrapper: InventoryWrapperPage;
  configureTestBed();

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      declarations: [
        InventoryWrapperPage
      ],
      imports: [
        IonicModule.forRoot(InventoryWrapperPage)
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
    fixture = TestBed.createComponent(InventoryWrapperPage);
    inventoryWrapper = fixture.componentInstance;
  });

  test('should create the component', () => {
    fixture.detectChanges();

    expect(inventoryWrapper).toBeDefined();
  }); // end 'should create the component' test

});
