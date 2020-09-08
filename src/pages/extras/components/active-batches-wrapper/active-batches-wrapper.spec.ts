/* Module imports */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from 'ionic-angular';
import { NO_ERRORS_SCHEMA } from '@angular/core';

/* Test Configuration imports */
import { configureTestBed } from '../../../../../test-config/configureTestBed';

/* Page imports */
import { ActiveBatchesWrapperPage } from './active-batches-wrapper';


describe('Inventory Wrapper Page', () => {
  let fixture: ComponentFixture<ActiveBatchesWrapperPage>;
  let activeBatchesWrapper: ActiveBatchesWrapperPage;
  configureTestBed();

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      declarations: [
        ActiveBatchesWrapperPage
      ],
      imports: [
        IonicModule.forRoot(ActiveBatchesWrapperPage)
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
    fixture = TestBed.createComponent(ActiveBatchesWrapperPage);
    activeBatchesWrapper = fixture.componentInstance;
  });

  test('should create the component', () => {
    fixture.detectChanges();

    expect(activeBatchesWrapper).toBeDefined();
  }); // end 'should create the component' test

});
