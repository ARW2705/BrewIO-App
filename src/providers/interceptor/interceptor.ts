/* Module imports */
import { HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse, HttpEvent } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/do';

/* Provider imports */
import { UserProvider } from '../user/user';


@Injectable()
export class AuthorizedInterceptor implements HttpInterceptor {

  constructor(private injector: Injector) { }

  /**
   * Add authorization header with json web token
   *
   * @params: req - the outgoing http request
   * @params: next - angular http handler to continue the request
   *
   * @return: observable of http event to pass response back to origin
  **/
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const userService = this.injector.get(UserProvider);
    const authToken = userService.getToken();
    const authRequest = req.clone({headers: req.headers.set('Authorization', `bearer ${authToken}`)});
    return next.handle(authRequest);
  }

}

@Injectable()
export class UnauthorizedInterceptor implements HttpInterceptor {

  constructor(private injector: Injector) { }

  /**
   * Handle unauthorized response
   *
   * @params: req - the outgoing http request
   * @params: next - angular http handler to continue the request
   *
   * @return: observable of http event to pass response back to origin
  **/
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const userService = this.injector.get(UserProvider);
    const authToken = userService.getToken();

    return next
      .handle(req)
      .do((event: HttpEvent<any>) => {
        // do nothing - only handle errors
      }, (error: any) => {
        if (error instanceof HttpErrorResponse) {
          if (error.status == 401 && authToken) {
            console.log('UnauthorizedInterceptor: ', error);
            userService.checkJWToken();
          }
        }
      });
  }
}
