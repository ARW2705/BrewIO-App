import { TestBed, getTestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Events } from 'ionic-angular';

import { ProcessProvider } from './process';
import { UserProvider } from '../user/user';
import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';

import { baseURL } from '../../shared/constants/base-url';
import { apiVersion } from '../../shared/constants/api-version';
import { mockProcessSchedule } from '../../../test-config/mockmodels/mockProcessSchedule';
import { mockBatch } from '../../../test-config/mockmodels/mockBatch';
import { mockUser } from '../../../test-config/mockmodels/mockUser';
import { clone } from '../../shared/utility-functions/utilities';

describe('Process Service', () => {
  let injector: TestBed;
  let processService: ProcessProvider;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule ],
      providers: [
        Events,
        ProcessProvider,
        UserProvider,
        ProcessHttpErrorProvider
      ]
    });
    injector = getTestBed();
    processService = injector.get(ProcessProvider);
    httpMock = injector.get(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  test('should start a new batch', done => {
    processService.startNewBatch('userId', 'masterId', 'recipeId').subscribe(schedule => {
      expect(schedule).toEqual(mockProcessSchedule);
      done();
    });

    const req = httpMock.expectOne(`${baseURL}${apiVersion}/process/user/userId/master/masterId/recipe/recipeId`);
    expect(req.request.method).toMatch('GET');
    req.flush(mockProcessSchedule);
  });

  test('should get a batch by its id', done => {
    processService.getBatchById('batchId').subscribe(batch => {
      expect(batch).toEqual(mockBatch);
      done();
    });

    const req = httpMock.expectOne(`${baseURL}${apiVersion}/process/in-progress/batchId`);
    expect(req.request.method).toMatch('GET');
    req.flush(mockBatch);
  });

  test('should increment the batch current step', done => {
    const _updatedMockBatch = clone(mockBatch);
    _updatedMockBatch._id = 'batchId';
    _updatedMockBatch.currentStep++;
    const _mockUser = clone(mockUser);
    _mockUser.inProgressList = [_updatedMockBatch];

    processService.incrementCurrentStep('batchId').subscribe(user => {
      expect(user).toEqual(_mockUser);
      expect(_mockUser.inProgressList[0].currentStep).toBe(_updatedMockBatch.currentStep);
      done();
    });

    const req = httpMock.expectOne(`${baseURL}${apiVersion}/process/in-progress/batchId/next`);
    expect(req.request.method).toMatch('GET');
    req.flush(_mockUser);
  });

  test('should patch step by batch id and step id', done => {
    const _mockBatch = clone(mockBatch);
    _mockBatch.schedule[0].duration = 10;

    processService.patchBatchById('batchId', 'stepId', _mockBatch).subscribe(updatedBatch => {
      expect(updatedBatch).toEqual(_mockBatch);
      done();
    });

    const req = httpMock.expectOne(`${baseURL}${apiVersion}/process/in-progress/batchId/step/stepId`);
    expect(req.request.method).toMatch('PATCH');
    req.flush(_mockBatch);
  });

  test('should end batch', done => {
    processService.endBatchById('batchId').subscribe(response => {
      expect(response.success).toBe(true);
      expect(response.updatedList.length).toBe(0);
      done();
    });

    const req = httpMock.expectOne(`${baseURL}${apiVersion}/process/in-progress/batchId`);
    expect(req.request.method).toMatch('DELETE');
    req.flush({success: true, updatedList: []});
  });

});
