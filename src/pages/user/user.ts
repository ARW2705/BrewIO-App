import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

import { User } from '../../shared/interfaces/user';

import { UserProvider } from '../../providers/user/user';

@Component({
  selector: 'page-user',
  templateUrl: 'user.html',
})
export class UserPage {

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    private userService: UserProvider) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad UserPage');
  }

}
