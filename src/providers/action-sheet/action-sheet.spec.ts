/* Module imports */
import { TestBed, getTestBed, async } from '@angular/core/testing';
import { ActionSheetController, ActionSheet } from 'ionic-angular';

/* Test configuration imports */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Mock imports */
import { mockActionSheetButtons } from '../../../test-config/mockmodels/mockActionSheetButtons';
import { ActionSheetControllerMock, ActionSheetMock } from '../../../test-config/mocks-ionic';

/* Interface imports */
import { ActionSheetButton } from '../../shared/interfaces/action-sheet-buttons';

/* Provider imports */
import { ActionSheetProvider } from './action-sheet';


describe('Action sheet provider', () => {
  let injector: TestBed;
  let actionService: ActionSheetProvider;
  let actionCtrl: ActionSheetController;
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
    actionCtrl = injector.get(ActionSheetController);
  }));

  test('should open action sheet with default class', () => {
    const _mockActionSheet: ActionSheetMock = new ActionSheetMock();

    actionCtrl.create = jest
      .fn()
      .mockImplementation((options: object): any => {
        _mockActionSheet.buttons = options['buttons'];
        return _mockActionSheet;
      });

    const createSpy: jest.SpyInstance = jest
      .spyOn(actionService.actionCtrl, 'create');
    const consoleSpy: jest.SpyInstance = jest
      .spyOn(console, 'log');

    const _mockActionSheetButtons: ActionSheetButton[]
      = mockActionSheetButtons();

    actionService.openActionSheet('title', _mockActionSheetButtons);

    const buttonsLength: number = _mockActionSheet['buttons'].length;
    _mockActionSheet['buttons'][buttonsLength - 1]['handler']();
    expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0])
      .toMatch('Action Sheet cancelled');
    expect(createSpy.mock.calls[0][0].title).toMatch('title');
    expect(createSpy.mock.calls[0][0].buttons[0].text)
      .toMatch(_mockActionSheetButtons[0].text);
    expect(createSpy.mock.calls[0][0].cssClass).toMatch('action-sheet-main');
  }); // end 'should open action sheet with default class' test

  test('should open action sheet with custom class', () => {
    const createSpy: jest.SpyInstance = jest
      .spyOn(actionService.actionCtrl, 'create');

    const _mockActionSheetButtons: ActionSheetButton[]
      = mockActionSheetButtons();

    actionService.openActionSheet(
      'custom-title',
      _mockActionSheetButtons,
      'custom-class'
    );

    expect(createSpy.mock.calls[1][0].title).toMatch('custom-title');
    expect(createSpy.mock.calls[1][0].buttons[0].text)
      .toMatch(_mockActionSheetButtons[0].text);
    expect(createSpy.mock.calls[1][0].cssClass).toMatch('custom-class');
  }); // end 'should open action sheet with custom class' test

});
