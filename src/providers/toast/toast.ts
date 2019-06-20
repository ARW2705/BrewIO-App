import { Injectable } from '@angular/core';
import { ToastController } from 'ionic-angular';

@Injectable()
export class ToastProvider {

  constructor(private toastCtrl: ToastController) { }

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
