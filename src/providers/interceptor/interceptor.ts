/* Module imports */
import { HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse, HttpEvent } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { Observable } from 'rxjs/Observable';

/* Provider imports */
import { UserProvider } from '../user/user';
import { ToastProvider } from '../toast/toast';


@Injectable()
export class AuthorizedInterceptor implements HttpInterceptor {

  constructor(public injector: Injector) { }

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

  constructor(
    public injector: Injector,
    public toastService: ToastProvider
  ) { }

  /**
   * Handle unauthorized response
   *
   * @params: req - the outgoing http request
   * @params: next - angular http handler to continue the request
   *
   * @return: observable of http event to pass response back to origin
  **/
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next
      .handle(req)
      .do(
        () => {},
        (error: any) => {
          if (error instanceof HttpErrorResponse && error.status === 401) {
            // TODO clear data and open login modal
            this.toastService.presentToast(
              'Not Authorized. Please log in',
              3000,
              'bottom',
              'error-toast'
            );
          } else {
            this.toastService.presentToast(
              `An unexpected error occured: <${error.status}> ${error.statusText}`,
              null,
              'bottom',
              'error-toast',
              true
            )
          }
        }
      );
  }
}
