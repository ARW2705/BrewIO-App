/* Module imports */
import { Injectable } from '@angular/core';
import { ActionSheet, ActionSheetController } from 'ionic-angular';

/* Interface imports */
import { ActionSheetButton } from '../../shared/interfaces/action-sheet-buttons';


@Injectable()
export class ActionSheetProvider {

  constructor(public actionCtrl: ActionSheetController) { }

  /**
   * Open an action sheet
   *
   * @params: title - action sheet title
   * @params: buttons - array of action sheet buttons
   * @params: [customClass] - css class to apply to action sheet
   *
   * @return: none
  **/
  openActionSheet(
    title: string,
    buttons: ActionSheetButton[],
    customClass?: string
  ): void {
    buttons.push({
      text: 'Cancel',
      role: 'cancel',
      handler: () => {
        console.log('Action Sheet cancelled');
      }
    });

    const actionSheet: ActionSheet = this.actionCtrl.create({
      title: title,
      buttons: buttons,
      cssClass: customClass || 'action-sheet-main'
    });
    
    actionSheet.present({keyboardClose: false});
  }

}
