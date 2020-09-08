/* Module imports */
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { catchError } from 'rxjs/operators/catchError';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { of } from 'rxjs/observable/of'
import { map } from 'rxjs/operators/map';

/* Constants imports */
import { API_VERSION } from '../../shared/constants/api-version';
import { BASE_URL } from '../../shared/constants/base-url';

/* Interface imports */
import { Grains, Hops, LibraryStorage, Style, Yeast } from '../../shared/interfaces/library';

/* Utility imports */
import { normalizeErrorObservableMessage } from '../../shared/utility-functions/observable-helpers';

/* Provider imports */
import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';
import { StorageProvider } from '../storage/storage';


@Injectable()
export class LibraryProvider {
  grainsLibrary: Grains[] = null;
  hopsLibrary: Hops[] = null;
  yeastLibrary: Yeast[] = null;
  styleLibrary: Style[] = null;

  constructor(
    public http: HttpClient,
    public processHttpError: ProcessHttpErrorProvider,
    public storageService: StorageProvider
  ) { }

  /***** API access methods *****/

  /**
   * Fetch each library type to pre-load into memory, not to be used to return
   * the observables
   *
   * @params: none
   * @return: none
  **/
  fetchAllLibraries(): void {
    // Get libraries from storage, but do not overwrite if fetched from server
    this.storageService.getLibrary()
      .subscribe(
        (libraries: LibraryStorage): void => {
          if (this.grainsLibrary === null) this.grainsLibrary = libraries.grains;
          if (this.hopsLibrary === null) this.hopsLibrary = libraries.hops;
          if (this.yeastLibrary === null) this.yeastLibrary = libraries.yeast;
          if (this.styleLibrary === null) this.styleLibrary = libraries.style;
        },
        (error: ErrorObservable): void => {
          console.log(
            `${normalizeErrorObservableMessage(error)}: awaiting data from server`
          );
        }
      );

    // Get libraries from server
    forkJoin(
      this.fetchGrainsLibrary(),
      this.fetchHopsLibrary(),
      this.fetchYeastLibrary(),
      this.fetchStyleLibrary()
    )
    .subscribe(
      ([grainsLibrary, hopsLibrary, yeastLibrary, styleLibrary]): void => {
        this.grainsLibrary = grainsLibrary;
        this.hopsLibrary = hopsLibrary;
        this.yeastLibrary = yeastLibrary;
        this.styleLibrary = styleLibrary;
        this.updateStorage();
      },
      (error: ErrorObservable): void => {
        // TODO error handle forkjoin
        console.log(
          `Library fetch error: ${normalizeErrorObservableMessage(error)}`
        );
      });
  }

  /**
   * Fetch grains library
   *
   * @params: none
   *
   * @return: observable of array of grains
  **/
  fetchGrainsLibrary(): Observable<Grains[]> {
    return this.http.get(`${BASE_URL}/${API_VERSION}/library/grains`)
      .pipe(
        map((grains: Grains[]): Grains[] => {
          this.grainsLibrary = grains.sort(this.sortAlpha);
          this.updateStorage();
          return grains;
        }),
        catchError((error: HttpErrorResponse): ErrorObservable => {
          return this.processHttpError.handleError(error)
        })
      );
  }

  /**
   * Fetch hops library
   *
   * @params: none
   *
   * @return: observable of array of hops
  **/
  fetchHopsLibrary(): Observable<Hops[]> {
    return this.http.get(`${BASE_URL}/${API_VERSION}/library/hops`)
      .pipe(
        map((hops: Hops[]): Hops[] => {
          this.hopsLibrary = hops.sort(this.sortAlpha);
          this.updateStorage();
          return hops;
        }),
        catchError((error: HttpErrorResponse): ErrorObservable => {
          return this.processHttpError.handleError(error)
        })
      );
  }

  /**
   * Fetch yeast library
   *
   * @params: none
   *
   * @return: observable of array of yeast
  **/
  fetchYeastLibrary(): Observable<Yeast[]> {
    return this.http.get(`${BASE_URL}/${API_VERSION}/library/yeast`)
      .pipe(
        map((yeast: Yeast[]): Yeast[] => {
          this.yeastLibrary = yeast.sort(this.sortAlpha);
          this.updateStorage();
          return yeast;
        }),
        catchError((error: HttpErrorResponse): ErrorObservable => {
          return this.processHttpError.handleError(error)
        })
      );
  }

  /**
   * Fetch style library
   *
   * @params: none
   *
   * @return: observable of array of style
  **/
  fetchStyleLibrary(): Observable<Style[]> {
    return this.http.get(`${BASE_URL}/${API_VERSION}/library/style`)
      .pipe(
        map((style: Style[]): Style[] => {
          this.styleLibrary = style.sort(this.sortAlpha);
          this.updateStorage();
          return style;
        }),
        catchError((error: HttpErrorResponse): ErrorObservable => {
          return this.processHttpError.handleError(error)
        })
      );
  }

  /***** End API access methods *****/


  /***** Utility methods *****/

