/* Module imports */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';

/* Constants imports */
import { baseURL } from '../../shared/constants/base-url';
import { apiVersion } from '../../shared/constants/api-version';

/* Interface imports */
import { Grains, Hops, Yeast, Style, LibraryStorage} from '../../shared/interfaces/library';

/* Provider imports */
import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';
import { StorageProvider } from '../storage/storage';


@Injectable()
export class LibraryProvider {
  grainsLibrary: Array<Grains> = null;
  hopsLibrary: Array<Hops> = null;
  yeastLibrary: Array<Yeast> = null;
  styleLibrary: Array<Style> = null;

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
    this.storageService.getLibrary()
      .subscribe(
        (libraries: LibraryStorage) => {
          this.grainsLibrary = libraries.grains;
          this.hopsLibrary = libraries.hops;
          this.yeastLibrary = libraries.yeast;
          this.styleLibrary = libraries.style;
        },
        (error: ErrorObservable) => {
          console.log(`${error}: awaiting data from server`);
        }
      );
    Observable.forkJoin(
      this.fetchGrainsLibrary(),
      this.fetchHopsLibrary(),
      this.fetchYeastLibrary(),
      this.fetchStyleLibrary()
    )
    .subscribe(
      ([grainsLibrary, hopsLibrary, yeastLibrary, styleLibrary]) => {
        this.grainsLibrary = grainsLibrary;
        this.hopsLibrary = hopsLibrary;
        this.yeastLibrary = yeastLibrary;
        this.styleLibrary = styleLibrary;
        this.updateStorage();
      },
      error => {
        // TODO error handle forkjoin
        console.log(error);
      });
  }

  /**
   * Fetch grains library
   *
   * @params: none
   *
   * @return: observable of array of grains
  **/
  fetchGrainsLibrary(): Observable<Array<Grains>> {
    return this.http.get(`${baseURL}/${apiVersion}/library/grains`)
      .map((grains: Array<Grains>) => {
        this.grainsLibrary = grains.sort(this.sortAlpha);
        this.updateStorage();
        return grains;
      })
      .catch(error => this.processHttpError.handleError(error));
  }

  /**
   * Fetch hops library
   *
   * @params: none
   *
   * @return: observable of array of hops
  **/
  fetchHopsLibrary(): Observable<Array<Hops>> {
    return this.http.get(`${baseURL}/${apiVersion}/library/hops`)
      .map((hops: Array<Hops>) => {
        this.hopsLibrary = hops.sort(this.sortAlpha);
        this.updateStorage();
        return hops;
      })
      .catch(error => this.processHttpError.handleError(error));
  }

  /**
   * Fetch yeast library
   *
   * @params: none
   *
   * @return: observable of array of yeast
  **/
  fetchYeastLibrary(): Observable<Array<Yeast>> {
    return this.http.get(`${baseURL}/${apiVersion}/library/yeast`)
      .map((yeast: Array<Yeast>) => {
        this.yeastLibrary = yeast.sort(this.sortAlpha);
        this.updateStorage();
        return yeast;
      })
      .catch(error => this.processHttpError.handleError(error));
  }

  /**
   * Fetch style library
   *
   * @params: none
   *
   * @return: observable of array of style
  **/
  fetchStyleLibrary(): Observable<Array<Style>> {
    return this.http.get(`${baseURL}/${apiVersion}/library/style`)
      .map((style: Array<Style>) => {
        this.styleLibrary = style.sort(this.sortAlpha);
        this.updateStorage();
        return style;
      })
      .catch(error => this.processHttpError.handleError(error));
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
  getAllLibraries(): Observable<Array<Array<any>>> {
    return Observable.forkJoin(
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
  getGrainsLibrary(): Observable<Array<Grains>> {
    return this.grainsLibrary === null
            ? this.fetchGrainsLibrary()
            : Observable.of(this.grainsLibrary);
  }

  /**
   * Get grains by id, fetch the library if one is not present
   *
   * @params: grainId - id of grains document to retrieve
   *
   * @return: observable of grains document
  **/
  getGrainsById(grainId: string): Observable<Grains> {
    let grains;
    if (this.grainsLibrary !== null) {
      grains = this.grainsLibrary.find(entry => entry._id === grainId);
    }
    return grains !== undefined
            ? Observable.of(grains)
            : this.fetchGrainsLibrary()
              .map(library => library.find(entry => entry._id === grainId));
  }

  /**
   * Get hops library from memory or fetch from server if not present
   *
   * @params: none
   *
   * @return: observable of array of hops
  **/
  getHopsLibrary(): Observable<Array<Hops>> {
    return this.hopsLibrary === null
            ? this.fetchHopsLibrary()
            : Observable.of(this.hopsLibrary);
  }

  /**
   * Get hops by id, fetch the library if one is not present
   *
   * @params: hopsId - id of hops document to retrieve
   *
   * @return: observable of hops document
  **/
  getHopsById(hopsId: string): Observable<Hops> {
    let hops;
    if (this.hopsLibrary !== null) {
      hops = this.hopsLibrary.find(entry => entry._id === hopsId);
    }
    return hops !== undefined
            ? Observable.of(hops)
            : this.fetchHopsLibrary()
              .map(library => library.find(entry => entry._id === hopsId));
  }

  /**
   * Get yeast library from memory or fetch from server if not present
   *
   * @params: none
   *
   * @return: observable of array of yeast
  **/
  getYeastLibrary(): Observable<Array<Yeast>> {
    return this.yeastLibrary === null
            ? this.fetchYeastLibrary()
            : Observable.of(this.yeastLibrary);
  }

  /**
   *Get yeast by id, fetch the library if one is not present
   *
   * @params: yeastId - id of yeast document to retrieve
   *
   * @return: observable of yeast document
  **/
  getYeastById(yeastId: string): Observable<Yeast> {
    let yeast;
    if (this.yeastLibrary !== null) {
      yeast = this.yeastLibrary.find(entry => entry._id === yeastId);
    }
    return yeast !== undefined
            ? Observable.of(yeast)
            : this.fetchYeastLibrary()
              .map(library => library.find(entry => entry._id === yeastId));
  }

  /**
   * Get style library from memory or fetch from server if not present
   *
   * @params: none
   *
   * @return: observable of array of style
  **/
  getStyleLibrary(): Observable<Array<Style>> {
    return this.styleLibrary === null
            ? this.fetchStyleLibrary()
            : Observable.of(this.styleLibrary);
  }

  /**
   * Get style by id, fetch the library if one is not present
   *
   * @params: styleId - id of yeast document to retrieve
   *
   * @return: observable of style
  **/
  getStyleById(styleId: string): Observable<Style> {
    let style;
    if (this.styleLibrary !== null) {
      style = this.styleLibrary.find(entry => entry._id === styleId);
    }
    return style !== undefined
            ? Observable.of(style)
            : this.fetchStyleLibrary()
              .map(library => library.find(entry => entry._id === styleId));
  }

  /**
   * Comparator to sort object alphabetically
   *
   * @params: a - lefthand object
   * @params: b - righthand object
   *
   * @return: -1 if lefthand should be first, 1 if righthand should be first, 0 if equal
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
      () => {},
      error => {
        console.log('Error storing library', error);
      }
    );
  }

  /***** End utility methods *****/

}
