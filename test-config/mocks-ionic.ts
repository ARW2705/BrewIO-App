import { Injectable } from '@angular/core';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { Pipe, PipeTransform } from '@angular/core';
import { of } from 'rxjs/observable/of';

import { BASE_URL } from '../src/shared/constants/base-url';
import { API_VERSION } from '../src/shared/constants/api-version';


export class ActionSheetControllerMock {
  public _getPortal(): any {
    return {}
  };

  public create(options?: any) {
    return new ActionSheetMock();
  }
}


class ActionSheetMock {
  public present() { };
  public dismiss() { };
  public dismissAll() { };
}


export class AppMock { }


export class BackgroundModeMock {
  enable() {
    return;
  }
}


export class ConfigMock {
  public get(...args): any {
    return;
  }

  public getBoolean(...args): any {
    return;
  }
}


export class DeepLinkerMock { }


export class DomMock {
  public debouncer(): any { }
}


export class EventsMock {
  public subscribe(...args): any {
    return;
  }

  public unsubscribe(...args): any {
    return;
  }

  public publish(...args): any {
    return;
  }
}


export class FormMock {
  _ids: number = -1;
  public nextId(): number {
    return ++this._ids;
  }
}


export class GestureMock {
  public createGesture(): any { }
}


@Injectable()
export class HttpMock {
  ROOT_URL: string = `${BASE_URL}/${API_VERSION}`;

  constructor(public http: HttpClient) { }

  public get(): Observable<any> {
    return this.http.get<any>(this.ROOT_URL + '/mock');
  }
}


export class ModalControllerMock {
  public _getPortal(): any {
    return {}
  };

  public create(options?: any) {
    return new ModalMock();
  }
}


export class ModalMock {
  _callbackData: any = undefined;

  _getCallBackData(): any {
    return this._callbackData;
  }

  _setCallBackData(data: any) {
    this._callbackData = data;
  }

  present(options?: any) { };
  dismiss() { };
  dismissAll() { };
  onDidDismiss(cb) {
    cb(this._callbackData);
  };
}


export class NavMock {
  _views: any[] = [ {name: 'first'}, { name: 'last' }];

  public pop(): any {
    return new Promise(function(resolve: Function): void {
      resolve();
    });
  }

  public push(): any {
    return new Promise(function(resolve: Function): void {
      resolve();
    });
  }

  public getActive(): any {
    return {
      instance: {
        model: 'something',
      },
      name: 'mock-active-name'
    };
  }

  public setRoot(): any {
    return true;
  }

  public registerChildNav(nav: any): void {
    return ;
  }

  public unregisterChildNav(nav: any): void {
    return ;
  }

  public getViews(): any[] {
    return this._views;
  }

  public length(): number {
    return this._views.length;
  }
}


export class NavParamsMock {
  static returnParam = {};

  public get(key): any {
    if (Object.keys(NavParamsMock.returnParam).length > 0) {
      return NavParamsMock.returnParam[key];
    }
    return 'default';
  }

  static setParams(key, val): void {
    NavParamsMock.returnParam[key] = val;
  }
}


export class NetworkMock {
  public onConnect(): Observable<any> {
    return of();
  }

  public onDisconnect(): Observable<any> {
    return of();
  }
}


export class NetworkMockDev extends NetworkMock {
  constructor() {
    super();
  }

  public get type(): string {
    return 'none';
  }
}


export class NetworkMockCordova extends NetworkMock {
  constructor() {
    super();
  }

  public get type(): string {
    return 'cordova';
  }

  public onConnect(): Observable<any> {
    let emitter;
    const obs = Observable.create(e => emitter = e);
    setTimeout(() => {
      emitter.next(true);
    }, 10);
    return obs;
  }

  public onDisconnect(): Observable<any> {
    let emitter;
    const obs = Observable.create(e => emitter = e);
    setTimeout(() => {
      emitter.next(true);
    }, 30);
    return obs;
  }
}


export class PlatformMock {
  public Css = {
    transition: ''
  }

  public width(): number {
    return 360;
  }

  public ready(): Promise<string> {
    return new Promise((resolve) => {
      resolve('READY');
    });
  }

  public getQueryParam() {
    return true;
  }

  public registerBackButtonAction(fn: Function, priority?: number): Function {
    return (() => true);
  }

  public hasFocus(ele: HTMLElement): boolean {
    return true;
  }

  public doc(): HTMLDocument {
    return document;
  }

  public getElementComputedStyle(container: any): any {
    return {
      paddingLeft: '10',
      paddingTop: '10',
      paddingRight: '10',
      paddingBottom: '10',
    };
  }

  public onResize(callback: any) {
    return callback;
  }

  public registerListener(ele: any, eventName: string, callback: any): Function {
    return (() => true);
  }

  public win(): Window {
    return window;
  }

  public raf(callback: any): number {
    return 1;
  }

  public timeout(callback: any, timer: number): any {
    return setTimeout(callback, timer);
  }

  public cancelTimeout(id: any) {
    // do nothing
  }

  public getActiveElement(): any {
    return document['activeElement'];
  }
}


export class PlatformMockCordova extends PlatformMock {
  _platformMock: string = 'cordova';

  constructor() {
    super();
  }

  public is(platform: string): boolean {
    return this._platformMock === platform;
  }
}


export class PlatformMockDev extends PlatformMock {
  _platformMock: string = '';

  constructor() {
    super();
  }

  public is(platform: string): boolean {
    return this._platformMock === platform;
  }
}


@Pipe({name: 'sort'})
export class SortPipeMock implements PipeTransform {
  transform(arr: Array<any>, sortBy: string): Array<any> {
    return arr;
  }
}


export class SplashScreenMock extends SplashScreen {
  hide() {
    return;
  }
}


export class StatusBarMock extends StatusBar {
  styleDefault() {
    return;
  }
}


@Injectable()
export class StorageMock {
  storage: any = {};

  constructor() { }

  public clear(): void {
    this.storage = {};
  }

  public get(key: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const result = this.storage[key];
      if (result !== undefined) {
        resolve(result);
      } else {
        reject('Key not found');
      }
    });
  }

  public set(key: string, value: any): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.storage[key] = value;
      resolve(value);
    });
  }

  public remove(key: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      delete this.storage[key];
      resolve();
    });
  }
}


export class ToastControllerMock {
  public _getPortal(): any {
    return {}
  };

  public create(options?: any) {
    return new ToastMock();
  }
}

class ToastMock {
  present() { };
  dismiss() { };
  dismissAll() { };
}


export class ViewControllerMock {
  public readReady = {
    subscribe(){ }
  };
  public writeReady = {
    subscribe(){ }
  };
  public dismiss() { }
  public _setHeader() { }
  public _setNavbar() { }
  public _setIONContent() { }
  public _setIONContentRef() { }
}
