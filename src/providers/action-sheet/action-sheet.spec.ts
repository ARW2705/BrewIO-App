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

  beforeAll(async(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        ActionSheetProvider,
        { provide: ActionSheetController, useClass: ActionSheetControllerMock }
      ]
    });

    injector = getTestBed();
    actionService = injector.get(ActionSheetProvider);
  }));

  test('should create action buttons', () => {
    const buttons: Array<ActionSheetButton> = actionService.generateActionSheetButtons(mockActionSheetButtons());
    expect(buttons[0].text).toMatch('Choice 1');
    expect(buttons[4].role).toMatch('cancel');
  }); // end 'should create action buttons' test

  test('should have an action button handler', () => {
    const buttons: Array<ActionSheetButton> = actionService.generateActionSheetButtons(mockActionSheetButtons());
    const handler = buttons[buttons.length - 1].handler;
    const consoleSpy = jest.spyOn(console, 'log');
    handler();
    expect(consoleSpy).toHaveBeenCalledWith('Action Sheet cancelled');
  }); // end 'should have an action button hanlder' test

  test('should open action sheet', () => {
    const createSpy = jest.spyOn(actionService.actionCtrl, 'create');
    const _mockActionSheetButtons = mockActionSheetButtons();

    actionService.openActionSheet('title', _mockActionSheetButtons, 'custom-class');

    expect(createSpy.mock.calls[0][0].title).toMatch('title');
    expect(createSpy.mock.calls[0][0].buttons[0].text).toMatch(_mockActionSheetButtons[0].text);
    expect(createSpy.mock.calls[0][0].cssClass).toMatch('custom-class');
  }); // end 'should open action sheet' test

});
