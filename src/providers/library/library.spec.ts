/* Module imports */
import { TestBed, getTestBed, async } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { IonicStorageModule } from '@ionic/storage';
import { Observable } from 'rxjs/Observable';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';

/* Constant imports */
import { baseURL } from '../../shared/constants/base-url';
import { apiVersion } from '../../shared/constants/api-version';

/* Test configuration imports */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Mock imports */
import { mockGrains } from '../../../test-config/mockmodels/mockGrains';
import { mockHops } from '../../../test-config/mockmodels/mockHops';
import { mockYeast } from '../../../test-config/mockmodels/mockYeast';
import { mockStyles } from '../../../test-config/mockmodels/mockStyles';
import { mockErrorResponse } from '../../../test-config/mockmodels/mockErrorResponse';

/* Interface imports */
import { Style } from '../../shared/interfaces/library';
import { Grains } from '../../shared/interfaces/library';
import { Hops } from '../../shared/interfaces/library';
import { Yeast } from '../../shared/interfaces/library';
import { LibraryStorage } from '../../shared/interfaces/library';

/* Provider imports */
import { LibraryProvider } from './library';
import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';
import { StorageProvider } from '../storage/storage';


describe('Library service', () => {
  let injector: TestBed;
  let libraryService: LibraryProvider;
  let httpMock: HttpTestingController;
  configureTestBed();

  beforeAll(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        IonicStorageModule.forRoot()
      ],
      providers: [
        LibraryProvider,
        ProcessHttpErrorProvider,
        StorageProvider
      ]
    });
  }));

  beforeEach(() => {
    injector = getTestBed();
    libraryService = injector.get(LibraryProvider);
    httpMock = injector.get(HttpTestingController);
  });

  describe('HTTP tests', () => {

    afterEach(() => {
      httpMock.verify();
    });

    describe('fetch library entries', () => {

      test('should return an Observable<Array<Grains>>', done => {
        const _mockGrains = mockGrains();

        libraryService.getGrainsLibrary()
          .subscribe(grains => {
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

        libraryService.getHopsLibrary()
          .subscribe(hops => {
            expect(hops.length).toBe(3);
            expect(hops).toEqual(_mockHops);
            done();
          });

        const req = httpMock.expectOne(`${baseURL}/${apiVersion}/library/hops`);
        expect(req.request.method).toBe('GET');
        req.flush(_mockHops);
      }); // end 'should return an Observable<Array<Hops>>' test

      test('should return an Observable<Array<Yeast>>', done => {
        const _mockYeast = mockYeast();

        libraryService.getYeastLibrary()
          .subscribe(yeast => {
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

        libraryService.getStyleLibrary()
          .subscribe(styles => {
            expect(styles.length).toBe(4);
            expect(styles).toEqual(_mockStyles);
            done();
          });

        const req = httpMock.expectOne(`${baseURL}/${apiVersion}/library/style`);
        expect(req.request.method).toBe('GET');
        req.flush(_mockStyles);
      }); // end 'should return an Observable<Array<Style>>' test

      test('should return an Observable with an array of each library', done => {
        const _mockGrains = mockStyles();
        const _mockHops = mockHops();
        const _mockYeast = mockYeast();
        const _mockStyles = mockStyles();

        libraryService.getAllLibraries()
          .subscribe((libraries: Array<any>) => {
            expect(libraries[0]).toEqual(_mockGrains);
            expect(libraries[1]).toEqual(_mockHops);
            expect(libraries[2]).toEqual(_mockYeast);
            expect(libraries[3]).toEqual(_mockStyles);
            done();
          });

        const reqGrains = httpMock.expectOne(`${baseURL}/${apiVersion}/library/grains`);
        expect(reqGrains.request.method).toBe('GET');
        reqGrains.flush(_mockGrains);

        const reqHops = httpMock.expectOne(`${baseURL}/${apiVersion}/library/hops`);
        expect(reqHops.request.method).toBe('GET');
        reqHops.flush(_mockHops);

        const reqYeast = httpMock.expectOne(`${baseURL}/${apiVersion}/library/yeast`);
        expect(reqYeast.request.method).toBe('GET');
        reqYeast.flush(_mockYeast);

        const reqStyles = httpMock.expectOne(`${baseURL}/${apiVersion}/library/style`);
        expect(reqStyles.request.method).toBe('GET');
        reqStyles.flush(_mockStyles);
      }); // end 'should return an Observable with an array of each library' test

      test('should call each fetch method', done => {
        const fetchGrainsLibrarySpy = jest.spyOn(libraryService, 'fetchGrainsLibrary');
        const fetchHopsLibrarySpy = jest.spyOn(libraryService, 'fetchHopsLibrary');
        const fetchYeastLibrarySpy = jest.spyOn(libraryService, 'fetchYeastLibrary');
        const fetchStyleLibrarySpy = jest.spyOn(libraryService, 'fetchStyleLibrary');
        const storageSpy = jest.spyOn(libraryService.storageService, 'getLibrary');

        libraryService.fetchAllLibraries();

        setTimeout(() => {
          expect(fetchGrainsLibrarySpy).toHaveBeenCalled();
          expect(fetchHopsLibrarySpy).toHaveBeenCalled();
          expect(fetchYeastLibrarySpy).toHaveBeenCalled();
          expect(fetchStyleLibrarySpy).toHaveBeenCalled();
          expect(storageSpy).toHaveBeenCalled();
          done();
        }, 10);

        const reqGrains = httpMock.expectOne(`${baseURL}/${apiVersion}/library/grains`);
        expect(reqGrains.request.method).toBe('GET');
        reqGrains.flush([]);

        const reqHops = httpMock.expectOne(`${baseURL}/${apiVersion}/library/hops`);
        expect(reqHops.request.method).toBe('GET');
        reqHops.flush([]);

        const reqYeast = httpMock.expectOne(`${baseURL}/${apiVersion}/library/yeast`);
        expect(reqYeast.request.method).toBe('GET');
        reqYeast.flush([]);

        const reqStyles = httpMock.expectOne(`${baseURL}/${apiVersion}/library/style`);
        expect(reqStyles.request.method).toBe('GET');
        reqStyles.flush([]);
      }); // end 'should return an Observable with an array of each library' test

      test('should load libraries from storage', done => {
        const _mockGrains = mockGrains();
        const _mockHops = mockHops();
        const _mockYeast = mockYeast();
        const _mockStyle = mockStyles();

        expect(libraryService.grainsLibrary).toBeNull();
        expect(libraryService.hopsLibrary).toBeNull();
        expect(libraryService.yeastLibrary).toBeNull();
        expect(libraryService.styleLibrary).toBeNull();

        libraryService.storageService.getLibrary = jest
          .fn()
          .mockReturnValue(
            Observable.of({
              grains: _mockGrains,
              hops: _mockHops,
              yeast: _mockYeast,
              style: _mockStyle
            })
          );

        libraryService.fetchGrainsLibrary = jest
          .fn()
          .mockReturnValue(new ErrorObservable('short-circuit'));
        libraryService.fetchHopsLibrary = jest
          .fn()
          .mockReturnValue(new ErrorObservable('short-circuit'));
        libraryService.fetchYeastLibrary = jest
          .fn()
          .mockReturnValue(new ErrorObservable('short-circuit'));
        libraryService.fetchStyleLibrary = jest
          .fn()
          .mockReturnValue(new ErrorObservable('short-circuit'));

        libraryService.fetchAllLibraries();

        setTimeout(() => {
          expect(libraryService.grainsLibrary).not.toBeNull();
          expect(libraryService.hopsLibrary).not.toBeNull();
          expect(libraryService.yeastLibrary).not.toBeNull();
          expect(libraryService.styleLibrary).not.toBeNull();
          done();
        }, 10);
      }); // end 'should load libraries from storage' test

      test('should fail to load libraries from storage', done => {
        libraryService.storageService.getLibrary = jest
          .fn()
          .mockReturnValue(new ErrorObservable('load error'));

        const consoleSpy = jest.spyOn(console, 'log');

        libraryService.fetchGrainsLibrary = jest
          .fn()
          .mockReturnValue(new ErrorObservable('short-circuit'));
        libraryService.fetchHopsLibrary = jest
          .fn()
          .mockReturnValue(new ErrorObservable('short-circuit'));
        libraryService.fetchYeastLibrary = jest
          .fn()
          .mockReturnValue(new ErrorObservable('short-circuit'));
        libraryService.fetchStyleLibrary = jest
          .fn()
          .mockReturnValue(new ErrorObservable('short-circuit'));

        libraryService.fetchAllLibraries();

        setTimeout(() => {
          expect(consoleSpy.mock.calls[0][0]).toMatch('load error: awaiting data from server');
          done();
        }, 10);
      }); // end 'should fail to load libraries from storage' test

      test('should get error response on grains library get request', done => {
        libraryService.fetchGrainsLibrary()
          .subscribe(
            response => {
              console.log('Should not get a response', response);
              expect(true).toBe(false);
            },
            error => {
              expect(error).toMatch('<500> Internal Server Error');
              done();
            }
          );

        const getReq = httpMock.expectOne(`${baseURL}/${apiVersion}/library/grains`);
        getReq.flush(null, mockErrorResponse(500, 'Internal Server Error'));
      }); // end 'should get error response on grains library get request' test

      test('should get error response on hops library get request', done => {
        libraryService.fetchHopsLibrary()
          .subscribe(
            response => {
              console.log('Should not get a response', response);
              expect(true).toBe(false);
            },
            error => {
              expect(error).toMatch('<500> Internal Server Error');
              done();
            }
          );

        const getReq = httpMock.expectOne(`${baseURL}/${apiVersion}/library/hops`);
        getReq.flush(null, mockErrorResponse(500, 'Internal Server Error'));
      }); // end 'should get error response on hops library get request' test

      test('should get error response on yeast library get request', done => {
        libraryService.fetchYeastLibrary()
          .subscribe(
            response => {
              console.log('Should not get a response', response);
              expect(true).toBe(false);
            },
            error => {
              expect(error).toMatch('<500> Internal Server Error');
              done();
            }
          );

        const getReq = httpMock.expectOne(`${baseURL}/${apiVersion}/library/yeast`);
        getReq.flush(null, mockErrorResponse(500, 'Internal Server Error'));
      }); // end 'should get error response on yeast library get request' test

      test('should get error response on style library get request', done => {
        libraryService.fetchStyleLibrary()
          .subscribe(
            response => {
              console.log('Should not get a response', response);
              expect(true).toBe(false);
            },
            error => {
              expect(error).toMatch('<500> Internal Server Error');
              done();
            }
          );

        const getReq = httpMock.expectOne(`${baseURL}/${apiVersion}/library/style`);
        getReq.flush(null, mockErrorResponse(500, 'Internal Server Error'));
      }); // end 'should get error response on style library get request' test

    }); // end 'fetch library entries' section

    describe('get library entries by id with no entries stored', () => {

      test('should return an Observable<Grains>', done => {
        const _mockGrains = mockGrains();
        const _mockSelected = _mockGrains[0];

        libraryService.getGrainsById(_mockSelected._id)
          .subscribe(grains => {
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

        libraryService.getHopsById(_mockSelected._id)
          .subscribe(hops => {
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

        libraryService.getYeastById(_mockSelected._id)
          .subscribe(yeast => {
            expect(yeast).toEqual(_mockSelected);
            done();
          });

        const req = httpMock.expectOne(`${baseURL}/${apiVersion}/library/yeast`);
        expect(req.request.method).toBe('GET');
        req.flush(_mockYeast);
      }); // end 'should return an Observable<Yeast>' test

    }); // end 'fetch Library entries by id with no entries stored' section

  }); // end 'HTTP tests' section

  describe('From stored libraries tests', () => {

    describe('get library with entries stored', () => {

      test('should return an Observable<Array<Grains>> from stored', done => {
        const _mockGrains = mockGrains();
        libraryService.grainsLibrary = _mockGrains;

        libraryService.getGrainsLibrary().subscribe(grains => {
          expect(grains.length).toBe(3);
          expect(grains).toEqual(_mockGrains);
          done();
        });
      }); // end 'should return an Observable<Array<Grains>> from stored' test

      test('should return an Observable<Array<Hops>> from stored', done => {
        const _mockHops = mockHops();
        libraryService.hopsLibrary = _mockHops;

        libraryService.getHopsLibrary().subscribe(hops => {
          expect(hops.length).toBe(3);
          expect(hops).toEqual(_mockHops);
          done();
        }); // end 'should return an Observable<Array<Hops>> from stored' test
      });

      test('should return an Observable<Array<Yeast>> from stored', done => {
        const _mockYeast = mockYeast();
        libraryService.yeastLibrary = _mockYeast;

        libraryService.getYeastLibrary().subscribe(yeast => {
          expect(yeast.length).toBe(2);
          expect(yeast).toEqual(_mockYeast);
          done();
        });
      }); // end 'should return an Observable<Array<Yeast>> from stored' test

      test('should return an Observable<Array<Style>> from stored', done => {
        const _mockStyles = mockStyles();
        libraryService.styleLibrary = _mockStyles;

        libraryService.getStyleLibrary().subscribe(styles => {
          expect(styles.length).toBe(4);
          expect(styles).toEqual(_mockStyles);
          done();
        });
      }); // end 'should return an Observable<Array<Style>> from stored' test

    }); // end 'get library with entries stored' section

    describe('fetch library entries by id with entries stored', () => {

      test('should return an Observable<Grains>', done => {
        const _mockGrains = mockGrains();
        const _mockSelected = _mockGrains[0];
        libraryService.grainsLibrary = _mockGrains;

        libraryService.getGrainsById(_mockSelected._id)
          .subscribe((grains: Grains) => {
            expect(grains).toEqual(_mockSelected);
            done();
          });
      }); // end 'should return an Observable<Grains>' test

      test('should return an Observable<Hops>', done => {
        const _mockHops = mockHops();
        const _mockSelected = _mockHops[0];
        libraryService.hopsLibrary = _mockHops;

        libraryService.getHopsById(_mockSelected._id)
          .subscribe((hops: Hops) => {
            expect(hops).toEqual(_mockSelected);
            done();
          });
      }); // end 'should return an Observable<Hops>' test

      test('should return an Observable<Yeast>', done => {
        const _mockYeast = mockYeast();
        const _mockSelected = _mockYeast[0];
        libraryService.yeastLibrary = _mockYeast;

        libraryService.getYeastById(_mockSelected._id)
          .subscribe((yeast: Yeast) => {
            expect(yeast).toEqual(_mockSelected);
            done();
          });
      }); // end 'should return an Observable<Yeast>' test

      test('should return an Observable<Style> from in memory style library', done => {
        const _mockStyle = mockStyles();
        const _mockSelected = _mockStyle[0];
        libraryService.styleLibrary = _mockStyle;

        libraryService.getStyleById(_mockSelected._id)
          .subscribe((style: Style) => {
            expect(style).toStrictEqual(_mockSelected);
            done();
          });
      }); // end 'should return an Observable<Style>' test

      test('should fetch style library, then return an Observable<Style>', done => {
        const _mockStyles = mockStyles();
        libraryService.getStyleById(_mockStyles[0]._id)
          .subscribe((style: Style) => {
            expect(style).toStrictEqual(_mockStyles[0]);
            done();
          });

        const getReq = httpMock.expectOne(`${baseURL}/${apiVersion}/library/style`);
        getReq.flush(_mockStyles);
      }); // end 'should fetch style library, then return an Observable<Style>' test

    }); // end 'fetch Library entries by id with entries stored' section

  }); // end 'From stored libraries tests' section

  describe('Utility functions', () => {

    test('should sort objects alphabetically by name', () => {
      const mockLeft = { name: 'a'};
      const mockRight = { name: 'b'};

      const testLeft = libraryService.sortAlpha(mockLeft, mockRight);
      const testRight = libraryService.sortAlpha(mockRight, mockLeft);
      const testEqual = libraryService.sortAlpha(mockLeft, mockLeft);

      expect(testLeft).toBe(-1);
      expect(testRight).toBe(1);
      expect(testEqual).toBe(0);
    }); // end 'should sort objects alphabetically by name' test

    test('should update library storage', done => {
      const _mockGrains = mockGrains();
      const _mockHops = mockHops();
      const _mockYeast = mockYeast();
      const _mockStyle = mockStyles();

      libraryService.grainsLibrary = _mockGrains;
      libraryService.hopsLibrary = _mockHops;
      libraryService.yeastLibrary = _mockYeast;
      libraryService.styleLibrary = _mockStyle;

      const _mockLibrary: LibraryStorage = {
        grains: _mockGrains,
        hops: _mockHops,
        yeast: _mockYeast,
        style: _mockStyle
      };

      const storageSpy = jest.spyOn(libraryService.storageService, 'setLibrary');

      libraryService.updateStorage();

      setTimeout(() => {
        expect(storageSpy).toHaveBeenCalledWith(_mockLibrary);
        done();
      }, 10);
    }); // end 'should update library storage' test

    test('should fail to store library', done => {
      libraryService.storageService.setLibrary = jest
        .fn()
        .mockReturnValue(new ErrorObservable('store error'));

      const consoleSpy = jest.spyOn(console, 'log');

      libraryService.updateStorage();

      setTimeout(() => {
        const callCount = consoleSpy.mock.calls.length;
        expect(consoleSpy.mock.calls[callCount - 1][0]).toMatch('Error storing library');
        expect(consoleSpy.mock.calls[callCount - 1][1]).toMatch('store error');
        done();
      });
    }); // end 'should fail to store library' test

  }); // end 'Utility functions' section

});
