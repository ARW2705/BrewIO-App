/* Module imports */
import { TestBed, async, ComponentFixture } from '@angular/core/testing';
import { IonicModule } from 'ionic-angular';
import { By } from '@angular/platform-browser';

/* Test configuration imports */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Mock imports */
import { mockTimer } from '../../../test-config/mockmodels/mockTimer';

/* Component imports */
import { ProgressCircleComponent } from './progress-circle';


describe('Progress Circle Component', () => {
  let fixture: ComponentFixture<ProgressCircleComponent>;
  let progressCircle: ProgressCircleComponent;
  let testSettings = mockTimer().settings;
  configureTestBed();

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      declarations:[
        ProgressCircleComponent
      ],
      imports: [
        IonicModule
      ],
      providers: []
    });
    await TestBed.compileComponents();
  })()
  .then(done)
  .catch(done.fail));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgressCircleComponent);
    progressCircle = fixture.componentInstance;
    progressCircle.settings = testSettings;
  });

  test('should create the component', () => {
    fixture.detectChanges();
    expect(progressCircle).toBeDefined();
    expect(progressCircle.settings).toStrictEqual(mockTimer().settings);
  }); // end 'should create the component' test

  test('should have an svg with attributes', () => {
    fixture.detectChanges();
    const svg = fixture.debugElement.query(By.css('svg'));
    expect(svg.attributes.width).toMatch(testSettings.width.toString());
    expect(svg.attributes.height).toMatch(testSettings.height.toString());
    console.log(svg.children[0].name);
    const circle = svg.children.find(child => child.name === 'circle');
    expect(circle).toBeDefined();
    expect(circle.attributes['stroke-dashoffset']).toMatch('10');
    const text = svg.children.find(child => child.name === 'text');
    expect(text.attributes['text-anchor']).toMatch('textAnchor');
  }); // end 'should have an svg with attributes' test

});
