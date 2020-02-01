import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';

export const mockObservablesArray = () => {
  const mock: Array<Observable<any>> = [
    Observable.of({key: 'a'}),
    Observable.of({key: 'b'}),
    Observable.of({key: 'c'})
  ];
  return mock;
};
