import { HttpErrorResponse } from '@angular/common/http';

import { ProcessHttpErrorProvider } from './process-http-error';

let processHttpService: ProcessHttpErrorProvider;

describe('Process Http Error Service', () => {

  beforeAll(() => {
    processHttpService = new ProcessHttpErrorProvider();
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

    processHttpService.handleError(errorResponse).subscribe(
      _ => { },
      error => expect(error).toMatch('Not authorized')
    );
  });

  test('should get 500 HttpErrorResponse', () => {
    const errorResponse: HttpErrorResponse = new HttpErrorResponse({
      status: 500,
      statusText: 'test 500 error',
      error: {
        name: ''
      }
    });

    processHttpService.handleError(errorResponse).subscribe(
      _ => { },
      error => expect(error).toMatch('<500> test 500 error: ')
    );
  });

  test('should get ValidationError', () => {
    const errorResponse: HttpErrorResponse = new HttpErrorResponse({
      status: 500,
      statusText: 'test validation error',
      error: {
        name: 'ValidationError',
        message: 'a database validation error occurred'
      }
    });

    processHttpService.handleError(errorResponse).subscribe(
      _ => { },
      error => expect(error).toMatch('<500> test validation error: a database validation error occurred')
    );
  });

  test('should get 503 generic error with message', () => {
    const error = {
      status: 503,
      message: 'generic error message'
    };

    processHttpService.handleError(error).subscribe(
      _ => { },
      error => expect(error).toMatch('generic error message')
    );
  });

  test('should get 500 generic error', () => {
    const genericError = '500 Internal Server Error';

    processHttpService.handleError(genericError).subscribe(
      _ => { },
      error => expect(error).toMatch(genericError)
    );
  });

})
