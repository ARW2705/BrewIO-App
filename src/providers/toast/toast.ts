import { Injectable } from '@angular/core';
import { ToastController } from 'ionic-angular';

@Injectable()
export class ToastProvider {

  constructor(private toastCtrl: ToastController) {
    console.log('Hello ToastProvider Provider');
  }

  public presentToast(message: string, position?: string, duration?: number, customClass?: string): void {
    const toast = this.toastCtrl.create({
      message: message,
      position: position || 'bottom',
      duration: duration || 2000,
      cssClass: customClass || 'main-toast'
    });
    toast.present();
  }

}
