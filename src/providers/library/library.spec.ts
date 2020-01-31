/* Module imports */
import { TestBed, getTestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

/* Constant imports */
import { baseURL } from '../../shared/constants/base-url';
import { apiVersion } from '../../shared/constants/api-version';

/* Mock imports */
import { mockGrains } from '../../../test-config/mockmodels/mockGrains';
import { mockHops } from '../../../test-config/mockmodels/mockHops';
import { mockYeast } from '../../../test-config/mockmodels/mockYeast';
import { mockStyles } from '../../../test-config/mockmodels/mockStyles';

/* Provider imports */
import { LibraryProvider } from './library';
import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';

describe('Library service', () => {
  let injector: TestBed;
  let libraryService: LibraryProvider;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule ],
      providers: [
        LibraryProvider,
        ProcessHttpErrorProvider
      ]
    });
    injector = getTestBed();
    libraryService = injector.get(LibraryProvider);
    httpMock = injector.get(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('fetch Library entries', () => {
    const _mockGrains = mockGrains();

    test('should return an Observable<Array<Grains>>', done => {
      libraryService.getGrainsLibrary().subscribe(grains => {
        expect(grains.length).toBe(3);
        expect(grains).toEqual(_mockGrains);
        done();
      });

      const req = httpMock.expectOne(`${baseURL}/${apiVersion}/library/grains`);
      expect(req.request.method).toBe('GET');
      req.flush(_mockGrains);
    }); // end 'should return an Observable<Array<Grains>>' test

    test('should return an Observable<Array<Hops>>', done => {
      const _mockHops = mockHops();

      libraryService.fetchHopsLibrary().subscribe(hops => {
        expect(hops.length).toBe(3);
        expect(hops).toEqual(_mockHops);
        done();
      }); // end 'should return an Observable<Array<Hops>>' test

      const req = httpMock.expectOne(`${baseURL}/${apiVersion}/library/hops`);
      expect(req.request.method).toBe('GET');
      req.flush(_mockHops);
    });

    test('should return an Observable<Array<Yeast>>', done => {
      const _mockYeast = mockYeast();

      libraryService.fetchYeastLibrary().subscribe(yeast => {
        expect(yeast.length).toBe(2);
        expect(yeast).toEqual(_mockYeast);
        done();
      });

      const req = httpMock.expectOne(`${baseURL}/${apiVersion}/library/yeast`);
      expect(req.request.method).toBe('GET');
      req.flush(_mockYeast);
    }); // end 'should return an Observable<Array<Yeast>>' test

    test('should return an Observable<Array<Style>>', done => {
      const _mockStyles = mockStyles();

      libraryService.fetchStyleLibrary().subscribe(styles => {
        expect(styles.length).toBe(4);
        expect(styles).toEqual(_mockStyles);
        done();
      });

      const req = httpMock.expectOne(`${baseURL}/${apiVersion}/library/style`);
      expect(req.request.method).toBe('GET');
      req.flush(_mockStyles);
    }); // end 'should return an Observable<Array<Style>>' test

  }); // end 'fetch Library entries' section

  describe('fetch Library entries by id', () => {

    test('should return an Observable<Grains>', done => {
      const _mockGrains = mockGrains();
      const _mockSelected = _mockGrains[0];

      libraryService.getGrainsById(_mockSelected._id).subscribe(grains => {
        expect(grains).toEqual(_mockSelected);
        done();
      });

      const req = httpMock.expectOne(`${baseURL}/${apiVersion}/library/grains`);
      expect(req.request.method).toBe('GET');
      req.flush(_mockGrains);
    }); // end 'should return an Observable<Grains>' test

    test('should return an Observable<Hops>', done => {
      const _mockHops = mockHops();
      const _mockSelected = _mockHops[0];

      libraryService.getHopsById(_mockSelected._id).subscribe(hops => {
        expect(hops).toEqual(_mockSelected);
        done();
      });

      const req = httpMock.expectOne(`${baseURL}/${apiVersion}/library/hops`);
      expect(req.request.method).toBe('GET');
      req.flush(_mockHops);
    }); // end 'should return an Observable<Hops>' test

    test('should return an Observable<Yeast>', done => {
      const _mockYeast = mockYeast();
      const _mockSelected = _mockYeast[0];

      libraryService.getYeastById(_mockSelected._id).subscribe(yeast => {
        expect(yeast).toEqual(_mockSelected);
        done();
      });

      const req = httpMock.expectOne(`${baseURL}/${apiVersion}/library/yeast`);
      expect(req.request.method).toBe('GET');
      req.flush(_mockYeast);
    }); // end 'should return an Observable<Yeast>' test

  }); // end 'fetch Library entries by id' section

});
