/* Module imports */
import { Component, OnInit } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';


@Component({
  selector: 'page-confirmation',
  templateUrl: 'confirmation.html',
})
export class ConfirmationPage implements OnInit {
  title: string = '';
  message: string = '';
  subMessage: string = null;

  constructor(
    public navParams: NavParams,
    public viewCtrl: ViewController
  ) { }

  ngOnInit() {
    this.title = this.navParams.get('title');
    this.message = this.navParams.get('message');
    this.subMessage = this.navParams.get('subMessage');
  }

  /**
   * Confirm by calling view controller dismiss with true
   *
   * @params: none
   * @return: none
  **/
  confirm(): void {
    this.viewCtrl.dismiss(true);
  }

  /**
   * Cancel confirmation by calling view controller dismiss with false
   *
   * @params: none
   * @return: none
  **/
  dismiss(): void {
    this.viewCtrl.dismiss(false);
  }

}
