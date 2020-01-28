/* Module imports */
import { Injectable } from '@angular/core';
import { ToastController } from 'ionic-angular';

@Injectable()
export class ToastProvider {

  constructor(private toastCtrl: ToastController) { }

  /**
   * Show toast
   *
   * @params: message - message text
   * @params: [duration] - time toast is shown in ms
   * @params: [position] - position on screen of toast, options: 'top', 'bottom', or 'middle'
   * @params: [customClass] - css class name to add to toast
   * @params: [showCloseButton] - if true, close button will be displayed
   * @params: [closeButtonText] - text of toast dimiss button
   * @params: [dismissOnPageChange] - if true, dismiss the toast when navigating to new page
   *
   * @return: none
  **/
  presentToast(
    message: string,
    duration?: number,
    position?: string,
    customClass?: string,
    showCloseButton?: boolean,
    closeButtonText?: string,
    dismissOnPageChange?: boolean
  ): void {
      const defaultClass = 'main-toast';
      const toast = this.toastCtrl.create({
        message: message,
        duration: duration || 2000,
        position: position || 'bottom',
        cssClass: `${defaultClass} ${customClass}` || defaultClass,
        showCloseButton: showCloseButton || false,
        closeButtonText: closeButtonText || 'Close',
        dismissOnPageChange: dismissOnPageChange || false
      });
      toast.present();
  }

}
