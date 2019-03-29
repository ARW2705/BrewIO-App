import { HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse, HttpEvent } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/do';

import { AuthenticationProvider } from '../authentication/authentication';

@Injectable()
export class AuthorizedInterceptor implements HttpInterceptor {

  constructor(private injector: Injector) {
    console.log('Hello AuthorizedInterceptor Provider');
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const authProvider = this.injector.get(AuthenticationProvider);
    const authToken = authProvider.getToken();
    const authRequest = req.clone({headers: req.headers.set('Authorization', `bearer ${authToken}`)});
    return next.handle(authRequest);
  }

}

@Injectable()
export class UnauthorizedInterceptor implements HttpInterceptor {

  constructor(private injector: Injector) {
    console.log('Hello UnauthorizedInterceptor Provider');
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const authProvider = this.injector.get(AuthenticationProvider);
    const authToken = authProvider.getToken();

    return next
      .handle(req)
      .do((event: HttpEvent<any>) => {
        // do nothing
      }, (error: any) => {
        if (error instanceof HttpErrorResponse) {
          if (error.status == 401 && authToken) {
            console.log('UnauthorizedInterceptor: ', error);
            authProvider.checkJWTtoken();
          }
        }
      });
  }
}
