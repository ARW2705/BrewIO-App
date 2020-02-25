/* Module imports */
import { TestBed, getTestBed, async } from '@angular/core/testing';
import { ActionSheetController } from 'ionic-angular';

/* Test configuration imports */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Mock imports */
import { mockActionSheetButtons } from '../../../test-config/mockmodels/mockActionSheetButtons';
import { ActionSheetControllerMock } from '../../../test-config/mocks-ionic';

/* Interface imports */
import { ActionSheetButton } from '../../shared/interfaces/action-sheet-buttons';

/* Provider imports */
import { ActionSheetProvider } from './action-sheet';

describe('Action sheet provider', () => {
  let injector;
  let actionService;
  configureTestBed();

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        ActionSheetProvider,
        { provide: ActionSheetController, useClass: ActionSheetControllerMock }
      ]
    });

    injector = getTestBed();
    actionService = injector.get(ActionSheetProvider);
  })()
  .then(done)
  .catch(done.fail));

  test('should create action buttons', () => {
    const buttons: Array<ActionSheetButton> = actionService.generateActionSheetButtons(mockActionSheetButtons());
    expect(buttons[0].text).toMatch('Choice 1');
    expect(buttons[3].role).toMatch('cancel');
  });

});
