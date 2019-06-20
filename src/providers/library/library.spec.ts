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
  let libService: LibraryProvider;
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
    libService = injector.get(LibraryProvider);
    httpMock = injector.get(HttpTestingController);
  });

  describe('fetch Library entries', () => {

    test('should return an Observable<Array<Grains>>', () => {
      const _mockGrains = mockGrains;

      libService.getGrainsLibrary().subscribe(grains => {
        expect(grains.length).toBe(3);
        expect(grains).toEqual(_mockGrains);
      });

      const req = httpMock.expectOne(`${baseURL}${apiVersion}/library/grains`);
      expect(req.request.method).toBe('GET');
      req.flush(_mockGrains);
    });

    test('should return an Observable<Array<Hops>>', () => {
      const _mockHops = mockHops;

      libService.fetchHopsLibrary().subscribe(hops => {
        expect(hops.length).toBe(3);
        expect(hops).toEqual(_mockHops);
      });

      const req = httpMock.expectOne(`${baseURL}${apiVersion}/library/hops`);
      expect(req.request.method).toBe('GET');
      req.flush(_mockHops);
    });

    test('should return an Observable<Array<Yeast>>', () => {
      const _mockYeast = mockYeast;

      libService.fetchYeastLibrary().subscribe(yeast => {
        expect(yeast.length).toBe(2);
        expect(yeast).toEqual(_mockYeast);
      });

      const req = httpMock.expectOne(`${baseURL}${apiVersion}/library/yeast`);
      expect(req.request.method).toBe('GET');
      req.flush(_mockYeast);
    });

    test('should return an Observable<Array<Style>>', () => {
      const _mockStyles = mockStyles;

      libService.fetchStyleLibrary().subscribe(styles => {
        expect(styles.length).toBe(4);
        expect(styles).toEqual(_mockStyles);
      });

      const req = httpMock.expectOne(`${baseURL}${apiVersion}/library/style`);
      expect(req.request.method).toBe('GET');
      req.flush(_mockStyles);
    });

  });

  describe('fetch Library entries by id', () => {

    test('should return an Observable<Grains>', () => {
      const _mockGrains = mockGrains;
      const _mockSelected = mockGrains[0];

      libService.getGrainsById('5ca285e8f7e5f91a1f31d775').subscribe(grains => {
        expect(grains).toEqual(_mockSelected);
      });

      const req = httpMock.expectOne(`${baseURL}${apiVersion}/library/grains`);
      expect(req.request.method).toBe('GET');
      req.flush(_mockGrains);
    });

    test('should return an Observable<Hops>', () => {
      const _mockHops = mockHops;
      const _mockSelected = mockHops[0];

      libService.getHopsById('5ca28662f7e5f91a1f31d835').subscribe(hops => {
        expect(hops).toEqual(_mockSelected);
      });

      const req = httpMock.expectOne(`${baseURL}${apiVersion}/library/hops`);
      expect(req.request.method).toBe('GET');
      req.flush(_mockHops);
    });

    test('should return an Observable<Yeast>', () => {
      const _mockYeast = mockYeast;
      const _mockSelected = mockYeast[0];

      libService.getYeastById('5ca286b7f7e5f91a1f31d8af').subscribe(yeast => {
        expect(yeast).toEqual(_mockSelected);
      });

      const req = httpMock.expectOne(`${baseURL}${apiVersion}/library/yeast`);
      expect(req.request.method).toBe('GET');
      req.flush(_mockYeast);
    });

  });

});
