import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';

import { baseURL } from '../../shared/constants/base-url';
import { apiVersion } from '../../shared/constants/api-version';
import { Grains, Hops, Yeast, Style } from '../../shared/interfaces/library';

import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';

@Injectable()
export class LibraryProvider {
  private grainsLibrary: Array<Grains> = null;
  private hopsLibrary: Array<Hops> = null;
  private yeastLibrary: Array<Yeast> = null;
  private styleLibrary: Array<Style> = null;

  constructor(public http: HttpClient,
    private processHttpError: ProcessHttpErrorProvider) {
    console.log('Hello LibraryProvider Provider');
  }

  getAllLibraries(): Observable<any> {
    return Observable.forkJoin(
      this.getGrainsLibrary(),
      this.getHopsLibrary(),
      this.getYeastLibrary(),
      this.getStyleLibrary()
    );
  }

  getGrainsLibrary(): Observable<any> {
    return this.grainsLibrary == null
            ? this.fetchGrainsLibrary()
            : Observable.of(this.grainsLibrary);
  }

  getGrainsById(grainId: string): Observable<any> {
    let grains;
    if (this.grainsLibrary != null) {
      grains = this.grainsLibrary.find(entry => entry._id == grainId);
    }
    return grains != undefined
            ? Observable.of(grains)
            : this.fetchGrainsLibrary()
              .map(library => library.find(entry => entry._id == grainId));
  }

  getHopsLibrary(): Observable<any> {
    return this.hopsLibrary == null
            ? this.fetchHopsLibrary()
            : Observable.of(this.hopsLibrary);
  }

  getHopsById(hopsId: string): Observable<any> {
    let hops;
    if (this.hopsLibrary != null) {
      hops = this.hopsLibrary.find(entry => entry._id == hopsId);
    }
    return hops != undefined
            ? Observable.of(hops)
            : this.fetchHopsLibrary()
              .map(library => library.find(entry => entry._id == hopsId));
  }

  getYeastLibrary(): Observable<any> {
    return this.yeastLibrary == null
            ? this.fetchYeastLibrary()
            : Observable.of(this.yeastLibrary);
  }

  getYeastById(yeastId: string): Observable<any> {
    let yeast;
    if (this.yeastLibrary != null) {
      yeast = this.yeastLibrary.find(entry => entry._id == yeastId);
    }
    return yeast != undefined
            ? Observable.of(yeast)
            : this.fetchYeastLibrary()
              .map(library => library.find(entry => entry._id == yeastId));
  }

  getStyleLibrary(): Observable<any> {
    return this.styleLibrary == null
            ? this.fetchStyleLibrary()
            : Observable.of(this.styleLibrary);
  }

  fetchAllLibraries() {
    this.fetchGrainsLibrary();
    this.fetchHopsLibrary();
    this.fetchYeastLibrary();
    this.fetchStyleLibrary();
  }

  fetchGrainsLibrary(): Observable<any> {
    return this.http.get(baseURL + apiVersion + '/library/grains')
      .map((grains: Array<Grains>) => this.grainsLibrary = grains.sort(this.sortAlpha))
      .catch(error => this.processHttpError.handleError(error));
  }

  fetchHopsLibrary(): Observable<any> {
    return this.http.get(baseURL + apiVersion + '/library/hops')
      .map((hops: Array<Hops>) => this.hopsLibrary = hops.sort(this.sortAlpha))
      .catch(error => this.processHttpError.handleError(error));
  }

  fetchYeastLibrary(): Observable<any> {
    return this.http.get(baseURL + apiVersion + '/library/yeast')
      .map((yeast: Array<Yeast>) => this.yeastLibrary = yeast.sort(this.sortAlpha))
      .catch(error => this.processHttpError.handleError(error));
  }

  fetchStyleLibrary(): Observable<any> {
    return this.http.get(baseURL + apiVersion + '/library/style')
      .map((style: Array<Style>) => this.styleLibrary = style.sort(this.sortAlpha))
      .catch(error => this.processHttpError.handleError(error));
  }

  private sortAlpha(a, b) {
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  }

}
