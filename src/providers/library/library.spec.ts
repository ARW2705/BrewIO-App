/* Module imports */
import { TestBed, getTestBed, async } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { of } from 'rxjs/observable/of';

/* Constant imports */
import { BASE_URL } from '../../shared/constants/base-url';
import { API_VERSION } from '../../shared/constants/api-version';

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
  let storage: StorageProvider;
  let processHttpError; ProcessHttpErrorProvider;
  configureTestBed();

  beforeAll(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
      ],
      providers: [
        LibraryProvider,
        { provide: ProcessHttpErrorProvider, useValue: {} },
        { provide: StorageProvider, useValue: {} }
      ]
    });
  }));

  beforeEach(() => {
    injector = getTestBed();
    libraryService = injector.get(LibraryProvider);
    httpMock = injector.get(HttpTestingController);
    storage = injector.get(StorageProvider);
    processHttpError = injector.get(ProcessHttpErrorProvider);
  });


  describe('Fetch library data', () => {

    afterEach(() => {
      httpMock.verify();
    });

    test('should call each fetch method', done => {
      storage.getLibrary = jest
        .fn()
        .mockReturnValue(of([]));

      libraryService.updateStorage = jest
        .fn();

      const fetchGrainsLibrarySpy: jest.SpyInstance = jest
        .spyOn(libraryService, 'fetchGrainsLibrary');
      const fetchHopsLibrarySpy: jest.SpyInstance = jest
        .spyOn(libraryService, 'fetchHopsLibrary');
      const fetchYeastLibrarySpy: jest.SpyInstance = jest
        .spyOn(libraryService, 'fetchYeastLibrary');
      const fetchStyleLibrarySpy: jest.SpyInstance = jest
        .spyOn(libraryService, 'fetchStyleLibrary');
      const storageSpy: jest.SpyInstance = jest.spyOn(storage, 'getLibrary');

      libraryService.fetchAllLibraries();

      setTimeout(() => {
        expect(fetchGrainsLibrarySpy).toHaveBeenCalled();
        expect(fetchHopsLibrarySpy).toHaveBeenCalled();
        expect(fetchYeastLibrarySpy).toHaveBeenCalled();
        expect(fetchStyleLibrarySpy).toHaveBeenCalled();
        expect(storageSpy).toHaveBeenCalled();
        done();
      }, 10);

      const reqGrains: TestRequest = httpMock
        .expectOne(`${BASE_URL}/${API_VERSION}/library/grains`);
      expect(reqGrains.request.method).toBe('GET');
      reqGrains.flush([]);

      const reqHops: TestRequest = httpMock
        .expectOne(`${BASE_URL}/${API_VERSION}/library/hops`);
      expect(reqHops.request.method).toBe('GET');
      reqHops.flush([]);

      const reqYeast: TestRequest = httpMock
        .expectOne(`${BASE_URL}/${API_VERSION}/library/yeast`);
      expect(reqYeast.request.method).toBe('GET');
      reqYeast.flush([]);

      const reqStyles: TestRequest = httpMock
        .expectOne(`${BASE_URL}/${API_VERSION}/library/style`);
      expect(reqStyles.request.method).toBe('GET');
      reqStyles.flush([]);
    }); // end 'should return an Observable with an array of each library' test

    test('should load libraries from storage', done => {
      const _mockGrains: Grains[] = mockGrains();
      const _mockHops: Hops[] = mockHops();
      const _mockYeast: Yeast[] = mockYeast();
      const _mockStyle: Style[] = mockStyles();

      expect(libraryService.grainsLibrary).toBeNull();
      expect(libraryService.hopsLibrary).toBeNull();
      expect(libraryService.yeastLibrary).toBeNull();
      expect(libraryService.styleLibrary).toBeNull();

      storage.getLibrary = jest
        .fn()
        .mockReturnValue(
          of({
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
      storage.getLibrary = jest
        .fn()
        .mockReturnValue(new ErrorObservable('load error'));

      const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

      libraryService.fetchGrainsLibrary = jest
        .fn()
        .mockReturnValue(new ErrorObservable({error: 'short-circuit'}));
      libraryService.fetchHopsLibrary = jest
        .fn()
        .mockReturnValue(new ErrorObservable({error: 'short-circuit'}));
      libraryService.fetchYeastLibrary = jest
        .fn()
        .mockReturnValue(new ErrorObservable({error: 'short-circuit'}));
      libraryService.fetchStyleLibrary = jest
        .fn()
        .mockReturnValue(new ErrorObservable({error: 'short-circuit'}));

      libraryService.fetchAllLibraries();

      setTimeout(() => {
        expect(consoleSpy.mock.calls[0][0])
          .toMatch('load error: awaiting data from server');
        done();
      }, 10);
    }); // end 'should fail to load libraries from storage' test

    test('should get error response on grains library get request', done => {
      processHttpError.handleError = jest
        .fn()
        .mockReturnValue(new ErrorObservable('<500> Internal Server Error'));

      libraryService.fetchGrainsLibrary()
        .subscribe(
          (response: Grains[]): void => {
            console.log('Should not get a response', response);
            expect(true).toBe(false);
          },
          (error: string): void => {
            expect(error).toMatch('<500> Internal Server Error');
            done();
          }
        );

      const getReq: TestRequest = httpMock
        .expectOne(`${BASE_URL}/${API_VERSION}/library/grains`);
      getReq.flush(null, mockErrorResponse(500, 'Internal Server Error'));
    }); // end 'should get error response on grains library get request' test

    test('should get error response on hops library get request', done => {
      processHttpError.handleError = jest
        .fn()
        .mockReturnValue(new ErrorObservable('<500> Internal Server Error'));

      libraryService.fetchHopsLibrary()
        .subscribe(
          (response: Hops[]): void => {
            console.log('Should not get a response', response);
            expect(true).toBe(false);
          },
          (error: string): void => {
            expect(error).toMatch('<500> Internal Server Error');
            done();
          }
        );

      const getReq: TestRequest = httpMock
        .expectOne(`${BASE_URL}/${API_VERSION}/library/hops`);
      getReq.flush(null, mockErrorResponse(500, 'Internal Server Error'));
    }); // end 'should get error response on hops library get request' test

    test('should get error response on yeast library get request', done => {
      processHttpError.handleError = jest
        .fn()
        .mockReturnValue(new ErrorObservable('<500> Internal Server Error'));

      libraryService.fetchYeastLibrary()
        .subscribe(
          (response: Yeast[]): void => {
            console.log('Should not get a response', response);
            expect(true).toBe(false);
          },
          (error: string): void => {
            expect(error).toMatch('<500> Internal Server Error');
            done();
          }
        );

      const getReq: TestRequest = httpMock
        .expectOne(`${BASE_URL}/${API_VERSION}/library/yeast`);
      getReq.flush(null, mockErrorResponse(500, 'Internal Server Error'));
    }); // end 'should get error response on yeast library get request' test

    test('should get error response on style library get request', done => {
      processHttpError.handleError = jest
        .fn()
        .mockReturnValue(new ErrorObservable('<500> Internal Server Error'));

      libraryService.fetchStyleLibrary()
        .subscribe(
          (response: Style[]): void => {
            console.log('Should not get a response', response);
            expect(true).toBe(false);
          },
          (error: string): void => {
            expect(error).toMatch('<500> Internal Server Error');
            done();
          }
        );

      const getReq: TestRequest = httpMock
        .expectOne(`${BASE_URL}/${API_VERSION}/library/style`);
      getReq.flush(null, mockErrorResponse(500, 'Internal Server Error'));
    }); // end 'should get error response on style library get request' test

  }); // end 'Fetch library entries' section


  describe('Get library data', () => {

    beforeEach(() => {
      const _mockGrains: Grains[] = mockGrains();
      libraryService.fetchGrainsLibrary = jest
        .fn()
        .mockReturnValue(of(_mockGrains));

      const _mockHops: Hops[] = mockHops();
      libraryService.fetchHopsLibrary = jest
        .fn()
        .mockReturnValue(of(_mockHops));

      const _mockYeast: Yeast[] = mockYeast();
      libraryService.fetchYeastLibrary = jest
        .fn()
        .mockReturnValue(of(_mockYeast));

      const _mockStyles: Style[] = mockStyles();
      libraryService.fetchStyleLibrary = jest
        .fn()
        .mockReturnValue(of(_mockStyles));
    });

    test('should return an Observable<Grains>[]', done => {
      const _mockGrains: Grains[] = mockGrains();

      libraryService.getGrainsLibrary()
        .subscribe((grains: Grains[]): void => {
          expect(grains.length).toBe(3);
          expect(grains).toEqual(_mockGrains);
          done();
        });
    }); // end 'should return an Observable<Grains>[]' test

    test('should return an Observable<Hops>[]', done => {
      const _mockHops: Hops[] = mockHops();

      libraryService.getHopsLibrary()
        .subscribe((hops: Hops[]): void => {
          expect(hops.length).toBe(3);
          expect(hops).toEqual(_mockHops);
          done();
        });
    }); // end 'should return an Observable<Hops>[]' test

    test('should return an Observable<Yeast>[]', done => {
      const _mockYeast: Yeast[] = mockYeast();

      libraryService.getYeastLibrary()
        .subscribe((yeast: Yeast[]): void => {
          expect(yeast.length).toBe(2);
          expect(yeast).toEqual(_mockYeast);
          done();
        });
    }); // end 'should return an Observable<Yeast>[]' test

    test('should return an Observable<Style>[]', done => {
      const _mockStyles: Style[] = mockStyles();

      libraryService.getStyleLibrary()
        .subscribe((styles: Style[]): void => {
          expect(styles.length).toBe(4);
          expect(styles).toEqual(_mockStyles);
          done();
        });
    }); // end 'should return an Observable<Style>[]' test

    test('should return an Observable with an array of each library', done => {
      const _mockGrains: Grains[] = mockGrains();
      const _mockHops: Hops[] = mockHops();
      const _mockYeast: Yeast[] = mockYeast();
      const _mockStyles: Style[] = mockStyles();

      libraryService.getAllLibraries()
        .subscribe(
          (libraries: (Grains[] | Hops[] | Yeast[] | Style[])[]): void => {
            expect(libraries[0]).toEqual(_mockGrains);
            expect(libraries[1]).toEqual(_mockHops);
            expect(libraries[2]).toEqual(_mockYeast);
            expect(libraries[3]).toEqual(_mockStyles);
            done();
          }
        );
    }); // end 'should return an Observable with an array of each library' test

  }); // end 'Get library data' section


  describe('Get library entries by id with no entries stored', () => {

    test('should return an Observable<Grains>', done => {
      const _mockGrains: Grains[] = mockGrains();
      const _mockSelected: Grains = _mockGrains[0];

      libraryService.fetchGrainsLibrary = jest
        .fn()
        .mockReturnValue(of(_mockGrains));

      libraryService.getGrainsById(_mockSelected._id)
        .subscribe((grains: Grains): void => {
          expect(grains).toEqual(_mockSelected);
          done();
        });
    }); // end 'should return an Observable<Grains>' test

    test('should return an Observable<Hops>', done => {
      const _mockHops: Hops[] = mockHops();
      const _mockSelected: Hops = _mockHops[0];

      libraryService.fetchHopsLibrary = jest
        .fn()
        .mockReturnValue(of(_mockHops));

      libraryService.getHopsById(_mockSelected._id)
        .subscribe((hops: Hops): void => {
          expect(hops).toEqual(_mockSelected);
          done();
        });
    }); // end 'should return an Observable<Hops>' test

    test('should return an Observable<Yeast>', done => {
      const _mockYeast: Yeast[] = mockYeast();
      const _mockSelected: Yeast = _mockYeast[0];

      libraryService.fetchYeastLibrary = jest
        .fn()
        .mockReturnValue(of(_mockYeast));

      libraryService.getYeastById(_mockSelected._id)
        .subscribe((yeast: Yeast): void => {
          expect(yeast).toEqual(_mockSelected);
          done();
        });
    }); // end 'should return an Observable<Yeast>' test

  }); // end 'Get library entries by id with no entries stored' section


  describe('From stored libraries tests', () => {

    test('should return an Observable<Grains>[] from stored', done => {
      const _mockGrains: Grains[] = mockGrains();
      libraryService.grainsLibrary = _mockGrains;

      libraryService.getGrainsLibrary()
        .subscribe((grains: Grains[]): void => {
          expect(grains.length).toBe(3);
          expect(grains).toEqual(_mockGrains);
          done();
        });
    }); // end 'should return an Observable<Grains>[] from stored' test

    test('should return an Observable<Hops>[] from stored', done => {
      const _mockHops: Hops[] = mockHops();
      libraryService.hopsLibrary = _mockHops;

      libraryService.getHopsLibrary()
        .subscribe((hops: Hops[]): void => {
          expect(hops.length).toBe(3);
          expect(hops).toEqual(_mockHops);
          done();
        });
    }); // end 'should return an Observable<Hops>[] from stored' test

    test('should return an Observable<Yeast>[] from stored', done => {
      const _mockYeast: Yeast[] = mockYeast();
      libraryService.yeastLibrary = _mockYeast;

      libraryService.getYeastLibrary()
        .subscribe((yeast: Yeast[]): void => {
          expect(yeast.length).toBe(2);
          expect(yeast).toEqual(_mockYeast);
          done();
        });
    }); // end 'should return an Observable<Yeast>[] from stored' test

    test('should return an Observable<Style>[] from stored', done => {
      const _mockStyles: Style[] = mockStyles();
      libraryService.styleLibrary = _mockStyles;

      libraryService.getStyleLibrary()
        .subscribe((styles: Style[]): void => {
          expect(styles.length).toBe(4);
          expect(styles).toEqual(_mockStyles);
          done();
        });
    }); // end 'should return an Observable<Style>[] from stored' test

    test('should return an Observable<Grains>', done => {
      const _mockGrains: Grains[] = mockGrains();
      const _mockSelected: Grains = _mockGrains[0];
      libraryService.grainsLibrary = _mockGrains;

      libraryService.getGrainsById(_mockSelected._id)
        .subscribe((grains: Grains): void => {
          expect(grains).toEqual(_mockSelected);
          done();
        });
    }); // end 'should return an Observable<Grains>' test

    test('should return an Observable<Hops>', done => {
      const _mockHops: Hops[] = mockHops();
      const _mockSelected: Hops = _mockHops[0];
      libraryService.hopsLibrary = _mockHops;

      libraryService.getHopsById(_mockSelected._id)
        .subscribe((hops: Hops): void => {
          expect(hops).toEqual(_mockSelected);
          done();
        });
    }); // end 'should return an Observable<Hops>' test

    test('should return an Observable<Yeast>', done => {
      const _mockYeast: Yeast[] = mockYeast();
      const _mockSelected: Yeast = _mockYeast[0];
      libraryService.yeastLibrary = _mockYeast;

      libraryService.getYeastById(_mockSelected._id)
        .subscribe((yeast: Yeast): void => {
          expect(yeast).toEqual(_mockSelected);
          done();
        });
    }); // end 'should return an Observable<Yeast>' test

    test('should return an Observable<Style> from in memory style library', done => {
      const _mockStyle: Style[] = mockStyles();
      const _mockSelected: Style = _mockStyle[0];
      libraryService.styleLibrary = _mockStyle;

      libraryService.getStyleById(_mockSelected._id)
        .subscribe((style: Style): void => {
          expect(style).toStrictEqual(_mockSelected);
          done();
        });
    }); // end 'should return an Observable<Style>' test

    test('should fetch style library, then return an Observable<Style>', done => {
      const _mockStyles: Style[] = mockStyles();

      libraryService.fetchStyleLibrary = jest
        .fn()
        .mockReturnValue(of(_mockStyles));

      libraryService.getStyleById(_mockStyles[0]._id)
        .subscribe((style: Style): void => {
          expect(style).toStrictEqual(_mockStyles[0]);
          done();
        });
    }); // end 'should fetch style library, then return an Observable<Style>' test

  }); // end 'From stored libraries tests' section

  describe('Utility functions', () => {

    test('should sort objects alphabetically by name', () => {
      const mockLeft: object = { name: 'a'};
      const mockRight: object = { name: 'b'};

      const testLeft: number = libraryService.sortAlpha(mockLeft, mockRight);
      const testRight: number = libraryService.sortAlpha(mockRight, mockLeft);
      const testEqual: number = libraryService.sortAlpha(mockLeft, mockLeft);

      expect(testLeft).toEqual(-1);
      expect(testRight).toEqual(1);
      expect(testEqual).toEqual(0);
    }); // end 'should sort objects alphabetically by name' test

    test('should update library storage', done => {
      storage.setLibrary = jest
        .fn()
        .mockReturnValue(of({}));

      const _mockGrains: Grains[] = mockGrains();
      const _mockHops: Hops[] = mockHops();
      const _mockYeast: Yeast[] = mockYeast();
      const _mockStyle: Style[] = mockStyles();

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

      const storageSpy: jest.SpyInstance = jest
        .spyOn(libraryService.storageService, 'setLibrary');

      libraryService.updateStorage();

      setTimeout(() => {
        expect(storageSpy).toHaveBeenCalledWith(_mockLibrary);
        done();
      }, 10);
    }); // end 'should update library storage' test

    test('should fail to store library', done => {
      storage.setLibrary = jest
        .fn()
        .mockReturnValue(new ErrorObservable('store error'));

      const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

      libraryService.updateStorage();

      setTimeout(() => {
        const callCount: number = consoleSpy.mock.calls.length;
        expect(consoleSpy.mock.calls[callCount - 1][0])
          .toMatch('Library store error: store error');
        done();
      });
    }); // end 'should fail to store library' test

  }); // end 'Utility functions' section

});
