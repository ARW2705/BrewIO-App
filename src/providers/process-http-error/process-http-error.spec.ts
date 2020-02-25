/* Module imports */
import { TestBed, getTestBed, async } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';

/* Test configuration imports */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Provider imports */
import { ProcessHttpErrorProvider } from './process-http-error';

describe('Process HTTP Error Service', () => {
  let injector: TestBed;
  let processHttpService: ProcessHttpErrorProvider;
  configureTestBed();

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      providers: [
        ProcessHttpErrorProvider
      ]
    });
  })()
  .then(done)
  .catch(done.fail));

  beforeEach(() => {
    injector = getTestBed();
    processHttpService = injector.get(ProcessHttpErrorProvider);
  });

  test('should get 401 HttpErrorResponse', () => {
    const errorResponse: HttpErrorResponse = new HttpErrorResponse({
      status: 401,
      statusText: '',
      error: {
        error: {
          message: 'Not authorized'
        }
      }
    });

    processHttpService.handleError(errorResponse)
      .subscribe(
        _ => { },
        error => expect(error).toMatch('Not authorized')
      );
  }); // end 'should get 401 HttpErrorResponse' test

  test('should get 500 HttpErrorResponse', () => {
    const errorResponse: HttpErrorResponse = new HttpErrorResponse({
      status: 500,
      statusText: 'test 500 error',
      error: {
        name: ''
      }
    });

    processHttpService.handleError(errorResponse)
      .subscribe(
        _ => { },
        error => expect(error).toMatch('<500> test 500 error')
      );
  }) // end 'should get 500 HttpErrorResponse' test

  test('should get ValidationError', () => {
    const errorResponse: HttpErrorResponse = new HttpErrorResponse({
      status: 500,
      statusText: 'test validation error',
      error: {
        name: 'ValidationError',
        message: 'a database validation error occurred'
      }
    });

    processHttpService.handleError(errorResponse)
      .subscribe(
        _ => { },
        error => expect(error).toMatch('<500> test validation error')
      );
  }); // end 'should get ValidationError' test

  test('should get 503 generic error with message', () => {
    const error = {
      status: 503,
      message: 'generic error message'
    };

    processHttpService.handleError(error).subscribe(
      _ => { },
      error => expect(error).toMatch('generic error message')
    );
  }); // end 'should get 503 generic error with message' test

  test('should get 500 generic error', () => {
    const genericError = '500 Internal Server Error';

    processHttpService.handleError(genericError)
      .subscribe(
        _ => { },
        error => expect(error).toMatch(genericError)
      );
  }); // end 'should get 500 generic error' test

});
