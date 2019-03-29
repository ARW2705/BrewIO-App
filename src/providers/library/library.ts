import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/catch';

import { baseURL } from '../../shared/constants/base-url';
import { apiVersion } from '../../shared/constants/api-version';
import { Grains, Hops, Yeast, Style } from '../../shared/interfaces/library';

import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';

@Injectable()
export class LibraryProvider {

  constructor(public http: HttpClient,
    private processHttpError: ProcessHttpErrorProvider) {
    console.log('Hello LibraryProvider Provider');
  }

  /* Grains Routes */

  getAllGrains(): Observable<any> {
    return this.http.get(baseURL + apiVersion + '/library/grains')
      .catch(error => this.processHttpError.handleError(error));
  }

  postGrainsEntry(grains: Grains): Observable<any> {
    return this.http.post(baseURL + apiVersion + '/library/grains', grains)
      .catch(error => this.processHttpError.handleError(error));
  }

  getGrainsById(grainsId: string): Observable<any> {
    return this.http.get(baseURL + apiVersion + `/library/grains/${grainsId}`)
      .catch(error => this.processHttpError.handleError(error));
  }

  patchGrainsById(grainsId: string, update: any): Observable<any> {
    return this.http.patch(baseURL + apiVersion + `/library/grains/${grainsId}`, update)
      .catch(error => this.processHttpError.handleError(error));
  }

  deleteGrainsById(grainsId: string): Observable<any> {
    return this.http.delete(baseURL + apiVersion + `/library/grains/${grainsId}`)
      .catch(error => this.processHttpError.handleError(error));
  }

  /* END Grains Routes */


  /* Hops Routes */

  getAllHops(): Observable<any> {
    return this.http.get(baseURL + apiVersion + '/library/hops')
      .catch(error => this.processHttpError.handleError(error));
  }

  postHopsEntry(hops: Hops): Observable<any> {
    return this.http.post(baseURL + apiVersion + '/library/hops', hops)
      .catch(error => this.processHttpError.handleError(error));
  }

  getHopsById(hopsId: string): Observable<any> {
    return this.http.get(baseURL + apiVersion + `/library/hops/${hopsId}`)
      .catch(error => this.processHttpError.handleError(error));
  }

  patchHopsById(hopsId: string, update: any): Observable<any> {
    return this.http.patch(baseURL + apiVersion + `/library/hops/${hopsId}`, update)
      .catch(error => this.processHttpError.handleError(error));
  }

  deleteHopsById(hopsId: string): Observable<any> {
    return this.http.delete(baseURL + apiVersion + `/library/hops/${hopsId}`)
      .catch(error => this.processHttpError.handleError(error));
  }

  /* END Hops Routes */


  /* Yeast Routes */

  getAllYeast(): Observable<any> {
    return this.http.get(baseURL + apiVersion + '/library/yeast')
      .catch(error => this.processHttpError.handleError(error));
  }

  postYeastEntry(yeast: Yeast): Observable<any> {
    return this.http.post(baseURL + apiVersion + '/library/yeast', yeast)
      .catch(error => this.processHttpError.handleError(error));
  }

  getYeastById(yeastId: string): Observable<any> {
    return this.http.get(baseURL + apiVersion + `/library/yeast/${yeastId}`)
      .catch(error => this.processHttpError.handleError(error));
  }

  patchYeastById(yeastId: string, update: any): Observable<any> {
    return this.http.patch(baseURL + apiVersion + `/library/yeast/${yeastId}`, update)
      .catch(error => this.processHttpError.handleError(error));
  }

  deleteYeastById(yeastId: string): Observable<any> {
    return this.http.delete(baseURL + apiVersion + `/library/yeast/${yeastId}`)
      .catch(error => this.processHttpError.handleError(error));
  }

  /* END Yeast Routes */


  /* Style Routes */

  getAllStyle(): Observable<any> {
    return this.http.get(baseURL + apiVersion + '/library/style')
      .catch(error => this.processHttpError.handleError(error));
  }

  postStyleEntry(style: Style): Observable<any> {
    return this.http.post(baseURL + apiVersion + '/library/style', style)
      .catch(error => this.processHttpError.handleError(error));
  }

  getStyleById(styleId: string): Observable<any> {
    return this.http.get(baseURL + apiVersion + `/library/style/${styleId}`)
      .catch(error => this.processHttpError.handleError(error));
  }

  patchStyleById(styleId: string, update: any): Observable<any> {
    return this.http.patch(baseURL + apiVersion + `/library/style/${styleId}`, update)
      .catch(error => this.processHttpError.handleError(error));
  }

  deleteStyleById(styleId: string): Observable<any> {
    return this.http.delete(baseURL + apiVersion + `/library/style/${styleId}`)
      .catch(error => this.processHttpError.handleError(error));
  }

  /* END Style Routes */

}
