import { TestBed, getTestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { LibraryProvider } from './library';
import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';

import { baseURL } from '../../shared/constants/base-url';
import { apiVersion } from '../../shared/constants/api-version';
import { mockGrains } from '../../../test-config/mockmodels/mockGrains';
import { mockHops } from '../../../test-config/mockmodels/mockHops';
import { mockYeast } from '../../../test-config/mockmodels/mockYeast';
import { mockStyles } from '../../../test-config/mockmodels/mockStyles';

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

    test('should return an Observable<Array<Grains>>', done => {
      libraryService.getGrainsLibrary().subscribe(grains => {
        expect(grains.length).toBe(3);
        expect(grains).toEqual(mockGrains);
        done();
      });

      const req = httpMock.expectOne(`${baseURL}${apiVersion}/library/grains`);
      expect(req.request.method).toBe('GET');
      req.flush(mockGrains);
    });

    test('should return an Observable<Array<Hops>>', done => {
      libraryService.fetchHopsLibrary().subscribe(hops => {
        expect(hops.length).toBe(3);
        expect(hops).toEqual(mockHops);
        done();
      });

      const req = httpMock.expectOne(`${baseURL}${apiVersion}/library/hops`);
      expect(req.request.method).toBe('GET');
      req.flush(mockHops);
    });

    test('should return an Observable<Array<Yeast>>', done => {
      libraryService.fetchYeastLibrary().subscribe(yeast => {
        expect(yeast.length).toBe(2);
        expect(yeast).toEqual(mockYeast);
        done();
      });

      const req = httpMock.expectOne(`${baseURL}${apiVersion}/library/yeast`);
      expect(req.request.method).toBe('GET');
      req.flush(mockYeast);
    });

    test('should return an Observable<Array<Style>>', done => {
      libraryService.fetchStyleLibrary().subscribe(styles => {
        expect(styles.length).toBe(4);
        expect(styles).toEqual(mockStyles);
        done();
      });

      const req = httpMock.expectOne(`${baseURL}${apiVersion}/library/style`);
      expect(req.request.method).toBe('GET');
      req.flush(mockStyles);
    });

  });

  describe('fetch Library entries by id', () => {

    test('should return an Observable<Grains>', done => {
      const _mockSelected = mockGrains[0];

      libraryService.getGrainsById('5ca285e8f7e5f91a1f31d775').subscribe(grains => {
        expect(grains).toEqual(_mockSelected);
        done();
      });

      const req = httpMock.expectOne(`${baseURL}${apiVersion}/library/grains`);
      expect(req.request.method).toBe('GET');
      req.flush(mockGrains);
    });

    test('should return an Observable<Hops>', done => {
      const _mockSelected = mockHops[0];

      libraryService.getHopsById('5ca28662f7e5f91a1f31d835').subscribe(hops => {
        expect(hops).toEqual(_mockSelected);
        done();
      });

      const req = httpMock.expectOne(`${baseURL}${apiVersion}/library/hops`);
      expect(req.request.method).toBe('GET');
      req.flush(mockHops);
    });

    test('should return an Observable<Yeast>', done => {
      const _mockSelected = mockYeast[0];

      libraryService.getYeastById('5ca286b7f7e5f91a1f31d8af').subscribe(yeast => {
        expect(yeast).toEqual(_mockSelected);
        done();
      });

      const req = httpMock.expectOne(`${baseURL}${apiVersion}/library/yeast`);
      expect(req.request.method).toBe('GET');
      req.flush(mockYeast);
    });

  });

});