  /**
   * Call get methods for each library type
   *
   * @params: none
   *
   * @return: combined observable of all library requests
  **/
  getAllLibraries(): Observable<(Grains[] | Hops[] | Yeast[] | Style[])[]> {
    return forkJoin(
      this.getGrainsLibrary(),
      this.getHopsLibrary(),
      this.getYeastLibrary(),
      this.getStyleLibrary()
    );
  }

  /**
   * Get grains library from memory or fetch from server if not present
   *
   * @params: none
   *
   * @return: observable of array of grains
  **/
  getGrainsLibrary(): Observable<Grains[]> {
    return this.grainsLibrary === null
      ? this.fetchGrainsLibrary()
      : of(this.grainsLibrary);
  }

  /**
   * Get grains by id, fetch the library if one is not present
   *
   * @params: grainId - id of grains document to retrieve
   *
   * @return: observable of grains document
  **/
  getGrainsById(grainId: string): Observable<Grains> {
    let grains: Grains;
    if (this.grainsLibrary !== null) {
      grains = this.grainsLibrary
        .find((entry: Grains): boolean => entry._id === grainId);
    }
    return grains !== undefined
      ? of(grains)
      : this.fetchGrainsLibrary()
          .pipe(
            map((library: Grains[]): Grains => {
              return library
                .find((entry: Grains): boolean => entry._id === grainId);
            })
          );
  }

  /**
   * Get hops library from memory or fetch from server if not present
   *
   * @params: none
   *
   * @return: observable of array of hops
  **/
  getHopsLibrary(): Observable<Hops[]> {
    return this.hopsLibrary === null
      ? this.fetchHopsLibrary()
      : of(this.hopsLibrary);
  }

  /**
   * Get hops by id, fetch the library if one is not present
   *
   * @params: hopsId - id of hops document to retrieve
   *
   * @return: observable of hops document
  **/
  getHopsById(hopsId: string): Observable<Hops> {
    let hops: Hops;
    if (this.hopsLibrary !== null) {
      hops = this.hopsLibrary
        .find((entry: Hops): boolean => entry._id === hopsId);
    }
    return hops !== undefined
      ? of(hops)
      : this.fetchHopsLibrary()
          .pipe(
            map((library: Hops[]): Hops => {
              return library
                .find((entry: Hops): boolean => entry._id === hopsId);
            })
          );
  }

  /**
   * Get yeast library from memory or fetch from server if not present
   *
   * @params: none
   *
   * @return: observable of array of yeast
  **/
  getYeastLibrary(): Observable<Yeast[]> {
    return this.yeastLibrary === null
      ? this.fetchYeastLibrary()
      : of(this.yeastLibrary);
  }

  /**
   *Get yeast by id, fetch the library if one is not present
   *
   * @params: yeastId - id of yeast document to retrieve
   *
   * @return: observable of yeast document
  **/
  getYeastById(yeastId: string): Observable<Yeast> {
    let yeast: Yeast;
    if (this.yeastLibrary !== null) {
      yeast = this.yeastLibrary
        .find((entry: Yeast): boolean => entry._id === yeastId);
    }
    return yeast !== undefined
      ? of(yeast)
      : this.fetchYeastLibrary()
          .pipe(
            map((library: Yeast[]): Yeast => {
              return library
                .find((entry: Yeast): boolean => entry._id === yeastId);
            })
          );
  }

  /**
   * Get style library from memory or fetch from server if not present
   *
   * @params: none
   *
   * @return: observable of array of style
  **/
  getStyleLibrary(): Observable<Style[]> {
    return this.styleLibrary === null
      ? this.fetchStyleLibrary()
      : of(this.styleLibrary);
  }

  /**
   * Get style by id, fetch the library if one is not present
   *
   * @params: styleId - id of yeast document to retrieve
   *
   * @return: observable of style
  **/
  getStyleById(styleId: string): Observable<Style> {
    let style: Style;
    if (this.styleLibrary !== null) {
      style = this.styleLibrary
        .find((entry: Style): boolean => entry._id === styleId);
    }
    return style !== undefined
      ? of(style)
      : this.fetchStyleLibrary()
          .pipe(
            map((library: Style[]): Style => {
              return library
                .find((entry: Style): boolean => entry._id === styleId);
            })
          );
  }

  /**
   * Comparator to sort object alphabetically
   *
   * @params: a - lefthand object to compare
   * @params: b - righthand object to compare
   *
   * @return: -1 if lefthand should be first, 1 if righthand should be first,
   *          0 if equal
  **/
  sortAlpha(a: any, b: any): number {
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  }

  /**
   * Update library storage
   *
   * @params: none
   * @return: none
  **/
  updateStorage(): void {
    this.storageService.setLibrary({
      grains: this.grainsLibrary,
      hops: this.hopsLibrary,
      yeast: this.yeastLibrary,
      style: this.styleLibrary
    })
    .subscribe(
      (): void => {},
      (error: ErrorObservable): void => {
        console.log(
          `Library store error: ${normalizeErrorObservableMessage(error)}`
        );
      }
    );
  }

  /***** End utility methods *****/

}
