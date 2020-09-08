/* Module imports */
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { IonicModule } from 'ionic-angular';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { SimpleChange } from '@angular/core';

/* Test configuration imports */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Component imports */
import { AccordionComponent } from './accordion';


describe('Accordion Component', () => {
  let fixture: ComponentFixture<AccordionComponent>;
  let accordion: AccordionComponent;
  configureTestBed();

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      declarations: [
        AccordionComponent
      ],
      imports: [
        IonicModule,
        NoopAnimationsModule
      ],
      providers: []
    });
    await TestBed.compileComponents();
  })()
  .then(done)
  .catch(done.fail));

  beforeEach(() => {
    fixture = TestBed.createComponent(AccordionComponent);
    accordion = fixture.componentInstance;
  });

  test('should create the component', () => {
    fixture.detectChanges();

    expect(accordion).toBeDefined();
  }); // end 'should create the component' test

  test('should toggle expansion', () => {
    fixture.detectChanges();

    const accElem = fixture.debugElement.query(By.css('.expand-accordion'));

    expect(accElem.properties['@expandUpDown'].value).toMatch('collapsed');
    expect(accElem.properties['@expandUpDown'].params.height).toBe(0);

    accordion.ngOnChanges({ expanded: new SimpleChange(false, true, false) });

    fixture.detectChanges();

    expect(accElem.properties['@expandUpDown'].value).toMatch('expanded');

    accordion.ngOnChanges({ expanded: new SimpleChange(false, false, false) });

    fixture.detectChanges();

    expect(accElem.properties['@expandUpDown'].value).toMatch('collapsed');
  }); // end 'should toggle expansion' test

});
