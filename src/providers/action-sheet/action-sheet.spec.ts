import { TestBed, getTestBed } from '@angular/core/testing';
import { ActionSheetController, App, Config, Platform } from 'ionic-angular';

import { ActionSheetButton } from '../../shared/interfaces/action-sheet-buttons';
import { mockActionSheetButtons } from '../../../test-config/mockmodels/mockActionSheetButtons';

import { ActionSheetProvider } from './action-sheet';

describe('Action sheet provider', () => {
  let injector;
  let actionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        App,
        Config,
        Platform,
        ActionSheetController,
        ActionSheetProvider
      ]
    });

    injector = getTestBed();
    actionService = injector.get(ActionSheetProvider);
  });

  test('should create action buttons', () => {
    const buttons: Array<ActionSheetButton> = actionService.generateActionSheetButtons(mockActionSheetButtons);
    expect(buttons[0].text).toMatch('Choice 1');
    expect(buttons[3].role).toMatch('cancel');
  });

});
