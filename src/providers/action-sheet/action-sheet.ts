/* Module imports */
import { Injectable } from '@angular/core';
import { ActionSheetController } from 'ionic-angular';

/* Interface imports */
import { ActionSheetButton } from '../../shared/interfaces/action-sheet-buttons';


@Injectable()
export class ActionSheetProvider {

  constructor(public actionCtrl: ActionSheetController) { }

  /**
   * Create action sheet
   *
   * @params: buttons - action button to add to sheet
   *
   * @return: array of action sheet buttons
  **/
  generateActionSheetButtons(buttons: Array<ActionSheetButton>): Array<any> {
    const actions: Array<ActionSheetButton> = buttons.map(button => {
      const action = {
        text: button.text,
        handler: button.handler
      };
      if (button.role) {
        action['role'] = button.role;
      }
      return action;
    });
    actions.push({
      text: 'Cancel',
      role: 'cancel',
      handler: () => {
        console.log('Action Sheet cancelled');
      }
    });
    return actions;
  }

  /**
   * Open an action sheet
   *
   * @params: title - action sheet title
   * @params: buttons - array of action sheet buttons
   * @params: [customClass] - css class to apply to action sheet
   *
   * @return: none
  **/
  openActionSheet(title: string, buttons: Array<ActionSheetButton>, customClass?: string): void {
    const actionSheet = this.actionCtrl.create({
      title: title,
      buttons: this.generateActionSheetButtons(buttons),
      cssClass: customClass || 'main-action-sheet'
    });
    actionSheet.present({keyboardClose: false});
  }

}
