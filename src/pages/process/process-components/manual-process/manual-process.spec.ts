/* Module imports */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from 'ionic-angular';
import { NO_ERRORS_SCHEMA } from '@angular/core';

/* Test configuration imports */
import { configureTestBed } from '../../../../../test-config/configureTestBed';

/* Mock imports */
import { mockProcessSchedule } from '../../../../../test-config/mockmodels/mockProcessSchedule';

/* Component imports */
import { ManualProcessComponent } from './manual-process';


describe('Manual Process Page', () => {
  let fixture: ComponentFixture<ManualProcessComponent>;
  let mpPage: ManualProcessComponent;
  configureTestBed();

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      declarations: [
        ManualProcessComponent
      ],
      imports: [
        IonicModule.forRoot(ManualProcessComponent)
      ],
      providers: [ ],
      schemas: [
        NO_ERRORS_SCHEMA
      ]
    });
    await TestBed.compileComponents();
  })()
  .then(done)
  .catch(done.fail));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManualProcessComponent);
    mpPage = fixture.componentInstance;
    mpPage.stepData = mockProcessSchedule()[0];
  });

  test('should create the component', () => {
    fixture.detectChanges();

    expect(mpPage).toBeDefined();
    expect(mpPage.stepData).toStrictEqual(mockProcessSchedule()[0]);
  }); // end 'should create the component' test

});
