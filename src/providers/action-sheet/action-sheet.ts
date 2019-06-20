import { Injectable } from '@angular/core';
import { ActionSheetController } from 'ionic-angular';

import { ActionSheetButton } from '../../shared/interfaces/action-sheet-buttons';

@Injectable()
export class ActionSheetProvider {

  constructor(public actionCtrl: ActionSheetController) { }

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

  openActionSheet(title: string, buttons: Array<ActionSheetButton>, customClass?: string): void {
    const actionSheet = this.actionCtrl.create({
      title: title,
      buttons: this.generateActionSheetButtons(buttons),
      cssClass: customClass || 'main-action-sheet'
    })
    actionSheet.present({keyboardClose: false});
  }

}
