/* Mock imports */
import { mockAlert, mockAlertPast, mockAlertFuture } from '../../../test-config/mockmodels/mockAlert';

/* Interface imports */
import { Alert } from '../../shared/interfaces/alert';

/* Pipe imports */
import { SortPipe } from './sort';


describe('Pipe: Sort', () => {
  const sortPipe: SortPipe = new SortPipe();

  test('should sort unsorted array by datetime', () => {
    const _mockAlert: Alert = mockAlert();
    const _mockAlertsArray: Alert[] = [
      mockAlertFuture(),
      mockAlertPast(),
      _mockAlert,
      _mockAlert
    ];
    const futureDatetime: Alert = _mockAlertsArray[0];
    const pastDatetime: Alert = _mockAlertsArray[1];

    sortPipe.transform(_mockAlertsArray, 'datetime');

    expect(_mockAlertsArray[0].datetime).toMatch(pastDatetime.datetime);
    expect(_mockAlertsArray[3].datetime).toMatch(futureDatetime.datetime);
  }); // end 'should sort array by datetime' test

  test('should return undefined when something other than an array is given', () => {
    expect(sortPipe.transform({}, 'datetime')).toBeUndefined();
  }); // end 'should return undefined when something other than an array is given' test

  test('should not sort array without a supported sortBy type', () => {
    const _mockArray: number[] = [3, 2, 1];

    sortPipe.transform(_mockArray, 'number');

    expect(_mockArray[0]).toBe(3);
    expect(_mockArray[2]).toBe(1);
  }); // end 'should not sort array without a supported sortBy type' test

  test('should log error and not perform sorting operation with object that lacks a datetime property', () => {
    const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'error');
    const _mockArray: Alert[] = [mockAlert(), <Alert>{}];

    sortPipe.transform(_mockArray, 'datetime');

    expect(consoleSpy)
      .toHaveBeenCalledWith(
        'Sort pipe error: comparate missing \'datetime\' property'
      );
    expect(_mockArray[1]).toEqual({});
  }); // end 'should log error and not perform sorting operation with object that lacks a datetime property' test

});
